Catatan ini mengikuti lima langkah di checklist. Urutannya juga mengikuti sejarah NLP: dari model yang membaca kata satu per satu (RNN, LSTM), ke representasi makna kata (embedding), sampai attention dan Transformer yang menjadi dasar semua LLM modern.

Sebelum masuk model, teks dipecah menjadi **token** (kata, potongan kata, atau karakter), lalu setiap token diberi nomor id. Model hanya melihat urutan angka itu.

## 1. RNN

*Recurrent Neural Network* membaca urutan satu langkah demi satu langkah sambil membawa **hidden state** `h`, semacam ingatan ringkas tentang semua yang sudah dibaca:

```text
h_t = tanh(W_x · x_t + W_h · h_(t-1) + b)
```

Bobot yang sama dipakai di setiap langkah, sehingga RNN bisa memproses urutan sepanjang apa pun. Untuk klasifikasi kalimat, hidden state terakhir dipakai sebagai ringkasan kalimat.

Masalah utamanya: saat backpropagation melewati banyak langkah waktu, gradien dikalikan berulang-ulang dengan matriks yang sama sehingga **menghilang** (atau meledak). Akibatnya RNN biasa sulit mengingat informasi dari puluhan langkah sebelumnya. Training-nya juga harus berurutan, jadi lambat dan sulit diparalelkan.

## 2. LSTM

*Long Short-Term Memory* menambahkan **cell state** `c`, jalur memori panjang yang diatur oleh tiga gerbang (nilainya 0–1 dari sigmoid):

| Gerbang | Tugas |
|---|---|
| Forget gate | Berapa banyak memori lama yang dibuang |
| Input gate | Berapa banyak informasi baru yang ditulis |
| Output gate | Bagian memori mana yang dikeluarkan sebagai hidden state |

Karena cell state diperbarui dengan **penjumlahan** (bukan perkalian berulang), gradien bisa mengalir jauh tanpa menghilang. GRU adalah versi lebih ringkas dengan dua gerbang dan performa yang mirip.

```python
import torch
from torch import nn

class KlasifikasiTeks(nn.Module):
    def __init__(self, vocab_size, emb_dim=128, hidden=128, n_kelas=2):
        super().__init__()
        self.emb = nn.Embedding(vocab_size, emb_dim, padding_idx=0)
        self.lstm = nn.LSTM(emb_dim, hidden, batch_first=True, bidirectional=True)
        self.out = nn.Linear(hidden * 2, n_kelas)

    def forward(self, token_ids):                  # (batch, panjang)
        x = self.emb(token_ids)                     # (batch, panjang, emb_dim)
        _, (h, _) = self.lstm(x)                    # h: (2 arah, batch, hidden)
        h = torch.cat([h[0], h[1]], dim=1)          # gabungkan arah maju dan mundur
        return self.out(h)

model = KlasifikasiTeks(vocab_size=20_000)
print(model(torch.randint(1, 20_000, (8, 40))).shape)   # torch.Size([8, 2])
```

LSTM masih berguna untuk deret waktu dan perangkat dengan sumber daya terbatas, tapi untuk teks sudah hampir sepenuhnya digantikan Transformer.

## 3. Word Embeddings

Representasi kata paling naif adalah **one-hot**: vektor sepanjang kosakata dengan satu angka 1. Semua kata sama jauhnya satu sama lain, dan tidak ada makna yang tertangkap.

**Embedding** adalah vektor padat (misalnya 300 angka) di mana kata dengan makna mirip letaknya berdekatan. Ide dasarnya, *distributional hypothesis*: kata yang muncul dalam konteks serupa punya makna serupa.

| Metode | Ide |
|---|---|
| Word2Vec (Skip-gram, CBOW) | Tebak kata dari tetangganya, atau sebaliknya |
| GloVe | Faktorisasi matriks ko-okurensi kata |
| FastText | Seperti Word2Vec, tapi dari potongan huruf; menangani kata yang tidak dikenal |
| Kontekstual (BERT, GPT) | Vektor kata berubah sesuai kalimatnya: "bisa" ular dan "bisa" mampu berbeda |

Embedding menangkap hubungan sebagai arah dalam ruang vektor, contoh klasiknya `raja - pria + wanita ≈ ratu`. Kemiripan diukur dengan cosine similarity:

```python
import numpy as np

emb = {   # contoh mainan 3 dimensi; embedding sungguhan berdimensi ratusan
    "kucing":  np.array([0.9, 0.8, 0.1]),
    "anjing":  np.array([0.8, 0.9, 0.2]),
    "mobil":   np.array([0.1, 0.2, 0.9]),
}
cos = lambda a, b: a @ b / (np.linalg.norm(a) * np.linalg.norm(b))
print(round(cos(emb["kucing"], emb["anjing"]), 3), round(cos(emb["kucing"], emb["mobil"]), 3))   # 0.99 0.303
```

