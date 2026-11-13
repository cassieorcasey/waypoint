Catatan ini mengikuti delapan langkah di checklist. Semua contoh memakai dua tabel kecil supaya mudah dilacak. Sintaksnya standar SQL dan jalan di PostgreSQL maupun MySQL. SQLite (tanpa instalasi server) cukup untuk mencoba hampir semuanya; pengecualiannya `ALTER TABLE ... ADD CONSTRAINT` di langkah 7, dan `FULL JOIN` yang baru ada di SQLite 3.39 ke atas. Contoh dan hasilnya sudah dijalankan untuk memastikan keluarannya cocok.

```sql
CREATE TABLE pelanggan (
    id     INTEGER PRIMARY KEY,
    nama   TEXT NOT NULL,
    kota   TEXT
);

CREATE TABLE pesanan (
    id            INTEGER PRIMARY KEY,
    pelanggan_id  INTEGER NOT NULL REFERENCES pelanggan(id),
    tanggal       DATE NOT NULL,
    total         NUMERIC(10, 2) NOT NULL
);

INSERT INTO pelanggan VALUES (1, 'Ayu', 'Jakarta'), (2, 'Budi', 'Bandung'),
                             (3, 'Citra', 'Jakarta'), (4, 'Dewi', NULL);
INSERT INTO pesanan VALUES (1, 1, '2026-01-05', 150000), (2, 1, '2026-02-10', 80000),
                           (3, 2, '2026-02-11', 220000), (4, 3, '2026-03-02', 50000);
```

## 1. Konsep RDBMS

*Relational Database Management System* menyimpan data dalam **tabel**: **baris** (*row*, satu catatan) dan **kolom** (*column*, satu atribut dengan tipe tertentu). Tabel saling terhubung lewat kunci, jadi data tidak perlu diulang di mana-mana.

Contoh: nama dan kota pelanggan disimpan **sekali** di `pelanggan`. Tabel `pesanan` hanya mencatat `pelanggan_id`. Kalau Ayu pindah kota, cukup ubah satu baris.

Kemampuan penting RDBMS:

- **Skema bertipe**: kolom `total` hanya menerima angka, `NOT NULL` melarang kosong.
- **Transaksi (ACID)**: beberapa perubahan berhasil semua atau batal semua. Contoh klasik: transfer uang tidak boleh berhenti di tengah.
- **SQL**: bahasa deklaratif. Kamu menulis *apa* yang dicari, mesin database memilih *bagaimana* mengerjakannya.
- **Konkurensi**: banyak pengguna membaca dan menulis bersamaan tanpa merusak data.

`NULL` berarti "tidak diketahui", **bukan** nol dan bukan string kosong. Ia punya aturan sendiri, dan itu sumber banyak kebingungan (lihat langkah 2).

## 2. SELECT, WHERE, ORDER BY

```sql
SELECT nama, kota
FROM pelanggan
WHERE kota = 'Jakarta'
ORDER BY nama ASC;
```

Operator filter yang sering dipakai:

```sql
WHERE total >= 100000 AND tanggal >= '2026-02-01'
WHERE kota IN ('Jakarta', 'Bandung')
WHERE total BETWEEN 50000 AND 150000  -- batas ikut masuk
WHERE nama LIKE 'A%'  -- diawali A; _ = satu karakter
WHERE kota IS NULL  -- bukan "= NULL"
```

> **Jebakan NULL:** `kota = NULL` tidak pernah benar, dan `kota <> 'Jakarta'` juga **tidak** mengembalikan baris yang kotanya `NULL`. Gunakan `IS NULL` dan `IS NOT NULL`.

`ORDER BY total DESC` mengurutkan dari terbesar. `LIMIT 3` membatasi jumlah baris (di SQL Server memakai `TOP 3`). `DISTINCT` membuang duplikat: `SELECT DISTINCT kota FROM pelanggan`.

Urutan **pengerjaan** query berbeda dari urutan penulisannya, dan memahaminya menghindarkan banyak error:

1. `FROM` (dan `JOIN`) lalu `WHERE` (saring baris)
2. `GROUP BY` (kelompokkan) lalu `HAVING` (saring kelompok)
3. `SELECT` (hitung kolom dan alias) lalu `ORDER BY` lalu `LIMIT`

Itu sebabnya alias yang dibuat di `SELECT` tidak bisa dipakai di `WHERE`.

## 3. GROUP BY dan HAVING

`GROUP BY` mengelompokkan baris yang nilainya sama, lalu fungsi agregat dihitung **per kelompok**.

```sql
SELECT pelanggan_id, COUNT(*) AS jumlah_pesanan, SUM(total) AS belanja
FROM pesanan
GROUP BY pelanggan_id;
```

| pelanggan_id | jumlah_pesanan | belanja |
|---|---|---|
| 1 | 2 | 230000 |
| 2 | 1 | 220000 |
| 3 | 1 | 50000 |

