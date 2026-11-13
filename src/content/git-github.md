Catatan ini mengikuti enam langkah di checklist. Kuncinya: Git itu soal **snapshot**. Setiap commit adalah foto seluruh proyekmu pada satu momen, dan kamu bisa kembali ke foto mana pun. Kalau bingung di tengah jalan, jalankan `git status`; ia selalu memberi tahu posisimu dan perintah berikutnya.

## 1. Init, add, commit

Setiap file berada di salah satu dari tiga area:

| Area | Artinya | Perintah pindah |
|---|---|---|
| Working directory | File yang sedang kamu edit | |
| Staging area | Perubahan yang dipilih untuk commit berikutnya | `git add` |
| Repository | Riwayat commit yang sudah tersimpan | `git commit` |

```bash
git config --global user.name "Nama Kamu"
git config --global user.email "kamu@email.com"

git init -b main  # mulai repositori di folder ini
git status  # lihat kondisi sekarang

git add analisis.py  # masukkan satu file ke staging
git add .  # atau semua perubahan
git commit -m "Tambah fungsi pembersihan data"

git log --oneline  # riwayat ringkas
git diff  # perubahan yang belum di-stage
git diff --staged  # perubahan yang sudah di-stage
```

Pesan commit yang baik singkat (di bawah 70 karakter), dalam bentuk perintah, dan menjelaskan **apa** yang berubah: "Perbaiki hitung rata-rata saat data kosong", bukan "update" atau "fix bug".

Jangan commit file yang tidak perlu: data besar, kunci rahasia, `.venv/`, `__pycache__/`. Daftarkan di file `.gitignore`:

```text
.venv/
__pycache__/
.env
*.csv
.ipynb_checkpoints/
```

> **Penting:** kalau password, token, atau API key terlanjur ter-commit, menghapusnya di commit berikutnya tidak cukup karena masih ada di riwayat. Anggap kunci itu bocor dan ganti segera.

## 2. Branch dan checkout

Branch adalah jalur kerja terpisah. Kamu bisa bereksperimen tanpa mengganggu `main`.

```bash
git branch  # daftar branch, tanda * = yang aktif
git switch -c fitur/hapus-outlier  # buat branch baru lalu pindah
# ... edit, add, commit ...
git switch main  # kembali ke main
```

`git switch` adalah perintah modern untuk pindah branch. Di banyak tutorial kamu akan melihat `git checkout`, dan keduanya bekerja:

```bash
git checkout main  # sama dengan git switch main
git checkout -b fitur/baru  # sama dengan git switch -c fitur/baru
```

Kebiasaan yang baik: satu branch untuk satu tujuan, dengan nama yang menjelaskan isinya (`fitur/...`, `perbaikan/...`). Branch murah, jadi jangan ragu membuat banyak.

## 3. Merge

Merge menggabungkan hasil kerja satu branch ke branch lain. Pindah dulu ke branch **tujuan**:

```bash
git switch main
git merge fitur/hapus-outlier
```

Ada dua hasil:

- **Fast-forward**: `main` tidak berubah sejak branch dibuat, jadi Git cukup menggeser penunjuk `main` maju. Tidak ada commit baru.
- **Merge commit**: kedua branch sama-sama berubah, jadi Git membuat satu commit baru yang menyatukan keduanya.

Kalau dua branch mengubah **baris yang sama**, terjadi *conflict*. Git berhenti dan menandai file:

```text
<<<<<<< HEAD
rata_rata = sum(x) / len(x)
=======
rata_rata = statistics.mean(x)
>>>>>>> fitur/hapus-outlier
```

Cara menyelesaikan:

1. Buka file, putuskan isi akhirnya, lalu hapus ketiga baris penanda (`<<<<<<<`, `=======`, `>>>>>>>`).
2. `git add nama-file`
3. `git commit` untuk menyelesaikan merge.

Tersesat di tengah conflict? `git merge --abort` mengembalikan semuanya seperti sebelum merge. Setelah merge selesai, branch yang sudah tidak dipakai boleh dihapus: `git branch -d fitur/hapus-outlier`.

## 4. Clone, pull, push

Remote adalah salinan repositori di server (misalnya GitHub), biasanya bernama `origin`.

```bash
git clone https://github.com/pengguna/proyek.git  # salin repositori + riwayatnya
cd proyek

git push -u origin main  # kirim commit lokal ke remote; -u hanya sekali per branch
git push  # selanjutnya cukup begini

git fetch  # ambil info terbaru tanpa mengubah file-mu
git pull  # fetch + merge ke branch aktif
```