Konsep yang sama berlaku untuk kalimat dan dokumen utuh (*sentence embeddings*), dan menjadi dasar pencarian semantik dan RAG di Fase 7.

## 4. Self attention

Attention memungkinkan setiap token **melihat langsung semua token lain** dan mengambil informasi yang relevan, tanpa harus melewati rantai panjang seperti RNN. Dalam "Hewan itu tidak menyeberang jalan karena **ia** terlalu lelah", attention membantu "ia" merujuk ke "hewan".

Setiap token diproyeksikan menjadi tiga vektor:

- **Query** (Q): apa yang sedang saya cari?
- **Key** (K): apa yang saya tawarkan?
- **Value** (V): informasi apa yang saya bawa?

```text
Attention(Q, K, V) = softmax(Q Kᵀ / √d_k) · V
```

Skor `Q Kᵀ` mengukur kecocokan setiap pasangan token; dibagi `√d_k` supaya softmax tidak terlalu tajam; hasilnya bobot untuk merata-ratakan Value.

```python
def softmax(z):
    e = np.exp(z - z.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

rng = np.random.default_rng(0)
n_token, d_model, d_k = 4, 8, 8
X = rng.normal(size=(n_token, d_model))            # embedding 4 token
Wq, Wk, Wv = (rng.normal(size=(d_model, d_k)) for _ in range(3))

Q, K, V = X @ Wq, X @ Wk, X @ Wv
bobot = softmax(Q @ K.T / np.sqrt(d_k))            # (4, 4): baris i = perhatian token i ke semua token
keluaran = bobot @ V                               # (4, 8)
print(bobot.sum(axis=1))                           # [1. 1. 1. 1.]

mask = np.triu(np.ones((n_token, n_token)), k=1).astype(bool)   # causal mask untuk model generatif
skor = np.where(mask, -np.inf, Q @ K.T / np.sqrt(d_k))          # token tidak boleh melihat masa depan
print(np.round(softmax(skor), 2)[0])               # token pertama hanya melihat dirinya: [1. 0. 0. 0.]
```

**Multi-head attention** menjalankan beberapa attention secara paralel dengan proyeksi berbeda, sehingga tiap "kepala" bisa fokus pada hubungan yang berbeda (sintaksis, rujukan, posisi), lalu hasilnya digabung.

## 5. Dasar arsitektur Transformer

Transformer (paper *Attention Is All You Need*, 2017) membuang rekurensi sepenuhnya dan hanya memakai attention. Karena semua token diproses sekaligus, training bisa diparalelkan besar-besaran di GPU, dan inilah yang memungkinkan model berukuran miliaran parameter.

Satu **blok Transformer** berisi:

1. **Multi-head self-attention**, lalu *residual connection* dan *layer normalization*.
2. **Feed-forward network** (dua layer linear dengan aktivasi di tengah) yang diterapkan ke setiap token secara terpisah, lalu residual dan layer norm lagi.

Model menumpuk puluhan blok seperti ini. Karena attention tidak tahu urutan, ditambahkan **positional encoding** (sinus/kosinus, posisi yang dipelajari, atau RoPE pada LLM modern) ke embedding token.

| Varian | Attention | Contoh | Cocok untuk |
|---|---|---|---|
| Encoder-only | Dua arah | BERT, RoBERTa | Klasifikasi, NER, embedding |
| Decoder-only | Causal (hanya ke kiri) | GPT, Claude, Llama | Menghasilkan teks |
| Encoder-decoder | Encoder dua arah + decoder causal dengan *cross-attention* | T5, BART | Terjemahan, ringkasan |

Kelemahan utama: biaya attention tumbuh **kuadratik** terhadap panjang teks, karena setiap token dibandingkan dengan semua token lain. Banyak riset (FlashAttention, sparse attention) berfokus di sini. Kelanjutan topik ini, cara LLM dilatih dan dipakai, ada di catatan LLM Fase 7.

## Latihan

1. Implementasikan satu langkah RNN dengan NumPy dan jalankan pada urutan 10 vektor acak.
2. Latih `KlasifikasiTeks` pada dataset sentimen (misalnya IMDB) dan bandingkan dengan baseline TF-IDF + Logistic Regression. Mana yang lebih baik, dan seberapa besar selisihnya?
3. Muat embedding GloVe atau FastText, lalu cari 10 kata terdekat untuk "raja" dan uji analogi `raja - pria + wanita`.
4. Kembangkan kode self-attention menjadi multi-head (2 kepala) dan cek bentuk keluarannya.
5. Baca *The Illustrated Transformer* dari Jay Alammar, lalu gambar ulang diagram satu blok encoder dari ingatan.
