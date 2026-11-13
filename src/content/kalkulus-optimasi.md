Catatan ini mengikuti enam langkah di checklist. Melatih model ML pada dasarnya adalah **optimasi**: mencari parameter yang membuat error sekecil mungkin. Kalkulus memberi alatnya, yaitu turunan, yang memberi tahu ke arah mana parameter harus digeser.

## 1. Turunan

Turunan `f'(x)` adalah laju perubahan `f` di titik `x`: kemiringan garis singgung grafiknya.

```text
f'(x) = lim (h → 0)  [f(x + h) - f(x)] / h
```

Aturan yang paling sering dipakai:

| Fungsi | Turunan |
|---|---|
| `c` (konstanta) | `0` |
| `xⁿ` | `n·xⁿ⁻¹` |
| `eˣ` | `eˣ` |
| `ln x` | `1/x` |
| `f + g` | `f' + g'` |
| `f · g` | `f'g + fg'` |

Contoh: `f(x) = x² + 3x`, maka `f'(x) = 2x + 3`. Di `x = 3`, kemiringannya 9.

Turunan bisa diperiksa secara numerik, cara yang juga dipakai untuk mengecek implementasi gradien sendiri (*gradient checking*):

```python
def f(x):
    return x**2 + 3*x

def turunan_numerik(f, x, h=1e-5):
    return (f(x + h) - f(x - h)) / (2 * h)   # selisih tengah, lebih akurat

print(round(turunan_numerik(f, 3), 6))       # 9.0
```

Arti praktis: kalau `f'(x) > 0`, menaikkan `x` menaikkan `f`. Jadi untuk **mengecilkan** `f`, geser `x` ke arah **berlawanan** dengan tanda turunan. Di titik minimum (atau maksimum), `f'(x) = 0`.

## 2. Turunan parsial

Fungsi dengan banyak variabel, misalnya loss yang bergantung pada semua bobot model, punya satu **turunan parsial** per variabel: turunkan terhadap satu variabel, anggap variabel lain konstanta.

```text
f(x, y) = x²y + 3y
∂f/∂x = 2xy
∂f/∂y = x² + 3
```

Di titik `(1, 2)`: `∂f/∂x = 4` dan `∂f/∂y = 4`. Setiap turunan parsial menjawab: "kalau hanya variabel ini yang digeser sedikit, seberapa cepat `f` berubah?"

## 3. Chain rule

Untuk fungsi bersusun `f(g(x))`:

```text
d/dx f(g(x)) = f'(g(x)) · g'(x)
```

Contoh: `h(x) = (3x + 1)²`. Dalamnya `g = 3x + 1` (turunan 3), luarnya `f = g²` (turunan `2g`). Jadi `h'(x) = 2(3x + 1) · 3 = 18x + 6`.

Chain rule adalah **inti backpropagation** (Fase 5). Neural network adalah fungsi yang sangat bersusun: input → lapisan 1 → lapisan 2 → … → loss. Gradien loss terhadap bobot di lapisan awal dihitung dengan mengalikan turunan lokal tiap lapisan dari belakang ke depan.

```text
x → z = w·x + b → a = σ(z) → L = (a - y)²
∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w = 2(a - y) · σ'(z) · x
```

## 4. Gradient vector

**Gradien** `∇f` adalah vektor berisi semua turunan parsial:

```text
∇f(x, y) = [∂f/∂x, ∂f/∂y]
```

Sifat penting: gradien menunjuk ke arah **kenaikan tercuram** `f`, dan panjangnya menunjukkan seberapa curam. Maka arah **penurunan tercuram** adalah `-∇f`. Di titik minimum, gradiennya vektor nol.

Contoh: `f(x, y) = x² + y²` (mangkuk dengan dasar di `(0, 0)`). `∇f = [2x, 2y]`. Di titik `(3, 4)`, gradiennya `[6, 8]`, menunjuk menjauhi dasar mangkuk; bergerak ke arah `[-6, -8]` membawa kita turun.

