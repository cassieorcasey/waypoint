Catatan ini mengikuti enam langkah di checklist. Model hanya sebaik data yang masuk ke dalamnya, dan data itu datang lewat pipeline yang dibangun, dijadwalkan, dan dirawat. Kamu tidak harus menjadi data engineer, tetapi sebagai Lead kamu perlu cukup paham untuk merancang bersama mereka, menilai usulan mereka, dan tahu mengapa pipeline rusak di jam dua pagi.

## 1. ETL vs ELT, batch vs streaming

| Pola | Urutan | Cocok untuk |
|---|---|---|
| **ETL** | Extract, **Transform**, lalu Load ke tujuan | Transformasi berat sebelum masuk, data sensitif yang perlu dibersihkan dulu |
| **ELT** | Extract, **Load** data mentah, lalu Transform di dalam warehouse | Warehouse modern yang murah dan cepat; transformasi bisa diulang dan diubah |

ELT mengalahkan ETL di banyak tim karena **data mentah tetap tersimpan**. Jika logika transformasi salah, kamu cukup menjalankan ulang, tanpa harus mengambil data dari sumber lagi.

| | Batch | Streaming |
|---|---|---|
| Cara kerja | Memproses kumpulan data per jadwal (jam, hari) | Memproses peristiwa begitu datang |
| Latensi | Menit sampai jam | Detik atau kurang |
| Kerumitan | Rendah | Tinggi (urutan peristiwa, data terlambat, status) |
| Alat umum | Airflow, dbt, Spark | Kafka, Flink, Spark Structured Streaming |

Pertanyaan yang menentukan: **berapa cepat keputusan harus diambil?** Dashboard mingguan dan model yang dilatih ulang tiap malam cukup dengan batch. Deteksi penipuan saat transaksi butuh streaming. Jangan memilih streaming hanya karena terdengar modern: biayanya jauh lebih besar untuk dirawat.

## 2. Data warehouse, data lake, dan star schema

| | Data warehouse | Data lake |
|---|---|---|
| Isi | Data terstruktur, sudah dimodelkan | Data mentah dalam berbagai format (CSV, JSON, Parquet, log, gambar) |
| Skema | Ditentukan saat **menulis** | Ditentukan saat **membaca** |
| Contoh | BigQuery, Snowflake, Redshift | Penyimpanan objek (S3, GCS) |

Pola **lakehouse** menggabungkan keduanya: file terbuka (Parquet, Delta, Iceberg) di penyimpanan objek, dengan mesin query di atasnya.

Untuk analitik, bentuk pemodelan yang paling umum adalah **star schema**: satu tabel **fakta** (kejadian yang diukur, misalnya transaksi) dikelilingi tabel **dimensi** (konteks: pelanggan, produk, tanggal).

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE dim_pelanggan (pelanggan_id INTEGER PRIMARY KEY, nama TEXT, kota TEXT);
CREATE TABLE dim_produk    (produk_id INTEGER PRIMARY KEY, nama TEXT, kategori TEXT);
CREATE TABLE fakta_penjualan (
    transaksi_id INTEGER PRIMARY KEY,
    tanggal TEXT, pelanggan_id INTEGER, produk_id INTEGER, jumlah INTEGER, harga REAL
);
INSERT INTO dim_pelanggan VALUES (1,'Ani','Jakarta'), (2,'Budi','Bandung');
INSERT INTO dim_produk    VALUES (1,'Kopi','Minuman'), (2,'Roti','Makanan');
INSERT INTO fakta_penjualan VALUES
  (1,'2025-01-01',1,1,2,25000), (2,'2025-01-01',2,2,1,15000), (3,'2025-01-02',1,2,3,15000);
