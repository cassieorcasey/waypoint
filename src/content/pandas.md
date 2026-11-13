Catatan ini mengikuti lima langkah di checklist. pandas adalah alat utama untuk data tabular di Python: membaca, membersihkan, menggabungkan, dan meringkas. Contoh di bawah memakai satu dataset kecil penjualan supaya mudah dilacak. Semua sintaks berlaku untuk pandas 2 dan 3.

```python
import pandas as pd

df = pd.DataFrame({
    "tanggal": pd.to_datetime(["2026-01-03", "2026-01-03", "2026-01-10", "2026-02-02", "2026-02-15", "2026-02-20"]),
    "kota":    ["Jakarta", "Bandung", "Jakarta", "Surabaya", "Bandung", "Jakarta"],
    "produk":  ["Kopi", "Teh", "Teh", "Kopi", "Kopi", "Kopi"],
    "jumlah":  [3, 5, 2, 4, 1, 6],
    "harga":   [25000, 15000, 15000, 25000, 25000, 25000],
})
```

## 1. DataFrame dan Series

**Series** adalah satu kolom: array satu dimensi dengan label (*index*). **DataFrame** adalah tabel: kumpulan Series yang berbagi index yang sama.

```python
df["jumlah"]                 # Series
df[["kota", "jumlah"]]       # DataFrame dengan dua kolom

df.shape                     # (6, 5)
df.dtypes                    # tipe tiap kolom
df.head(3)                   # 3 baris pertama
df.info()                    # tipe, jumlah non-null, memori
df.describe()                # ringkasan statistik kolom numerik
df["kota"].value_counts()    # frekuensi tiap kategori
```

Membuat kolom baru dengan operasi vektor (tanpa loop):

```python
df["pendapatan"] = df["jumlah"] * df["harga"]
df["bulan"] = df["tanggal"].dt.strftime("%Y-%m")     # "2026-01"
```

Memilih baris dan kolom:

| Cara | Berdasarkan | Contoh |
|---|---|---|
| `loc` | Label | `df.loc[0, "kota"]`, `df.loc[df["jumlah"] > 3, ["kota", "jumlah"]]` |
| `iloc` | Posisi | `df.iloc[0, 1]`, `df.iloc[:3, :2]` |

> **Penting:** untuk mengubah nilai, selalu pakai satu langkah `df.loc[baris, kolom] = nilai`. Pola dua langkah seperti `df[df.x > 0]["y"] = 1` tidak mengubah `df` (di pandas 3 tidak pernah, karena *copy-on-write*).

## 2. Impor/ekspor CSV, JSON, SQL

```python
df = pd.read_csv("penjualan.csv", parse_dates=["tanggal"])
df = pd.read_csv("data.csv", sep=";", decimal=",", encoding="utf-8")   # format Indonesia/Eropa
df.to_csv("hasil.csv", index=False)

df = pd.read_json("data.json")                  # array of objects
df = pd.read_json("data.jsonl", lines=True)     # satu objek per baris
df.to_json("hasil.json", orient="records", force_ascii=False)

df = pd.read_excel("laporan.xlsx", sheet_name="Q1")   # butuh openpyxl
df.to_parquet("hasil.parquet")                  # cepat dan kecil; bagus untuk data besar
```

SQL lewat SQLAlchemy atau koneksi `sqlite3`:

```python
import sqlite3

con = sqlite3.connect(":memory:")
df.to_sql("penjualan", con, index=False)
hasil = pd.read_sql("SELECT kota, SUM(jumlah) AS total FROM penjualan GROUP BY kota", con)
```

Kebiasaan setelah membaca file apa pun: cek `df.shape`, `df.head()`, `df.dtypes`, dan `df.isna().sum()`. Kolom angka yang terbaca sebagai teks biasanya tanda pemisah desimal, simbol mata uang, atau nilai kosong yang ditulis aneh ("-", "N/A").

## 3. Filtering

