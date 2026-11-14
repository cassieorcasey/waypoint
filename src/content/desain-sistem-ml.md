Catatan ini mengikuti lima langkah di checklist, ditambah mini-proyek penutup Fase 8. Model hanyalah satu kotak kecil di dalam sistem ML. Seorang Lead diminta menjawab pertanyaan yang lebih luas: apakah seluruh sistem akan tetap berjalan, tetap benar, dan tetap terjangkau saat dipakai nyata, dan apa yang terjadi kalau satu bagian gagal.

## 1. Menetapkan kebutuhan

Mulailah dari kebutuhan, bukan dari arsitektur. Tanyakan hal ini sebelum menggambar apa pun:

| Pertanyaan | Mengapa penting |
|---|---|
| Keputusan apa yang dibantu, dan seberapa sering? | Menentukan batch atau online |
| Berapa **latensi** yang bisa diterima? | Menentukan ukuran model dan cara serving |
| Berapa **throughput** puncak (permintaan per detik)? | Menentukan jumlah mesin |
| Apa **SLA** ketersediaan? | Menentukan redundansi dan fallback |
| Berapa **anggaran** biaya per prediksi atau per bulan? | Membatasi pilihan model dan infrastruktur |
| Seberapa mahal **salah**, dan jenis salah mana yang lebih parah? | Menentukan ambang dan pengawasan manusia |
| Data apa yang tersedia **saat prediksi** (bukan saat training)? | Mencegah fitur yang tidak bisa didapat saat serving |
| Aturan privasi dan regulasi apa yang berlaku? | Menentukan lokasi data dan kebutuhan audit |

**Batch atau online?** Jika hasil boleh disiapkan sebelumnya (rekomendasi harian, skor risiko mingguan), pakai batch: lebih murah, sederhana, dan mudah diperiksa. Pakai online hanya jika keputusan bergantung pada konteks yang baru muncul saat itu (deteksi penipuan saat transaksi).

```python
import math

def kebutuhan_mesin(qps_puncak, latensi_detik, konkurensi_per_mesin, cadangan=0.3):
    """Perkiraan jumlah mesin: permintaan yang sedang diproses = QPS x latensi (hukum Little)."""
    bersamaan = qps_puncak * latensi_detik
    return math.ceil(bersamaan / konkurensi_per_mesin * (1 + cadangan))

# 200 permintaan/detik di puncak, model butuh 80 ms, satu mesin menangani 8 permintaan bersamaan
print(kebutuhan_mesin(200, 0.08, 8))      # 3 mesin termasuk cadangan 30%
```

Perhitungan kasar seperti ini sering cukup untuk menyingkirkan desain yang jelas tidak masuk akal sebelum ada kode.

## 2. Arsitektur end-to-end

Hampir semua sistem ML terdiri dari lima bagian yang sama. Gambar milikmu sendiri dengan nama komponen nyata:

```
 Sumber data ──► Pipeline data ──► Penyimpanan fitur ──► Training ──► Registry model
 (aplikasi, log)   (kualitas, ELT)   (offline + online)     (terjadwal)   (versi, metrik)
                                            │                                  │
                                            ▼                                  ▼
                                      Serving online ◄──────────────── Deploy otomatis
                                            │
                                            ▼
                              Aplikasi ──► Log prediksi ──► Monitoring ──► Latih ulang?
                                                              (data, model, bisnis)
```

Hal yang diperiksa pada setiap panah:

- **Siapa pemiliknya** dan apa yang terjadi jika ia terlambat atau berhenti?
- **Apa kontrak data**-nya (skema, kesegaran)?
- **Bagaimana versinya dilacak**: kode, data, fitur, dan model, sehingga satu prediksi bisa ditelusuri ulang?
- **Apa yang dilog**: input, versi model, keluaran, dan hasil sebenarnya bila tersedia, karena itulah bahan latih ulang dan investigasi.

