Catatan ini mengikuti enam langkah di checklist dan melengkapi catatan Prinsip Lead Data Scientist. Di tingkat Lead, pertanyaannya bergeser dari "bisakah kita membuat modelnya?" menjadi "apakah ini layak dikerjakan, dalam urutan apa, dan bagaimana kita tahu itu berhasil?". Sebagian besar proyek AI yang gagal tidak gagal karena modelnya buruk, tetapi karena masalahnya salah dipilih, nilainya tidak pernah dihitung, atau organisasinya tidak siap memakai hasilnya.

## 1. Menilai peluang AI

Sebelum menulis satu baris kode, lewati lima penyaring ini:

| Penyaring | Pertanyaan | Tanda bahaya |
|---|---|---|
| **Keputusan** | Keputusan apa yang berubah, dan siapa yang mengambilnya? | Tidak ada yang mengambil keputusan berdasarkan hasilnya |
| **Nilai** | Berapa nilai keputusan yang lebih baik, dalam rupiah, jam kerja, atau risiko? | "Pokoknya strategis" |
| **Data** | Apakah data yang relevan ada, cukup, dan boleh dipakai? | Data baru akan dikumpulkan "nanti" |
| **Kelayakan teknis** | Apakah masalah ini pada dasarnya bisa diprediksi? Apa baseline sederhananya? | Jawabannya ditentukan hal yang tidak terukur |
| **Kesiapan operasional** | Siapa yang memakai, merawat, dan memantaunya? | Tidak ada pemilik setelah peluncuran |

Gunakan matriks **dampak × kelayakan** untuk memilah daftar ide:

| | Kelayakan tinggi | Kelayakan rendah |
|---|---|---|
| **Dampak tinggi** | **Kerjakan sekarang** | Pecah jadi tahap kecil atau teliti dulu |
| **Dampak rendah** | Kerjakan jika murah (kemenangan cepat) | **Jangan dikerjakan** |

Dan ingat pertanyaan paling jujur: **apakah ini perlu AI?** Aturan bisnis, query SQL, atau perbaikan proses sering memberi 70% manfaat dengan 10% biaya. Aturan pertama Google Rules of ML adalah: jangan takut meluncurkan produk tanpa ML.

## 2. Business case dan ROI

Business case adalah argumen berbasis angka yang bisa diperiksa orang lain. Strukturnya sederhana:

| Komponen | Isi |
|---|---|
| **Biaya awal** | Waktu tim, data, infrastruktur, integrasi, lisensi |
| **Biaya berulang** | Cloud, perawatan, pemantauan, pelabelan, waktu orang yang menjaga sistem |
| **Manfaat** | Pendapatan tambahan, biaya yang dihemat, risiko yang dihindari, waktu yang dibebaskan |
| **Asumsi** | Tingkat adopsi, peningkatan metrik, jumlah pengguna |
| **Skenario** | Pesimis, dasar, optimis |
| **Ukuran** | Net present value (NPV), waktu balik modal, ROI |

```python
def npv(arus_kas, diskonto):
    """Net present value: arus_kas[0] adalah tahun 0 (biasanya negatif, biaya awal)."""
    return sum(a / (1 + diskonto) ** t for t, a in enumerate(arus_kas))

def kasus(biaya_awal, biaya_tahunan, manfaat_tahunan, tahun=3, diskonto=0.10):
    bersih = manfaat_tahunan - biaya_tahunan
    arus = [-biaya_awal] + [bersih] * tahun
    balik_modal = biaya_awal / bersih if bersih > 0 else float("inf")
    return round(npv(arus, diskonto)), round(balik_modal, 1)

# Angka dalam juta rupiah. Contoh: model prioritas pelanggan untuk tim retensi
biaya_awal, biaya_tahunan, manfaat = 600, 240, 700
print("Dasar      :", kasus(biaya_awal, biaya_tahunan, manfaat))           # (NPV, tahun balik modal)
print("Manfaat 50%:", kasus(biaya_awal, biaya_tahunan, manfaat * 0.5))
print("Manfaat 80%:", kasus(biaya_awal, biaya_tahunan, manfaat * 0.8))
```

