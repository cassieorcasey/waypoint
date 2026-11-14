Catatan ini mengikuti enam langkah di checklist. Model prediksi menjawab "apa yang kemungkinan terjadi". Eksperimen dan inferensi kausal menjawab "apa yang terjadi **jika kita bertindak**", dan itu pertanyaan yang sebenarnya diajukan bisnis. Bagi seorang Lead, ini cara membedakan inisiatif yang berhasil dari yang hanya kebetulan bertepatan dengan kenaikan metrik.

```python
import numpy as np
from scipy import stats
```

## 1. Korelasi vs kausalitas

Dua hal yang berkorelasi belum tentu saling menyebabkan. Penyebab umumnya adalah **confounder**: faktor ketiga yang memengaruhi keduanya.

> Pelanggan yang memakai fitur baru membeli lebih banyak. Apakah fitur itu penyebabnya? Mungkin pelanggan paling aktif saja yang menemukan fitur itu, dan mereka memang sudah suka membeli.

Kerangka berpikirnya adalah **counterfactual**: efek sebuah perlakuan adalah selisih antara apa yang terjadi dengan perlakuan itu dan apa yang *akan* terjadi tanpanya. Kita tidak pernah mengamati keduanya untuk orang yang sama, sehingga perlu pembanding yang adil. Cara paling andal membuatnya adalah **randomisasi**: kelompok yang diacak secara rata-rata identik dalam segala hal kecuali perlakuannya.

```python
rng = np.random.default_rng(1)
n = 100_000
keaktifan = rng.normal(0, 1, n)                              # confounder
pakai_fitur = (keaktifan + rng.normal(0, 1, n)) > 0.5        # orang aktif lebih sering memakai fitur
belanja = 50 + 20 * keaktifan + 0 * pakai_fitur + rng.normal(0, 10, n)   # efek fitur sebenarnya: nol

print("Selisih naif   :", round(belanja[pakai_fitur].mean() - belanja[~pakai_fitur].mean(), 1))

acak = rng.random(n) < 0.5                                   # sekarang perlakuan diacak
belanja_acak = 50 + 20 * keaktifan + 0 * acak + rng.normal(0, 10, n)
print("Selisih diacak :", round(belanja_acak[acak].mean() - belanja_acak[~acak].mean(), 1))
```

Perbandingan naif menunjukkan selisih besar padahal efek sebenarnya nol. Setelah diacak, selisihnya mendekati nol.

## 2. Merancang A/B test

Sebelum menjalankan, tulis ini di dokumen rancangan:

| Bagian | Pertanyaan | Contoh |
|---|---|---|
| Hipotesis | Apa perubahan dan efek yang diharapkan? | Tombol bayar baru menaikkan konversi |
| Metrik utama | Satu metrik yang menentukan keputusan | Konversi checkout per pengunjung |
| Guardrail | Metrik yang tidak boleh memburuk | Waktu muat, tingkat retur, keluhan |
| Unit randomisasi | Siapa/apa yang diacak? | Pengguna (bukan sesi atau halaman) |
| Populasi | Siapa yang ikut? | Pengunjung baru di Indonesia |
| Durasi | Berapa lama? | Minimal satu atau dua siklus mingguan penuh |
| Aturan keputusan | Apa yang kita lakukan untuk tiap hasil? | Rilis jika naik ≥ 1 poin dan guardrail aman |

Dua prinsip: **tentukan metrik dan aturan keputusan sebelum melihat data**, dan **acak pada unit yang sama dengan yang dianalisis**. Mengacak per pengguna lalu menganalisis per sesi membuat data tampak lebih banyak daripada kenyataannya dan menggelembungkan keyakinan.

## 3. Power analysis

*Power* adalah peluang mendeteksi efek yang memang ada. Ukuran sampel bergantung pada empat hal: tingkat signifikansi α (biasanya 0,05), power (biasanya 0,8), variansi metrik, dan **MDE** (*minimum detectable effect*), yaitu efek terkecil yang cukup bernilai untuk dideteksi.

