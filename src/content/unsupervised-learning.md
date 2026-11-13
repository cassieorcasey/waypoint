Catatan ini mengikuti empat langkah di checklist. Unsupervised learning bekerja **tanpa label**: tugasnya menemukan struktur di data. Dua keluarga utama: **clustering** (mengelompokkan data yang mirip, misalnya segmentasi pelanggan) dan **reduksi dimensi** (meringkas banyak fitur jadi sedikit, misalnya untuk visualisasi). Karena tidak ada jawaban benar, evaluasinya selalu melibatkan penilaian manusia: apakah kelompoknya masuk akal dan berguna?

```python
import numpy as np
from sklearn.datasets import make_blobs, make_moons, load_wine
from sklearn.preprocessing import StandardScaler
```

Hampir semua metode di sini berbasis **jarak**, jadi fitur **wajib di-scale** dulu.

## 1. K-Means

Algoritma:

1. Pilih `k` pusat awal (scikit-learn memakai *k-means++* yang menyebarkan pusat awal dengan cerdas).
2. Tempatkan setiap titik ke pusat terdekat.
3. Pindahkan setiap pusat ke rata-rata titik anggotanya.
4. Ulangi langkah 2–3 sampai pusat tidak berubah.

K-Means meminimalkan **inertia**: total kuadrat jarak titik ke pusatnya.

```python
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

X, _ = make_blobs(n_samples=500, centers=4, cluster_std=1.0, random_state=0)
X = StandardScaler().fit_transform(X)

for k in range(2, 8):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    print(k, round(km.inertia_, 1), round(silhouette_score(X, km.labels_), 3))
```

Memilih `k`:

- **Elbow**: plot inertia terhadap `k`, pilih titik "siku" di mana penurunannya melandai.
- **Silhouette score** (-1 sampai 1): seberapa dekat titik ke kelompoknya dibanding kelompok tetangga. Makin tinggi makin baik. Pada data contoh, nilainya puncak di `k = 4`.
- **Kebutuhan bisnis**: tim marketing mungkin hanya sanggup menangani 3–5 segmen.

Keterbatasan: K-Means mengasumsikan kelompok berbentuk bulat dan berukuran mirip, sensitif terhadap outlier, dan harus diberi `k` di awal.

## 2. DBSCAN

DBSCAN mengelompokkan berdasarkan **kepadatan**: kelompok adalah area padat yang dipisahkan area jarang. Dua parameter:

- `eps`: radius tetangga.
- `min_samples`: jumlah tetangga minimum agar sebuah titik disebut **titik inti**.

Titik yang tidak masuk area padat mana pun diberi label `-1` (**noise**).

```python
from sklearn.cluster import DBSCAN

Xm, _ = make_moons(n_samples=400, noise=0.06, random_state=0)   # dua bulan sabit
Xm = StandardScaler().fit_transform(Xm)

db = DBSCAN(eps=0.3, min_samples=5).fit(Xm)
label = db.labels_
print("kelompok:", len(set(label)) - (1 if -1 in label else 0), "| noise:", (label == -1).sum())

km = KMeans(n_clusters=2, n_init=10, random_state=0).fit(Xm)   # K-Means memotong bulan sabitnya secara lurus
```

Kelebihan: tidak perlu menentukan jumlah kelompok, bisa menemukan bentuk sembarang, dan otomatis mendeteksi outlier. Kelemahan: sulit jika kepadatan antarkelompok sangat berbeda, dan `eps` sensitif. Cara memilih `eps`: urutkan jarak ke tetangga ke-`min_samples` untuk semua titik, plot, lalu cari "siku"-nya. HDBSCAN (`sklearn.cluster.HDBSCAN`) mengatasi kepadatan yang beragam tanpa `eps`.

## 3. Hierarchical Clustering