Prinsip yang membuat sistem bertahan: mulailah dari **versi paling sederhana yang berfungsi** (sering aturan bisnis atau model linear) lalu tambah kerumitan ketika ukuran nyata menuntutnya. Setiap komponen tambahan adalah sesuatu yang harus dirawat seseorang di jam dua pagi.

## 3. Pola serving dan rilis

| Pola | Cara kerja | Cocok untuk |
|---|---|---|
| **Batch** | Skor dihitung terjadwal dan disimpan di tabel | Segmentasi, skor mingguan, rekomendasi email |
| **Online (sinkron)** | API menghitung saat diminta | Keputusan real time di aplikasi |
| **Streaming** | Menghitung terus-menerus dari aliran peristiwa | Deteksi anomali, fitur real time |
| **Di perangkat** | Model berjalan di ponsel atau browser | Privasi, tanpa jaringan, latensi sangat rendah |

Strategi rilis yang menurunkan risiko:

1. **Shadow**: model baru ikut memprediksi di produksi tetapi hasilnya tidak dipakai; bandingkan dengan model lama.
2. **Canary**: sebagian kecil trafik (1 sampai 5%) memakai model baru sambil memantau metrik.
3. **Bertahap** ke 100% jika metrik aman, dengan jalan kembali (*rollback*) yang sudah dilatih.
4. **A/B test** bila yang ingin dibuktikan adalah dampak bisnisnya, bukan hanya kebenaran teknis.

Setiap sistem online butuh **fallback**: apa yang dijawab ketika model lambat atau mati?

```python
import time

def prediksi_dengan_fallback(fitur, model, aturan_cadangan, batas_detik=0.2):
    """Jika model gagal atau terlalu lambat, pakai aturan sederhana, dan catat kejadiannya."""
    mulai = time.perf_counter()
    try:
        hasil = model(fitur)
        if time.perf_counter() - mulai > batas_detik:
            raise TimeoutError("model melewati batas latensi")
        return hasil, "model"
    except Exception:
        return aturan_cadangan(fitur), "fallback"

model_rusak = lambda f: 1 / 0
aturan = lambda f: 0.5                       # misalnya: skor netral, atau rata-rata historis
print(prediksi_dengan_fallback({"x": 1}, model_rusak, aturan))     # (0.5, 'fallback')
```

Fallback yang tidak dipantau berbahaya: jika 30% permintaan diam-diam jatuh ke fallback, kualitas turun tanpa ada yang tahu. Catat dan beri alarm pada persentasenya.

## 4. Mode kegagalan

Sistem ML gagal dengan cara yang tidak muncul di perangkat lunak biasa: **tanpa error, tapi diam-diam salah**.

| Mode kegagalan | Gejala | Pencegahan |
|---|---|---|
| **Training-serving skew** | Bagus di evaluasi, buruk di produksi | Satu kode fitur dipakai untuk keduanya; feature store; bandingkan distribusi fitur saat serving dengan saat training |
| **Kebocoran data** | Skor offline terlalu bagus | Pembagian berdasarkan waktu atau entitas; tinjau fitur yang mencurigakan |
| **Data drift** | Distribusi input bergeser | Pantau PSI atau statistik per fitur |
| **Concept drift** | Hubungan input dan target berubah (perilaku pelanggan, regulasi) | Pantau metrik hasil; jadwal latih ulang |
| **Ketergantungan hulu** | Tim lain mengubah skema atau berhenti mengirim | Data contract, tes skema, alarm kesegaran |
| **Umpan balik berputar** | Keputusan model memengaruhi data yang nanti dipakai untuk melatihnya | Sisihkan sebagian kecil keputusan acak untuk data yang tidak bias |
| **Fitur yang tak tersedia** | Nilai kosong di produksi | Penanganan nilai hilang yang sama dan dites |
| **Kegagalan berantai** | Satu komponen lambat menjatuhkan yang lain | Batas waktu, circuit breaker, antrean dengan batas |

