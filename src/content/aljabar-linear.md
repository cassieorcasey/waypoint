Catatan ini mengikuti delapan langkah di checklist. Aljabar linear adalah bahasa data di machine learning: satu baris data adalah **vektor**, satu dataset adalah **matriks**, dan sebagian besar model hanyalah rangkaian perkalian matriks. Semua contoh memakai NumPy.

```python
import numpy as np
```

## 1. Vektor

Vektor adalah daftar angka berurutan. Secara geometri, vektor adalah panah dari titik asal: punya arah dan panjang. Di data science, satu vektor biasanya mewakili satu objek: rumah dengan fitur `[luas, kamar, umur]`, atau satu kata sebagai *embedding* 768 angka.

```python
rumah = np.array([120, 3, 10])     # vektor berdimensi 3
print(rumah.shape)                 # (3,)
```

Dimensi vektor adalah jumlah elemennya. Ruang berdimensi tinggi (ratusan sampai ribuan) itu biasa di ML, walaupun tidak bisa kita bayangkan secara visual. Rumusnya tetap sama.

## 2. Operasi vektor

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(a + b)                    # [5 7 9]   penjumlahan per elemen
print(2 * a)                    # [2 4 6]   perkalian skalar
print(a @ b)                    # 32        dot product: 1*4 + 2*5 + 3*6
print(np.linalg.norm(a))        # 3.7416... panjang (norma L2) = akar(14)

cos = (a @ b) / (np.linalg.norm(a) * np.linalg.norm(b))
print(round(cos, 4))            # 0.9746    cosine similarity
```

**Dot product** mengukur seberapa searah dua vektor. Dibagi panjang keduanya, hasilnya **cosine similarity**: 1 berarti searah, 0 tegak lurus, -1 berlawanan. Inilah cara mesin pencari semantik dan sistem rekomendasi mengukur kemiripan: dua dokumen mirip kalau embedding-nya searah.

| Norma | Rumus | Dipakai di |
|---|---|---|
| L2 (Euclidean) | akar dari jumlah kuadrat | Jarak, regularisasi Ridge |
| L1 (Manhattan) | jumlah nilai mutlak | Regularisasi Lasso |

## 3. Matriks

Matriks adalah tabel angka berukuran `m × n` (m baris, n kolom). Dataset dengan 1.000 baris dan 5 fitur adalah matriks `1000 × 5`; setiap baris adalah satu vektor data.

```python
X = np.array([[120, 3, 10],
              [ 85, 2,  4],
              [200, 4, 25]])
print(X.shape)          # (3, 3)
print(X[0])             # baris pertama: [120 3 10]
print(X[:, 1])          # kolom kedua: [3 2 4]
```

Matriks khusus yang sering muncul: **identitas** `I` (diagonal 1, sisanya 0; `A @ I = A`), **diagonal**, dan **simetris** (`A = Aᵀ`, misalnya matriks kovarians dan korelasi).

## 4. Perkalian matriks

`A @ B` hanya bisa dilakukan jika jumlah **kolom A** sama dengan jumlah **baris B**: `(m × n) @ (n × p)` menghasilkan `(m × p)`. Setiap elemen hasilnya adalah dot product satu baris A dengan satu kolom B.

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[0, 1], [1, 0]])
print(A @ B)       # [[2 1] [4 3]]
print(B @ A)       # [[3 4] [1 2]]   urutan penting: A@B != B@A
print(A * B)       # [[0 2] [3 0]]   ini perkalian per elemen, BUKAN perkalian matriks
```

Model linear adalah perkalian matriks: prediksi untuk seluruh dataset sekaligus adalah `y_hat = X @ w + b`. Satu lapisan neural network juga sama, ditambah fungsi aktivasi. Itulah sebabnya GPU (yang sangat cepat mengalikan matriks) mempercepat deep learning.

> **Tip:** Kalau error "shapes not aligned", tulis bentuk kedua matriks di kertas: kolom kiri harus sama dengan baris kanan.

## 5. Transpose

Transpose menukar baris dan kolom: elemen `(i, j)` pindah ke `(j, i)`, dan bentuk `m × n` menjadi `n × m`.

```python
M = np.array([[1, 2, 3], [4, 5, 6]])
print(M.T)                       # [[1 4] [2 5] [3 6]]
print(M.shape, M.T.shape)        # (2, 3) (3, 2)
```

Sifat yang sering dipakai: `(Aᵀ)ᵀ = A` dan `(AB)ᵀ = BᵀAᵀ` (urutan terbalik). `Xᵀ X` selalu persegi dan simetris; bentuk ini muncul di rumus regresi linear `w = (XᵀX)⁻¹ Xᵀ y` dan di matriks kovarians.

## 6. Eigenvalues dan Eigenvectors

Untuk matriks persegi `A`, vektor `v` (bukan nol) adalah **eigenvector** jika `A v = λ v`. Artinya, saat dikalikan `A`, vektor itu tidak berubah arah, hanya diskalakan sebesar `λ` (**eigenvalue**).