## 5. Gradient descent

Algoritma yang melatih hampir semua model ML modern:

```text
ulangi:
    θ ← θ - η · ∇L(θ)
```

`θ` adalah parameter, `L` adalah loss, dan `η` (eta) adalah **learning rate**: besar langkah. Contoh regresi linear dari nol dengan NumPy:

```python
import numpy as np

rng = np.random.default_rng(0)
x = rng.uniform(0, 10, 200)
y = 3 * x + 2 + rng.normal(0, 1, 200)   # data sebenarnya: kemiringan 3, intersep 2

w, b, lr = 0.0, 0.0, 0.01
for epoch in range(2000):
    y_hat = w * x + b
    err = y_hat - y
    loss = (err ** 2).mean()            # MSE
    dw = 2 * (err * x).mean()           # ∂L/∂w
    db = 2 * err.mean()                 # ∂L/∂b
    w -= lr * dw
    b -= lr * db

print(round(w, 2), round(b, 2))         # mendekati 3 dan 2
```

Memilih learning rate:

- **Terlalu kecil**: konvergen sangat lambat.
- **Terlalu besar**: loss melompat-lompat atau malah membesar (divergen).
- Praktiknya: coba skala log (`0.1`, `0.01`, `0.001`) dan amati kurva loss.

Varian berdasarkan jumlah data per langkah:

| Varian | Data per langkah | Sifat |
|---|---|---|
| Batch GD | Seluruh dataset | Stabil, lambat untuk data besar |
| Stochastic GD | Satu contoh | Cepat, berisik |
| Mini-batch GD | 32–512 contoh | Standar deep learning |

## 6. Fungsi optimasi

Fungsi yang diminimalkan disebut **loss** (atau *cost*, *objective*). Bentuknya menentukan seberapa mudah optimasinya:

- **Konveks**: berbentuk mangkuk, hanya punya satu minimum global. Gradient descent dengan learning rate yang wajar pasti sampai. Contoh: MSE pada regresi linear, log loss pada regresi logistik.
- **Non-konveks**: banyak lembah, dataran (*plateau*), dan titik pelana. Neural network termasuk di sini. Kita tidak dijamin menemukan minimum global, tapi minimum lokal yang ditemukan biasanya sudah cukup baik.

Optimizer modern memperbaiki gradient descent biasa:

| Optimizer | Ide |
|---|---|
| Momentum | Mengumpulkan "kecepatan" dari gradien sebelumnya, melewati lembah sempit dan dataran lebih cepat |
| RMSProp | Learning rate per parameter, dikecilkan untuk parameter yang gradiennya sering besar |
| Adam | Gabungan momentum dan RMSProp; titik awal yang aman untuk deep learning (`lr=1e-3`) |

Regularisasi juga bagian dari fungsi optimasi: menambahkan penalti `λ‖w‖²` (L2) atau `λ‖w‖₁` (L1) ke loss membuat model memilih bobot yang lebih kecil dan tidak *overfit* (Ridge dan Lasso di Fase 4).

## Latihan

1. Turunkan dengan tangan `f(x) = 3x³ - 2x + 5`, lalu cek di `x = 2` dengan `turunan_numerik`.
2. Hitung gradien `f(x, y) = x²y + sin(y)` dan evaluasi di `(1, 0)`.
3. Pakai chain rule untuk menurunkan `σ(z) = 1 / (1 + e⁻ᶻ)`. Buktikan hasilnya sama dengan `σ(z)(1 - σ(z))`.
4. Jalankan contoh gradient descent dengan learning rate `0.001`, `0.01`, dan `0.05`. Plot loss per epoch untuk ketiganya.
5. Ubah contoh itu menjadi mini-batch (32 data per langkah) dan bandingkan kurva loss-nya.

Untuk intuisi visual, tonton bab gradient descent di playlist Neural Networks 3Blue1Brown.
