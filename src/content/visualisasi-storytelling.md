Catatan ini mengikuti tiga langkah di checklist. Visualisasi punya dua tugas berbeda: **eksplorasi** (kamu sendiri mencari pola, cepat dan banyak) dan **komunikasi** (orang lain memahami satu pesan, sedikit dan rapi). Kesalahan paling umum adalah menunjukkan grafik eksplorasi ke audiens.

```python
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
```

## 1. Matplotlib: histogram dan scatter plot

Matplotlib adalah fondasi; seaborn dibangun di atasnya. Selalu pakai antarmuka berorientasi objek (`fig, ax`): lebih jelas dan mudah diatur ketika grafiknya lebih dari satu.

```python
rng = np.random.default_rng(0)
umur = rng.normal(35, 10, 500).clip(18, 70)
gaji = 2 + umur * 0.25 + rng.normal(0, 2, 500)       # juta rupiah

fig, axes = plt.subplots(1, 2, figsize=(11, 4))

axes[0].hist(umur, bins=25, color="#4C78A8", edgecolor="white")
axes[0].set(title="Sebaran umur pelanggan", xlabel="Umur (tahun)", ylabel="Jumlah")

axes[1].scatter(umur, gaji, alpha=0.4, s=15)
axes[1].set(title="Gaji naik seiring umur", xlabel="Umur (tahun)", ylabel="Gaji (juta Rp)")

fig.tight_layout()
fig.savefig("eksplorasi.png", dpi=150)
```

**Histogram** menunjukkan bentuk distribusi satu variabel: simetris atau miring, satu puncak atau dua, ada outlier atau tidak. Jumlah `bins` mengubah ceritanya; coba beberapa nilai.

**Scatter plot** menunjukkan hubungan dua variabel numerik: arah, kekuatan, bentuk (linear atau melengkung), dan kelompok. Dengan ribuan titik, kecilkan `alpha` atau pakai `hexbin` supaya titik tidak menumpuk.

## 2. Seaborn: box plot dan heatmap korelasi

Seaborn bekerja langsung dengan DataFrame dan cocok untuk grafik statistik.

```python
df = pd.DataFrame({
    "umur": umur,
    "gaji": gaji,
    "segmen": rng.choice(["Basic", "Plus", "Premium"], 500, p=[0.5, 0.3, 0.2]),
})
df["belanja"] = df["gaji"] * 0.3 + df["segmen"].map({"Basic": 0, "Plus": 1.5, "Premium": 4}) + rng.normal(0, 1, 500)

fig, axes = plt.subplots(1, 2, figsize=(11, 4))
sns.boxplot(data=df, x="segmen", y="belanja", order=["Basic", "Plus", "Premium"], ax=axes[0])
axes[0].set(title="Belanja per segmen", xlabel="", ylabel="Belanja bulanan (juta Rp)")

korelasi = df[["umur", "gaji", "belanja"]].corr()
sns.heatmap(korelasi, annot=True, fmt=".2f", cmap="RdBu_r", vmin=-1, vmax=1, square=True, ax=axes[1])
axes[1].set(title="Korelasi antar variabel")
fig.tight_layout()
```

**Box plot**: garis tengah adalah median, kotak adalah Q1 sampai Q3 (50% data di tengah), kumis sampai 1,5×IQR, dan titik di luar kumis adalah kandidat outlier. Bagus untuk membandingkan distribusi antarkelompok. Jika jumlah data per kelompok kecil, tumpuk titik aslinya dengan `sns.stripplot` supaya tidak menyesatkan.

**Heatmap korelasi**: korelasi Pearson dari -1 sampai 1. Pakai colormap **divergen** dengan pusat 0 (`vmin=-1, vmax=1`) supaya warna netral berarti "tidak berhubungan". Dua catatan penting:

- Korelasi hanya menangkap hubungan **linear**. Hubungan berbentuk U bisa berkorelasi nol.
- Korelasi **bukan** sebab-akibat. Penjualan es krim dan kasus tenggelam berkorelasi karena keduanya naik di musim panas.

Grafik seaborn lain yang sering dipakai di EDA: `histplot` dengan `hue`, `kdeplot`, `countplot`, `pairplot` (scatter semua pasangan), dan `lineplot` untuk deret waktu.

