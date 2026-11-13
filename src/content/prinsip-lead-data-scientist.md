Catatan ini mengikuti empat langkah di checklist. Pergeseran terbesar dari data scientist senior ke **Lead** bukan soal model yang lebih canggih. Ukuran keberhasilanmu berubah dari "apa yang saya hasilkan" menjadi "apa yang tim saya hasilkan, dan seberapa besar dampaknya bagi bisnis". Empat langkah di bawah adalah alat untuk pergeseran itu.

## 1. Leverage: tooling, pustaka internal, data asset bersama

*Leverage* adalah melakukan pekerjaan sekali yang membuat banyak orang lebih cepat berkali-kali. Seorang Lead mencari pekerjaan yang berulang di tim dan mengubahnya menjadi aset bersama.

| Bentuk | Contoh | Dampak |
|---|---|---|
| Pustaka internal | Paket Python berisi fungsi evaluasi standar, koneksi data, plot bermerek perusahaan | Setiap proyek mulai dari fondasi yang sama dan teruji |
| Template proyek | Struktur folder, konfigurasi, CI, dan contoh tes yang langsung jalan (misalnya dengan `cookiecutter`) | Proyek baru siap dalam menit, bukan hari |
| Data asset bersama | Tabel fitur pelanggan yang bersih dan terdokumentasi, *feature store*, set evaluasi standar | Tidak ada lagi lima versi definisi "pelanggan aktif" |
| Platform | Pipeline training dan deploy standar, dashboard monitoring | Model berpindah dari notebook ke produksi tanpa bantuan khusus |
| Dokumentasi | Panduan "cara kita melakukan X", catatan keputusan arsitektur | Pengetahuan tidak hilang saat orang pindah |

Cara memilih investasi leverage: hitung **frekuensi × waktu yang dihemat × jumlah orang**, dibandingkan dengan biaya membangun dan merawatnya. Mulai dari masalah yang benar-benar dikeluhkan tim, buat versi kecil, dan biarkan dipakai sebelum diperluas. Pustaka yang tidak dipakai siapa pun hanyalah beban perawatan.

## 2. Mentorship dan code review untuk tim junior

Tujuan mentorship adalah membuat orang lain **mampu mengambil keputusan yang baik tanpa kamu**. Kalau semua keputusan masih harus lewat kamu, tim tidak akan tumbuh lebih besar dari kapasitasmu sendiri.

Prinsip mentorship yang efektif:

- **Tanya sebelum memberi tahu.** "Menurutmu kenapa skor validasinya jauh di atas skor uji?" membangun cara berpikir; memberi jawaban hanya menyelesaikan satu masalah.
- **Delegasikan hasil, bukan langkah.** Jelaskan masalah, batasan, dan seperti apa "selesai", lalu biarkan mereka memilih caranya. Sesuaikan tingkat detail dengan pengalaman orangnya.
- **Biarkan kesalahan kecil yang bisa dipulihkan terjadi**, lalu bahas bersama. Cegah hanya kesalahan yang mahal atau tidak bisa dibatalkan.
- **Jadwal rutin** satu-satu (*1:1*) milik mereka: tujuan karier, hambatan, umpan balik dua arah.
- **Pujian spesifik dan umpan balik spesifik.** "Kerja bagus" kurang berguna dibanding "cara kamu membagi data per pelanggan mencegah kebocoran yang sering terlewat".

Code review sebagai alat mengajar (lengkap dengan catatan Git & GitHub di Fase 1):

- Untuk tim junior, prioritaskan komentar tentang **kebenaran dan cara berpikir** (kebocoran data, metrik yang salah, asumsi tersembunyi) di atas gaya kode. Gaya diserahkan ke linter.
- Jelaskan **alasan** di balik setiap permintaan perubahan, dan tautkan ke panduan tim jika ada.
- Tandai tingkat urgensi: wajib diperbaiki, saran, atau `Nit:` (kecil, boleh diabaikan).
- Sesekali, **minta mereka me-review kodemu**. Ini mengajarkan cara membaca kode orang lain dan menunjukkan bahwa semua orang bisa salah.

## 3. Clean code guidelines

Kode data science sering ditulis sekali di notebook lalu dibuang, tapi kode yang masuk produksi dibaca jauh lebih sering daripada ditulis. Panduan bersama mengurangi perdebatan dan mempercepat review.

Contoh isi panduan tim:

1. **Notebook untuk eksplorasi, modul untuk produksi.** Logika yang dipakai ulang dipindah ke file `.py` dengan tes.
2. **Nama yang menjelaskan isi**: `pelanggan_aktif_30_hari`, bukan `df2`; `hitung_psi()`, bukan `proses()`.
3. **Fungsi kecil dengan satu tugas**, dengan type hint dan docstring singkat untuk fungsi publik.
4. **Tidak ada angka ajaib.** Ambang, tanggal potong, dan hyperparameter berada di file konfigurasi.
5. **Format dan lint otomatis** (misalnya `ruff`), dijalankan di CI dan pre-commit.
6. **Tes untuk logika data**: transformasi, pembuatan fitur, dan pembagian data.
7. **Seed acak dan versi** dicatat untuk setiap hasil yang dilaporkan.
8. **Tidak ada rahasia di kode**; kredensial dari environment variable atau secret manager.

