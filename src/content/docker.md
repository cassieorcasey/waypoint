Catatan ini mengikuti tiga langkah di checklist. Docker menyelesaikan masalah klasik "jalan di laptopku, gagal di server". Aplikasi, versi Python, library, dan pengaturannya dipaketkan menjadi satu **image** yang berjalan sama persis di mana pun.

| Istilah | Arti |
|---|---|
| Dockerfile | Resep teks untuk membangun image |
| Image | Hasil build: paket siap jalan, tidak bisa diubah |
| Container | Image yang sedang berjalan; bisa banyak dari satu image |
| Registry | Tempat menyimpan image (Docker Hub, GitHub Container Registry, AWS ECR) |

Contoh di catatan ini memaketkan API FastAPI dari catatan Model Serving. Struktur foldernya:

```text
proyek/
├── app.py
├── model.joblib
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

## 1. Menulis Dockerfile

```dockerfile
# Image dasar: Python resmi versi ramping
FROM python:3.12-slim

# Python tidak menulis .pyc dan log langsung keluar (tidak tertahan buffer)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Salin requirements dulu supaya layer instalasi di-cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Baru salin kode dan model
COPY app.py model.joblib ./

# Jalankan sebagai pengguna biasa, bukan root
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Setiap instruksi membentuk satu **layer**. Docker menyimpan layer di cache, dan cache hanya dipakai ulang jika layer itu dan semua layer sebelumnya tidak berubah. Karena itu urutannya penting: hal yang jarang berubah (instalasi library) di atas, hal yang sering berubah (kode) di bawah. Dengan urutan ini, mengubah `app.py` tidak memicu instalasi ulang semua library.

| Instruksi | Fungsi |
|---|---|
| `FROM` | Image dasar |
| `WORKDIR` | Folder kerja di dalam container |
| `COPY` | Salin file dari komputer ke image |
| `RUN` | Jalankan perintah saat build |
| `ENV` | Variabel lingkungan |
| `EXPOSE` | Dokumentasi port yang dipakai aplikasi |
| `CMD` | Perintah default saat container dijalankan |

Server harus mendengarkan di `0.0.0.0`, bukan `127.0.0.1`, supaya bisa diakses dari luar container.

## 2. Memaketkan kode dan dependensi

**Kunci versi** di `requirements.txt` supaya build hari ini dan bulan depan menghasilkan hal yang sama:

```text
fastapi==0.115.12
uvicorn==0.34.2
scikit-learn==1.6.1
pandas==2.2.3
joblib==1.4.2
```

Angka versi di atas hanya contoh. Pakai versi yang sama persis dengan lingkungan tempat model dilatih (`pip freeze`), terutama scikit-learn, karena model joblib bergantung padanya.

**`.dockerignore`** mencegah file yang tidak perlu ikut masuk ke image, sehingga build lebih cepat, image lebih kecil, dan rahasia tidak bocor:

```text
.git
.venv
__pycache__
*.ipynb
.ipynb_checkpoints
data/
.env
```

Prinsip yang perlu dipegang:

- **Jangan memasukkan rahasia** (API key, password) ke image. Siapa pun yang punya image bisa membacanya. Berikan lewat variabel lingkungan saat container dijalankan.
- **Image kecil** lebih cepat diunduh dan dijalankan: pakai varian `-slim`, `--no-cache-dir`, dan jangan menyalin data latih.
- **Model besar** (ratusan MB ke atas) lebih baik diunduh saat start dari penyimpanan objek (S3, Hugging Face Hub) daripada dimasukkan ke image.
- Untuk library yang butuh kompilasi, **multi-stage build** memisahkan tahap build (dengan compiler) dari image akhir yang ramping.

## 3. Menjalankan container

```bash
docker build -t api-diagnosis:1.0 .              # bangun image dari Dockerfile di folder ini
docker images                                    # daftar image

docker run -d --name diagnosis -p 8000:8000 api-diagnosis:1.0
#          │   │                └ port komputer:port container
#          │   └ nama container
#          └ jalan di latar belakang

curl http://localhost:8000/health
docker ps                                        # container yang sedang jalan
docker logs -f diagnosis                         # lihat log
docker exec -it diagnosis bash                   # masuk ke dalam container untuk debugging
docker stop diagnosis && docker rm diagnosis     # hentikan dan hapus
```

Memberi konfigurasi dan rahasia saat menjalankan:

```bash
docker run -d -p 8000:8000 -e API_KEY=rahasia -e LOG_LEVEL=info api-diagnosis:1.0
docker run -d -p 8000:8000 --env-file .env api-diagnosis:1.0
```

Untuk lebih dari satu layanan (misalnya API + database + Redis), **Docker Compose** menjalankan semuanya dengan satu file:

```yaml
# compose.yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - db
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: contoh
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
docker compose up -d --build
docker compose down
```

Data di dalam container **hilang** saat container dihapus. Simpan data yang harus bertahan di **volume** (seperti `pgdata` di atas).

## Latihan

1. Paketkan API dari catatan Model Serving menjadi image, jalankan, dan panggil `/health` dari luar container.
2. Ubah satu baris di `app.py` lalu build ulang. Perhatikan layer mana yang memakai cache.
3. Pindahkan `COPY . .` ke atas `pip install`, build ulang setelah mengubah kode, dan bandingkan waktunya.
4. Bandingkan ukuran image dari `python:3.12` dan `python:3.12-slim` dengan `docker images`.
5. Tambahkan PostgreSQL dengan Docker Compose dan simpan setiap prediksi ke tabel log.
