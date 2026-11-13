Catatan ini mengikuti tiga langkah di checklist. Computer vision mengajari model memahami gambar: mengklasifikasi (gambar ini kucing atau anjing), mendeteksi (di mana saja ada mobil), atau mensegmentasi (piksel mana yang jalan). Contoh kode memakai PyTorch dan torchvision.

Gambar bagi komputer adalah tensor angka: tinggi × lebar × kanal (3 kanal RGB, nilai 0–255). Di PyTorch urutannya `(batch, kanal, tinggi, lebar)`.

## 1. CNN dan pooling layer

Fully connected layer biasa tidak cocok untuk gambar: gambar 224×224×3 punya 150.528 input, sehingga satu layer 1.000 neuron sudah butuh 150 juta bobot, dan layer itu tidak tahu bahwa piksel yang berdekatan saling berhubungan.

**Konvolusi** menyelesaikan keduanya. Sebuah **filter** kecil (misalnya 3×3) digeser ke seluruh gambar; di setiap posisi dihitung dot product antara filter dan potongan gambar di bawahnya. Hasilnya **feature map** yang menyala di tempat pola filter ditemukan.

- **Berbagi bobot**: filter yang sama dipakai di semua posisi, jadi parameternya sedikit dan deteksi pola tidak bergantung pada letaknya.
- **Hierarki fitur**: layer awal belajar tepi dan warna, layer tengah belajar tekstur dan bagian (mata, roda), layer akhir belajar objek utuh.

Parameter konvolusi: jumlah filter (`out_channels`), ukuran kernel, `stride` (langkah geser), dan `padding`. Ukuran keluaran = `(N - K + 2P) / S + 1`.

**Pooling** mengecilkan feature map. *Max pooling* 2×2 mengambil nilai terbesar dari setiap blok 2×2: lebar dan tinggi menjadi setengah, komputasi turun, dan model sedikit lebih toleran terhadap pergeseran posisi.

```python
import torch
from torch import nn

class CNNKecil(nn.Module):
    def __init__(self, n_kelas=10):
        super().__init__()
        self.fitur = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),   # 32×32 → 16×16
            nn.Conv2d(32, 64, kernel_size=3, padding=1), nn.ReLU(), nn.MaxPool2d(2),  # 16×16 → 8×8
        )
        self.kepala = nn.Sequential(nn.Flatten(), nn.Linear(64 * 8 * 8, 128), nn.ReLU(), nn.Linear(128, n_kelas))

    def forward(self, x):
        return self.kepala(self.fitur(x))

model = CNNKecil()
print(model(torch.randn(4, 3, 32, 32)).shape)   # torch.Size([4, 10]): 4 gambar, 10 skor kelas
```

**Augmentasi data** (membalik, memotong acak, mengubah kecerahan) memperbanyak variasi data latih secara gratis dan sangat mengurangi overfit:

```python
from torchvision import transforms

latih = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),   # statistik ImageNet
])
```

## 2. Transfer learning dengan ResNet

Melatih CNN besar dari nol butuh jutaan gambar. **Transfer learning** memakai model yang sudah dilatih pada ImageNet (1,2 juta gambar, 1.000 kelas): fitur umumnya (tepi, tekstur, bentuk) sudah berguna untuk tugas lain, jadi cukup mengganti layer terakhir dan melatih sedikit.

**ResNet** memperkenalkan *skip connection*: keluaran layer = `F(x) + x`. Gradien bisa mengalir langsung lewat jalur pintas, sehingga jaringan sangat dalam (50–150 layer) tetap bisa dilatih.

```python
from torchvision.models import resnet18, ResNet18_Weights

weights = ResNet18_Weights.DEFAULT
model = resnet18(weights=weights)
preprocess = weights.transforms()            # resize dan normalisasi yang cocok dengan bobotnya

for p in model.parameters():                 # tahap 1: bekukan seluruh backbone
    p.requires_grad = False
model.fc = nn.Linear(model.fc.in_features, 3)   # kepala baru untuk 3 kelas, otomatis bisa dilatih

optimizer = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)
```

Strategi bertahap yang umum:

1. **Feature extraction**: bekukan semua layer, latih hanya kepala baru. Cepat, cocok untuk data sedikit (ratusan gambar per kelas).
2. **Fine-tuning**: buka beberapa blok terakhir (`model.layer4`) dan latih dengan learning rate jauh lebih kecil (misalnya `1e-4`), supaya fitur yang sudah bagus tidak rusak.

Selalu pakai preprocessing yang sama dengan saat model dilatih (`weights.transforms()`), termasuk normalisasi.

## 3. YOLO

Klasifikasi menjawab "apa"; **deteksi objek** menjawab "apa dan di mana" dengan kotak pembatas (*bounding box*) dan skor keyakinan. **YOLO** (*You Only Look Once*) memprediksi semua kotak dalam satu kali lewat jaringan, sehingga cukup cepat untuk video real-time.

Konsep penting:

- **IoU** (*Intersection over Union*): luas irisan dibagi luas gabungan dua kotak. Dipakai untuk menilai seberapa tepat kotak prediksi dan untuk membuang duplikat.
- **Non-Maximum Suppression**: dari beberapa kotak yang menumpuk pada objek yang sama, simpan yang skornya tertinggi.
- **mAP** (*mean Average Precision*): metrik standar deteksi, misalnya mAP@0.5 (kotak dianggap benar jika IoU ≥ 0,5).

Cara paling praktis memakai YOLO adalah library `ultralytics`:

```python
from ultralytics import YOLO

model = YOLO("yolo11n.pt")                  # model kecil, sudah dilatih pada COCO (80 kelas)
hasil = model("jalan.jpg", conf=0.4)        # deteksi pada satu gambar
for kotak in hasil[0].boxes:
    print(model.names[int(kotak.cls)], round(float(kotak.conf), 2), kotak.xyxy.tolist())

# Melatih pada dataset sendiri (format YOLO: satu file .txt label per gambar)
model.train(data="dataset.yaml", epochs=50, imgsz=640)
metrik = model.val()                        # mAP pada data validasi
```

File `dataset.yaml` berisi lokasi folder gambar train/val dan daftar nama kelas. Label bisa dibuat dengan alat anotasi seperti CVAT atau Label Studio. Versi YOLO berganti cepat; cek dokumentasi Ultralytics untuk nama model terbaru.

## Latihan

1. Latih `CNNKecil` pada CIFAR-10 (`torchvision.datasets.CIFAR10`) selama beberapa epoch, dengan dan tanpa augmentasi. Bandingkan akurasi validasinya.
2. Hitung dengan tangan ukuran keluaran konvolusi 5×5 dengan stride 2 dan padding 1 pada gambar 64×64.
3. Ambil 100–200 foto per kelas untuk tiga kelas pilihanmu, lalu lakukan transfer learning ResNet18: tahap feature extraction, lalu fine-tuning `layer4`.
4. Tulis fungsi IoU untuk dua kotak `[x1, y1, x2, y2]`.
5. Jalankan YOLO pada video pendek dan hitung jumlah orang per frame.

Rujukan mendalam: Stanford CS231n dan Hugging Face Computer Vision Course di bagian sumber belajar.
