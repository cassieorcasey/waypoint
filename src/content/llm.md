Catatan ini mengikuti tiga langkah di checklist. *Large Language Model* adalah Transformer yang dilatih pada teks dalam jumlah sangat besar untuk satu tugas sederhana: menebak token berikutnya. Kemampuan yang terlihat "cerdas" (meringkas, menerjemahkan, menulis kode) muncul dari tugas itu ditambah tahap pelatihan lanjutan. Catatan ini melanjutkan catatan NLP di Fase 5.

## 1. Arsitektur Transformer encoder/decoder

Ringkasan tiga varian Transformer (detailnya di catatan NLP):

| Varian | Melihat | Dilatih untuk | Contoh |
|---|---|---|---|
| Encoder-only | Semua token, dua arah | Menebak token yang ditutupi (*masked LM*) | BERT: klasifikasi, embedding |
| Decoder-only | Hanya token sebelumnya (*causal*) | Menebak token berikutnya | GPT, Claude, Llama, Gemma |
| Encoder-decoder | Encoder dua arah, decoder causal + *cross-attention* | Mengubah satu urutan menjadi urutan lain | T5, BART: terjemahan, ringkasan |

Hampir semua LLM percakapan modern adalah **decoder-only**. Cara kerjanya saat menghasilkan teks (*autoregressive*):

1. Teks dipecah menjadi **token** (potongan kata, misalnya dengan BPE). Satu kata bahasa Indonesia sering menjadi 1–3 token.
2. Model menghitung distribusi peluang untuk token berikutnya.
3. Satu token dipilih (*sampling*), ditambahkan ke input, lalu langkah 2 diulang.

Parameter sampling yang sering diatur:

| Parameter | Efek |
|---|---|
| `temperature` | Rendah (0–0,3): jawaban konsisten dan faktual. Tinggi (0,8–1): lebih bervariasi dan kreatif |
| `top_p` | Hanya memilih dari token teratas yang peluang kumulatifnya mencapai p |
| `max_tokens` | Batas panjang jawaban |

**Context window** adalah jumlah token maksimum (input + output) yang bisa dilihat model sekaligus. Apa pun di luar jendela itu tidak "diingat"; inilah salah satu alasan RAG diperlukan.

Tahap pelatihan LLM percakapan:

1. **Pretraining**: menebak token berikutnya pada triliunan token teks. Menghasilkan model yang tahu banyak hal, tapi belum bisa mengikuti instruksi.
2. **Supervised fine-tuning (SFT)**: dilatih pada contoh pasangan instruksi dan jawaban yang baik.
3. **Preference tuning** (RLHF, DPO, dan sejenisnya): dilatih agar lebih memilih jawaban yang dinilai lebih membantu, jujur, dan aman.

Keterbatasan yang harus selalu diingat: LLM bisa **berhalusinasi** (menghasilkan fakta yang terdengar meyakinkan tapi salah), pengetahuannya berhenti di tanggal tertentu, dan hasilnya tidak deterministik. Untuk fakta, hubungkan dengan sumber (RAG); untuk angka, minta model menulis kode yang menghitungnya.

## 2. Prompt engineering

Prompt engineering adalah menulis instruksi supaya model menghasilkan yang kamu butuhkan secara konsisten. Anggap model sebagai rekan kerja cerdas yang **tidak tahu konteksmu** sama sekali.

**Prinsip yang paling berpengaruh:**

1. **Jelas dan spesifik.** Sebutkan tujuan, audiens, format, panjang, dan batasan. "Ringkas" itu kabur; "ringkas dalam 3 poin untuk manajer non teknis, masing-masing maksimal 20 kata" itu jelas.
2. **Beri konteks dan alasan.** "Ringkasan ini dibaca di layar ponsel" membantu model menebak hal yang tidak kamu tulis.
3. **Beri contoh** (*few-shot*). Dua atau tiga contoh input–output yang beragam sering lebih efektif daripada paragraf penjelasan.
4. **Pisahkan bagian prompt dengan tag** seperti `<dokumen>`, `<instruksi>`, `<contoh>`, supaya model tidak mencampur instruksi dengan data.
5. **Beri peran** lewat system prompt: "Kamu adalah analis data senior di perusahaan e-commerce."
6. **Beri ruang berpikir** untuk tugas yang butuh penalaran: minta model menguraikan langkahnya sebelum menjawab.
7. **Tentukan format keluaran** secara eksplisit, misalnya JSON dengan skema tertentu, supaya bisa diproses program.
8. **Pecah tugas besar** menjadi rangkaian prompt kecil (*prompt chaining*): ekstrak → analisis → tulis.

Contoh memanggil LLM lewat API dengan prinsip-prinsip di atas:

```python
import anthropic

client = anthropic.Anthropic()        # membaca ANTHROPIC_API_KEY dari environment

ulasan = "Pengiriman cepat, tapi kemasannya penyok dan satu gelas pecah. CS responsif."

pesan = client.messages.create(
    model="claude-sonnet-5-5",
    max_tokens=500,
    temperature=0,
    system="Kamu menganalisis ulasan pelanggan toko online untuk tim operasional.",
    messages=[{
        "role": "user",
        "content": f"""<ulasan>{ulasan}</ulasan>

Klasifikasikan ulasan di atas. Balas hanya dengan JSON berformat:
{{"sentimen": "positif|negatif|campuran", "aspek": [{{"nama": "...", "sentimen": "..."}}], "perlu_tindak_lanjut": true|false}}

Aspek yang mungkin: pengiriman, kemasan, produk, layanan_pelanggan, harga.""",
    }],
)
print(pesan.content[0].text)
```