```python
df[df["jumlah"] > 3]
df[(df["kota"] == "Jakarta") & (df["produk"] == "Kopi")]   # pakai & | ~, dan kurung
df[df["kota"].isin(["Jakarta", "Bandung"])]
df[df["tanggal"].between("2026-01-01", "2026-01-31")]
df[df["produk"].str.contains("Ko")]
df[~df["kota"].isna()]                                     # ~ = NOT

df.query("jumlah > 3 and kota == 'Jakarta'")               # alternatif yang ringkas
```

Mengurutkan dan mengambil teratas:

```python
df.sort_values(["kota", "jumlah"], ascending=[True, False])
df.nlargest(3, "pendapatan")
```

## 4. Groupby

Pola **split–apply–combine**: pecah data per kelompok, hitung sesuatu per kelompok, gabungkan hasilnya.

```python
df.groupby("kota")["pendapatan"].sum()

ringkas = df.groupby("kota").agg(
    transaksi=("jumlah", "size"),
    unit=("jumlah", "sum"),
    pendapatan=("pendapatan", "sum"),
    rata_unit=("jumlah", "mean"),
).sort_values("pendapatan", ascending=False)
```

Hasilnya, dengan data contoh:

| kota | transaksi | unit | pendapatan | rata_unit |
|---|---|---|---|---|
| Jakarta | 3 | 11 | 255000 | 3.67 |
| Bandung | 2 | 6 | 100000 | 3.00 |
| Surabaya | 1 | 4 | 100000 | 4.00 |

Dua varian penting:

```python
# transform: hasil per kelompok dikembalikan ke setiap baris (bentuk tetap)
df["porsi_kota"] = df["pendapatan"] / df.groupby("kota")["pendapatan"].transform("sum")

# beberapa kunci + resample per waktu
df.groupby(["bulan", "produk"])["jumlah"].sum()
df.set_index("tanggal").resample("W")["pendapatan"].sum()   # per minggu
```

Menggabungkan tabel memakai `merge`, padanan JOIN di SQL:

```python
target = pd.DataFrame({"kota": ["Jakarta", "Bandung"], "target": [200000, 150000]})
df_kota = ringkas.reset_index().merge(target, on="kota", how="left")   # Surabaya: target NaN
```

## 5. Pivot table

Pivot table menyusun ringkasan dua dimensi: satu kategori di baris, satu di kolom.

```python
pv = df.pivot_table(
    index="kota",
    columns="produk",
    values="pendapatan",
    aggfunc="sum",
    fill_value=0,
    margins=True,           # baris dan kolom "All" berisi total
)
```

| kota | Kopi | Teh | All |
|---|---|---|---|
| Bandung | 25000 | 75000 | 100000 |
| Jakarta | 225000 | 30000 | 255000 |
| Surabaya | 100000 | 0 | 100000 |
| All | 350000 | 105000 | 455000 |

Lawannya, `melt`, mengubah tabel lebar menjadi panjang (format yang disukai seaborn dan banyak model):

```python
panjang = pv.drop(index="All", columns="All").reset_index().melt(id_vars="kota", var_name="produk", value_name="pendapatan")
```

`pd.crosstab(df["kota"], df["produk"])` adalah jalan pintas untuk menghitung frekuensi kombinasi dua kategori.

## Latihan

1. Baca satu dataset Kaggle (misalnya Titanic), lalu jawab: berapa baris, kolom mana yang punya nilai kosong, dan tipe apa yang salah terbaca?
2. Hitung tingkat keselamatan per kelas dan jenis kelamin dengan `groupby`, lalu dengan `pivot_table`. Bandingkan hasilnya.
3. Tambahkan kolom yang berisi selisih umur penumpang terhadap rata-rata umur di kelasnya (`transform`).
4. Ekspor ringkasanmu ke CSV dan Parquet, lalu bandingkan ukuran file-nya.
5. Tulis query SQL dari catatan SQL Fase 1 dalam pandas, dan sebaliknya.