```python
import pandas as pd

# Sebelum
def proses(d):
    d = d[d.x > 30]
    d["y"] = d.a / d.b
    return d

# Sesudah
MIN_HARI_AKTIF = 30

def hitung_rasio_belanja(transaksi: pd.DataFrame) -> pd.DataFrame:
    """Rasio belanja bulan ini terhadap rata-rata 3 bulan, untuk pelanggan aktif."""
    aktif = transaksi[transaksi["hari_aktif"] > MIN_HARI_AKTIF].copy()
    aktif["rasio_belanja"] = aktif["belanja_bulan_ini"] / aktif["rata_belanja_3_bulan"]
    return aktif
```

Panduan yang baik itu **pendek** (bisa dibaca dalam sepuluh menit), **disepakati bersama**, dan **ditegakkan oleh alat** sejauh mungkin, bukan oleh komentar manusia di setiap review.

## 4. Menerjemahkan masalah bisnis jadi problem statement dan hipotesis teruji

Ini keterampilan yang paling membedakan seorang Lead. Permintaan bisnis hampir selalu datang dalam bentuk solusi atau keluhan yang kabur: "kita butuh model AI untuk churn", "penjualan turun, tolong analisis". Tugasmu mengubahnya menjadi masalah yang jelas, terukur, dan bisa diuji.

**Langkah 1. Gali keputusan di baliknya.** Tanyakan: keputusan apa yang akan diambil berdasarkan hasilnya? Siapa yang mengambilnya, dan seberapa sering? Kalau tidak ada keputusan yang berubah, proyek itu sebaiknya tidak dikerjakan.

**Langkah 2. Tulis problem statement** dengan struktur yang jelas:

> Untuk **[pengguna/keputusan]**, kami ingin **[hasil yang terukur]** dari **[kondisi sekarang]** menjadi **[target]** dalam **[jangka waktu]**, yang bernilai sekitar **[dampak bisnis]**. Batasan: **[data, waktu, regulasi, biaya]**.

Contoh: "Untuk tim retensi yang setiap minggu memilih 2.000 pelanggan yang dihubungi, kami ingin menaikkan persentase pelanggan berisiko yang tertangkap dari ~15% (dipilih acak) menjadi ≥ 35% dalam 3 bulan, dengan target menahan sekitar 400 pelanggan per bulan. Batasan: hanya data transaksi dan keluhan; tidak boleh memakai data lokasi."

**Langkah 3. Ubah asumsi menjadi hipotesis yang bisa dibuktikan salah:**

| Asumsi bisnis | Hipotesis teruji | Cara menguji |
|---|---|---|
| "Pelanggan pergi karena harga" | Pelanggan yang berhenti mengalami kenaikan harga lebih sering daripada yang bertahan, dengan selisih ≥ 10 poin persen | Analisis data historis |
| "Kontak proaktif mengurangi churn" | Pelanggan berisiko yang dihubungi punya churn 3 bulan lebih rendah ≥ 2 poin dibanding yang tidak | A/B test |
| "Model bisa memprediksi churn" | Model mencapai recall@10% ≥ 0,35 pada data 3 bulan terakhir | Evaluasi offline |

**Langkah 4. Sepakati metrik keberhasilan sebelum mulai**, termasuk metrik bisnis (pelanggan yang tertahan, rupiah) dan bukan hanya metrik model (AUC). Model dengan AUC 0,9 yang tidak mengubah keputusan apa pun tidak bernilai apa-apa.

**Langkah 5. Mulai dari baseline paling sederhana**: aturan bisnis, query SQL, atau heuristik. Sering kali baseline sudah memberi 70% nilainya dalam seminggu, dan model kompleks hanya layak jika selisihnya sepadan.

Pertanyaan yang selalu berguna di rapat awal: "Kalau proyek ini berhasil sempurna, apa yang berbeda dalam enam bulan?", "Bagaimana kita tahu kalau proyek ini gagal?", dan "Apa yang terjadi kalau kita tidak mengerjakan ini sama sekali?"

## Latihan

1. Daftar tiga pekerjaan berulang di proyek-proyekmu sendiri, lalu rancang satu pustaka atau template kecil untuk yang paling mahal.
2. Review satu notebook lama milikmu seolah-olah milik anggota tim junior. Tulis lima komentar dengan tingkat urgensi dan alasannya.
3. Tulis panduan clean code tim maksimal satu halaman, dan atur `ruff` serta pre-commit untuk menegakkannya.
4. Ambil permintaan kabur ("tolong buat dashboard penjualan pakai AI") dan ubah menjadi problem statement lengkap beserta tiga hipotesis teruji.
5. Untuk satu proyek Fase 4–7 milikmu, tulis satu halaman yang menjelaskan dampak bisnisnya kepada manajer non teknis.

Rujukan: Google Engineering Practices untuk code review, *Hidden Technical Debt in ML Systems*, dan People + AI Guidebook di bagian sumber belajar.
