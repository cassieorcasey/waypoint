Catatan ini mengikuti dua langkah di checklist. NumPy adalah fondasi hampir semua library data di Python: pandas, scikit-learn, dan matplotlib dibangun di atasnya. Dua hal yang perlu dikuasai: cara kerja array, dan cara berpikir tanpa loop.

```python
import numpy as np
```

## 1. Array multi dimensi

`ndarray` adalah tabel angka bertipe sama yang disimpan rapat di memori. Itu yang membuatnya jauh lebih cepat dan hemat daripada list Python.

```python
a = np.array([1, 2, 3])                 # 1D, shape (3,)
M = np.array([[1, 2, 3], [4, 5, 6]])    # 2D, shape (2, 3)
T = np.zeros((2, 3, 4))                 # 3D, misalnya 2 gambar 3×4

print(M.ndim, M.shape, M.size, M.dtype) # 2 (2, 3) 6 int64
```

Membuat array:

```python
np.zeros((3, 3))            # semua 0
np.ones(5)                  # semua 1
np.eye(3)                   # matriks identitas
np.arange(0, 10, 2)         # [0 2 4 6 8]
np.linspace(0, 1, 5)        # [0.   0.25 0.5  0.75 1.  ]
rng = np.random.default_rng(42)
rng.normal(0, 1, size=(2, 3))   # angka acak normal; pakai Generator, bukan np.random.seed
```

**Indexing dan slicing**:

```python
M = np.arange(12).reshape(3, 4)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]
print(M[1, 2])          # 6           baris 1, kolom 2
print(M[:, 0])          # [0 4 8]     seluruh kolom 0
print(M[0:2, 1:3])      # [[1 2] [5 6]]
print(M[M > 6])         # [ 7  8  9 10 11]   boolean mask
print(M[[0, 2]])        # baris 0 dan 2 (fancy indexing)
```

> **Penting:** slicing menghasilkan **view**, bukan salinan. Mengubah `M[0:2, 1:3]` ikut mengubah `M`. Gunakan `.copy()` bila butuh salinan terpisah. Boolean mask dan fancy indexing selalu menghasilkan salinan.

**Mengubah bentuk**: `reshape(3, 4)` atau `reshape(-1, 1)` (`-1` = hitung otomatis), `M.T` untuk transpose, `ravel()` untuk meratakan, `np.concatenate`, `np.vstack`, dan `np.hstack` untuk menggabungkan.

**Axis**: banyak fungsi menerima `axis`. `axis=0` bekerja **menyusuri baris** (hasil per kolom), `axis=1` bekerja **menyusuri kolom** (hasil per baris).

```python
print(M.sum(axis=0))    # [12 15 18 21]   total per kolom
print(M.sum(axis=1))    # [ 6 22 38]      total per baris
```

## 2. Vectorization

Vectorization berarti menulis operasi pada **seluruh array sekaligus**, bukan dengan loop Python. Operasinya dijalankan oleh kode C yang sudah dikompilasi, biasanya puluhan sampai ratusan kali lebih cepat.

```python
import time

x = np.random.default_rng(0).random(1_000_000)

t = time.perf_counter()
hasil_loop = [v * 2 + 1 for v in x]
print("loop  :", round(time.perf_counter() - t, 3), "detik")

t = time.perf_counter()
hasil_vec = x * 2 + 1
print("vektor:", round(time.perf_counter() - t, 4), "detik")
```

Alat utama vectorization:

- **Operasi per elemen**: `+ - * / **`, juga fungsi universal (*ufunc*) seperti `np.sqrt`, `np.exp`, `np.log`, `np.abs`.
- **Agregasi**: `sum`, `mean`, `std`, `min`, `max`, `argmax`, `cumsum`, dengan `axis`.
- **Kondisi**: `np.where(kondisi, a, b)` menggantikan `if/else` di dalam loop.
- **Broadcasting**: array berbeda bentuk bisa dioperasikan jika dimensinya cocok dari kanan (sama, atau salah satunya 1).

```python
nilai = np.array([[70, 80, 90],
                  [60, 75, 85]])
bobot = np.array([0.2, 0.3, 0.5])        # shape (3,) di-broadcast ke tiap baris
print(nilai @ bobot)                     # [83. 77.]  nilai akhir tertimbang

# Standardisasi per kolom dengan broadcasting: (2,3) - (3,) / (3,)
z = (nilai - nilai.mean(axis=0)) / nilai.std(axis=0)

status = np.where(nilai >= 75, "lulus", "ulang")
```

Contoh nyata: jarak Euclidean dari setiap titik ke setiap pusat cluster, tanpa satu pun loop:

```python
titik = rng.random((100, 2))             # 100 titik
pusat = rng.random((3, 2))               # 3 pusat
jarak = np.sqrt(((titik[:, None, :] - pusat[None, :, :]) ** 2).sum(axis=2))
print(jarak.shape)                       # (100, 3)
label = jarak.argmin(axis=1)             # pusat terdekat untuk tiap titik
```

`[:, None, :]` menambahkan dimensi berukuran 1 supaya broadcasting menghasilkan semua pasangan `(100, 3, 2)`. Pola ini dipakai di K-Means (Fase 4).

> **Tip:** Kalau kamu menulis `for i in range(len(arr))` pada array NumPy, berhenti dan tanyakan: bisakah ini satu ekspresi array?

## Latihan

1. Buat matriks 5×5 berisi angka 1–25, lalu ambil diagonalnya, baris terakhir, dan semua angka genap.
2. Normalisasi setiap kolom matriks acak 100×4 ke rentang 0–1 (min-max) tanpa loop.
3. Ganti semua nilai negatif di sebuah array dengan 0 memakai `np.where`, lalu dengan `np.clip`.
4. Hitung moving average 7 hari dari 365 angka acak dengan `np.convolve` atau `np.cumsum`.
5. Tulis ulang fungsi berbasis loop berikut tanpa loop, lalu ukur selisih waktunya: hitung berapa banyak pasangan `(i, j)` dengan `a[i] + b[j] > 1`.
