Catatan ini mengikuti sembilan langkah di checklist, urutannya sama. Jalankan setiap contoh sendiri di terminal (`python`) atau notebook; membaca saja tidak cukup untuk bahasa pemrograman. Semua contoh berlaku untuk Python 3.10 ke atas.

## 1. Sintaks dasar, variabel, tipe data

Python menandai blok kode dengan **indentasi** (4 spasi), bukan kurung kurawal. Variabel tidak perlu dideklarasikan: nama hanya menunjuk ke sebuah objek.

```python
nama = "Ayu"
umur = 24
tinggi = 1.62
aktif = True
kosong = None

print(type(umur))  # <class 'int'>
print(f"{nama} berumur {umur} tahun")  # f-string
```

| Tipe | Contoh | Catatan |
|---|---|---|
| `int` | `42` | Ukurannya tidak dibatasi |
| `float` | `3.14` | `0.1 + 0.2 != 0.3` karena representasi biner |
| `str` | `"halo"` | Tidak bisa diubah (immutable) |
| `bool` | `True` | Subtipe dari `int`: `True + True == 2` |
| `NoneType` | `None` | Artinya "tidak ada nilai" |

Operator yang wajib hafal: `//` pembagian bulat, `%` sisa bagi, `**` pangkat. Operator `/` selalu menghasilkan `float`.

```python
print(7 // 2, 7 % 2, 2 ** 10, 7 / 2)  # 3 1 1024 3.5
```

> **Tip:** Untuk membandingkan float pakai `math.isclose(a, b)`, bukan `==`.

## 2. Kondisional dan loop

```python
nilai = 82
if nilai >= 90:
    huruf = "A"
elif nilai >= 75:
    huruf = "B"
else:
    huruf = "C"
```

Nilai yang dianggap salah (*falsy*): `0`, `0.0`, `""`, `[]`, `{}`, `set()`, `None`, `False`. Semua yang lain benar. Karena itu `if daftar:` sudah cukup untuk mengecek daftar tidak kosong.

```python
for i in range(3):  # 0, 1, 2
    print(i)

buah = ["apel", "jeruk", "mangga"]
for idx, nama in enumerate(buah, start=1):
    print(idx, nama)

for a, b in zip([1, 2, 3], ["x", "y", "z"]):
    print(a, b)

n = 0
while n < 3:
    n += 1
```

`break` menghentikan loop, `continue` lompat ke iterasi berikutnya. Loop juga punya `else` yang jalan **hanya jika loop selesai tanpa `break`**, berguna untuk pencarian:

```python
for x in [3, 5, 8]:
    if x % 2 == 0:
        print("ketemu genap", x)
        break
else:
    print("tidak ada genap")
```

## 3. Fungsi dan scope

```python
def luas_persegi_panjang(p, l=1):
    """Hitung luas. Docstring ini muncul di help()."""
    return p * l

print(luas_persegi_panjang(4, 5))  # 20
print(luas_persegi_panjang(l=3, p=2))  # argumen bernama
```

`*args` menampung argumen posisi ekstra sebagai tuple, `**kwargs` menampung argumen bernama ekstra sebagai dict.

```python
def rata_rata(*angka):
    return sum(angka) / len(angka)

rata_rata(80, 90, 100)  # 90.0
```

**Jebakan klasik:** nilai default dibuat sekali saat fungsi didefinisikan. Jangan pakai list atau dict sebagai default.

```python
def tambah(x, daftar=[]):  # salah: daftar dipakai bersama
    daftar.append(x)
    return daftar

def tambah_benar(x, daftar=None):
    if daftar is None:
        daftar = []
    daftar.append(x)
    return daftar
```

**Scope** mengikuti aturan LEGB: Python mencari nama di *Local*, lalu *Enclosing* (fungsi pembungkus), lalu *Global*, lalu *Built-in*. Mengubah variabel luar dari dalam fungsi butuh `global` atau `nonlocal`, tapi hindari kalau bisa. Lebih rapi: kirim sebagai argumen, kembalikan sebagai hasil.

## 4. List, Tuple, Dictionary, Set

| Struktur | Urut | Bisa diubah | Isi unik | Contoh |
|---|---|---|---|---|
| `list` | ya | ya | tidak | `[1, 2, 2]` |
| `tuple` | ya | tidak | tidak | `(1, 2)` |
| `dict` | ya (urutan sisip) | ya | kunci unik | `{"a": 1}` |
| `set` | tidak | ya | ya | `{1, 2}` |

```python
angka = [3, 1, 2]
angka.append(4)
angka.sort()
print(angka[0], angka[-1], angka[1:3])  # 1 4 [2, 3]

titik = (2, 5)
x, y = titik  # unpacking

umur = {"Ayu": 24, "Budi": 31}
umur["Citra"] = 28
print(umur.get("Dewi", 0))  # 0, tanpa error
for nama, u in umur.items():
    print(nama, u)

a, b = {1, 2, 3}, {3, 4}
print(a & b, a | b, a - b)  # {3} {1,2,3,4} {1,2}
```

Soal kecepatan: mengecek `x in daftar` memeriksa satu per satu (O(n)), sedangkan `x in set_atau_dict` rata-rata O(1). Untuk pencarian berulang, ubah list jadi set.

Menyalin: `b = a` tidak menyalin, hanya menambah nama. Pakai `a.copy()` atau `a[:]` untuk salinan dangkal, dan `copy.deepcopy(a)` kalau ada list di dalam list.

## 5. List comprehension dan generator expressions