Dua pertanyaan yang sebaiknya selalu ditanyakan di design review: **"Bagaimana kita tahu kalau ini rusak?"** dan **"Bagaimana kita kembali ke keadaan sebelumnya dalam hitungan menit?"** Jika jawabannya tidak ada, desainnya belum selesai.

## 5. Design doc dan design review

Design doc adalah alat berpikir sebelum menjadi dokumen. Menulisnya membuat celah logika muncul saat memperbaikinya masih murah. Kerangka dua sampai empat halaman:

| Bagian | Isi |
|---|---|
| **Konteks dan tujuan** | Masalah bisnis, keputusan yang dibantu, metrik keberhasilan |
| **Bukan tujuan** | Apa yang sengaja tidak dikerjakan |
| **Kebutuhan** | Latensi, throughput, anggaran, SLA, privasi |
| **Desain yang diusulkan** | Diagram, aliran data, komponen, pola serving dan rilis |
| **Alternatif yang dipertimbangkan** | Minimal dua, dengan alasan tidak dipilih |
| **Risiko dan mode kegagalan** | Tabel seperti di atas, dengan deteksi dan mitigasi |
| **Rencana monitoring dan rollback** | Metrik, ambang alarm, siapa yang dipanggil |
| **Rencana rilis dan tonggak** | Shadow, canary, kapan dinyatakan berhasil |
| **Pertanyaan terbuka** | Hal yang belum diputuskan, dengan pemilik |

Catat keputusan penting sebagai **ADR** (*architecture decision record*): satu halaman berisi konteks, keputusan, dan konsekuensi. Enam bulan kemudian, orang baru bisa memahami *mengapa* sistemnya begini.

Saat memimpin design review:

- Kirim dokumen **sebelum** rapat; gunakan rapat untuk membahas, bukan membacakan.
- Undang orang dari tim yang terdampak (data engineering, aplikasi, keamanan), bukan hanya sesama data scientist.
- Pisahkan komentar **wajib diperbaiki** dari saran dan selera.
- Hargai usulan paling sederhana yang memenuhi kebutuhan. Kerumitan harus membuktikan dirinya.
- Akhiri dengan keputusan tercatat dan pemilik untuk setiap tindak lanjut.

## Mini-proyek Fase 8

Ambil proyek Fase 6 (model yang disajikan lewat API di Docker) dan jadikan lebih siap produksi:

1. Tambahkan **pelacakan eksperimen** (misalnya MLflow) dan daftarkan model di registry dengan versi.
2. Tambahkan **CI** (GitHub Actions) yang menjalankan tes kode, tes skema data, dan ambang performa model.
3. Tambahkan **log prediksi** dan satu pemeriksaan **drift** sederhana, misalnya PSI pada dua fitur terpenting.
4. Tulis **design doc dua halaman** dengan struktur di atas, termasuk tabel mode kegagalan dan rencana rollback.
5. Minta **satu orang me-review** dokumennya (teman, rekan kerja, atau komunitas), perbaiki berdasarkan komentarnya, dan catat satu keputusan sebagai ADR.

## Latihan

1. Pilih sistem ML yang pernah kamu pakai (rekomendasi, deteksi penipuan, pencarian) dan gambar arsitekturnya dari lima komponen di atas. Tandai tiga titik yang paling mungkin gagal.
2. Hitung kebutuhan mesin dan biaya bulanan untuk tiga skenario trafik pada API modelmu.
3. Tulis tabel mode kegagalan untuk proyekmu dengan kolom deteksi dan mitigasi. Lengkapi sampai tidak ada baris kosong.
4. Rancang strategi rilis (shadow, canary, rollback) untuk model baru dan tentukan metrik yang menghentikan rilis.
5. Tulis satu ADR tentang keputusan nyata yang kamu ambil: misalnya batch vs online, atau model sederhana vs kompleks.

Rujukan: *Rules of Machine Learning* (Google), *Designing Machine Learning Systems* (Chip Huyen), dan panduan MLOps Google Cloud di bagian sumber belajar.