Hasilnya mengajarkan sesuatu: kasus dasar terlihat sangat menarik, tetapi jika hanya **separuh** manfaat yang terwujud, NPV-nya negatif. Selalu lakukan **analisis sensitivitas**: cari "berapa persen manfaat yang harus terwujud agar impas?" lalu tanyakan apakah angka itu realistis.

Beberapa kebiasaan yang membuat business case dipercaya:

- **Hitung biaya total sebenarnya**, termasuk perawatan dan waktu orang, bukan hanya biaya membangun.
- **Pisahkan manfaat yang terukur dari yang diharapkan.** Manfaat "tidak berwujud" boleh disebut, tapi jangan dihitung dalam angka utama.
- **Tulis asumsi dan pemiliknya.** Jika tim bisnis menyatakan adopsi 80%, mintalah dia yang bertanggung jawab atas angka itu.
- **Bandingkan dengan alternatif**, termasuk "tidak melakukan apa-apa" dan solusi non-AI.

## 3. Build vs buy vs API

Tiga jalan yang umum: **membangun sendiri**, **membeli produk jadi**, atau **memakai API model** dengan lapisan aplikasi sendiri.

| Kriteria | Build | Buy (produk jadi) | API + aplikasi sendiri |
|---|---|---|---|
| Kecepatan ke hasil pertama | Lambat | Cepat | Cepat |
| Kecocokan dengan kebutuhan spesifik | Tertinggi | Terbatas pada fitur vendor | Tinggi |
| Biaya awal | Tinggi | Rendah | Rendah sampai sedang |
| Biaya berulang | Infrastruktur dan tim | Langganan | Berbasis pemakaian |
| Kendali atas data dan model | Penuh | Rendah | Sedang |
| Ketergantungan pada vendor | Rendah | Tinggi | Sedang |
| Beban perawatan | Tinggi | Rendah | Sedang |

Pertanyaan penentu:

1. **Apakah ini pembeda kompetitif kita?** Jika ya, pertimbangkan membangun. Jika ini fungsi umum (transkripsi, OCR, penerjemahan), hampir selalu beli.
2. **Seberapa sensitif datanya?** Regulasi dan kebijakan privasi bisa menutup beberapa pilihan.
3. **Berapa biaya berulangnya pada volume yang kita harapkan?** Harga per pemakaian yang murah saat percobaan bisa menjadi besar pada skala penuh. Hitung seperti di catatan Evaluasi LLM.
4. **Berapa mahal pindah vendor?** Rancang agar lapisan model bisa diganti.
5. **Apakah tim punya kemampuan merawatnya?** Sistem yang dibangun tapi tak ada yang paham adalah utang.

Seringkali jalur terbaiknya bertahap: mulai dengan API atau produk jadi untuk membuktikan nilai, lalu bangun sendiri hanya bagian yang terbukti penting dan mahal.

## 4. Prioritisasi dan roadmap tim

Tim selalu punya lebih banyak permintaan daripada kapasitas. Prioritisasi yang sehat tidak bergantung pada siapa yang paling vokal.

Skor sederhana yang bisa dibahas bersama: **dampak × keyakinan ÷ usaha**.

```python
usulan = [
    # (nama, dampak 1-10, keyakinan 0-1, usaha dalam minggu-orang)
    ("Prediksi churn untuk tim retensi", 8, 0.7, 10),
    ("Chatbot FAQ internal",              5, 0.8,  4),
    ("Forecast stok gudang",              7, 0.6, 12),
    ("Deteksi anomali transaksi",         9, 0.4, 20),
]
for nama, dampak, yakin, usaha in sorted(usulan, key=lambda u: u[1] * u[2] / u[3], reverse=True):
    print(f"{dampak * yakin / usaha:4.2f}  {nama}")
```

Angkanya bukan kebenaran; gunanya memaksa percakapan: "kenapa dampaknya 9?" "kenapa keyakinannya hanya 0,4?". Skor rendah pada keyakinan sering berarti **butuh penelitian kecil dulu** sebelum berkomitmen.

Tips menyusun roadmap:

