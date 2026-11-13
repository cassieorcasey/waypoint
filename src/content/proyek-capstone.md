Catatan ini mengikuti enam langkah di checklist. Capstone adalah satu proyek **end to end** yang menggabungkan semua fase: data, model, deployment, monitoring, dan komunikasi ke bisnis. Bagi rekruter dan manajer, satu proyek yang lengkap dan bisa dipakai jauh lebih meyakinkan daripada sepuluh notebook Kaggle.

## Memilih proyek

Kriteria proyek capstone yang baik:

- **Masalah nyata** dengan pengguna atau keputusan yang jelas (lihat langkah 4 catatan Prinsip Lead Data Scientist).
- **Data yang bisa didapat** secara legal: dataset publik, API terbuka, atau data milikmu sendiri.
- **Cakupan 6–10 minggu** paruh waktu. Lebih baik kecil dan selesai daripada ambisius dan setengah jadi.
- **Menyentuh komponen dari setiap fase**, sesuai langkah-langkah di bawah.

Contoh ide yang sesuai dengan checklist (gabungan RAG dan ML):

> **Asisten layanan pelanggan e-commerce**: RAG yang menjawab pertanyaan dari kebijakan toko dengan kutipan sumber, ditambah model klasifikasi yang memprediksi tiket mana yang akan eskalasi menjadi keluhan, sehingga tim CS bisa memprioritaskannya. Dashboard menunjukkan waktu respons dan tiket yang tercegah eskalasi.

Ide lain: deteksi anomali transaksi dengan penjelasan dalam bahasa alami, prediksi permintaan stok untuk UMKM, atau sistem rekomendasi materi belajar.

## Rencana kerja

| Minggu | Fokus | Hasil |
|---|---|---|
| 1 | Problem statement, data, arsitektur | Dokumen satu halaman, diagram, EDA awal |
| 2–3 | Baseline dan model utama | Notebook eksperimen dan run di MLflow |
| 4 | API dan Docker | Endpoint `/predict` berjalan di container |
| 5 | CI/CD dan deploy | URL publik, tes otomatis di GitHub Actions |
| 6 | Dashboard dan monitoring | Dashboard dampak bisnis, log prediksi |
| 7 | Dokumentasi dan presentasi | README, model card, slide eksekutif |

## 1. Riset dan arsitektur data

- Tulis **problem statement** dengan metrik bisnis dan metrik model yang disepakati sejak awal.
- Tinjau pendekatan yang sudah ada (paper, artikel teknis perusahaan, solusi Kaggle) supaya tidak menemukan ulang hal yang sama.
- Petakan **sumber data**: asal, ukuran, frekuensi pembaruan, kualitas, dan isu privasi.
- Gambar **arsitektur** dari data mentah sampai pengguna:

```text
sumber data → ingest (skrip terjadwal) → penyimpanan (Postgres / Parquet) → fitur
           → training (MLflow) → registry → API (FastAPI + Docker) → aplikasi/dashboard
                                                       ↓
                                           log prediksi → monitoring
```

Simpan keputusan penting dalam catatan singkat (*decision log*): apa yang dipilih, alternatifnya, dan alasannya.

## 2. Model RAG/ML

- Mulai dari **baseline** sederhana dan catat skornya, supaya setiap peningkatan bisa diukur.
- Tetapkan **set evaluasi** sebelum eksperimen: data uji untuk model ML; daftar pertanyaan dengan jawaban yang diharapkan untuk RAG.
- Lacak semua eksperimen di **MLflow** dengan parameter, metrik, dan versi data.
- Evaluasi lebih dari satu angka: per kelompok (*slice*), analisis kesalahan pada contoh yang salah, dan untuk RAG ukur kualitas retrieval dan kesetiaan jawaban secara terpisah.
- Pilih model akhir dengan mempertimbangkan latensi, biaya, dan kemudahan menjelaskan, bukan hanya skor.

## 3. API Docker dan CI/CD

- Bungkus model dalam **FastAPI** dengan skema input/output, `/health`, dan versi model di setiap respons.
- Paketkan dengan **Docker**, dengan versi library terkunci.
- **GitHub Actions**: lint, tes kode, tes data, dan tes ambang model di setiap pull request; build image dan deploy otomatis dari `main`.
- Deploy ke **Hugging Face Spaces, Render, atau AWS**, dan pastikan URL publiknya bisa dicoba orang lain.
- Catat setiap prediksi (tanpa data pribadi) untuk monitoring.

## 4. Dashboard dampak bisnis