Untuk membandingkan dua proporsi, rumus pendekatannya:

```python
def n_per_kelompok(p_dasar, mde_mutlak, alpha=0.05, power=0.8):
    """Ukuran sampel per kelompok untuk uji dua proporsi (dua sisi)."""
    p1, p2 = p_dasar, p_dasar + mde_mutlak
    z_a, z_b = stats.norm.ppf(1 - alpha / 2), stats.norm.ppf(power)
    p_rata = (p1 + p2) / 2
    n = ((z_a * np.sqrt(2 * p_rata * (1 - p_rata)) + z_b * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) / mde_mutlak ** 2
    return int(np.ceil(n))

print(n_per_kelompok(0.10, 0.01))    # konversi 10% -> 11%
print(n_per_kelompok(0.10, 0.02))    # efek dua kali lebih besar
```

Efek yang setengahnya lebih kecil membutuhkan kira-kira **empat kali** sampel. Itu sebabnya perubahan kecil pada metrik yang jarang terjadi sering tidak layak diuji. Jika sampelnya tidak cukup, pilihannya: pakai metrik yang lebih sensitif, perbesar perubahannya, perpanjang durasi, atau terima bahwa eksperimen ini tidak akan menghasilkan jawaban yang tegas.

## 4. Menganalisis hasil

Untuk dua proporsi, uji z memberi nilai p dan interval kepercayaan selisihnya:

```python
def analisis_ab(konv_a, n_a, konv_b, n_b, alpha=0.05):
    pa, pb = konv_a / n_a, konv_b / n_b
    p_gabung = (konv_a + konv_b) / (n_a + n_b)
    se_uji = np.sqrt(p_gabung * (1 - p_gabung) * (1 / n_a + 1 / n_b))
    z = (pb - pa) / se_uji
    nilai_p = float(2 * (1 - stats.norm.cdf(abs(z))))
    se = np.sqrt(pa * (1 - pa) / n_a + pb * (1 - pb) / n_b)
    ci = (pb - pa - stats.norm.ppf(1 - alpha / 2) * se, pb - pa + stats.norm.ppf(1 - alpha / 2) * se)
    return {"selisih": round(pb - pa, 4), "nilai_p": round(nilai_p, 4), "ci": tuple(round(float(x), 4) for x in ci)}

print(analisis_ab(konv_a=1000, n_a=10_000, konv_b=1100, n_b=10_000))
```

Cara membacanya yang benar:

- **Fokus pada interval kepercayaan, bukan hanya nilai p.** Interval menunjukkan rentang efek yang masuk akal. "Naik antara 0,2 dan 1,8 poin" memberi dasar keputusan yang lebih baik daripada "p = 0,02".
- **Signifikan secara statistik tidak sama dengan penting secara bisnis.** Dengan sampel jutaan, efek 0,01% bisa signifikan namun tidak berarti.
- **Multiple testing.** Memeriksa 20 metrik atau irisan dengan α = 0,05 hampir pasti menghasilkan satu "temuan" palsu. Tetapkan satu metrik utama, dan koreksi (misalnya Bonferroni) untuk sisanya.
- **Peeking.** Mengintip nilai p setiap hari lalu berhenti begitu "signifikan" menaikkan galat positif palsu jauh di atas 5%. Tetapkan durasi atau ukuran sampel di awal, atau pakai metode sekuensial yang dirancang untuk itu.

```python
# Peeking: tidak ada efek sama sekali (A = B), tetapi kita berhenti saat pertama kali p < 0,05
rng = np.random.default_rng(2)
positif_palsu = 0
for _ in range(500):
    a, b = rng.random(5000) < 0.1, rng.random(5000) < 0.1
    for akhir in range(500, 5001, 500):                       # 10 kali mengintip
        hasil = analisis_ab(a[:akhir].sum(), akhir, b[:akhir].sum(), akhir)
        if hasil["nilai_p"] < 0.05:
            positif_palsu += 1
            break
print("Tingkat positif palsu dengan peeking:", positif_palsu / 500)   # jauh di atas 0,05
```

