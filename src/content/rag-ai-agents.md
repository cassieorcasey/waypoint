Catatan ini mengikuti dua langkah di checklist, ditambah pengantar AI agent di bagian akhir. **RAG** (*Retrieval-Augmented Generation*) membuat LLM menjawab berdasarkan dokumenmu: sebelum menjawab, sistem **mencari** potongan dokumen yang relevan, lalu menyertakannya di prompt. Hasilnya: jawaban berdasar sumber, bisa dikutip, dan selalu terbaru tanpa melatih ulang model.

```text
Indexing (sekali, atau saat dokumen berubah):
  dokumen → pecah jadi chunk → embedding → simpan di vector database

Query (setiap pertanyaan):
  pertanyaan → embedding → cari chunk termirip → prompt (pertanyaan + chunk) → LLM → jawaban + sumber
```

## 1. Vector database: ChromaDB, Pinecone, atau FAISS

Vector database menyimpan **embedding** (vektor makna, lihat catatan NLP) dan mencari vektor yang paling mirip dengan cepat. Mencari dengan membandingkan satu per satu terlalu lambat untuk jutaan vektor, jadi dipakai indeks *Approximate Nearest Neighbor* (ANN) seperti **HNSW**: sedikit mengorbankan ketepatan demi kecepatan yang jauh lebih tinggi.

| Pilihan | Jenis | Cocok untuk |
|---|---|---|
| ChromaDB | Library/server ringan, open source | Prototipe dan aplikasi kecil sampai menengah |
| FAISS | Library pencarian vektor dari Meta | Kecepatan tinggi di memori, kamu yang mengatur penyimpanan |
| Pinecone | Layanan cloud terkelola | Produksi tanpa mengurus infrastruktur |
| pgvector | Ekstensi PostgreSQL | Sudah memakai Postgres (termasuk Supabase) |

Contoh ChromaDB. Untuk teks bahasa Indonesia, pakai model embedding multibahasa:

```python
import chromadb
from chromadb.utils import embedding_functions

ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2")
client = chromadb.PersistentClient(path="./vektor_db")
koleksi = client.get_or_create_collection("kebijakan", embedding_function=ef,
                                          metadata={"hnsw:space": "cosine"})

koleksi.add(
    ids=["cuti-1", "cuti-2", "reimburse-1"],
    documents=[
        "Karyawan tetap mendapat 12 hari cuti tahunan setelah masa kerja satu tahun.",
        "Cuti yang tidak dipakai dapat dibawa ke tahun berikutnya maksimal 5 hari.",
        "Biaya perjalanan dinas diganti paling lambat 14 hari setelah laporan disetujui.",
    ],
    metadatas=[{"sumber": "handbook.pdf", "hal": 12}, {"sumber": "handbook.pdf", "hal": 12},
               {"sumber": "keuangan.pdf", "hal": 3}],
)
hasil = koleksi.query(query_texts=["berapa hari libur tahunan saya?"], n_results=2)
print(hasil["documents"][0], hasil["metadatas"][0])
```

Perhatikan bahwa kata "libur" tidak ada di dokumen, tapi pencarian semantik tetap menemukan potongan tentang "cuti". Itulah keunggulan embedding dibanding pencarian kata kunci.

FAISS bekerja langsung dengan array vektor:

```python
import faiss
import numpy as np

vek = np.random.default_rng(0).random((10_000, 384)).astype("float32")
faiss.normalize_L2(vek)                       # setelah dinormalisasi, inner product = cosine
index = faiss.IndexFlatIP(vek.shape[1])
index.add(vek)
skor, posisi = index.search(vek[:1], 5)       # 5 tetangga terdekat dari vektor pertama
```

## 2. Aplikasi RAG berbasis dokumen dengan LangChain atau LlamaIndex

Sebelum memakai framework, pahami alurnya dengan versi mini. Contoh di bawah memakai TF-IDF sebagai pengganti embedding supaya bisa dijalankan tanpa model atau layanan apa pun; strukturnya sama dengan RAG sungguhan.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

dokumen = {
    "handbook.pdf": "Karyawan tetap mendapat 12 hari cuti tahunan setelah masa kerja satu tahun. "
                    "Cuti yang tidak dipakai dapat dibawa ke tahun berikutnya maksimal 5 hari. "
                    "Pengajuan cuti dilakukan lewat portal HR paling lambat 7 hari sebelumnya.",
    "keuangan.pdf": "Biaya perjalanan dinas diganti paling lambat 14 hari setelah laporan disetujui. "
                    "Bukti pembayaran asli wajib dilampirkan.",
}

def chunk(teks, ukuran=2):                       # di sini: 2 kalimat per chunk
    kalimat = [k.strip() + "." for k in teks.split(".") if k.strip()]
    return [" ".join(kalimat[i:i + ukuran]) for i in range(0, len(kalimat), ukuran)]

chunks = [(sumber, c) for sumber, teks in dokumen.items() for c in chunk(teks)]
vec = TfidfVectorizer().fit([c for _, c in chunks])
matriks = vec.transform([c for _, c in chunks])

