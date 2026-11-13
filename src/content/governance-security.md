Catatan ini mengikuti empat langkah di checklist. Governance adalah sisi ML yang sering dilewati di tutorial, tapi menentukan apakah model boleh dan layak dipakai di organisasi sungguhan. Bagi seorang Lead Data Scientist, ini bagian dari tanggung jawab utama: memastikan model bisa dipercaya, diaudit, dan tidak merugikan orang.

## 1. Standar kualitas data

Model tidak bisa lebih baik dari datanya. Kualitas data diukur dari beberapa dimensi:

| Dimensi | Pertanyaan | Contoh aturan |
|---|---|---|
| Kelengkapan | Apakah data yang wajib ada? | `id_pelanggan` tidak boleh kosong |
| Validitas | Apakah sesuai format dan rentang? | Umur 17–100, email berformat benar |
| Keunikan | Apakah ada duplikat? | Satu `id_transaksi` hanya satu baris |
| Konsistensi | Apakah sama antar sistem? | Total di tabel ringkasan = jumlah detail |
| Ketepatan waktu | Apakah cukup baru? | Data kemarin sudah masuk sebelum pukul 06.00 |
| Akurasi | Apakah sesuai kenyataan? | Sampel acak dicocokkan dengan dokumen asli |

Tulis aturan sebagai kode dan jalankan otomatis setiap kali data baru masuk, sebelum dipakai untuk training atau prediksi:

```python
import pandas as pd

def cek_kualitas(df: pd.DataFrame) -> list[str]:
    masalah = []
    if df["id_pelanggan"].isna().any():
        masalah.append("id_pelanggan kosong")
    if df["id_transaksi"].duplicated().any():
        masalah.append(f"{df['id_transaksi'].duplicated().sum()} id_transaksi duplikat")
    if not df["umur"].dropna().between(17, 100).all():
        masalah.append("umur di luar 17–100")
    kosong = df.isna().mean()
    for kolom in kosong[kosong > 0.2].index:
        masalah.append(f"{kolom}: {kosong[kolom]:.0%} kosong (batas 20%)")
    return masalah

contoh = pd.DataFrame({"id_pelanggan": [1, 2, None], "id_transaksi": [10, 10, 11], "umur": [25, 130, 40]})
print(cek_kualitas(contoh))
```

Buat juga **kontrak data** dengan tim pemilik sumber data: skema, arti setiap kolom, jadwal pembaruan, dan siapa yang dihubungi jika ada masalah. Perubahan skema tanpa pemberitahuan adalah penyebab paling umum model rusak diam-diam.

## 2. Manajemen risiko model

Setiap model bisa salah. Manajemen risiko memastikan kesalahan itu dipahami, dibatasi, dan ada yang bertanggung jawab.

**Klasifikasikan risiko** berdasarkan dampak keputusan yang dipengaruhi model:

| Tingkat | Contoh | Kontrol |
|---|---|---|
| Rendah | Rekomendasi artikel | Monitoring standar |
| Sedang | Prioritas tiket layanan pelanggan | Review berkala, monitoring per kelompok |
| Tinggi | Persetujuan kredit, rekrutmen, diagnosis | Validasi independen, keterjelasan, uji keadilan, manusia ikut memutuskan, audit |

Komponen manajemen risiko:

- **Validasi independen**: model berisiko tinggi diperiksa orang yang tidak membangunnya.
- **Uji keadilan** (*fairness*): bandingkan metrik antar kelompok (gender, wilayah, umur). Selisih besar adalah tanda bahaya, bahkan jika atribut sensitif tidak dipakai sebagai fitur, karena fitur lain (kode pos, nama sekolah) bisa menjadi proksinya.
- **Keterjelasan** (*explainability*): bisa menjelaskan faktor apa yang mendorong sebuah keputusan, misalnya dengan SHAP atau koefisien model linear.
- **Batas pemakaian**: dokumentasikan kapan model **tidak boleh** dipakai (populasi di luar data latih, tujuan lain).
- **Manusia dalam loop** dan jalur keberatan untuk keputusan yang berdampak besar pada orang.
- **Rencana darurat**: cara mematikan model dan kembali ke aturan sederhana jika terjadi masalah.

```python
import numpy as np
from sklearn.metrics import recall_score

rng = np.random.default_rng(0)
kelompok = rng.choice(["A", "B"], 2000, p=[0.7, 0.3])
y = rng.integers(0, 2, 2000)
pred = np.where(kelompok == "A", y, np.where(rng.random(2000) < 0.7, y, 1 - y))   # model lebih buruk di B

for g in ["A", "B"]:
    m = kelompok == g
    print(g, "recall:", round(recall_score(y[m], pred[m]), 3), "| tingkat positif:", round(pred[m].mean(), 3))
```

Rujukan kerangka kerja yang banyak dipakai: NIST AI Risk Management Framework (Govern, Map, Measure, Manage). Di sektor keuangan, regulator biasanya juga punya aturan manajemen risiko model sendiri.

## 3. Dokumentasi reproducibility

Sebuah hasil bisa direproduksi jika orang lain (atau kamu, enam bulan kemudian) bisa mendapatkan model dan angka yang sama. Yang harus dicatat dan dikunci:

