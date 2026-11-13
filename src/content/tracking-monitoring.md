Catatan ini mengikuti empat langkah di checklist. Model yang sudah di-deploy bukan pekerjaan selesai. Dunia berubah, data berubah, dan performa model menurun diam-diam tanpa ada error yang muncul. Tracking menjawab "eksperimen mana yang menghasilkan model ini?", monitoring menjawab "apakah model ini masih bekerja dengan baik?".

## 1. Tracking eksperimen dengan MLflow

Tanpa tracking, eksperimen berakhir di nama file seperti `model_final_v3_benar.pkl` dan tidak ada yang ingat parameter apa yang menghasilkan skor terbaik. MLflow mencatat setiap **run**: parameter, metrik, artefak (model, grafik), versi kode, dan lingkungan.

```python
import mlflow
import mlflow.sklearn
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, f1_score
from sklearn.model_selection import train_test_split

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=0, stratify=y)

mlflow.set_experiment("diagnosis-tumor")

for depth in [3, 6, None]:
    with mlflow.start_run(run_name=f"rf-depth-{depth}"):
        params = {"n_estimators": 300, "max_depth": depth, "random_state": 0}
        model = RandomForestClassifier(**params).fit(X_tr, y_tr)
        proba = model.predict_proba(X_te)[:, 1]

        mlflow.log_params(params)
        mlflow.log_metric("roc_auc", roc_auc_score(y_te, proba))
        mlflow.log_metric("f1", f1_score(y_te, proba >= 0.5))
        mlflow.set_tag("data_versi", "breast_cancer_v1")
        mlflow.sklearn.log_model(model, "model")
```

```bash
mlflow ui                   # buka http://localhost:5000, bandingkan run berdampingan
```

Komponen MLflow:

| Komponen | Fungsi |
|---|---|
| Tracking | Mencatat parameter, metrik, dan artefak setiap run |
| Model Registry | Menyimpan versi model dengan alias seperti `champion` dan `challenger` |
| Models | Format standar untuk memuat model: `mlflow.pyfunc.load_model(uri)` |

Kebiasaan yang baik: catat versi **data** (hash file atau tag) di setiap run, beri nama run yang bermakna, dan daftarkan ke Model Registry hanya model yang benar-benar dipertimbangkan untuk produksi. Alternatif populer: Weights & Biases (kuat untuk deep learning) dan DVC (versi data di Git).

## 2. Data drift

**Data drift** (*covariate shift*) terjadi ketika distribusi **input** di produksi berbeda dari data latih. Contoh: model kredit dilatih saat suku bunga rendah, lalu suku bunga naik; atau aplikasi masuk ke kota baru dengan profil pengguna berbeda.

Data drift bisa dideteksi **tanpa label**, jadi ini peringatan dini yang murah. Dua cara umum untuk fitur numerik:

- **Uji Kolmogorov–Smirnov (KS)**: membandingkan dua distribusi; p-value kecil berarti berbeda. Pada data besar, perbedaan sepele pun bisa signifikan, jadi lihat juga besar statistiknya.
- **Population Stability Index (PSI)**: banyak dipakai di industri keuangan. Patokan umum: < 0,1 stabil, 0,1–0,25 perlu diperhatikan, > 0,25 bergeser signifikan.

```python
import numpy as np
from scipy.stats import ks_2samp

def psi(acuan, sekarang, bins=10):
    batas = np.quantile(acuan, np.linspace(0, 1, bins + 1))
    batas[0], batas[-1] = -np.inf, np.inf
    p = np.histogram(acuan, batas)[0] / len(acuan)
    q = np.histogram(sekarang, batas)[0] / len(sekarang)
    p, q = np.clip(p, 1e-6, None), np.clip(q, 1e-6, None)
    return float(np.sum((q - p) * np.log(q / p)))

rng = np.random.default_rng(0)
latih = rng.normal(35, 8, 5000)              # umur pengguna saat training
minggu_ini = rng.normal(35, 8, 2000)         # tidak berubah
bulan_depan = rng.normal(29, 7, 2000)        # pengguna makin muda

for nama, data in [("minggu ini", minggu_ini), ("bulan depan", bulan_depan)]:
    stat = ks_2samp(latih, data)
    print(f"{nama}: PSI={psi(latih, data):.3f}  KS={stat.statistic:.3f}  p={stat.pvalue:.3g}")
```

