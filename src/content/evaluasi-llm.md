Catatan ini mengikuti lima langkah di checklist, ditambah mini-proyek penutup Fase 7. Membuat demo LLM yang menakjubkan itu mudah. Yang membedakan produk yang bertahan adalah kemampuan **mengukur** apakah ia benar, apakah ia aman, dan apakah biayanya masuk akal. Tanpa itu, setiap perubahan prompt hanyalah tebakan.

## 1. Mengapa evaluasi LLM berbeda

Di ML klasik, ada label dan satu metrik: akurasi, AUC. Di LLM:

- **Keluaran terbuka.** Ada banyak jawaban yang sama-sama benar dengan susunan kata berbeda, sehingga pencocokan string sering gagal.
- **Tidak deterministik.** Pertanyaan yang sama bisa mendapat jawaban berbeda (kecuali suhu = 0, dan itu pun tidak selalu menjamin).
- **Banyak dimensi kualitas.** Benar, relevan, setia pada sumber, nada tepat, format sesuai, aman.
- **Perubahan kecil berdampak besar.** Mengganti satu kalimat di prompt, atau versi model, bisa memperbaiki satu kasus dan merusak sepuluh lainnya.
- **Benchmark umum tidak mewakili kasusmu.** Skor di leaderboard tidak menjamin model itu cocok untuk dokumen dan pelangganmu.

Kesimpulannya: **evaluasi harus dibangun dari kasus nyata milikmu**, dan dijalankan ulang setiap kali sesuatu berubah, seperti tes otomatis di perangkat lunak.

## 2. Set evaluasi dan error analysis

Mulai dari kecil: **30 sampai 100 contoh** yang dipilih dengan sengaja sudah jauh lebih berguna daripada tidak punya sama sekali.

Sumber contoh yang baik:

- Pertanyaan atau input **nyata** dari pengguna (log, tiket, email), dengan data pribadi dihapus.
- **Kasus sulit**: ambigu, pertanyaan di luar cakupan, input berantakan, bahasa campuran.
- Kegagalan yang pernah terjadi. Setiap bug yang ditemukan menjadi satu contoh evaluasi baru.
- Kasus yang **harus ditolak** atau dijawab "saya tidak tahu".

Setiap contoh menyimpan input, jawaban acuan atau kriteria (apa yang harus ada, apa yang tidak boleh ada), dan tag kategori.

**Error analysis** adalah kebiasaan paling berharga: baca keluaran yang gagal satu per satu, beri label jenis kegagalannya, lalu hitung. Jangan langsung menebak perbaikan.

```python
from collections import Counter

# Hasil membaca 40 keluaran yang gagal: satu label per kegagalan
label = (["jawaban tidak ada di dokumen (retrieval gagal)"] * 17
         + ["mengarang fakta (halusinasi)"] * 9
         + ["format tidak sesuai permintaan"] * 8
         + ["terlalu panjang"] * 4
         + ["menolak padahal seharusnya menjawab"] * 2)

for jenis, n in Counter(label).most_common():
    print(f"{n:3d}  {n/len(label):4.0%}  {jenis}")
```

Dari hitungan di atas, perbaikan paling berharga adalah **retrieval**, bukan prompt. Tanpa error analysis, tim sering menghabiskan seminggu mengutak-atik prompt untuk masalah yang sumbernya di tempat lain.

## 3. Metode penilaian dan evaluasi RAG

Pilih dari yang paling murah dan paling pasti, lalu naik sesuai kebutuhan:

| Metode | Cocok untuk | Kelemahan |
|---|---|---|
| Aturan dan kode | Format JSON valid, ada kata kunci wajib, panjang, tidak ada kata terlarang | Tidak menilai makna |
| Pencocokan jawaban | Jawaban pendek dan pasti (angka, label, nama) | Kaku untuk teks panjang |
| Rubrik oleh manusia | Standar emas untuk kualitas, nada, kegunaan | Lambat dan mahal |
| **LLM-as-judge** | Menilai banyak keluaran terhadap rubrik secara cepat | Bias dan tidak sempurna; harus divalidasi |

**LLM-as-judge** berarti model lain menilai keluaran memakai rubrik tertulis. Ini praktis, tetapi hakimnya sendiri perlu dites:

