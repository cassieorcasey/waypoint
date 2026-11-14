Catatan ini mengikuti enam langkah di checklist dan melengkapi catatan Prinsip Lead Data Scientist (mentorship dan code review). Di level Lead, hasil kerja sebagian besar berjalan lewat **orang lain**: keputusan yang kamu pengaruhi, tim yang kamu kembangkan, dan pemahaman yang kamu tanamkan pada pihak non teknis. Kemampuan teknis membuatmu dipercaya, tetapi komunikasi dan pengelolaan tim yang menentukan seberapa jauh dampakmu menjangkau.

## 1. Komunikasi ke eksekutif

Eksekutif punya sedikit waktu dan banyak keputusan. Mereka tidak butuh perjalanan analisismu, mereka butuh **kesimpulan, alasan, dan apa yang diminta darinya**.

**Prinsip piramida: jawaban dulu, bukti kemudian.**

| Urutan | Isi | Contoh |
|---|---|---|
| 1. Kesimpulan | Satu kalimat rekomendasi atau temuan | "Kami merekomendasikan menjalankan program retensi untuk 2.000 pelanggan berisiko per minggu." |
| 2. Dampak | Angka bisnis | "Diperkirakan menahan sekitar 400 pelanggan per bulan, bernilai ± Rp 600 juta per tahun." |
| 3. Dasar | Tiga alasan atau bukti terkuat | Hasil uji, perbandingan dengan baseline, studi percobaan |
| 4. Risiko | Apa yang bisa salah dan bagaimana ditangani | "Efek belum diuji pada pelanggan baru; uji A/B dua minggu" |
| 5. Permintaan | Keputusan atau sumber daya yang dibutuhkan | "Butuh persetujuan anggaran dan satu analis dari tim CRM." |

Kebiasaan yang membedakan:

- **Satu halaman keputusan.** Lampiran teknis boleh ada, tetapi halaman pertama harus berdiri sendiri.
- **Bahasa dampak, bukan bahasa model.** "Menahan 400 pelanggan" lebih berarti daripada "AUC 0,86". Tetap sediakan angka teknis, tetapi di bawah.
- **Visual sederhana**: satu pesan per grafik, judul berupa kesimpulannya ("Pelanggan tanpa interaksi 30 hari churn tiga kali lebih sering"), bukan deskripsi ("Grafik churn per kelompok").
- **Tebak pertanyaannya.** Siapkan jawaban untuk "Berapa biayanya?", "Apa risikonya?", "Kenapa tidak cara yang lebih sederhana?", "Bagaimana kita tahu itu berhasil?".
- **Hindari jargon**, atau jelaskan dengan analogi. Jika harus memakai istilah teknis, definisikan dalam satu kalimat.

## 2. Mengelola ekspektasi dan ketidakpastian

Pekerjaan data science penuh ketidakpastian: apakah datanya cukup, apakah sinyalnya ada. Ekspektasi yang tidak dikelola menimbulkan kejutan, dan kejutan merusak kepercayaan lebih besar daripada kabar buruk yang disampaikan lebih awal.

**Estimasi dengan rentang, bukan angka tunggal.** Estimasi tiga titik (optimis, paling mungkin, pesimis) memaksa berpikir tentang risiko:

```python
import numpy as np

def estimasi_pert(optimis, mungkin, pesimis):
    """Estimasi tiga titik (PERT): rata-rata berbobot dan simpangan baku kasarnya."""
    rata = (optimis + 4 * mungkin + pesimis) / 6
    sd = (pesimis - optimis) / 6
    return rata, sd

# Tugas dalam minggu-orang: (optimis, mungkin, pesimis)
tugas = {"pembersihan data": (1, 2, 5), "model dasar": (1, 2, 3), "integrasi API": (2, 3, 8)}
total_rata = sum(estimasi_pert(*t)[0] for t in tugas.values())
total_sd = np.sqrt(sum(estimasi_pert(*t)[1] ** 2 for t in tugas.values()))

print(f"Perkiraan   : {total_rata:.1f} minggu")
print(f"Rentang ~90%: {total_rata - 1.645 * total_sd:.1f} sampai {total_rata + 1.645 * total_sd:.1f} minggu")
```

Sampaikan sebagai "kemungkinan besar 6 sampai 9 minggu, tergantung kualitas data", bukan "7 minggu". Dan sebutkan **hal yang akan mempersempit rentang**: "setelah audit data minggu pertama, saya bisa memberi angka yang lebih pasti."

**Menyampaikan hasil negatif.** "Datanya tidak cukup untuk memprediksi hal ini" adalah temuan berharga, karena menyelamatkan perusahaan dari investasi sia-sia. Kerangka yang menolong:

> Kami menguji apakah **[pertanyaan]**. Hasilnya **[temuan tegas]**: **[bukti singkat]**. Artinya **[implikasi bagi keputusan]**. Pilihan ke depan: **[A]**, **[B]**, atau berhenti di sini dan memindahkan tim ke **[C]**.

Kebiasaan yang menjaga kepercayaan:

- **Kabari lebih awal** ketika risiko muncul, dengan opsi tindakan, bukan hanya masalah.
- **Pisahkan fakta, interpretasi, dan opini** ("datanya menunjukkan X"; "saya menduga Y"; "saya merekomendasikan Z").
- **Janji kecil yang ditepati** lebih berharga daripada janji besar yang melenceng.
- Katakan **"saya tidak tahu, tapi inilah cara saya mencari tahu"**, tidak menebak untuk terdengar yakin.

## 3. Pemetaan stakeholder dan kolaborasi lintas fungsi

Hampir tidak ada proyek data science yang hanya melibatkan data scientist. Petakan siapa yang berkepentingan:

| Peran | Yang mereka pedulikan | Cara bekerja sama |
|---|---|---|
| **Sponsor bisnis** | Hasil dan anggaran | Pembaruan singkat berkala; keputusan di titik tonggak |
| **Produk** | Pengalaman pengguna, prioritas, jadwal | Tentukan masalah dan metrik bersama sejak awal |
| **Engineering** | Keandalan, integrasi, perawatan | Libatkan sebelum desain final; sepakati antarmuka dan SLA |
| **Data engineering** | Kualitas dan ketersediaan data | Data contract, jadwal perubahan skema |
| **Pengguna akhir** | Kemudahan dan kepercayaan | Uji coba dini, umpan balik, pelatihan |
| **Legal, privasi, keamanan** | Kepatuhan dan risiko | Tinjauan sejak desain, bukan menjelang rilis |

Pemetaan sederhana: untuk tiap orang, catat **pengaruh** (seberapa besar ia bisa menentukan nasib proyek) dan **minat** (seberapa peduli ia), lalu putuskan frekuensi komunikasinya. Yang berpengaruh dan peduli perlu dilibatkan aktif; yang berpengaruh tetapi kurang peduli perlu dijaga tetap terinformasi, karena mereka bisa menjadi penghambat di menit terakhir.

Praktik yang melancarkan kerja sama:

- **Tuliskan tujuan dan definisi sukses bersama** sebelum mulai, dan simpan di satu tempat yang dilihat semua orang.
- **Bicarakan hal tidak enak lebih awal** (ketergantungan, tenggat yang tidak realistis, data yang buruk).
- **Pahami bahasa dan tekanan mitra**: apa yang diukur terhadap tim produk, apa yang membuat tim engineering sibuk.
- Kalau ada konflik prioritas, **bawa ke sponsor bersama** dengan pilihan dan konsekuensinya, jangan menyelesaikannya lewat pesan berkepanjangan.

## 4. Perencanaan kerja tim

**Kapasitas.** Hitung kapasitas nyata, bukan jumlah orang × jam kerja. Kurangi cuti, rapat, review, dukungan produksi, dan waktu belajar. Banyak tim hanya memiliki 50 sampai 60% waktu untuk pengembangan baru.

**Cara kerja yang cocok untuk data science.** Pekerjaan eksploratif tidak muat dalam sprint dua minggu yang kaku. Pendekatan yang sering berhasil:

- **Kotak waktu untuk eksplorasi** (misalnya dua minggu untuk menjawab "apakah sinyal ini ada?") dengan keluaran yang jelas: ya, tidak, atau butuh data tambahan.
- **Pecah menjadi irisan tipis end-to-end**: baseline sederhana yang berjalan sampai ujung dulu, lalu diperbaiki bertahap, bukan menyempurnakan modelnya dulu baru memikirkan integrasi.
- **Pertemuan singkat rutin** untuk hambatan, dan **demo berkala** kepada stakeholder agar masukan datang lebih awal.

**Utang teknis.** Kode notebook yang tidak diuji, pipeline tanpa pemantauan, dan fitur yang tak terdokumentasi makin mahal seiring waktu. Jadikan terlihat: catat di daftar yang sama dengan pekerjaan fitur, dan alokasikan porsi tetap tiap siklus (misalnya 20%). Hubungkan dengan akibat bisnis ("model ini butuh dua hari untuk dilatih ulang karena tidak ada pipeline") agar mudah dipertahankan di depan prioritas lain.

**Prioritas dan fokus.** Batasi pekerjaan yang berjalan bersamaan. Tim yang mengerjakan lima hal sekaligus menyelesaikan nol. Saat ada permintaan mendadak, ajukan pertanyaan: "Apa yang kita tunda untuk ini?"

## 5. 1:1, umpan balik, delegasi, dan pengembangan karier

Catatan Prinsip Lead sudah membahas mentorship dan code review. Di sini fokusnya pada ritme dan percakapan manajerial.

**1:1 mingguan atau dua mingguan** adalah waktu milik anggota tim, bukan laporan status. Tanyakan:

- "Apa yang sedang menghambatmu?"
- "Apa yang membuatmu bersemangat, dan apa yang menguras tenaga?"
- "Umpan balik apa yang kamu punya untukku?"
- "Apa tujuan kariermu 12 bulan ke depan dan apa yang bisa saya bantu?"