## 3. Menyajikan insight ke audiens teknis dan non teknis

Grafik untuk komunikasi dimulai dari **pesan**, bukan dari data. Tulis dulu satu kalimat yang ingin kamu sampaikan, lalu pilih grafik yang membuktikannya.

**Pilih jenis grafik dari pertanyaannya:**

| Pertanyaan | Grafik |
|---|---|
| Bagaimana berubah dari waktu ke waktu? | Line chart |
| Mana yang lebih besar? | Bar chart horizontal, diurutkan |
| Bagaimana sebarannya? | Histogram, box plot |
| Apakah dua hal berhubungan? | Scatter plot |
| Berapa porsi dari total? | Bar bertumpuk 100%; pie hanya untuk 2–3 bagian |

**Hapus semua yang tidak membantu pesan:** garis grid tebal, bingkai, legenda yang bisa diganti label langsung, efek 3D, dan warna yang tidak berarti apa-apa. Gunakan **satu warna aksen** untuk bagian yang penting dan abu-abu untuk sisanya.

```python
penjualan = pd.Series([120, 95, 88, 64, 40], index=["Kopi", "Teh", "Roti", "Jus", "Kue"])
warna = ["#E4572E" if k == "Kopi" else "#BBBBBB" for k in penjualan.index]

fig, ax = plt.subplots(figsize=(7, 3.5))
ax.barh(penjualan.index[::-1], penjualan.values[::-1], color=warna[::-1])
ax.set_title("Kopi menyumbang 30% penjualan Q1", loc="left", fontsize=13, weight="bold")
ax.spines[["top", "right"]].set_visible(False)
for i, v in enumerate(penjualan.values[::-1]):
    ax.text(v + 2, i, f"{v} jt", va="center")
ax.set_xticks([])
fig.tight_layout()
```

Judul grafik di atas adalah **kesimpulan**, bukan deskripsi ("Penjualan per produk Q1"). Pembaca langsung tahu apa yang harus dilihat.

**Sesuaikan dengan audiens:**

| | Audiens teknis | Audiens non teknis (manajer, eksekutif) |
|---|---|---|
| Mulai dari | Pertanyaan dan metode | Kesimpulan dan rekomendasi |
| Detail | Asumsi, metrik model, batasan, kode | Dampak bisnis dalam angka yang mereka pakai (Rp, pelanggan, hari) |
| Ketidakpastian | Interval kepercayaan, p-value | "Kami cukup yakin" dan rentang sederhana: "naik 3–5%" |
| Grafik | Boleh padat jika mereka mau menelusuri | Satu pesan per grafik |

Struktur yang bekerja untuk presentasi ke non teknis adalah **jawaban dulu** (piramida Minto):

1. **Kesimpulan**: "Kita kehilangan 12% pelanggan Premium karena keterlambatan pengiriman."
2. **Bukti**: dua sampai tiga grafik yang mendukung.
3. **Rekomendasi dan dampak**: "Pindah ke kurir B diperkirakan menahan 800 pelanggan per bulan, senilai Rp 1,2 miliar."
4. **Langkah berikutnya** dan keputusan yang diminta dari mereka.

> **Tip:** Uji grafikmu dengan aturan lima detik. Tunjukkan ke orang lain selama lima detik, lalu tanyakan apa pesannya. Kalau jawabannya beda dengan judulmu, perbaiki grafiknya.

## Latihan

1. Dari dataset pilihanmu, buat enam grafik eksplorasi cepat (histogram, box plot, scatter, heatmap korelasi). Tulis satu temuan dari tiap grafik.
2. Pilih temuan paling penting dan buat ulang menjadi satu grafik komunikasi: judul berupa kesimpulan, satu warna aksen, tanpa elemen berlebih.
3. Cari satu contoh pasangan variabel yang berkorelasi tapi jelas bukan sebab-akibat di datamu, lalu jelaskan faktor ketiganya.
4. Tulis ringkasan satu halaman untuk manajer dengan struktur jawaban dulu.
5. Presentasikan temuan yang sama dalam dua versi: lima menit untuk tim data, dua menit untuk eksekutif.

Blog Storytelling with Data di bagian sumber belajar penuh contoh sebelum dan sesudah untuk langkah 3.