def cari(pertanyaan, k=2):
    skor = cosine_similarity(vec.transform([pertanyaan]), matriks)[0]
    return [chunks[i] for i in skor.argsort()[::-1][:k]]

konteks = cari("berapa hari cuti yang bisa dibawa ke tahun depan?")
for sumber, isi in konteks:
    print(sumber, "|", isi)

prompt = "Jawab hanya berdasarkan dokumen di bawah. Jika tidak ada jawabannya, katakan tidak tahu. " \
         "Sebutkan sumbernya.\n\n" + \
         "\n".join(f'<dokumen sumber="{s}">{c}</dokumen>' for s, c in konteks) + \
         "\n\nPertanyaan: berapa hari cuti yang bisa dibawa ke tahun depan?"
# prompt ini lalu dikirim ke LLM, seperti contoh API di catatan LLM
```

Keputusan desain yang paling memengaruhi kualitas:

| Bagian | Pertimbangan |
|---|---|
| Chunking | Terlalu kecil kehilangan konteks, terlalu besar menenggelamkan informasi penting. Mulai dari ~300–800 token dengan sedikit tumpang-tindih, pecah mengikuti struktur dokumen (judul, paragraf) |
| Metadata | Simpan sumber, halaman, tanggal; dipakai untuk kutipan dan filter ("hanya dokumen 2026") |
| Retrieval | Gabungkan pencarian semantik dan kata kunci (*hybrid search*); tambahkan *reranker* untuk mengurutkan ulang hasil teratas |
| Prompt | Instruksikan untuk menjawab hanya dari konteks, mengaku tidak tahu, dan menyertakan sumber |
| Evaluasi | Ukur dua hal terpisah: apakah chunk yang benar terambil (*recall@k*), dan apakah jawaban setia pada konteks (*faithfulness*) |

Framework mempercepat bagian yang berulang: pembaca berbagai format file, pemecah teks, integrasi puluhan vector database dan LLM.

- **LlamaIndex** berfokus pada data dan retrieval, cocok untuk RAG atas dokumen.
- **LangChain** lebih umum: rantai pemanggilan LLM, tools, dan agent (lewat LangGraph).

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

docs = SimpleDirectoryReader("dokumen/").load_data()      # PDF, DOCX, TXT, ...
index = VectorStoreIndex.from_documents(docs)
mesin = index.as_query_engine(similarity_top_k=3)
jawaban = mesin.query("Berapa lama penggantian biaya perjalanan dinas?")
print(jawaban, [n.metadata.get("file_name") for n in jawaban.source_nodes])
```

Secara default LlamaIndex memakai model dari OpenAI; atur `Settings.llm` dan `Settings.embed_model` untuk penyedia lain. API kedua framework ini sering berubah antar versi, jadi selalu cocokkan contoh dengan dokumentasi resmi versi yang kamu pasang.

## Dari RAG ke AI agent

**Agent** adalah LLM yang bekerja dalam loop dan bisa **memakai tools** (fungsi yang kamu sediakan: cari dokumen, query database, panggil API, jalankan kode):

```text
ulangi:
    LLM membaca tujuan + hasil sejauh ini
    LLM memilih: panggil tool (dengan argumen) ATAU berikan jawaban akhir
    sistem menjalankan tool dan mengembalikan hasilnya ke LLM
```

RAG biasa selalu mencari sekali lalu menjawab. Agent bisa memutuskan **kapan** dan **apa** yang dicari, mencari beberapa kali, dan menggabungkan beberapa sumber. Misalnya: cari kebijakan cuti, cek sisa cuti di database HR, lalu hitung.

Prinsip membangun agent yang andal:

- **Mulai dari alur tetap**, dan pakai agent hanya jika langkahnya memang tidak bisa ditentukan di awal. Agent lebih mahal, lebih lambat, dan lebih sulit diuji.
- **Tools sedikit, deskripsi jelas.** Nama, kegunaan, dan parameter setiap tool harus mudah dipahami, seperti dokumentasi untuk rekan kerja baru.
- **Batasi wewenang.** Aksi yang mengubah data atau mengirim sesuatu harus meminta konfirmasi manusia, dan perlu batas jumlah langkah.
- **Catat setiap langkah** (tool yang dipanggil, argumen, hasil) supaya kegagalan bisa ditelusuri.

## Latihan

1. Jalankan versi mini TF-IDF di atas, lalu ganti TF-IDF dengan model embedding multibahasa. Bandingkan hasil untuk pertanyaan yang memakai sinonim ("libur" vs "cuti").
2. Bangun RAG atas 3–5 PDF milikmu (catatan kuliah, dokumentasi produk) dengan ChromaDB dan satu LLM.
3. Buat 20 pertanyaan beserta chunk yang seharusnya terambil, lalu ukur recall@3 untuk chunk berukuran 200, 500, dan 1.000 token.
4. Tambahkan instruksi "katakan tidak tahu" dan uji dengan 5 pertanyaan yang jawabannya tidak ada di dokumen.
5. Ubah RAG menjadi agent sederhana dengan dua tools (cari dokumen, kalkulator), lalu catat langkah-langkah yang diambilnya.

Rujukan: *RAG From Scratch* dari LangChain dan LLM Zoomcamp di bagian sumber belajar.