Aturan emas: setiap kolom di `SELECT` harus berada di `GROUP BY` **atau** dibungkus fungsi agregat.

`WHERE` menyaring **baris sebelum** dikelompokkan, sedangkan `HAVING` menyaring **kelompok sesudah** dihitung:

```sql
SELECT pelanggan_id, SUM(total) AS belanja
FROM pesanan
WHERE tanggal >= '2026-02-01'  -- baris dulu
GROUP BY pelanggan_id
HAVING SUM(total) > 100000;  -- baru kelompok
```

Aturan praktis: kondisi yang bisa dipindah ke `WHERE` sebaiknya di `WHERE`, karena menyaring lebih awal membuat query lebih cepat.

## 4. Fungsi agregat

| Fungsi | Hasil |
|---|---|
| `COUNT(*)` | Jumlah baris |
| `COUNT(kolom)` | Jumlah baris yang kolomnya **tidak NULL** |
| `COUNT(DISTINCT kolom)` | Jumlah nilai unik |
| `SUM`, `AVG` | Jumlah dan rata-rata |
| `MIN`, `MAX` | Terkecil dan terbesar |

```sql
SELECT COUNT(*) AS semua,
       COUNT(kota) AS yang_punya_kota,
       COUNT(DISTINCT kota) AS kota_unik
FROM pelanggan;
-- 4, 3, 2
```

Semua fungsi agregat (kecuali `COUNT(*)`) **mengabaikan NULL**. Artinya `AVG(kolom)` dihitung hanya dari baris yang terisi, dan itu bisa berbeda dari yang kamu kira. Kalau `NULL` memang harus dihitung nol, tulis `AVG(COALESCE(kolom, 0))`.

Tanpa `GROUP BY`, agregat meringkas seluruh tabel menjadi satu baris: `SELECT AVG(total) FROM pesanan;`.

## 5. JOIN

`JOIN` menggabungkan baris dari dua tabel berdasarkan kolom yang cocok.

```sql
SELECT p.nama, o.tanggal, o.total
FROM pelanggan AS p
INNER JOIN pesanan AS o ON o.pelanggan_id = p.id
ORDER BY o.tanggal;
```

| Jenis | Hasil |
|---|---|
| `INNER JOIN` | Hanya baris yang punya pasangan di kedua tabel |
| `LEFT JOIN` | Semua baris tabel kiri; kolom kanan `NULL` jika tidak ada pasangan |
| `RIGHT JOIN` | Kebalikan `LEFT` (jarang dipakai; tukar urutan tabel saja) |
| `FULL JOIN` | Semua baris dari kedua sisi (tidak ada di MySQL dan SQLite lama) |

Contoh kasus yang paling sering ditanyakan: **pelanggan yang belum pernah memesan**.

```sql
SELECT p.nama
FROM pelanggan AS p
LEFT JOIN pesanan AS o ON o.pelanggan_id = p.id
WHERE o.id IS NULL;
-- Dewi
```

Tiga kebiasaan penting:

- Selalu tulis kondisi `ON`. Tanpa itu hasilnya bisa menjadi perkalian semua baris (*cross join*).
- Beri alias tabel pendek (`p`, `o`) dan awali nama kolom dengan alias supaya tidak ambigu.
- Setelah JOIN, cek jumlah baris. Hubungan satu-ke-banyak menggandakan baris sisi "satu", dan itu membuat `SUM` membengkak tanpa disadari.

## 6. Subquery

Subquery adalah `SELECT` di dalam `SELECT` lain.

```sql
-- Skalar: satu nilai
SELECT * FROM pesanan
WHERE total > (SELECT AVG(total) FROM pesanan);

-- Daftar nilai dengan IN
SELECT nama FROM pelanggan
WHERE id IN (SELECT pelanggan_id FROM pesanan WHERE total > 100000);

-- EXISTS: cukup cek ada atau tidak
SELECT nama FROM pelanggan AS p
WHERE EXISTS (SELECT 1 FROM pesanan o WHERE o.pelanggan_id = p.id);

-- Di FROM: hasil antara diperlakukan seperti tabel
SELECT kota, AVG(belanja) AS rata_belanja
FROM (
    SELECT p.kota, SUM(o.total) AS belanja
    FROM pelanggan p JOIN pesanan o ON o.pelanggan_id = p.id
    GROUP BY p.id, p.kota
) AS per_pelanggan
GROUP BY kota;
```

Subquery **berkorelasi** (contoh `EXISTS` di atas) merujuk kolom dari query luar, jadi dievaluasi per baris. Untuk query yang makin panjang, **CTE** membuatnya lebih terbaca:

```sql
WITH per_pelanggan AS (
    SELECT pelanggan_id, SUM(total) AS belanja
    FROM pesanan
    GROUP BY pelanggan_id
)
SELECT p.nama, pp.belanja
FROM per_pelanggan AS pp
JOIN pelanggan AS p ON p.id = pp.pelanggan_id
WHERE pp.belanja > 100000;
```

Hati-hati dengan `NOT IN` bila subquery bisa menghasilkan `NULL`: satu `NULL` saja membuat hasilnya kosong. `NOT EXISTS` lebih aman.

## 7. Primary key dan foreign key

**Primary key (PK)** mengenali satu baris secara unik. Syaratnya: tidak `NULL`, tidak duplikat, dan sebaiknya tidak berubah. Pilihan umum adalah angka yang bertambah otomatis (`id`) atau UUID. Hindari data bermakna seperti nama atau email sebagai PK karena bisa berubah.

**Foreign key (FK)** adalah kolom yang menunjuk PK tabel lain dan menjaga **integritas referensial**: database menolak pesanan untuk pelanggan yang tidak ada.

```sql
ALTER TABLE pesanan
ADD CONSTRAINT fk_pesanan_pelanggan
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id)
    ON DELETE RESTRICT;  -- tolak hapus pelanggan yang masih punya pesanan
```

Pilihan `ON DELETE`:

| Opsi | Efek saat baris induk dihapus |
|---|---|
| `RESTRICT` / `NO ACTION` | Ditolak jika masih ada anak |
| `CASCADE` | Baris anak ikut terhapus (hati-hati) |
| `SET NULL` | Kolom FK di anak jadi `NULL` |

Hubungan antartabel: **satu-ke-banyak** (satu pelanggan, banyak pesanan) memakai FK di sisi "banyak". **Banyak-ke-banyak** (pesanan dan produk) butuh tabel penghubung dengan dua FK. PK dan FK juga yang membuat JOIN di langkah 5 efisien. PK otomatis berindeks, tetapi kolom FK biasanya perlu kamu beri indeks sendiri (`CREATE INDEX ... ON pesanan(pelanggan_id)`).

> **Catatan SQLite:** FK harus ditulis langsung di `CREATE TABLE` (seperti di awal catatan), dan pengecekannya baru aktif setelah `PRAGMA foreign_keys = ON;`.

## 8. Normalisasi

Normalisasi menata tabel supaya data tidak berulang dan tidak menimbulkan anomali saat diubah. Bayangkan satu tabel besar:

| pesanan_id | pelanggan | kota | produk | harga |
|---|---|---|---|---|
| 1 | Ayu | Jakarta | Buku, Pulpen | 50000, 5000 |

- **1NF**: setiap sel berisi **satu nilai** dan tidak ada kolom berulang. `Buku, Pulpen` dalam satu sel melanggar; pecah jadi satu baris per produk.
- **2NF**: (sudah 1NF) tidak ada kolom yang hanya bergantung pada **sebagian** dari kunci gabungan. Kalau kuncinya `(pesanan_id, produk)`, maka `harga` produk bergantung pada `produk` saja, jadi pindahkan ke tabel `produk`.
- **3NF**: (sudah 2NF) kolom non-kunci tidak bergantung pada kolom non-kunci lain. `kota` bergantung pada `pelanggan`, bukan pada pesanan, jadi pindahkan ke tabel `pelanggan`.

Hasilnya adalah tabel seperti di awal catatan ini: `pelanggan`, `pesanan`, ditambah `produk` dan `detail_pesanan`. Manfaatnya: mengubah kota Ayu cukup di satu tempat (tidak ada anomali pembaruan), dan data tidak tersimpan di dua tempat yang bisa bertentangan.

Normalisasi bukan dogma. Untuk analitik dan data warehouse, tabel sering sengaja **didenormalisasi** (satu tabel lebar) supaya query baca lebih cepat tanpa banyak JOIN. Aturan praktisnya: sistem transaksi cenderung dinormalisasi, sistem laporan cenderung didenormalisasi.

## Latihan

1. Tampilkan tiga pesanan dengan total terbesar beserta nama pelanggannya.
2. Hitung total belanja per kota. Kota `NULL` harus tampil sebagai "Tidak diketahui" (`COALESCE`).
3. Cari pelanggan yang total belanjanya di atas rata-rata total belanja semua pelanggan.
4. Tampilkan jumlah pesanan per bulan, hanya bulan dengan minimal dua pesanan (`GROUP BY` + `HAVING`).
5. Gambar sendiri desain tiga tabel untuk toko buku (buku, penulis, penjualan), tentukan PK, FK, dan jelaskan bentuk normal mana yang terpenuhi.
6. Sengaja tulis query yang salah dengan `NOT IN` dan data `NULL`, lalu perbaiki dengan `NOT EXISTS`.

Latihan paling efektif adalah menulis query tanpa menyalin, lalu memeriksa jumlah baris hasilnya dengan akal sehat: apakah angkanya masuk akal?
