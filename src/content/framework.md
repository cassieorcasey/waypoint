Catatan ini mengikuti tiga langkah di checklist. Framework deep learning mengurus tiga hal yang di catatan Dasar Neural Networks kita kerjakan manual: **tensor di GPU**, **autograd** (backpropagation otomatis), dan **komponen siap pakai** (layer, loss, optimizer). PyTorch dominan di riset dan sebagian besar industri; Keras unggul dalam kesederhanaan.

## 1. PyTorch

Tensor PyTorch mirip array NumPy, ditambah dua kemampuan: berjalan di GPU dan mencatat operasi untuk menghitung gradien.

```python
import torch

x = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
device = "cuda" if torch.cuda.is_available() else "cpu"   # di Mac Apple Silicon: "mps"
x = x.to(device)

w = torch.tensor(3.0, requires_grad=True)   # catat operasi yang melibatkan w
loss = (w * 2 - 4) ** 2
loss.backward()                             # autograd: hitung ∂loss/∂w
print(w.grad)                               # tensor(8.) karena 2·(2w - 4)·2 di w = 3
```

Tiga bagian yang selalu ada:

- **`nn.Module`**: kelas model. Daftarkan layer di `__init__`, tulis alurnya di `forward`.
- **`Dataset` dan `DataLoader`**: menyajikan data dalam mini-batch yang diacak.
- **Training loop**: ditulis sendiri, sehingga kamu mengontrol setiap langkah.

```python
from torch import nn
from torch.utils.data import TensorDataset, DataLoader

X = torch.randn(1000, 20)
y = (X[:, 0] + X[:, 1] > 0).long()            # label mainan: 2 kelas
ds = TensorDataset(X, y)
train_ds, val_ds = torch.utils.data.random_split(ds, [800, 200], generator=torch.Generator().manual_seed(0))
train_dl = DataLoader(train_ds, batch_size=64, shuffle=True)
val_dl = DataLoader(val_ds, batch_size=256)

model = nn.Sequential(nn.Linear(20, 64), nn.ReLU(), nn.Dropout(0.2), nn.Linear(64, 2)).to(device)
loss_fn = nn.CrossEntropyLoss()               # menerima logit mentah; softmax sudah di dalamnya
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
```

## 2. TensorFlow/Keras

Keras menyembunyikan training loop di balik `compile` dan `fit`. Sejak Keras 3, kode yang sama bisa berjalan di atas TensorFlow, PyTorch, atau JAX.

```python
import keras
from keras import layers

model_k = keras.Sequential([
    keras.Input(shape=(20,)),
    layers.Dense(64, activation="relu"),
    layers.Dropout(0.2),
    layers.Dense(2, activation="softmax"),
])
model_k.compile(optimizer=keras.optimizers.AdamW(1e-3),
                loss="sparse_categorical_crossentropy", metrics=["accuracy"])

riwayat = model_k.fit(
    X.numpy(), y.numpy(), validation_split=0.2, epochs=30, batch_size=64,
    callbacks=[keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)],
)
model_k.summary()
```

| | PyTorch | Keras |
|---|---|---|
| Gaya | Python biasa, loop ditulis sendiri | Deklaratif, `fit()` |
| Kurva belajar | Sedang | Paling landai |
| Fleksibilitas | Sangat tinggi | Tinggi untuk pola standar |
| Ekosistem | Hugging Face, sebagian besar riset dan model terbaru | TF Serving, TFLite untuk mobile |

Saran praktis: kuasai **PyTorch** sebagai alat utama, karena hampir semua model terbaru dan library Hugging Face berbasis PyTorch. Cukup bisa **membaca** kode Keras.

## 3. Membangun, melatih, dan mengevaluasi model

Training loop standar PyTorch. Polanya sama untuk model sebesar apa pun:

```python
def latih_satu_epoch(model, dl):
    model.train()                              # aktifkan dropout dan batchnorm mode latih
    total = 0.0
    for xb, yb in dl:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()                  # 1. hapus gradien lama
        loss = loss_fn(model(xb), yb)          # 2. forward + loss
        loss.backward()                        # 3. backprop
        optimizer.step()                       # 4. perbarui bobot
        total += loss.item() * len(xb)
    return total / len(dl.dataset)

@torch.no_grad()                               # tanpa mencatat gradien: lebih cepat, hemat memori
def evaluasi(model, dl):
    model.eval()                               # matikan dropout
    benar, total_loss = 0, 0.0
    for xb, yb in dl:
        xb, yb = xb.to(device), yb.to(device)
        logit = model(xb)
        total_loss += loss_fn(logit, yb).item() * len(xb)
        benar += (logit.argmax(1) == yb).sum().item()
    n = len(dl.dataset)
    return total_loss / n, benar / n

terbaik, sabar = float("inf"), 0
for epoch in range(100):
    tr_loss = latih_satu_epoch(model, train_dl)
    va_loss, va_acc = evaluasi(model, val_dl)
    print(f"{epoch:3d} train {tr_loss:.3f}  val {va_loss:.3f}  acc {va_acc:.3f}")
    if va_loss < terbaik:                      # simpan model terbaik
        terbaik, sabar = va_loss, 0
        torch.save(model.state_dict(), "model_terbaik.pt")
    else:
        sabar += 1
        if sabar >= 5:                         # early stopping
            break

model.load_state_dict(torch.load("model_terbaik.pt"))
```

Daftar periksa saat training tidak berjalan baik:

1. **Overfit satu batch kecil dulu.** Jika model tidak bisa mencapai loss mendekati nol pada 10 contoh, ada bug di model, loss, atau label.
2. **Cek bentuk dan tipe tensor** di setiap langkah. Kesalahan paling umum: label `float` untuk `CrossEntropyLoss` (harus `long`), atau softmax ganda.
3. **Plot kurva loss train dan validasi.** Pola keduanya menunjukkan underfit atau overfit (lihat catatan Evaluasi Model).
4. **Learning rate** adalah hyperparameter paling penting. Coba `1e-2`, `1e-3`, `1e-4`.
5. **Lupa `model.eval()`** membuat dropout tetap aktif saat evaluasi dan skornya turun.
6. **Seed acak** (`torch.manual_seed`) untuk hasil yang bisa diulang saat membandingkan eksperimen.

Evaluasi akhir dilakukan sekali pada data uji yang terpisah, dengan metrik dari catatan Evaluasi Model (confusion matrix, precision, recall, ROC-AUC), bukan hanya akurasi.

## Latihan

1. Ulangi jaringan NumPy dari catatan Dasar Neural Networks dengan PyTorch, lalu pastikan hasilnya mirip.
2. Latih MLP pada Fashion-MNIST (`torchvision.datasets.FashionMNIST`) dengan training loop di atas sampai akurasi validasi di atas 88%.
3. Buat model yang sama dengan Keras dan bandingkan jumlah baris kode serta hasilnya.
4. Sengaja buat bug (lupa `optimizer.zero_grad()`), amati efeknya pada kurva loss, lalu jelaskan kenapa.
5. Pindahkan training ke GPU gratis di Google Colab atau Kaggle dan bandingkan waktu per epoch.