```python
S = np.array([[2, 1], [1, 2]])
nilai, vektor = np.linalg.eigh(S)    # eigh untuk matriks simetris, hasil terurut naik
print(nilai)                         # [1. 3.]
print(vektor)                        # kolom = eigenvector: arah [1,-1] dan [1,1] (dinormalisasi)

v = vektor[:, 1]
print(np.allclose(S @ v, 3 * v))     # True
```

Kenapa penting: eigenvector dari **matriks kovarians** data adalah arah-arah dengan variasi terbesar, dan eigenvalue-nya adalah besar variasi itu. Ini inti **PCA** (Fase 4): proyeksikan data ke beberapa eigenvector dengan eigenvalue terbesar untuk mengurangi dimensi sambil mempertahankan informasi.

## 7. Matrix factorization

Matrix factorization memecah satu matriks menjadi perkalian beberapa matriks yang lebih sederhana atau lebih kecil. Beberapa bentuk:

| Faktorisasi | Bentuk | Kegunaan |
|---|---|---|
| LU | `A = L U` | Menyelesaikan sistem persamaan linear dengan cepat |
| QR | `A = Q R` | Regresi linear yang stabil secara numerik |
| Eigen | `A = Q Λ Q⁻¹` | PCA, analisis sistem dinamis |
| SVD | `A = U Σ Vᵀ` | Berlaku untuk matriks apa pun (langkah 8) |
| NMF | `A ≈ W H` (semua ≥ 0) | Topik dokumen, rekomendasi |

Contoh paling terkenal adalah **sistem rekomendasi**. Matriks rating pengguna × film yang sebagian besar kosong didekati sebagai `U @ Vᵀ`: setiap pengguna dan setiap film punya vektor "selera" kecil, dan rating yang belum ada ditebak dari dot product keduanya.

```python
from sklearn.decomposition import NMF

R = np.array([[5, 4, 0, 1],      # pengguna × film, 0 = belum menonton
              [4, 5, 1, 0],
              [1, 0, 5, 4],
              [0, 1, 4, 5]], dtype=float)
nmf = NMF(n_components=2, init="random", random_state=0, max_iter=1000)
W = nmf.fit_transform(R)          # 4 × 2: selera pengguna
H = nmf.components_               # 2 × 4: profil film
print(np.round(W @ H, 1))         # pendekatan R dari dua "selera" saja
```

Dua kolom di `W` di sini kira-kira menangkap dua kelompok selera (film 1–2 dan film 3–4).

## 8. SVD

*Singular Value Decomposition* memecah **matriks apa pun** `A` (tidak harus persegi) menjadi `U Σ Vᵀ`:

- `U`: arah-arah di ruang baris (ortonormal)
- `Σ`: nilai singular di diagonal, terurut dari terbesar, menunjukkan "seberapa penting" tiap arah
- `Vᵀ`: arah-arah di ruang kolom (ortonormal)

```python
A = np.array([[3, 1, 1],
              [-1, 3, 1],
              [1, 1, 3],
              [2, 2, 2]], dtype=float)
U, s, Vt = np.linalg.svd(A, full_matrices=False)
print(U.shape, s.shape, Vt.shape)           # (4, 3) (3,) (3, 3)
print(np.allclose(U @ np.diag(s) @ Vt, A))  # True: rekonstruksi sempurna

k = 1                                        # pendekatan rank-1
A1 = U[:, :k] @ np.diag(s[:k]) @ Vt[:k]
print(round(s[0]**2 / (s**2).sum(), 2))     # porsi "energi" yang ditangkap komponen pertama
```

Dengan hanya menyimpan `k` nilai singular terbesar, kita mendapat **pendekatan rank-k** terbaik dari matriks itu (teorema Eckart–Young). Kegunaannya: kompresi gambar, membuang noise, Latent Semantic Analysis untuk teks, dan PCA (PCA pada data yang sudah dipusatkan = SVD dari matriks datanya).

## Latihan

1. Tanpa komputer, hitung `[1, 2] @ [[2, 0], [1, 3]]`, lalu cek dengan NumPy.
2. Tulis fungsi `cosine(a, b)` dan gunakan untuk mencari pasangan paling mirip dari lima vektor acak.
3. Buktikan dengan NumPy bahwa `(A @ B).T` sama dengan `B.T @ A.T` untuk dua matriks acak.
4. Hitung eigenvalue matriks kovarians dari data 2 dimensi yang berkorelasi kuat (`np.cov`), lalu jelaskan arti eigenvector terbesarnya.
5. Ambil gambar hitam-putih sebagai matriks, kompres dengan SVD rank 5, 20, dan 50, lalu bandingkan hasilnya.

Rujukan visual terbaik untuk topik ini adalah seri *Essence of Linear Algebra* dari 3Blue1Brown di bagian sumber belajar.
