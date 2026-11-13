Catatan ini mengikuti enam langkah di checklist. Neural network adalah rangkaian fungsi sederhana (perkalian matriks + fungsi non-linear) yang ditumpuk. Langkah-langkah di bawah membangun satu jaringan kecil **dari nol dengan NumPy**, supaya setiap bagian terlihat. Framework seperti PyTorch melakukan hal yang sama secara otomatis.

```python
import numpy as np
from sklearn.datasets import make_moons

X, y = make_moons(n_samples=1000, noise=0.2, random_state=0)   # dua kelas, batas melengkung
y = y.reshape(-1, 1)
rng = np.random.default_rng(0)
```

## 1. Perceptron dan layers

**Perceptron** (neuron) menghitung jumlah tertimbang input ditambah bias, lalu memasukkannya ke fungsi aktivasi: `a = f(w·x + b)`. Satu neuron hanya bisa membuat batas lurus.

**Layer** adalah banyak neuron yang membaca input yang sama. Satu layer dengan `n` neuron untuk input berdimensi `d` punya matriks bobot `W` berukuran `d × n`, sehingga seluruh layer dihitung dengan satu perkalian matriks: `A = f(X @ W + b)`.

Menumpuk layer (input → hidden → output) memungkinkan jaringan membentuk batas yang melengkung. *Universal approximation theorem* menyatakan satu hidden layer yang cukup lebar bisa mendekati fungsi kontinu apa pun; dalam praktik, jaringan yang lebih **dalam** belajar lebih efisien.

```python
d_in, d_hidden, d_out = 2, 16, 1
W1 = rng.normal(0, np.sqrt(2 / d_in), (d_in, d_hidden))      # inisialisasi He, cocok untuk ReLU
b1 = np.zeros((1, d_hidden))
W2 = rng.normal(0, np.sqrt(1 / d_hidden), (d_hidden, d_out))
b2 = np.zeros((1, d_out))
print(W1.size + b1.size + W2.size + b2.size, "parameter")      # 65
```

Inisialisasi penting: bobot nol membuat semua neuron identik dan belajar hal yang sama; bobot terlalu besar membuat gradien meledak.

## 2. Activation functions: ReLU, Sigmoid, Tanh, Softmax

Tanpa fungsi aktivasi non-linear, tumpukan layer apa pun runtuh menjadi satu transformasi linear.

| Fungsi | Rumus | Keluaran | Dipakai di |
|---|---|---|---|
| ReLU | `max(0, z)` | 0 sampai ∞ | Hidden layer (default) |
| Sigmoid | `1 / (1 + e⁻ᶻ)` | 0 sampai 1 | Output klasifikasi biner |
| Tanh | `(eᶻ - e⁻ᶻ) / (eᶻ + e⁻ᶻ)` | -1 sampai 1 | RNN, hidden layer lama |
| Softmax | `eᶻⁱ / Σ eᶻʲ` | Peluang yang berjumlah 1 | Output multikelas |

```python
def relu(z):     return np.maximum(0, z)
def relu_d(z):   return (z > 0).astype(float)
def sigmoid(z):  return 1 / (1 + np.exp(-z))

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)      # dikurangi max supaya exp tidak overflow
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

print(np.round(softmax(np.array([[2.0, 1.0, 0.1]])), 3))   # [[0.659 0.242 0.099]]
```

Sigmoid dan tanh **jenuh** untuk `z` besar: turunannya mendekati nol sehingga gradien menghilang di jaringan dalam (*vanishing gradient*). ReLU tidak jenuh di sisi positif dan murah dihitung, itulah sebabnya ia menjadi default. Varian seperti Leaky ReLU dan GELU (dipakai di Transformer) memperbaiki neuron ReLU yang "mati" di nol.

## 3. Forward propagation

Forward pass menghitung prediksi dari input, layer demi layer. Simpan nilai antara (`Z1`, `A1`) karena dibutuhkan saat backpropagation.

```python
def forward(X):
    Z1 = X @ W1 + b1          # (n, 16)
    A1 = relu(Z1)
    Z2 = A1 @ W2 + b2         # (n, 1)
    A2 = sigmoid(Z2)          # peluang kelas 1
    return Z1, A1, Z2, A2
```

## 4. Loss function

Loss mengukur seberapa salah prediksi. Pilih sesuai tugasnya:

| Tugas | Output | Loss |
|---|---|---|
| Regresi | Linear | MSE, atau Huber jika ada outlier |
| Klasifikasi biner | Sigmoid | Binary cross-entropy |
| Klasifikasi multikelas | Softmax | Categorical cross-entropy |