Biasakan `git pull` **sebelum** mulai bekerja, supaya tidak menumpuk conflict. Kalau `git push` ditolak karena remote punya commit yang belum kamu punya, lakukan `git pull` dulu lalu push lagi.

> **Hindari `git push --force`** pada branch yang dipakai bersama. Perintah itu menimpa riwayat di remote dan bisa menghapus pekerjaan orang lain. Perintah `git reset --hard` juga membuang perubahan yang belum di-commit tanpa bisa dikembalikan.

Untuk push dari komputer sendiri ke GitHub, kamu butuh autentikasi: **personal access token** (dipakai sebagai pengganti password pada HTTPS) atau **SSH key**. Alur paling mudah bagi pemula adalah GitHub CLI: `gh auth login`.

## 5. Repositori GitHub dan Pull Request

GitHub adalah tempat repositori Git dihosting, ditambah alat kolaborasi. **Pull Request** (PR) adalah permintaan agar perubahan di satu branch digabungkan ke branch lain, disertai diskusi dan review.

Alur kerja standar:

1. Buat repositori di GitHub (**New repository**) lalu hubungkan: `git remote add origin <url>` atau `git clone`.
2. Buat branch dari `main`, kerjakan, commit.
3. `git push -u origin nama-branch`.
4. Di GitHub, klik **Compare & pull request**. Tulis judul yang jelas, jelaskan *apa* yang berubah dan *kenapa*.
5. Reviewer memberi komentar. Perbaiki di branch yang sama, commit baru otomatis masuk ke PR.
6. Setelah disetujui, **Merge pull request**, lalu hapus branch-nya.

Kalau mengerjakan repositori orang lain, alurnya sama dengan satu langkah tambahan di awal: **Fork** (salinan ke akunmu), kerjakan di fork, lalu buka PR ke repositori asli.

Deskripsi PR yang baik berisi:

- Ringkasan perubahan dalam satu atau dua kalimat.
- Alasan atau masalah yang diselesaikan (tautkan issue dengan `Closes #12`).
- Cara mengujinya.
- Tangkapan layar atau hasil angka, kalau relevan (misalnya metrik sebelum dan sesudah).

## 6. Dasar code review

Code review ada dua sisi: kamu me-review kode orang, dan kodemu di-review.

**Sebagai pembuat PR**

- Buat PR kecil, idealnya di bawah 400 baris yang berubah dan satu tujuan. PR besar jarang di-review dengan teliti.
- Review dirimu sendiri dulu di tab *Files changed* sebelum meminta orang lain.
- Pastikan kode berjalan dan tes lulus sebelum meminta review.
- Anggap komentar sebagai masukan untuk kode, bukan penilaian atas dirimu. Kalau tidak setuju, jelaskan alasannya dengan sopan.

**Sebagai reviewer**, periksa berurutan:

1. **Benar?** Apakah kode melakukan yang dijanjikan di deskripsi, termasuk kasus tepi (data kosong, nilai `None`, pembagian nol)?
2. **Mudah dibaca?** Nama jelas, fungsi tidak terlalu panjang, tidak ada duplikasi besar.
3. **Aman?** Tidak ada kunci atau data pribadi yang ikut ter-commit, input dari luar divalidasi.
4. **Teruji?** Ada tes untuk perilaku baru. Untuk kode data science: apakah hasil bisa direproduksi (seed acak, versi package dicatat)?

Cara menulis komentar yang baik:

- Spesifik dan menyebut alasan: "Di baris 42 `len(x)` bisa nol, jadi hasilnya error. Bagaimana kalau kita cek dulu?"
- Bedakan wajib dan saran: awali dengan `Nit:` untuk hal kecil yang boleh diabaikan.
- Bertanya lebih baik daripada memerintah: "Kenapa memakai `apply` di sini?" membuka diskusi.
- Sebutkan juga hal yang bagus. Review bukan hanya mencari kesalahan.

## Latihan

1. Buat repositori lokal, commit tiga kali dengan pesan yang jelas, lalu lihat hasilnya dengan `git log --oneline`.
2. Buat branch, ubah satu file, kembali ke `main`, ubah **baris yang sama** di file itu, lalu merge. Selesaikan conflict-nya sampai bersih.
3. Buat repositori di GitHub, push, lalu clone ke folder lain dan pastikan isinya sama.
4. Fork repositori publik latihan, ubah satu baris README, dan buka PR dengan deskripsi lengkap.
5. Minta teman (atau review sendiri keesokan harinya) memberi tiga komentar pada PR-mu dan perbaiki semuanya.

Perintah yang paling sering kamu pakai dalam sehari-hari hanya sembilan: `status`, `add`, `commit`, `switch`, `merge`, `pull`, `push`, `log`, `diff`. Hafalkan itu dulu.