Dashboard menjawab pertanyaan pemangku kepentingan, bukan menampilkan semua metrik yang ada. Susun tiga lapis:

| Lapis | Pertanyaan | Contoh metrik |
|---|---|---|
| Dampak bisnis | Apakah ini menghasilkan nilai? | Tiket eskalasi tercegah, jam kerja CS yang dihemat, estimasi rupiah |
| Pemakaian | Apakah dipakai? | Jumlah pertanyaan per hari, persentase jawaban yang diterima |
| Kesehatan model | Apakah masih bekerja? | Metrik model per minggu, drift, latensi p95, tingkat error |

Alat yang praktis: **Streamlit** (Python, cepat dibuat), Metabase atau Looker Studio (terhubung langsung ke database). Terapkan prinsip dari catatan Visualisasi & Storytelling: judul berupa kesimpulan dan satu pesan per grafik. Jika dampak sebenarnya belum bisa diukur, tampilkan **estimasi** dengan asumsi yang tertulis jelas.

## 5. Dokumentasi teknis

Dokumentasi yang lengkap membuat proyekmu bisa dinilai, dipakai, dan dilanjutkan orang lain:

- **README**: masalah yang diselesaikan, demo (URL dan GIF singkat), arsitektur, cara menjalankan lokal dalam beberapa perintah, struktur folder.
- **Model card**: tujuan, data, performa per kelompok, batasan, dan pemilik (catatan Governance & Security).
- **Dokumentasi API**: halaman `/docs` dari FastAPI, ditambah contoh `curl`.
- **Decision log**: pilihan penting dan alasannya.
- **Reproducibility**: commit, versi data, seed, dan cara melatih ulang.
- **Keterbatasan dan langkah berikutnya**: jujur tentang apa yang belum berhasil. Ini menunjukkan kedewasaan, bukan kelemahan.

## 6. Presentasi eksekutif untuk stakeholder

Format 10 menit untuk audiens non teknis, dengan struktur **jawaban dulu**:

1. **Masalah dan dampaknya** dalam bahasa bisnis (1 slide): "Tim CS menangani 3.000 tiket per minggu; 8% berakhir menjadi keluhan resmi."
2. **Solusi dalam satu kalimat dan demo singkat** (1–2 slide): tunjukkan, jangan jelaskan arsitektur.
3. **Hasil** (1–2 slide): angka bisnis lebih dulu, metrik model sebagai pendukung, dengan rentang ketidakpastian.
4. **Risiko dan batasan** (1 slide): kapan sistem bisa salah dan apa pengamannya.
5. **Rekomendasi dan permintaan** (1 slide): keputusan apa yang kamu minta dari mereka, misalnya uji coba 4 minggu di satu tim.

Siapkan **lampiran teknis** untuk pertanyaan detail, tapi jangan masukkan ke alur utama. Latih presentasinya dengan batas waktu, dan siapkan jawaban untuk tiga pertanyaan yang pasti muncul: "berapa biayanya?", "apa risikonya?", dan "kenapa tidak pakai cara yang lebih sederhana?".

## Daftar periksa akhir

- [Masalah] Problem statement dengan metrik bisnis tertulis sebelum mulai.
- [Data] Sumber, kualitas, dan privasi terdokumentasi.
- [Model] Baseline, set evaluasi, eksperimen di MLflow, analisis kesalahan.
- [Rekayasa] API + Docker + CI/CD + URL publik yang berjalan.
- [Monitoring] Log prediksi dan dashboard kesehatan model.
- [Komunikasi] README, model card, dan presentasi 10 menit.

Proyek yang mencentang semua poin di atas adalah bukti nyata kesiapan untuk peran yang menggabungkan teknis dan kepemimpinan.

## Latihan

1. Tulis tiga ide capstone, nilai masing-masing berdasarkan kriteria di atas, dan pilih satu.
2. Buat dokumen satu halaman: problem statement, metrik keberhasilan, sumber data, dan diagram arsitektur.
3. Susun rencana kerja mingguan untuk proyekmu dengan hasil konkret per minggu.
4. Setelah selesai, presentasikan ke satu orang non teknis dan satu orang teknis, lalu catat pertanyaan yang tidak bisa kamu jawab.
5. Publikasikan proyekmu (repo, URL demo, tulisan singkat) dan minta umpan balik dari praktisi.

Rujukan: proyek ML Zoomcamp dan MLOps Zoomcamp di bagian sumber belajar memberi contoh struktur capstone yang lengkap.