""")

kueri = """
SELECT p.kategori, d.kota, SUM(f.jumlah * f.harga) AS omzet
FROM fakta_penjualan f
JOIN dim_produk p ON p.produk_id = f.produk_id
JOIN dim_pelanggan d ON d.pelanggan_id = f.pelanggan_id
GROUP BY p.kategori, d.kota ORDER BY omzet DESC
"""
for baris in db.execute(kueri):
    print(baris)
```

Kebiasaan penting: tentukan **grain** (satu baris di tabel fakta mewakili apa persisnya) sebelum merancang apa pun. Grain yang kabur adalah sumber utama angka yang tidak cocok antar laporan.

## 3. Orkestrasi dengan Airflow

Pipeline nyata punya banyak langkah yang saling bergantung. **Orkestrator** menjalankannya sesuai jadwal dan urutan ketergantungan, mencoba ulang saat gagal, dan memberi tahu saat ada masalah. Di Airflow, alurnya berupa **DAG** (*directed acyclic graph*): kumpulan tugas dengan panah ketergantungan tanpa putaran.

```python
from datetime import datetime
from airflow.decorators import dag, task      # Airflow 3: from airflow.sdk import dag, task

@dag(
    schedule="@daily",
    start_date=datetime(2025, 1, 1),
    catchup=False,
    default_args={"retries": 2},
)
def penjualan_harian():
    @task
    def ekstrak(ds=None):
        """Ambil data transaksi untuk tanggal logis eksekusi (ds), bukan 'hari ini'."""
        return f"s3://mentah/transaksi/{ds}.parquet"

    @task
    def muat(path):
        ...   # tulis ke tabel staging dengan INSERT yang idempoten

    @task
    def hitung_fitur(path):
        ...

    path = ekstrak()
    muat(path)
    hitung_fitur(path)

penjualan_harian()
```

Dua konsep yang paling sering menjebak:

- **Tanggal logis (`ds`) vs waktu sekarang.** Tugas harus memproses data milik tanggal eksekusinya. Jika memakai `datetime.now()`, menjalankan ulang pipeline untuk tanggal lama memberi hasil yang salah.
- **Idempotensi.** Menjalankan sebuah tugas dua kali harus menghasilkan keadaan yang sama dengan sekali. Tanpa itu, retry otomatis menggandakan data.

```python
# Memuat ulang hari yang sama tidak boleh menggandakan baris
db.executescript("""
CREATE TABLE harian (tanggal TEXT, kategori TEXT, omzet REAL, PRIMARY KEY (tanggal, kategori));
""")

def muat_hari(tanggal, baris):
    db.execute("DELETE FROM harian WHERE tanggal = ?", (tanggal,))          # hapus partisi hari itu
    db.executemany("INSERT INTO harian VALUES (?, ?, ?)", [(tanggal, k, o) for k, o in baris])

muat_hari("2025-01-01", [("Minuman", 50000.0), ("Makanan", 15000.0)])
muat_hari("2025-01-01", [("Minuman", 50000.0), ("Makanan", 15000.0)])       # retry
print(db.execute("SELECT COUNT(*) FROM harian").fetchone())                  # (2,) bukan (4,)
```

Pola lain yang aman: `INSERT ... ON CONFLICT DO UPDATE` (upsert) atau menimpa seluruh partisi tanggal. Airflow menjalankan versi dan sintaks yang berbeda antar rilis mayor, jadi cocokkan contoh di atas dengan dokumentasi versi yang kamu pakai.

## 4. Transformasi dan tes data dengan dbt

**dbt** mengubah transformasi SQL menjadi proyek perangkat lunak: setiap model adalah satu file `SELECT`, ketergantungan antar model dilacak otomatis, dan hasilnya dites serta didokumentasikan.

```sql
-- models/omzet_harian.sql
select
    tanggal,
    kategori,
    sum(jumlah * harga) as omzet
from {{ ref('stg_penjualan') }}
group by 1, 2
```

Tes ditulis di berkas YAML di sampingnya:

```yaml
# models/omzet_harian.yml
version: 2
models:
  - name: omzet_harian
    columns:
      - name: tanggal
        tests: [not_null]
      - name: omzet
        tests: [not_null]
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns: [tanggal, kategori]
```

Manfaat untuk tim data science: fitur yang dihitung di dbt punya satu definisi yang disepakati, ada riwayat Git, dan tes otomatis menangkap perubahan yang merusak kolom penting sebelum sampai ke model.

## 5. Kualitas data dan data contract

Sebagian besar kegagalan model produksi berasal dari data, bukan dari algoritma: kolom berubah nama, satuan berganti, atau satu sumber berhenti mengirim data.

Lapisan pertahanan:

| Lapisan | Contoh pemeriksaan |
|---|---|
| Skema | Kolom wajib ada, tipe data benar |
| Kelengkapan | Persentase nilai kosong di bawah batas |
| Rentang dan nilai | Umur 0 sampai 120, mata uang dari daftar yang dikenal |
| Keunikan | Tidak ada ID duplikat |
| Kesegaran | Data terbaru tidak lebih tua dari 24 jam |
| Distribusi | Rata-rata dan proporsi tidak bergeser tajam dibanding minggu lalu |

**Data contract** adalah kesepakatan tertulis antara tim yang menghasilkan data dan tim yang memakainya: skema, arti tiap kolom, kesegaran, dan siapa yang dihubungi saat berubah. Dengan kesepakatan ini, perubahan di sumber diumumkan dan dites sebelum dirilis, bukan ditemukan setelah model rusak. Ini kesempatan yang baik untuk seorang Lead: kamu adalah konsumen data terbesar dan paling berkepentingan.

Untuk fitur ML, **feature store** menjaga definisi fitur yang sama antara training dan serving, sehingga mencegah *training-serving skew* yang dibahas di catatan Desain Sistem ML.

## 6. Kapan butuh komputasi terdistribusi (Spark)

Satu mesin dengan pandas atau DuckDB menangani jauh lebih banyak data daripada yang biasanya dikira, sering sampai puluhan gigabita. Tambahan kerumitan Spark baru sepadan ketika data tidak muat di satu mesin atau pekerjaan terlalu lambat.

| Konsep Spark | Arti |
|---|---|
| Partisi | Data dibagi menjadi potongan yang diproses paralel di banyak mesin |
| Transformasi malas (*lazy*) | Rencana kerja baru dijalankan saat ada aksi (`count`, `write`) |
| **Shuffle** | Data dipindahkan antar mesin (saat `groupBy`, `join`); langkah paling mahal |
| Skew | Satu partisi jauh lebih besar dari yang lain, sehingga seluruh pekerjaan menunggunya |

```python
from pyspark.sql import SparkSession, functions as F

spark = SparkSession.builder.appName("omzet").getOrCreate()
df = spark.read.parquet("s3://mentah/transaksi/")
hasil = (df.groupBy("kategori")
           .agg(F.sum(F.col("jumlah") * F.col("harga")).alias("omzet")))
hasil.write.mode("overwrite").parquet("s3://olahan/omzet_per_kategori/")
```

Praktik dasar: simpan data dalam format kolom (Parquet), filter sedini mungkin, pilih hanya kolom yang perlu, dan waspadai *shuffle*. Sebelum menggeser ke Spark, tanyakan dulu apakah DuckDB atau satu mesin besar sudah cukup.

## Latihan

1. Gambar alur data di proyekmu: dari sumber, ke penyimpanan mentah, ke tabel olahan, ke model. Tandai di mana data bisa rusak tanpa ada yang tahu.
2. Buat star schema untuk satu domain (transaksi, pesanan, sesi aplikasi) dengan SQLite atau DuckDB, mulai dengan menulis grain-nya.
3. Tulis DAG Airflow sederhana dengan tiga tugas dan jalankan lokal (`airflow standalone`). Picu retry dan pastikan hasilnya tidak ganda.
4. Buat proyek dbt kecil dengan satu model staging, satu model hasil, dan tiga tes data.
5. Tulis data contract satu halaman antara timmu dan tim sumber data utama: kolom, arti, kesegaran, dan prosedur perubahan.

Rujukan: *Data Engineering Zoomcamp*, dokumentasi Airflow, dbt, dan Spark di bagian sumber belajar.
