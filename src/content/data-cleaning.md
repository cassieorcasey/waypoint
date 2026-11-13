Catatan ini mengikuti lima langkah di checklist. Data nyata hampir selalu kotor, dan sebagian besar waktu proyek data habis di tahap ini. Prinsip yang berlaku untuk semua langkah: **pahami dulu penyebabnya, baru putuskan cara memperbaikinya**, dan catat setiap keputusan.

```python
import numpy as np
import pandas as pd
```

## 1. Missing values dan imputasi

Pertama, ukur seberapa banyak dan di mana:

```python
df.isna().sum()                          # jumlah kosong per kolom
df.isna().mean().sort_values()           # proporsinya
df[df["umur"].isna()].head()             # lihat contoh barisnya
```

Tanyakan **kenapa** datanya kosong, karena itu menentukan perlakuannya:

| Jenis | Arti | Contoh |
|---|---|---|
| MCAR | Kosong acak sepenuhnya | Sensor gagal kirim secara acak |
| MAR | Kosong bergantung pada kolom lain yang terlihat | Pria lebih jarang mengisi berat badan |
| MNAR | Kosong bergantung pada nilainya sendiri | Orang berpenghasilan tinggi tidak mau mengisi gaji |

Pilihan perlakuan:

- **Hapus baris** (`dropna`) jika sedikit dan acak. Hati-hati: bisa membuang informasi dan membuat bias.
- **Hapus kolom** jika sebagian besar kosong dan tidak penting.
- **Isi dengan nilai sederhana**: median untuk numerik (tahan outlier), modus atau kategori `"Tidak diketahui"` untuk kategorikal.
- **Isi berbasis kelompok**: misalnya median umur per kelas penumpang.
- **Model**: `KNNImputer` atau `IterativeImputer` di scikit-learn.
- **Tambah penanda**: kolom `umur_kosong` (0/1), karena "kosong" itu sendiri sering informatif.

```python
df["umur_kosong"] = df["umur"].isna().astype(int)
df["umur"] = df["umur"].fillna(df.groupby("kelas")["umur"].transform("median"))
```

> **Penting:** hitung nilai pengisi (median, modus) **hanya dari data latih**, lalu terapkan ke data uji. Menghitungnya dari seluruh data adalah *data leakage*. Cara paling aman adalah `SimpleImputer` di dalam `Pipeline` scikit-learn.

```python
from sklearn.impute import SimpleImputer

imp = SimpleImputer(strategy="median", add_indicator=True)
X_train_isi = imp.fit_transform(X_train)   # belajar median dari train
X_test_isi = imp.transform(X_test)         # pakai median yang sama
```

## 2. Deteksi outlier

Outlier adalah nilai yang jauh dari mayoritas. Bisa berupa **kesalahan** (umur 999, harga negatif) atau **kejadian nyata yang langka** (transaksi besar, yang justru penting di deteksi penipuan). Jangan langsung hapus.

Metode IQR (tahan terhadap outlier itu sendiri):

```python
q1, q3 = df["harga"].quantile([0.25, 0.75])
iqr = q3 - q1
batas_bawah, batas_atas = q1 - 1.5 * iqr, q3 + 1.5 * iqr
outlier = df[(df["harga"] < batas_bawah) | (df["harga"] > batas_atas)]
```

Metode lain:

- **z-score** `|z| > 3`: cocok untuk data yang mendekati normal, tapi mean dan std ikut tertarik oleh outlier.
- **Visual**: box plot dan histogram, selalu lihat dulu.
- **Multivariat**: `IsolationForest` untuk titik yang aneh secara kombinasi, walaupun tiap nilainya tampak wajar.

Setelah ketemu, pilih:

| Tindakan | Kapan |
|---|---|
| Perbaiki atau hapus | Jelas salah input (umur 999) |
| *Capping* / *winsorizing* | Nilai ekstrem asli tapi mengganggu model linear: `clip(batas_bawah, batas_atas)` |
| Transformasi | Data miring: `np.log1p` |
| Biarkan | Model berbasis pohon cukup tahan outlier, atau outlier adalah sinyal |