Binary cross-entropy: `L = -mean(y·log(p) + (1 - y)·log(1 - p))`. Loss ini menghukum keras prediksi yang **yakin tapi salah**: memprediksi 0,01 untuk contoh yang sebenarnya positif menghasilkan loss sekitar 4,6.

```python
def bce(y, p, eps=1e-12):
    p = np.clip(p, eps, 1 - eps)      # hindari log(0)
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
```

## 5. Backpropagation

Backpropagation menghitung gradien loss terhadap **setiap** bobot dengan chain rule, dimulai dari output dan mundur ke input. Untuk sigmoid + binary cross-entropy, gradien terhadap `Z2` menyederhana menjadi `A2 - y`.

```python
def backward(X, y, Z1, A1, A2):
    n = len(X)
    dZ2 = (A2 - y) / n                  # ∂L/∂Z2
    dW2 = A1.T @ dZ2                    # ∂L/∂W2
    db2 = dZ2.sum(axis=0, keepdims=True)
    dA1 = dZ2 @ W2.T                    # gradien mengalir ke layer sebelumnya
    dZ1 = dA1 * relu_d(Z1)              # lewat turunan ReLU
    dW1 = X.T @ dZ1
    db1 = dZ1.sum(axis=0, keepdims=True)
    return dW1, db1, dW2, db2
```

Perhatikan polanya: gradien bobot sebuah layer = input layer itu (ditranspose) dikali gradien keluarannya. Gradien yang diteruskan ke belakang = gradien keluaran dikali bobot (ditranspose), lalu dikali turunan aktivasi. Pola yang sama berlaku untuk jaringan sedalam apa pun, dan inilah yang dikerjakan *autograd* di PyTorch.

## 6. Optimizer

Optimizer memakai gradien untuk memperbarui bobot. Versi paling dasar adalah gradient descent: `W ← W - lr · dW`. Menyatukan semuanya menjadi training loop dengan **mini-batch**:

```python
lr, epochs, batch = 0.5, 300, 64
for epoch in range(epochs):
    idx = rng.permutation(len(X))
    for i in range(0, len(X), batch):
        b = idx[i:i + batch]
        Z1, A1, Z2, A2 = forward(X[b])
        dW1, db1, dW2, db2 = backward(X[b], y[b], Z1, A1, A2)
        W1 -= lr * dW1; b1 -= lr * db1
        W2 -= lr * dW2; b2 -= lr * db2
    if epoch % 100 == 0:
        print(epoch, round(bce(y, forward(X)[3]), 4))

akurasi = ((forward(X)[3] > 0.5) == y).mean()
print("akurasi:", round(akurasi, 3))
```

Optimizer modern menambahkan memori atas gradien sebelumnya:

| Optimizer | Ide | Default yang aman |
|---|---|---|
| SGD + momentum | Mengikuti arah rata-rata gradien, melaju di lembah datar | `lr=0.01, momentum=0.9` |
| RMSProp | Learning rate per parameter, dikecilkan jika gradiennya sering besar | `lr=1e-3` |
| Adam | Momentum + RMSProp dengan koreksi bias | `lr=1e-3` |
| AdamW | Adam dengan *weight decay* yang benar | Standar untuk Transformer |

Teknik pendukung yang hampir selalu dipakai: **learning rate schedule** (turunkan lr seiring waktu, atau *warmup* lalu *cosine decay*), **early stopping** berdasarkan loss validasi, **dropout** dan **weight decay** untuk mencegah overfit, serta **batch normalization** atau **layer normalization** untuk menstabilkan training.

## Latihan

1. Jalankan kode di atas, lalu ubah jumlah neuron hidden menjadi 2, 4, dan 64. Plot batas keputusannya untuk masing-masing.
2. Ganti ReLU dengan sigmoid di hidden layer. Bagaimana kecepatan turunnya loss?
3. Lakukan *gradient checking*: bandingkan `dW1` dari backprop dengan turunan numerik untuk beberapa elemen.
4. Tambahkan hidden layer kedua dan turunkan sendiri persamaan backprop-nya.
5. Implementasikan momentum, lalu Adam, dan bandingkan kurva loss ketiganya.

Untuk intuisi, tonton playlist Neural Networks 3Blue1Brown. Untuk membangun dari nol lebih jauh, ikuti *Zero to Hero* dari Andrej Karpathy.