Untuk fitur kategorikal, bandingkan proporsi tiap kategori (uji chi-square atau PSI per kategori). Pantau juga **kualitas data**: lonjakan nilai kosong, kategori baru yang tidak dikenal, nilai di luar rentang wajar. Banyak "drift" sebenarnya adalah bug di pipeline data hulu.

Library seperti Evidently AI membuat laporan drift lengkap untuk semua fitur sekaligus.

## 3. Concept drift

**Concept drift** terjadi ketika **hubungan** antara input dan target berubah, walaupun distribusi inputnya tetap. Contoh: pola penipuan berubah karena penipu beradaptasi dengan model; kebiasaan belanja berubah setelah pandemi; definisi "pelanggan aktif" diubah oleh tim bisnis.

| | Data drift | Concept drift |
|---|---|---|
| Yang berubah | Distribusi `X` | Hubungan `X → y` |
| Bisa dideteksi tanpa label? | Ya | Umumnya tidak, butuh label |
| Contoh | Pengguna makin muda | Sinyal penipuan lama tidak berlaku lagi |

Mendeteksi concept drift membutuhkan **label sebenarnya**, yang sering datang terlambat: status gagal bayar baru diketahui berbulan-bulan kemudian. Strategi:

- Pantau metrik performa (AUC, precision, recall) setiap kali label datang, per minggu atau per bulan.
- Gunakan **proksi** yang datang lebih cepat (misalnya keluhan pelanggan, tingkat pembatalan) sebagai peringatan awal.
- Pantau **distribusi skor prediksi** model: perubahan mendadak sering menjadi tanda pertama.
- Siapkan kebijakan **retraining**: terjadwal (tiap bulan), atau dipicu ketika metrik turun di bawah ambang, dengan model baru yang selalu dibandingkan dulu dengan model lama (*champion vs challenger*) sebelum menggantikannya.

## 4. Latensi dan degradasi performa

Selain kualitas prediksi, model di produksi adalah **layanan perangkat lunak** yang harus cepat dan stabil.

Ukur latensi dengan **persentil**, bukan rata-rata. Rata-rata menyembunyikan permintaan yang sangat lambat, padahal itulah yang dirasakan pengguna.

```python
waktu_ms = np.concatenate([rng.gamma(4, 10, 9800), rng.uniform(300, 1200, 200)])   # 2% sangat lambat
print(f"rata-rata {waktu_ms.mean():.0f} ms")
for p in (50, 95, 99):
    print(f"p{p}: {np.percentile(waktu_ms, p):.0f} ms")
```

Rata-rata di atas terlihat wajar, tapi p99 menunjukkan 1 dari 100 pengguna menunggu jauh lebih lama.

Metrik yang perlu dipantau (biasanya dengan Prometheus + Grafana, atau layanan monitoring cloud):

| Kategori | Metrik |
|---|---|
| Layanan | Latensi p50/p95/p99, jumlah permintaan per detik, tingkat error 4xx/5xx, CPU dan memori |
| Data | Nilai kosong, nilai di luar rentang, drift per fitur |
| Model | Distribusi skor, proporsi tiap kelas yang diprediksi, metrik performa saat label tersedia |
| Bisnis | Metrik yang dipengaruhi model: konversi, kerugian penipuan, kepuasan |

Tetapkan **SLO** (misalnya "p95 di bawah 200 ms, error di bawah 0,1%") dan pasang **alert** ketika dilanggar. Penyebab umum latensi naik: model dimuat ulang di setiap permintaan, fitur dihitung dengan query lambat, ukuran batch terlalu besar, atau server kekurangan memori. Penyebab umum performa model turun tanpa error: perubahan skema data di hulu, fitur yang diam-diam berisi nilai default, dan drift.

## Latihan

1. Catat 10 run dengan parameter berbeda di MLflow, lalu bandingkan di UI dan daftarkan yang terbaik ke Model Registry.
2. Hitung PSI dan statistik KS untuk setiap fitur antara data 2025 dan 2026 dari dataset pilihanmu (atau simulasikan pergeserannya).
3. Simulasikan concept drift: latih model, lalu ubah aturan pembentuk label di data baru dan amati penurunan metriknya dari minggu ke minggu.
4. Tambahkan middleware di API FastAPI-mu yang mencatat latensi setiap permintaan, lalu hitung p50, p95, dan p99.
5. Tulis rencana monitoring satu halaman untuk satu model: metrik apa, ambang berapa, siapa yang menerima alert, dan apa langkah pertamanya.