## 3. Hapus duplikat

```python
df.duplicated().sum()                                   # duplikat persis di semua kolom
df = df.drop_duplicates()

df.duplicated(subset=["id_pelanggan", "tanggal"]).sum() # duplikat menurut kunci bisnis
df = df.sort_values("waktu_update").drop_duplicates(subset="id_pelanggan", keep="last")
```

Duplikat yang tidak persis sering lolos: `"Jakarta"`, `"jakarta "`, dan `"DKI Jakarta"`. Rapikan teks dulu:

```python
df["kota"] = df["kota"].str.strip().str.title().replace({"Dki Jakarta": "Jakarta"})
```

Duplikat juga berbahaya di sisi evaluasi: data yang sama di train dan test membuat skor model terlihat lebih bagus dari kenyataannya.

## 4. Encoding fitur kategorikal

Model butuh angka. Cara mengubah kategori:

| Teknik | Hasil | Cocok untuk |
|---|---|---|
| One-hot | Satu kolom 0/1 per kategori | Kategori nominal dengan sedikit nilai unik |
| Ordinal | Satu kolom angka berurutan | Kategori berurutan (S < M < L) |
| Target encoding | Rata-rata target per kategori | Kategori dengan sangat banyak nilai (kode pos) |
| Frequency encoding | Frekuensi kemunculan | Alternatif sederhana untuk kardinalitas tinggi |

```python
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder

ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
X_kota = ohe.fit_transform(df[["kota"]])

ukuran = OrdinalEncoder(categories=[["S", "M", "L", "XL"]])
X_ukuran = ukuran.fit_transform(df[["ukuran"]])
```

Jangan beri angka 1, 2, 3 ke kategori **tanpa urutan** (Jakarta=1, Bandung=2): model linear akan menganggap Bandung "dua kali" Jakarta. `handle_unknown="ignore"` mencegah error ketika data baru berisi kategori yang tidak ada saat training. Target encoding harus dihitung dengan cross-validation (`TargetEncoder` di scikit-learn melakukannya) supaya tidak bocor.

## 5. Feature scaling

Fitur dengan skala berbeda (umur 20–60, gaji 5.000.000–50.000.000) membuat model berbasis jarak dan gradien berat sebelah ke fitur bernilai besar.

| Scaler | Rumus | Kapan |
|---|---|---|
| `StandardScaler` | `(x - mean) / std` | Default untuk model linear, SVM, neural network, PCA |
| `MinMaxScaler` | ke rentang 0–1 | Butuh rentang terbatas, misalnya input gambar |
| `RobustScaler` | `(x - median) / IQR` | Data dengan banyak outlier |

Model berbasis pohon (Decision Tree, Random Forest, XGBoost) **tidak butuh** scaling karena hanya membandingkan nilai dengan ambang.

Satukan semua langkah dalam satu pipeline supaya urutannya benar dan tidak ada kebocoran:

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

numerik = ["umur", "gaji"]
kategorikal = ["kota", "produk"]

prep = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), numerik),
    ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("ohe", OneHotEncoder(handle_unknown="ignore"))]), kategorikal),
])
model = Pipeline([("prep", prep), ("clf", LogisticRegression(max_iter=1000))])
model.fit(X_train, y_train)          # semua statistik dipelajari dari train saja
```

## Latihan

1. Pada dataset Titanic, buat tabel berisi persentase kosong tiap kolom dan putuskan perlakuan untuk masing-masing, lengkap dengan alasannya.
2. Bandingkan imputasi umur dengan median global dan median per kelas. Mana yang lebih masuk akal?
3. Cari outlier tarif tiket dengan IQR, lihat barisnya, dan putuskan apakah itu kesalahan atau nyata.
4. Sengaja buat 50 baris duplikat yang berbeda huruf besar/kecil, lalu bersihkan.
5. Bangun `ColumnTransformer` lengkap seperti contoh, dan pastikan tidak ada statistik yang dihitung dari data uji.