## 5. Jebakan eksperimen

| Jebakan | Gejala | Tindakan |
|---|---|---|
| **Sample ratio mismatch** (SRM) | Rasio kelompok menyimpang dari rencana (misalnya 50/50 jadi 52/48) | Uji chi-kuadrat pada jumlah pengguna; kalau SRM, jangan percaya hasilnya, cari bug penugasan |
| **Novelty effect** | Efek besar di awal lalu memudar | Jalankan cukup lama, lihat tren harian |
| **Interferensi** | Perlakuan satu pengguna memengaruhi pengguna lain (media sosial, marketplace, pengemudi dan penumpang) | Acak per kluster atau wilayah, bukan per individu |
| **Efek hari dalam minggu** | Perilaku berbeda di akhir pekan | Durasi kelipatan satu minggu |
| **Kontaminasi** | Orang melihat kedua versi | Acak per pengguna dan konsisten antar perangkat |
| **Memeriksa irisan sesudah** | Efek ditemukan hanya pada subkelompok tertentu | Anggap sebagai hipotesis baru, uji ulang |

```python
# Uji SRM: apakah 10.400 vs 9.600 pengguna wajar pada rencana 50/50?
observasi = [10_400, 9_600]
chi2, p = stats.chisquare(observasi, f_exp=[10_000, 10_000])
print(round(chi2, 1), p < 0.001)     # True: ada yang salah dengan penugasan
```

## 6. Inferensi kausal dari data observasional

Tidak semua hal bisa diacak: kebijakan harga di satu kota, perubahan regulasi, program yang sudah berjalan. Ada beberapa metode yang meniru eksperimen, masing-masing dengan **asumsi** yang harus kamu sebutkan dan periksa.

| Metode | Ide | Asumsi utama |
|---|---|---|
| **Difference-in-differences** | Bandingkan perubahan kelompok yang terkena dengan perubahan kelompok yang tidak terkena | Tanpa perlakuan, kedua kelompok akan bergerak sejajar (*parallel trends*) |
| **Propensity score** | Cocokkan atau bobot pengguna yang mirip peluang terkena perlakuannya | Semua confounder penting sudah terukur |
| **Regresi diskontinuitas** | Bandingkan pihak tepat di atas dan di bawah ambang aturan (misalnya skor 600) | Orang tidak bisa memanipulasi posisinya di sekitar ambang |

```python
# Difference-in-differences: kota A mendapat promo di bulan ke-2, kota B tidak
sebelum_a, sesudah_a = 100.0, 130.0
sebelum_b, sesudah_b = 90.0, 105.0
did = (sesudah_a - sebelum_a) - (sesudah_b - sebelum_b)
print(did)    # 15: kenaikan 30 dikurangi tren umum 15 yang juga terjadi tanpa promo
```

Metode observasional hampir selalu lebih lemah daripada eksperimen acak. Jika memungkinkan, ujilah juga dengan eksperimen kecil, dan laporkan hasilnya dengan jujur: "perkiraan efek dengan asumsi X", bukan "terbukti".

## Latihan

1. Ambil satu perubahan produk dari tempat kerjamu atau contoh publik, lalu tulis dokumen rancangan A/B test satu halaman (tabel di bagian 2).
2. Hitung ukuran sampel untuk tiga nilai MDE dengan `n_per_kelompok` dan jelaskan mana yang realistis diuji dalam dua minggu.
3. Jalankan simulasi peeking di atas dengan jumlah mengintip yang berbeda dan catat bagaimana galat positif palsunya berubah.
4. Simulasikan eksperimen dengan SRM (bug penugasan yang menghilangkan sebagian pengguna) dan tunjukkan bagaimana hasilnya bisa menyesatkan.
5. Cari satu kasus di mana kamu pernah menyimpulkan "X menyebabkan Y" dari data observasional. Tulis confounder yang mungkin dan cara mengujinya.

Rujukan: *Trustworthy Online Controlled Experiments*, *Causal Inference for the Brave and True*, dan tulisan Evan Miller di bagian sumber belajar.