- Tulis rubrik **spesifik dan biner** ("jawaban memuat angka yang sama dengan dokumen: ya/tidak"), bukan skor 1 sampai 10 yang kabur.
- Hakim cenderung menyukai jawaban yang panjang, jawaban yang berasal dari model serupa, dan urutan tertentu saat membandingkan dua jawaban. Acak urutannya.
- **Validasi hakim terhadap penilaian manusia** pada sampel (misalnya 50 contoh). Jika kesepakatannya rendah, perbaiki rubriknya sebelum mempercayai skornya.

```python
def kesepakatan(manusia, hakim):
    """Proporsi contoh di mana hakim LLM sepakat dengan label manusia."""
    return sum(m == h for m, h in zip(manusia, hakim)) / len(manusia)

manusia = [1, 1, 0, 1, 0, 0, 1, 1, 0, 1]
hakim   = [1, 1, 0, 1, 1, 0, 1, 0, 0, 1]
print(kesepakatan(manusia, hakim))      # 0.8: cukup baik untuk memantau, belum untuk keputusan penting
```

### Evaluasi RAG: pisahkan retrieval dari generasi

Jawaban RAG yang salah bisa karena dokumen yang benar **tidak ditemukan**, atau dokumen ditemukan tetapi model **tidak memakainya dengan benar**. Ukur keduanya terpisah.

| Bagian | Pertanyaan | Metrik |
|---|---|---|
| Retrieval | Apakah dokumen yang tepat ada di k hasil teratas? | Recall@k, MRR |
| Generasi | Apakah jawaban setia pada dokumen (tidak mengarang)? | Faithfulness, penilaian hakim |
| Akhir | Apakah jawaban benar dan berguna bagi pengguna? | Kebenaran, kelengkapan |

```python
def recall_at_k(hasil, relevan, k):
    """Berapa persen pertanyaan yang dokumen relevannya ada di k hasil teratas."""
    return sum(any(d in relevan[q] for d in docs[:k]) for q, docs in hasil.items()) / len(hasil)

def mrr(hasil, relevan):
    """Mean Reciprocal Rank: rata-rata 1/posisi dokumen relevan pertama."""
    skor = []
    for q, docs in hasil.items():
        posisi = next((i for i, d in enumerate(docs, 1) if d in relevan[q]), None)
        skor.append(1 / posisi if posisi else 0)
    return sum(skor) / len(skor)

hasil   = {"q1": ["d3", "d1", "d9"], "q2": ["d2", "d7", "d4"], "q3": ["d8", "d5", "d6"]}
relevan = {"q1": {"d1"}, "q2": {"d2"}, "q3": {"d4"}}
print(recall_at_k(hasil, relevan, 1), recall_at_k(hasil, relevan, 3))   # 0.33 0.67
print(round(mrr(hasil, relevan), 2))                                     # 0.5
```

Jika Recall@5 rendah, perbaiki *chunking*, embedding, atau pencarian hibrida dulu; memoles prompt tidak akan menolong.

## 4. Biaya dan latensi

Biaya LLM dihitung per **token** (potongan kata), biasanya terpisah untuk token masukan dan keluaran. Latensi naik dengan panjang keluaran dan ukuran model. Hitung biayanya sejak awal, bukan setelah peluncuran.

```python
def biaya_per_permintaan(token_masuk, token_keluar, harga_masuk_per_juta, harga_keluar_per_juta):
    return (token_masuk * harga_masuk_per_juta + token_keluar * harga_keluar_per_juta) / 1_000_000

# Harga di bawah ini HANYA contoh angka. Ambil harga terbaru dari daftar harga penyedia model.
HARGA = {"model_besar": (3.0, 15.0), "model_kecil": (0.25, 1.25)}    # USD per juta token (masuk, keluar)

# RAG: prompt 3.000 token (instruksi + dokumen) dan jawaban 300 token
for nama, (hm, hk) in HARGA.items():
    per_permintaan = biaya_per_permintaan(3000, 300, hm, hk)
    print(f"{nama:12s} ${per_permintaan:.5f} per permintaan, ${per_permintaan * 100_000:,.0f} untuk 100 ribu permintaan")
```

Tuas penghematan, dari yang paling aman:

- **Prompt lebih ringkas.** Buang instruksi berulang dan konteks yang tidak dipakai; kirim hanya potongan dokumen yang relevan.
- **Caching.** Awalan prompt yang sama dapat disimpan sehingga biayanya jauh lebih murah (banyak penyedia mendukung *prompt caching*), dan hasil untuk pertanyaan identik dapat di-cache di sisi aplikasimu.
- **Routing model.** Pertanyaan mudah ke model kecil, yang sulit ke model besar. Ukur dulu seberapa sering model kecil sudah cukup di set evaluasimu.
- **Batching.** Pekerjaan yang tidak butuh jawaban seketika (ringkasan malam hari) lewat API *batch* biasanya lebih murah.
- **Batas keluaran.** Atur panjang jawaban maksimum dan minta format ringkas.
- **Streaming.** Tidak mengurangi total waktu, tetapi membuat pengguna melihat respons mulai muncul lebih cepat.