- Gunakan format **now / next / later**, bukan tanggal pasti untuk semuanya. Hanya "now" yang boleh berupa komitmen.
- **Sisihkan kapasitas** sekitar 20 sampai 30% untuk perawatan model yang sudah berjalan, utang teknis, dan permintaan mendadak. Roadmap yang memakai 100% kapasitas pasti meleset.
- Pecah proyek besar menjadi **tonggak yang memberi nilai di tengah jalan**, bukan satu peluncuran besar di akhir.
- Sebut **apa yang tidak akan dikerjakan** dan kenapa. Itu bagian terpenting dari prioritas.
- Tinjau tiap kuartal dan berani menghentikan proyek yang bukti awalnya lemah.

## 5. Risiko dan kesiapan organisasi

Pertanyaan yang menentukan keberhasilan sering bukan teknis.

| Area | Pertanyaan | Contoh tindakan |
|---|---|---|
| **Kesiapan data** | Apakah data terdokumentasi, bisa diakses, dan berkualitas? | Audit data sebelum proyek, tunjuk pemilik data |
| **Adopsi** | Apakah pengguna akhir mau dan tahu cara memakainya? | Libatkan pengguna dari awal; uji coba dengan kelompok kecil |
| **Perubahan proses** | Apakah alur kerja akan berubah, dan siapa yang terdampak? | Rencana pelatihan dan komunikasi; sponsor di sisi bisnis |
| **Kepercayaan** | Apakah hasil bisa dijelaskan dan diperiksa? | Alasan prediksi, tingkat keyakinan, jalur eskalasi ke manusia |
| **Etika dan regulasi** | Apakah ada risiko bias, privasi, atau kepatuhan? | Tinjauan sejak desain, uji per kelompok, dokumentasi (lihat catatan Governance & Security) |
| **Ketergantungan** | Apa yang terjadi jika vendor, tim, atau data utama hilang? | Rencana cadangan, dokumentasi, lebih dari satu orang yang paham |

Model paling akurat tetap tidak bernilai jika tim operasional mengabaikan keluarannya. Biasanya **sponsor di sisi bisnis** dan **pengguna yang dilibatkan sejak hari pertama** menentukan nasib proyek lebih besar daripada selisih AUC dua poin.

## 6. Mengukur dan melaporkan dampak

Tutup lingkaran: bukti bahwa proyek menghasilkan nilai yang dijanjikan.

- **Pilih metrik bisnis sejak awal** (pelanggan yang tertahan, jam yang dihemat, biaya per tiket) dan tetapkan angka dasarnya sebelum peluncuran.
- **Bedakan metrik model dari metrik dampak.** AUC naik tidak sama dengan pendapatan naik. Jika memungkinkan, buktikan dampak dengan eksperimen terkontrol (catatan Eksperimen & Inferensi Kausal).
- Kaitkan dengan **OKR** tim: satu tujuan, dua sampai tiga hasil kunci yang terukur, misalnya "turunkan churn pelanggan berisiko dari 12% ke 10% dalam kuartal ini".
- **Laporan berkala** satu halaman: apa yang dijanjikan, apa yang tercapai, apa yang dipelajari, dan keputusan yang dibutuhkan.
- Lakukan **review pascaproyek** tanpa menyalahkan: apa yang berjalan baik, apa yang meleset dari asumsi business case, dan apa yang diubah pada proyek berikutnya. Mencocokkan angka aktual dengan business case adalah cara terbaik mempertajam estimasi.

## Latihan

1. Ambil tiga ide proyek AI yang pernah kamu dengar di tempat kerja. Lewati lima penyaring di bagian 1 dan letakkan dalam matriks dampak × kelayakan.
2. Buat business case satu halaman untuk satu ide: biaya awal, biaya berulang, manfaat, tiga skenario, dan titik impas manfaat.
3. Untuk satu fungsi (misalnya transkripsi atau klasifikasi dokumen), tulis perbandingan build, buy, dan API dengan angka biaya pada tiga volume.
4. Susun roadmap now/next/later untuk timmu enam bulan ke depan, termasuk apa yang sengaja **tidak** dikerjakan.
5. Pilih satu proyek yang sudah selesai dan tulis review pascaproyek: mana asumsi yang tepat, mana yang meleset, dan apa pelajarannya.

Rujukan: *People + AI Guidebook* (Google PAIR), *Building the AI-Powered Organization* (HBR), dan *Rules of Machine Learning* di bagian sumber belajar.