Clustering hierarkis membangun **pohon kelompok** (*dendrogram*). Versi *agglomerative* dimulai dari setiap titik sebagai kelompok sendiri, lalu berulang kali menggabungkan dua kelompok terdekat sampai tersisa satu.

Cara mengukur jarak antarkelompok (*linkage*):

| Linkage | Jarak antarkelompok | Sifat |
|---|---|---|
| `ward` | Kenaikan varians jika digabung | Kelompok kompak dan seimbang; default yang baik |
| `complete` | Jarak titik terjauh | Kelompok rapat |
| `average` | Rata-rata semua pasangan | Kompromi |
| `single` | Jarak titik terdekat | Bisa membentuk rantai panjang |

```python
from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import linkage, dendrogram
import matplotlib.pyplot as plt

Xw = StandardScaler().fit_transform(load_wine().data)
agg = AgglomerativeClustering(n_clusters=3, linkage="ward").fit(Xw)

Z = linkage(Xw, method="ward")
fig, ax = plt.subplots(figsize=(9, 3.5))
dendrogram(Z, truncate_mode="lastp", p=20, ax=ax)
ax.set(title="Dendrogram data wine", ylabel="Jarak penggabungan")
```

Potong dendrogram secara horizontal di tempat ada lompatan jarak yang besar: jumlah garis yang terpotong adalah jumlah kelompok yang wajar. Kelebihannya: tidak perlu menentukan `k` di awal dan hierarkinya sendiri informatif. Kelemahannya: memori dan waktunya tumbuh kuadratik, jadi kurang cocok untuk lebih dari puluhan ribu titik.

## 4. Principal Component Analysis

PCA mengubah fitur yang saling berkorelasi menjadi **komponen utama** baru yang tidak berkorelasi, terurut dari yang menangkap variasi terbanyak. Secara matematis, komponen adalah eigenvector matriks kovarians (lihat catatan Aljabar Linear), dihitung lewat SVD.

```python
from sklearn.decomposition import PCA

pca = PCA().fit(Xw)                       # 13 fitur kimia anggur
kumulatif = np.cumsum(pca.explained_variance_ratio_)
print(np.round(kumulatif[:5], 2))         # porsi variasi yang tertangkap oleh 1..5 komponen
k = int(np.argmax(kumulatif >= 0.9)) + 1
print("komponen untuk 90% variasi:", k)

X2 = PCA(n_components=2).fit_transform(Xw)   # untuk plot 2D
```

Kegunaan PCA:

- **Visualisasi** data berdimensi tinggi dalam 2D atau 3D.
- **Mengurangi fitur** sebelum model, menghilangkan multikolinearitas dan sebagian noise.
- **Mempercepat** clustering dan model lain.

Hal yang perlu diingat: PCA **wajib** di-scale (tanpa scaling, fitur dengan angka besar mendominasi); komponennya sulit dijelaskan dalam bahasa bisnis (setiap komponen campuran semua fitur, lihat `pca.components_`); dan PCA hanya menangkap struktur **linear**. Untuk visualisasi struktur non-linear, gunakan t-SNE atau UMAP, tapi jangan pakai jarak di plot itu sebagai ukuran sebenarnya.

## Latihan

1. Segmentasikan pelanggan (dataset *Mall Customers* di Kaggle) dengan K-Means. Tentukan `k` dengan elbow dan silhouette, lalu beri nama tiap segmen berdasarkan rata-rata fiturnya.
2. Jalankan K-Means dan DBSCAN pada `make_moons`, plot hasil keduanya berdampingan, dan jelaskan perbedaannya.
3. Buat dendrogram data wine dengan empat jenis linkage. Mana yang paling mirip dengan label asli?
4. Hitung berapa komponen PCA yang dibutuhkan untuk 95% variasi pada dataset digit (`load_digits`), lalu plot dua komponen pertama dengan warna per digit.
5. Bandingkan akurasi Logistic Regression pada data digit asli dan setelah PCA ke 20 komponen.