Catat hasilnya dan tindak lanjuti. Janji di 1:1 yang tidak ditepati lebih merusak daripada tidak bertanya.

**Umpan balik yang bisa dipakai** memakai kerangka SBI (*Situation, Behavior, Impact*):

> Pada **presentasi ke tim produk kemarin** (situasi), kamu menunjukkan tiga grafik tanpa menyebut keputusan yang kita butuhkan (perilaku), sehingga rapat berakhir tanpa kesimpulan (dampak). Lain kali coba mulai dengan rekomendasinya.

Sampaikan **sedini dan sesering mungkin, dan secara pribadi** untuk kritik, secara terbuka untuk pujian yang spesifik. Fokus pada perilaku yang bisa diubah, bukan kepribadian. Kejujuran yang disertai kepedulian nyata ("saya menyampaikan ini karena saya ingin kamu berhasil") membuat umpan balik keras sekalipun bisa diterima, seperti ide *Radical Candor*.

**Delegasi** menyesuaikan dengan kesiapan orangnya:

| Kesiapan | Cara mendelegasikan |
|---|---|
| Baru, belum terbiasa | Jelaskan langkah dan contoh, cek sering |
| Berkembang | Jelaskan tujuan dan batasan, beri ruang memilih cara, cek di titik tonggak |
| Mandiri | Serahkan hasil dan konteks, cukup tanya "butuh apa dariku?" |

Kesalahan umum Lead baru adalah **menarik kembali pekerjaan** karena "lebih cepat kalau saya yang mengerjakan". Memang lebih cepat hari ini, tetapi tim tidak pernah tumbuh dan kamu menjadi hambatan.

**Pengembangan karier:** bantu setiap orang menulis rencana sederhana: keterampilan yang ingin dikembangkan, proyek yang menantang, dan siapa yang bisa menjadi mentor. Beri mereka **proyek yang sedikit di atas kemampuan sekarang** dengan jaring pengaman.

## 6. Hiring dan struktur tim

**Peran yang sering muncul di tim data**

| Peran | Fokus utama |
|---|---|
| Analis data | Pertanyaan bisnis, dashboard, analisis ad hoc |
| Data scientist | Pemodelan, eksperimen, inferensi |
| ML engineer | Membawa model ke produksi, pipeline, serving |
| Data engineer | Pipeline, warehouse, kualitas data |
| Lead / manajer | Prioritas, tim, hubungan dengan bisnis, standar kualitas |

Komposisi bergantung pada tahap: tim kecil memerlukan banyak orang berkemampuan lintas peran; skala besar mendorong spesialisasi. Hindari tim data science yang tidak punya dukungan data engineering, karena mereka akan menghabiskan sebagian besar waktu pada pipeline.

**Proses rekrutmen yang adil dan prediktif**

1. **Definisikan kebutuhan** terlebih dahulu: tiga atau empat kemampuan yang benar-benar dipakai di pekerjaan ini, dengan tingkat yang diharapkan.
2. **Buat kriteria penilaian sebelum wawancara** dan pakai rubrik yang sama untuk semua kandidat.
3. **Uji pekerjaan yang mirip aslinya**: diskusi studi kasus, telaah kode (*code review*), atau tugas rumah yang singkat dan dibatasi waktunya. Hindari teka-teki yang tidak mirip pekerjaan.
4. **Nilai cara berpikir**: bagaimana ia mendefinisikan masalah, menyadari batas data, dan berkomunikasi dengan non teknis.
5. **Beri keputusan dan umpan balik dengan cepat** dan hormat.
6. **Wawancara oleh beberapa orang** dengan fokus berbeda, dan setiap penilai menulis penilaiannya **sebelum** berdiskusi supaya tidak saling memengaruhi.

Pertanyaan wawancara yang berguna: "Ceritakan proyek di mana hasilnya tidak seperti yang kamu harapkan. Apa yang kamu lakukan?", "Bagaimana kamu menjelaskan model ini ke seorang manajer non teknis?", dan "Kapan kamu memutuskan tidak membangun model?"

## Latihan

1. Ambil satu hasil analisis atau proyek lamamu dan tulis ulang sebagai satu halaman keputusan dengan lima bagian di tabel bagian 1. Minta satu orang non teknis membacanya dan tanyakan apa yang masih tidak jelas.
2. Berikan estimasi tiga titik untuk proyek yang sedang atau akan kamu kerjakan, dan tulis "hal yang akan mempersempit rentang".
3. Petakan stakeholder satu proyek dengan pengaruh dan minatnya, lalu putuskan frekuensi dan bentuk komunikasi untuk masing-masing.
4. Tulis tiga umpan balik SBI: dua untuk perilaku positif dan satu untuk hal yang perlu diperbaiki. Latih mengucapkannya dengan keras.
5. Susun rubrik wawancara untuk satu posisi (misalnya data scientist junior) dengan empat kriteria dan deskripsi tiap tingkat penilaian.

Rujukan: *Storytelling with Data*, *Radical Candor*, dan *The Manager's Path* di bagian sumber belajar.