| Komponen | Cara |
|---|---|
| Kode | Git commit hash untuk setiap model |
| Data | Versi atau snapshot data (DVC, tabel bertanggal, hash file) |
| Lingkungan | `requirements.txt` dengan versi terkunci, atau image Docker |
| Keacakan | Seed acak di NumPy, scikit-learn, PyTorch, dan pembagian data |
| Konfigurasi | Hyperparameter di file konfigurasi, bukan di kode yang diubah-ubah |
| Hasil | Metrik dan artefak tercatat di MLflow (catatan Tracking & Monitoring) |

Dokumentasikan setiap model dengan **model card**, dokumen singkat yang standar:

```text
Model card: Prediksi churn pelanggan v2.1
- Tujuan: memprioritaskan pelanggan untuk program retensi. Bukan untuk menentukan harga.
- Data latih: transaksi Jan 2024–Jun 2026, 1,2 juta pelanggan, wilayah Jawa dan Bali.
- Model: LightGBM; fitur utama: frekuensi belanja, hari sejak transaksi terakhir, keluhan.
- Performa (uji, Jul–Sep 2026): AUC 0,84; recall@10% 0,41.
- Per kelompok: AUC wilayah Bali 0,79 (lebih rendah, data lebih sedikit).
- Batasan: belum diuji untuk pelanggan korporat dan wilayah di luar Jawa–Bali.
- Pemilik: Tim Data Science Retensi. Review berikutnya: Jan 2027.
- Versi: commit a1b2c3d, data snapshot 2026-10-01, MLflow run 7f3e.
```

Untuk dataset, dokumen serupa disebut *datasheet*: asal data, cara pengumpulan, siapa yang terwakili dan siapa tidak, dan batasan penggunaannya.

## 4. Privasi data

Data science sering bekerja dengan data pribadi. Prinsip-prinsip yang berlaku di hampir semua regulasi privasi:

- **Minimisasi**: kumpulkan dan pakai hanya data yang benar-benar diperlukan untuk tujuan yang jelas.
- **Pembatasan tujuan**: data yang dikumpulkan untuk satu tujuan tidak otomatis boleh dipakai untuk tujuan lain.
- **Dasar hukum dan persetujuan** untuk pemrosesan.
- **Keamanan**: akses berdasarkan peran, enkripsi, log akses.
- **Retensi**: hapus data setelah tidak diperlukan.
- **Hak pemilik data**: mengakses, memperbaiki, dan meminta penghapusan datanya.

Di Indonesia, aturan utamanya adalah **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**; di Uni Eropa, GDPR. Untuk proyek nyata, selalu libatkan tim hukum atau *data protection officer* organisasimu, karena catatan ini bukan nasihat hukum.

Teknik praktis di sisi data science:

```python
import hashlib
import hmac
import os

KUNCI = os.environ.get("KUNCI_PSEUDONIM", "ganti-dengan-rahasia-di-env").encode()

def pseudonim(nilai: str) -> str:
    # HMAC dengan kunci rahasia: konsisten untuk join antartabel, tapi tidak bisa ditebak ulang tanpa kunci
    return hmac.new(KUNCI, nilai.strip().lower().encode(), hashlib.sha256).hexdigest()[:16]

print(pseudonim("ayu@contoh.com") == pseudonim(" Ayu@Contoh.com "))   # True
```

| Teknik | Penjelasan |
|---|---|
| Pseudonimisasi | Ganti identitas langsung (nama, email, NIK) dengan kode; masih termasuk data pribadi karena bisa dihubungkan kembali dengan kuncinya |
| Anonimisasi | Hapus kemungkinan identifikasi sepenuhnya; jauh lebih sulit dari kelihatannya, karena kombinasi umur + kode pos + gender sering cukup untuk mengenali orang |
| Generalisasi | Umur → kelompok umur, alamat → kota |
| Akses minimum | Analis bekerja dengan data yang sudah dipseudonimkan; data mentah hanya untuk peran tertentu |

Perhatian khusus untuk LLM dan layanan pihak ketiga: jangan mengirim data pribadi ke API eksternal tanpa persetujuan dan perjanjian pemrosesan data, dan jangan menaruh data pribadi di prompt, log, atau notebook yang dibagikan. Model juga bisa **menghafal** data latih, jadi data pribadi di training set adalah risiko kebocoran tersendiri.

## Latihan

1. Tulis 8 aturan kualitas data untuk dataset pilihanmu sebagai fungsi Python, lalu jalankan pada versi data yang sengaja dirusak.
2. Hitung recall dan tingkat prediksi positif per kelompok untuk salah satu model Fase 4-mu. Apakah ada selisih yang mengkhawatirkan?
3. Buat model card lengkap untuk satu model yang pernah kamu latih.
4. Pastikan satu proyekmu bisa direproduksi: clone ke folder baru, pasang dari `requirements.txt`, jalankan, dan cocokkan metriknya.
5. Petakan semua kolom data pribadi di satu dataset, tentukan perlakuannya (hapus, pseudonim, generalisasi), dan jelaskan alasannya.
