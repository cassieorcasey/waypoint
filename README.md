# Waypoint

Roadmap Lead Data Science dalam bentuk peta berurutan. Sembilan fase berderet vertikal sebagai jalur utama. Ketuk satu fase untuk memunculkan topik-topiknya sebagai gelembung, lalu ketuk topik untuk membuka panel berisi langkah dan sumber belajar.

Situs: https://cassieorcasey.github.io/waypoint/

## Setup sekali

Tabel menumpang di project Supabase **StudyO**, sama dengan Synthesis. Awalan `waypoint_` membuatnya tidak bentrok dengan tabel lain.

1. **Supabase → SQL Editor**: tempel isi `schema.sql`, lalu Run. Aman dijalankan ulang.
2. **Supabase → Authentication → URL Configuration → Redirect URLs**: tambahkan `https://cassieorcasey.github.io/waypoint/`.
3. **GitHub → repo → Settings → Pages → Source**: pilih **GitHub Actions**.

Setiap push ke `main` otomatis di-build dan di-deploy oleh `.github/workflows/deploy.yml`.

Login memakai akun StudyO (magic link). Synthesis dan Waypoint ada di domain yang sama, jadi kalau sudah masuk di salah satunya, yang lain ikut masuk.

## Mode contoh

Tambahkan `?demo` di URL untuk mencoba tanpa login. Progres mode ini hanya tersimpan di browser.

## Mengubah isi roadmap

Semua fase, topik, langkah, dan sumber ada di `src/data/roadmap.ts`.

- Teks dan judul boleh diubah kapan saja.
- **Jangan mengganti id yang sudah ada.** Progres di Supabase tersimpan per id langkah.
- Langkah baru memakai id baru (misalnya `python-10`), meski disisipkan di tengah daftar.

## Progres dari roadmap lama

Kalau roadmap HTML lama pernah dibuka di `cassieorcasey.github.io`, centangnya terdeteksi otomatis dan Waypoint menawarkan untuk memindahkannya. Dari tempat lain, buka `https://cassieorcasey.github.io/waypoint/#impor=1.2.7` dengan nomor checkbox lama (c1, c2, c7, ...).

## Struktur

| Bagian | Isi |
|---|---|
| `src/data/roadmap.ts` | Struktur roadmap: 9 fase, 27 topik, 124 langkah |
| `src/components/PhaseMap.tsx` | Jalur fase, cincin progres, gelembung topik |
| `src/components/TopicSheet.tsx` | Panel langkah dan sumber (Vaul) |
| `src/lib/progress.ts` | Baca dan simpan progres (Supabase atau localStorage) |
| `schema.sql` | Tabel `waypoint_progress` dan RLS |

Dibangun dengan React, Vite, Motion, Vaul, dan supabase-js.