Pantau tiga angka per versi: **kualitas** (skor evaluasi), **biaya per permintaan**, dan **latensi p95**. Perubahan yang menaikkan kualitas 1% tetapi biaya tiga kali lipat bukan perbaikan otomatis.

## 5. Memilih pendekatan dan keamanan

Urutan yang hampir selalu benar: **mulai dari yang paling murah, naik hanya jika evaluasi menunjukkan perlu.**

| Pendekatan | Pakai ketika | Catatan |
|---|---|---|
| **Prompt** (instruksi, contoh, format) | Kemampuan dasar sudah ada, hanya perlu diarahkan | Paling cepat dan murah untuk diubah |
| **RAG** | Jawaban butuh pengetahuan yang berubah atau milik perusahaan | Memberi sumber yang bisa diperiksa; kualitas bergantung pada retrieval |
| **Fine-tuning** | Gaya atau format konsisten, tugas sempit dengan banyak contoh, ingin model kecil yang murah | Butuh data berkualitas dan evaluasi; sulit menyuntikkan fakta baru yang sering berubah |
| **Model kecil** | Tugas terdefinisi sempit, volume tinggi, latensi ketat | Uji dulu di set evaluasi sebelum menggantikan model besar |

Keputusan selalu berdasar **selisih skor di set evaluasimu**, biaya, dan kemudahan perawatan, bukan selera tim atau ramai di media sosial.

Evaluasi keamanan dimasukkan ke dalam set yang sama:

- **Prompt injection**: dokumen atau input pengguna berisi perintah tersembunyi. Uji agar model tidak menurutinya.
- **Kebocoran**: model tidak boleh menampilkan prompt sistem, data pribadi, atau dokumen yang bukan hak penggunanya.
- **Penolakan yang tepat**: menolak permintaan berbahaya, tanpa menolak berlebihan pada permintaan wajar.
- **Guardrail**: validasi keluaran (format, daftar kata terlarang, pemeriksaan sumber), batas penggunaan alat bagi agen, dan persetujuan manusia untuk tindakan yang tidak bisa dibatalkan.

## Mini-proyek Fase 7

Bangun aplikasi RAG kecil di atas 20 sampai 50 dokumen yang kamu pahami (catatan sendiri, dokumentasi, atau artikel publik), lalu:

1. Tulis **30 pertanyaan evaluasi** dengan jawaban acuan dan dokumen sumbernya, termasuk lima pertanyaan yang jawabannya tidak ada di dokumen.
2. Ukur **Recall@k** retrieval dan **kebenaran** jawaban akhir, lalu catat tiga kegagalan terbanyak dengan error analysis.
3. Ubah satu hal (ukuran chunk, jumlah dokumen, atau prompt), jalankan ulang evaluasi, dan tunjukkan angka sebelum dan sesudahnya.
4. Hitung **biaya dan latensi per permintaan**, lalu coba satu penghematan (model lebih kecil atau prompt lebih ringkas) dan lihat dampaknya pada skor.
5. Tulis ringkasan satu halaman untuk orang non teknis: seberapa andal aplikasinya, berapa biayanya per seribu pertanyaan, dan apa risiko terbesarnya.

## Latihan

1. Susun set evaluasi 30 contoh untuk satu fitur LLM yang kamu kenal, dengan tag kategori dan kasus yang harus ditolak.
2. Lakukan error analysis pada 30 keluaran gagal dan buat tabel jenis kegagalannya.
3. Tulis rubrik biner untuk hakim LLM, lalu ukur kesepakatannya dengan penilaian manualmu pada 30 contoh.
4. Hitung biaya bulanan sebuah fitur pada tiga skenario volume, dan tentukan di volume berapa routing model layak dilakukan.
5. Buat daftar 10 uji keamanan (injection, kebocoran, penolakan) untuk aplikasimu dan jalankan sebelum rilis.

Rujukan: *Your AI Product Needs Evals* (Hamel Husain), *LLM Evaluation Guidebook* (Hugging Face), dan panduan prompt engineering di bagian sumber belajar.
