Catatan ini membahas satu langkah di checklist, dengan tiga pilihan platform. Setelah API terbungkus Docker, langkah terakhir adalah menjalankannya di server yang bisa diakses internet. Ketiga platform di sini menerima **image Docker**, jadi Dockerfile dari catatan sebelumnya bisa dipakai hampir tanpa perubahan.

## Memilih platform

| | Hugging Face Spaces | Render | AWS EC2 / App Runner |
|---|---|---|---|
| Cocok untuk | Demo, portofolio, model ML publik | API kecil sampai menengah | Produksi dan kebutuhan perusahaan |
| Cara deploy | Push ke repo Space | Hubungkan repo GitHub | Push image ke ECR (App Runner), atau kelola server sendiri (EC2) |
| Kerumitan | Paling mudah | Mudah | Paling banyak pengaturan |
| Paket gratis | Ada (CPU dasar) | Ada, tapi layanan tidur saat tidak dipakai | Free tier terbatas waktu dan kuota |

Batas paket gratis dan harga sering berubah; cek halaman harga resmi sebelum memilih.

## Persiapan yang sama untuk semua platform

1. **Port dari variabel lingkungan.** Banyak platform menentukan port sendiri lewat `PORT`. Ubah baris terakhir Dockerfile:

```dockerfile
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

2. **Endpoint `/health`** yang cepat, dipakai platform untuk mengecek aplikasi hidup.
3. **Rahasia** (API key, URL database) diatur di pengaturan *environment variables* platform, bukan di kode atau image.
4. **Uji lokal dulu**: `docker build` dan `docker run` harus berhasil di laptop sebelum dicoba di cloud.

## Hugging Face Spaces

Spaces adalah repositori Git di Hugging Face yang otomatis dibangun dan dijalankan.

1. Buat Space baru di huggingface.co, pilih SDK **Docker**.
2. Clone repo Space-nya, lalu tambahkan `Dockerfile`, kode, dan model.
3. Di bagian atas `README.md`, metadata YAML memberi tahu port aplikasi:

```yaml
---
title: API Diagnosis
sdk: docker
app_port: 8000
---
```

4. `git push`. Space membangun image dan menampilkan log build serta URL publiknya.

File model besar disimpan dengan Git LFS, atau lebih baik diunggah sebagai repositori model terpisah di Hub dan diunduh saat start dengan `huggingface_hub`. Untuk demo interaktif tanpa menulis frontend, Space juga mendukung **Gradio** dan **Streamlit**.

## Render

1. Push proyek (dengan Dockerfile) ke GitHub.
2. Di dashboard Render: **New → Web Service**, hubungkan repo-nya. Render mendeteksi Dockerfile.
3. Atur *environment variables* dan *health check path* `/health`.
4. Klik deploy. Setiap push ke branch utama otomatis memicu deploy ulang.

Render memberi variabel `PORT` dan sertifikat HTTPS otomatis. Di paket gratis, layanan berhenti setelah tidak ada permintaan selama beberapa waktu, sehingga permintaan pertama sesudahnya lambat (*cold start*). Itu wajar untuk portofolio, tapi tidak untuk produksi.

## AWS: App Runner atau EC2

**App Runner** adalah layanan terkelola: kamu memberi image, AWS mengurus server, skala, dan HTTPS. Alurnya:

```bash
# 1. Buat repositori image di ECR (sekali saja)
aws ecr create-repository --repository-name api-diagnosis

# 2. Login Docker ke ECR, beri tag, dan push image
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <akun>.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag api-diagnosis:1.0 <akun>.dkr.ecr.ap-southeast-1.amazonaws.com/api-diagnosis:1.0
docker push <akun>.dkr.ecr.ap-southeast-1.amazonaws.com/api-diagnosis:1.0
```

3. Di konsol App Runner: **Create service → Container registry → Amazon ECR**, pilih image, isi port 8000 dan health check `/health`.

Pastikan image dibangun untuk arsitektur yang sesuai. Laptop Apple Silicon menghasilkan image ARM secara default; tambahkan `--platform linux/amd64` saat `docker build` bila layanan memakai x86.

**EC2** adalah server virtual mentah: kamu memasang Docker sendiri, menjalankan container, mengatur firewall (*security group*), domain, dan HTTPS (biasanya dengan Nginx atau Caddy di depan). Kontrolnya penuh, tapi semua perawatan menjadi tanggung jawabmu. Untuk satu API model, App Runner (atau ECS) biasanya pilihan yang lebih masuk akal.

> **Penting:** aktifkan **budget alert** di AWS sejak hari pertama, dan matikan sumber daya yang tidak dipakai. Tagihan cloud yang terlupa adalah kesalahan pemula yang paling mahal. Jangan pernah commit *access key* AWS ke Git.

## Setelah online

- **Uji dari luar**: panggil `/health` dan `/predict` lewat URL publik.
- **Pantau log** di dashboard platform, terutama error 4xx/5xx dan latensi.
- **Otomatisasi deploy** dari GitHub Actions (catatan CI/CD Fase 8): tes lulus → build image → deploy.
- **Versi**: beri tag image dengan versi atau hash commit, bukan hanya `latest`, supaya bisa kembali ke versi sebelumnya dengan cepat.

## Latihan

1. Deploy API dari catatan Docker ke Hugging Face Spaces dan bagikan URL `/docs`-nya.
2. Deploy aplikasi yang sama ke Render, lalu ukur waktu *cold start* setelah layanan tidur.
3. Tambahkan API key sederhana lewat environment variable, dan pastikan permintaan tanpa key ditolak dengan `401`.
4. Push image ke registry (Docker Hub atau GHCR) dengan tag versi, lalu deploy ulang versi sebelumnya untuk berlatih *rollback*.
5. Tulis README singkat berisi URL, contoh permintaan `curl`, dan arti setiap field respons.