```python
kuadrat = [x * x for x in range(6)]  # [0, 1, 4, 9, 16, 25]
genap = [x for x in range(10) if x % 2 == 0]
peta = {nama: len(nama) for nama in ["Ayu", "Budi"]}
unik = {x % 3 for x in range(10)}  # {0, 1, 2}
```

Ganti `[ ]` dengan `( )` dan hasilnya **generator**: nilai dihitung satu per satu saat diminta, tidak disimpan semuanya di memori.

```python
total = sum(x * x for x in range(1_000_000))  # hemat memori

def hitung_mundur(n):
    while n > 0:
        yield n
        n -= 1

print(list(hitung_mundur(3)))  # [3, 2, 1]
```

Generator hanya bisa dibaca sekali. Kalau comprehension mulai panjang atau bersarang dua tingkat, tulis sebagai loop biasa supaya terbaca.

## 6. OOP: Class dan Object

Class adalah cetakan, objek adalah hasil cetakannya.

```python
class Rekening:
    def __init__(self, pemilik, saldo=0):
        self.pemilik = pemilik
        self._saldo = saldo  # awalan _ = "internal", sebatas konvensi

    def setor(self, jumlah):
        if jumlah <= 0:
            raise ValueError("jumlah harus positif")
        self._saldo += jumlah

    @property
    def saldo(self):  # dibaca seperti atribut: r.saldo
        return self._saldo

    def __repr__(self):
        return f"Rekening({self.pemilik!r}, saldo={self._saldo})"

r = Rekening("Ayu", 100)
r.setor(50)
print(r.saldo, r)  # 150 Rekening('Ayu', saldo=150)
```

`self` adalah objek yang sedang dipanggil. Untuk class yang isinya hanya data, `@dataclass` menulis `__init__` dan `__repr__` untukmu:

```python
from dataclasses import dataclass

@dataclass
class Titik:
    x: float
    y: float
```

## 7. OOP: Inheritance dan Polymorphism

Subclass mewarisi atribut dan method induknya, dan boleh menimpanya (*override*).

```python
class Hewan:
    def __init__(self, nama):
        self.nama = nama

    def bersuara(self):
        raise NotImplementedError

class Kucing(Hewan):
    def bersuara(self):
        return "meong"

class Anjing(Hewan):
    def __init__(self, nama, ras):
        super().__init__(nama)  # panggil __init__ induk
        self.ras = ras

    def bersuara(self):
        return "guk"

for h in [Kucing("Mimi"), Anjing("Rex", "Husky")]:
    print(h.nama, h.bersuara())  # satu panggilan, perilaku berbeda
```

Itulah **polimorfisme**: kode pemanggil tidak perlu tahu tipe pastinya. Python memakai *duck typing*: yang penting objek punya method yang dibutuhkan. Untuk memaksa subclass mengimplementasikan method tertentu, pakai `abc.ABC` dan `@abstractmethod`. Utamakan komposisi (objek berisi objek lain) bila hubungannya "punya", bukan "adalah".

## 8. Error dan exception handling

```python
def bagi(a, b):
    try:
        hasil = a / b
    except ZeroDivisionError:
        print("tidak bisa dibagi nol")
        return None
    except (TypeError, ValueError) as e:
        print("input salah:", e)
        return None
    else:
        return hasil  # jalan hanya jika tidak ada error
    finally:
        print("selesai")  # selalu jalan
```

Aturan praktis:

- Tangkap exception **yang spesifik**. `except:` telanjang ikut menelan `KeyboardInterrupt` dan menyembunyikan bug.
- Jangan menelan error diam-diam. Minimal catat atau lempar ulang dengan `raise`.
- Lempar error sendiri dengan `raise ValueError("pesan yang jelas")`, atau buat kelas sendiri: `class SaldoKurang(Exception): ...`.
- Untuk sumber daya yang harus ditutup (file, koneksi), pakai `with`:

```python
with open("data.txt", encoding="utf-8") as f:
    isi = f.read()  # file otomatis tertutup, error atau tidak
```

## 9. Modular code dengan pip

Satu file `.py` adalah **modul**, folder berisi modul (dan biasanya `__init__.py`) adalah **package**.

```python
# utils.py
def sapa(nama):
    return f"Halo, {nama}"

if __name__ == "__main__":  # hanya jalan saat file dieksekusi langsung
    print(sapa("dunia"))
```

```python
# main.py
from utils import sapa
import math
import numpy as np
```

`pip` memasang package dari PyPI. Selalu pakai **virtual environment** per proyek supaya versi package tidak bentrok:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install numpy pandas
pip freeze > requirements.txt  # catat versi yang dipakai
pip install -r requirements.txt  # pasang ulang di komputer lain
```

Tambahkan `.venv/` ke `.gitignore`; yang di-commit cukup `requirements.txt`.

## Latihan

1. Tulis fungsi `frekuensi_kata(teks)` yang mengembalikan dict jumlah tiap kata (huruf kecil, tanpa tanda baca).
2. Ubah ke satu baris dengan comprehension: daftar kuadrat dari bilangan ganjil 1 sampai 20.
3. Buat class `Keranjang` dengan method `tambah(item, harga)` dan property `total`.
4. Tulis generator `fibonacci()` tak terhingga, lalu ambil 10 nilai pertama dengan `itertools.islice`.
5. Bungkus pembacaan sebuah file CSV dengan `try/except` yang menangani file tidak ada dan encoding salah.
6. Pisahkan jawaban nomor 1 sampai 5 ke modul sendiri dan impor dari `main.py`.

Kalau bisa mengerjakan semuanya tanpa melihat catatan ini, langkah-langkah Python di checklist layak dicentang.