Perlakukan prompt seperti kode: simpan versinya, dan **uji dengan kumpulan contoh** (misalnya 30–100 kasus dengan jawaban yang diharapkan) setiap kali mengubahnya. Perbaikan yang terasa bagus di satu contoh bisa merusak contoh lain.

> **Keamanan:** teks dari pengguna atau dokumen bisa berisi instruksi tersembunyi (*prompt injection*), misalnya "abaikan instruksi sebelumnya". Pisahkan data dari instruksi dengan tag, jangan beri model akses ke aksi berbahaya tanpa konfirmasi, dan validasi keluarannya sebelum dipakai.

## 3. Fine tuning dengan Hugging Face Transformers

Fine-tuning melatih ulang model yang sudah ada pada data milikmu. Sebelum memutuskan, urutkan pilihan dari yang termurah:

| Kebutuhan | Pilihan pertama |
|---|---|
| Format atau gaya jawaban | Prompt engineering dengan contoh |
| Pengetahuan baru atau data yang sering berubah | RAG |
| Tugas sempit dan berulang dalam volume besar (klasifikasi, ekstraksi) dengan biaya/latensi rendah | Fine-tuning model kecil |
| Gaya atau perilaku khusus yang sulit dijelaskan lewat prompt | Fine-tuning |

Contoh fine-tuning model encoder kecil untuk klasifikasi sentimen dengan `Trainer`:

```python
import numpy as np
from datasets import load_dataset
from transformers import (AutoTokenizer, AutoModelForSequenceClassification,
                          DataCollatorWithPadding, TrainingArguments, Trainer)

nama = "distilbert-base-uncased"
ds = load_dataset("imdb")
tok = AutoTokenizer.from_pretrained(nama)
ds = ds.map(lambda b: tok(b["text"], truncation=True, max_length=256), batched=True)

model = AutoModelForSequenceClassification.from_pretrained(nama, num_labels=2)

def metrik(eval_pred):
    logits, labels = eval_pred
    return {"accuracy": float((np.argmax(logits, axis=-1) == labels).mean())}

args = TrainingArguments(
    output_dir="hasil-sentimen",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,                 # kecil: fitur bawaan model jangan sampai rusak
    per_device_train_batch_size=16,
    num_train_epochs=2,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
)
trainer = Trainer(
    model=model, args=args,
    train_dataset=ds["train"].shuffle(seed=0).select(range(5000)),
    eval_dataset=ds["test"].shuffle(seed=0).select(range(2000)),
    data_collator=DataCollatorWithPadding(tok),
    compute_metrics=metrik,
)
trainer.train()
trainer.save_model("model-sentimen")
```

Untuk teks bahasa Indonesia, mulai dari model yang dilatih pada bahasa Indonesia atau multibahasa (misalnya keluarga IndoBERT atau XLM-RoBERTa) di Hugging Face Hub.

Untuk LLM besar, melatih ulang semua parameter sangat mahal. **LoRA** (lewat library `peft`) membekukan model asli dan hanya melatih matriks tambahan kecil, biasanya kurang dari 1% parameter. Dengan **QLoRA**, model juga dimuat dalam presisi 4-bit sehingga muat di satu GPU.

```python
from peft import LoraConfig, get_peft_model

konfig = LoraConfig(r=8, lora_alpha=16, lora_dropout=0.05,
                    target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM")
model_lora = get_peft_model(model_dasar, konfig)      # model_dasar: LLM yang sudah dimuat
model_lora.print_trainable_parameters()
```

Hal yang paling menentukan hasil fine-tuning adalah **kualitas data**, bukan jumlahnya: beberapa ratus sampai ribuan contoh yang bersih, konsisten, dan mewakili kasus nyata. Selalu bandingkan dengan baseline prompt yang baik di set evaluasi yang sama; kalau selisihnya kecil, fine-tuning tidak sepadan dengan biaya perawatannya.

## Latihan

1. Hitung jumlah token kalimat bahasa Indonesia dan bahasa Inggris yang setara dengan tokenizer GPT-2 atau Llama. Mana yang lebih boros?
2. Buat prompt klasifikasi ulasan seperti contoh, lalu uji pada 30 ulasan berlabel. Catat akurasinya, perbaiki prompt, dan ukur lagi.
3. Coba temperature 0 dan 1 untuk prompt yang sama sebanyak lima kali, lalu bandingkan variasinya.
4. Fine-tune DistilBERT atau IndoBERT pada dataset sentimen kecil, lalu bandingkan dengan pendekatan prompt di nomor 2 dari sisi akurasi, biaya, dan latensi.
5. Tulis tiga contoh *prompt injection* terhadap prompt-mu sendiri dan perbaiki prompt-nya supaya tahan.

Rujukan: Hugging Face LLM Course dan panduan prompt engineering di bagian sumber belajar.
