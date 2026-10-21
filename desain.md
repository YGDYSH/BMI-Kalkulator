# desain.md — Rencana Pengembangan NutriKala

> Dokumen ini dibaca oleh agen coding (opencode). Kerjakan **per fase, berurutan**. Jangan lompat fase. Setelah tiap fase selesai, jalankan checklist verifikasi di akhir fase tersebut.

---

## 0. Konteks Proyek

**NutriKala** adalah PWA (Progressive Web App) kesehatan berbahasa Indonesia dengan tagline "Pola Hidup Sehat Hari Ini". Tanpa backend; semua data disimpan lokal di perangkat.

**Stack:** HTML + CSS + JavaScript vanilla (tanpa framework, tanpa bundler).

**Struktur file saat ini:**

```
/
├── index.html
├── manifest.json
├── sw.js
└── assets/
    ├── css/style.css
    ├── icons/
    └── js/
        ├── app.js         (inisialisasi & navigasi tab)
        ├── bmi.js         (kalkulator BMI)
        ├── data.js        (data statis)
        ├── hydration.js   (pelacak air minum)
        ├── storage.js     (wrapper penyimpanan lokal)
        └── ui.js          (helper UI, termasuk toast)
```

**Navigasi bawah (4 tab):** Kalkulator · Pola Makan · Olahraga · Akun.

**Status saat ini:**
- Tab **Kalkulator**: sudah berfungsi.
- Tab **Pola Makan**, **Olahraga**, **Akun**: masih placeholder ("Segera hadir" + toast "Fitur ini sedang disiapkan. Segera hadir!").

**Tujuan dokumen ini:** mengganti tiga placeholder dengan fitur nyata yang saling terhubung lewat satu profil pengguna.

---

## 1. Aturan Wajib (Ground Rules)

1. **Baca dulu sebelum menulis.** Buka `app.js`, `ui.js`, `storage.js`, `data.js`, `bmi.js`, `hydration.js`, `index.html`, dan `style.css`. Ikuti pola, gaya penamaan, dan cara render yang sudah ada. Jangan memperkenalkan pola baru jika sudah ada padanannya.
2. **Tanpa dependensi baru.** Tidak ada npm, framework, atau CDN. Vanilla JS saja. Grafik dibuat dengan SVG/Canvas manual.
3. **Semua teks UI berbahasa Indonesia**, nada ramah dan singkat.
4. **Semua akses penyimpanan lewat `storage.js`.** Jangan memanggil `localStorage` langsung dari modul lain. Jika wrapper belum punya fungsi yang dibutuhkan, tambahkan di `storage.js`.
5. **Pakai ulang gaya yang ada.** Gunakan warna, radius, font, dan komponen dari `style.css` (oranye hangat, sudut membulat, latar krem). Tambah class baru hanya jika perlu, dan beri prefiks sesuai halaman (`.meal-`, `.workout-`, `.profile-`).
6. **Mobile-first.** Lebar target 360–430px. Area sentuh minimal 44×44px.
7. **Aksesibilitas.** Kontras teks minimal WCAG AA, `aria-label` pada tombol ikon, ukuran font label minimal 12px, dan fokus yang terlihat.
8. **Offline-first.** Setiap file JS/CSS baru wajib ditambahkan ke daftar cache di `sw.js`, dan **naikkan versi cache** agar pembaruan sampai ke pengguna.
9. **Keamanan data.** Jangan gunakan `innerHTML` dengan input pengguna mentah. Gunakan `textContent` atau escape terlebih dahulu.
10. **Jangan merusak fitur yang sudah jalan** (BMI, hidrasi). Lakukan pengecekan manual setelah tiap fase.
11. **Commit kecil dan sering**, satu commit per tugas, dengan pesan jelas (contoh: `feat(profile): tambah form profil`).

---

## 2. Arsitektur Target

### 2.1 File baru

```
assets/js/
├── nutrition.js   (BARU: rumus BMR, TDEE, target kalori & makro; fungsi murni)
├── profile.js     (BARU: halaman Akun)
├── meals.js       (BARU: halaman Pola Makan)
├── workout.js     (BARU: halaman Olahraga)
└── charts.js      (BARU: grafik SVG sederhana, dipakai Akun & halaman lain)
```

`data.js` diperluas dengan `FOODS` dan `EXERCISES` (lihat bagian 4).

### 2.2 Pola modul

Setiap halaman diekspos sebagai modul dengan antarmuka seragam. Sesuaikan dengan cara `app.js` memuat modul yang sudah ada (ES module atau global namespace; **ikuti yang dipakai sekarang**).

```js
// contoh antarmuka yang diharapkan
export function renderMealsPage(container) { /* render + pasang event */ }
```

`app.js` memanggil fungsi render sesuai tab aktif, menggantikan placeholder "Segera hadir".

### 2.3 Kunci penyimpanan (via `storage.js`)

Gunakan prefiks `nutrikala:`. Cek kunci yang sudah dipakai `bmi.js` dan `hydration.js`, jangan bentrok.

| Kunci | Isi |
|---|---|
| `nutrikala:profile` | Objek profil pengguna |
| `nutrikala:weightLog` | Array `{date, weightKg}` |
| `nutrikala:mealLog` | Objek `{ "YYYY-MM-DD": [entry, ...] }` |
| `nutrikala:favFoods` | Array id makanan |
| `nutrikala:recentFoods` | Array id makanan (maks 10) |
| `nutrikala:workoutLog` | Objek `{ "YYYY-MM-DD": [entry, ...] }` |
| `nutrikala:settings` | Tema, satuan, pengingat |
| `nutrikala:schemaVersion` | Angka versi skema untuk migrasi |

### 2.4 Skema data

```js
// profile
{
  name: "string",
  birthYear: 1995,          // atau age: number
  sex: "male" | "female",
  heightCm: 165,
  weightKg: 60,
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active",
  goal: "lose" | "maintain" | "gain",
  targetWeightKg: 55,
  dailyWaterMl: 2000,
  updatedAt: "ISO date"
}

// meal entry
{ id: "uuid", foodId: "nasi-putih", slot: "breakfast"|"lunch"|"dinner"|"snack",
  servings: 1.5, addedAt: "ISO date" }

// workout entry
{ id: "uuid", exerciseId: "jalan-santai", minutes: 30,
  kcal: 120, addedAt: "ISO date" }

// food (di data.js)
{ id: "nasi-putih", name: "Nasi putih", portion: "1 piring (150 g)",
  kcal: 195, protein: 3.6, carbs: 42, fat: 0.3, tags: ["pokok"] }

// exercise (di data.js)
{ id: "jalan-santai", name: "Jalan santai", met: 3.5,
  category: "kardio"|"kekuatan"|"peregangan",
  place: "rumah"|"luar"|"gym", level: "pemula"|"menengah"|"lanjut",
  steps: ["...", "..."] }
```

### 2.5 Rumus (di `nutrition.js`, fungsi murni dan mudah diuji)

- **BMR (Mifflin-St Jeor):**
  - Pria: `10*berat + 6.25*tinggi - 5*usia + 5`
  - Wanita: `10*berat + 6.25*tinggi - 5*usia - 161`
- **TDEE** = BMR × faktor aktivitas: sedentary 1.2 · light 1.375 · moderate 1.55 · active 1.725 · very_active 1.9
- **Target kalori:** lose = TDEE − 500 · maintain = TDEE · gain = TDEE + 300
  - **Batas aman:** jangan pernah menyarankan di bawah 1200 kkal (wanita) atau 1500 kkal (pria).
- **Makro default:** protein 20%, lemak 25%, karbohidrat 55% dari kalori. Konversi: protein 4, karbo 4, lemak 9 kkal/gram.
- **Kalori olahraga:** `MET × beratKg × (menit / 60)`
- **Target olahraga mingguan:** 150 menit aktivitas sedang (acuan WHO).

---

## 3. Urutan Pengerjaan

### FASE 0 — Persiapan dan Pembersihan

Tujuan: fondasi rapi sebelum fitur baru.

- [x] **0.1** Baca semua file yang ada dan catat pola di komentar singkat di PR/commit.
- [x] **0.2** Hapus **placeholder ganda**: pilih satu saja (halaman "Segera hadir" **atau** toast). Selama fase berjalan, tab yang belum selesai cukup memakai satu pesan.
- [x] **0.3** Tambahkan `nutrition.js` berisi rumus pada bagian 2.5. Semua fungsi murni, tanpa akses DOM.
- [x] **0.4** Tambahkan `nutrikala:schemaVersion` di `storage.js` beserta fungsi `migrate()` kosong sebagai persiapan.
- [x] **0.5** Perbaiki kontras teks abu-abu pada latar krem dan ukuran label navigasi (lihat aturan 7).
- [x] **0.6** Ikon lonceng notifikasi: sembunyikan titik oranye sampai fitur pengingat ada (Fase 4), **atau** hubungkan ke panel sederhana. Jangan biarkan elemen yang tampak aktif tapi tidak berfungsi.

**Verifikasi:** kalkulator BMI dan hidrasi tetap jalan; aplikasi tetap bisa dibuka offline.

---

### FASE 1 — Halaman Akun (Profil) · PRIORITAS 1

Alasan: data profil dipakai semua fitur lain.

**Tugas:**
- [ ] **1.1** Buat `profile.js` dan render di tab Akun.
- [ ] **1.2** **Form profil:** nama, tahun lahir/usia, jenis kelamin, tinggi, berat, tingkat aktivitas, tujuan, berat target. Validasi rentang masuk akal (tinggi 100–250 cm, berat 20–300 kg, usia 10–100).
- [ ] **1.3** **Kartu ringkasan** di atas halaman: BMI, kategori, BMR, TDEE, dan target kalori harian (hitung via `nutrition.js`).
- [ ] **1.4** **Pra-isi kalkulator BMI** dari profil agar pengguna tidak mengisi ulang. Pertahankan kalkulator tetap bisa dipakai tanpa profil.
- [ ] **1.5** **Riwayat berat badan:** tombol "Catat berat hari ini" menyimpan ke `weightLog` (satu entri per hari, timpa jika sama).
- [ ] **1.6** Buat `charts.js` dengan `renderLineChart(container, points, options)` berbasis SVG. Tampilkan grafik berat 30/90 hari dengan garis target.
- [ ] **1.7** **Pengaturan:** tema terang/gelap (gunakan CSS variables), satuan kg/lb (konversi hanya di tampilan, simpan selalu dalam kg/cm).
- [ ] **1.8** **Data & privasi:** tombol ekspor data (unduh JSON), impor data, dan hapus semua data (dengan dialog konfirmasi). Tampilkan pernyataan: "Data tersimpan di perangkatmu dan tidak dikirim ke server."
- [ ] **1.9** **Tentang & disclaimer:** versi aplikasi dan teks "NutriKala memberi informasi umum, bukan pengganti saran dokter atau ahli gizi."
- [ ] **1.10** State kosong: jika profil belum diisi, tampilkan ajakan ramah untuk melengkapinya.

**Kriteria selesai:**
- Profil tersimpan dan tetap ada setelah reload/offline.
- Mengubah profil memperbarui target kalori secara langsung.
- Ekspor menghasilkan file JSON yang bisa diimpor kembali tanpa kehilangan data.

---

### FASE 2 — Halaman Pola Makan · PRIORITAS 2

Fokus: **pencatat asupan harian** terhadap target kalori, bukan sekadar jadwal.

**Tugas:**
- [ ] **2.1** Isi `FOODS` di `data.js`: **minimal 60 makanan Indonesia** umum dengan kalori dan makro per porsi. Contoh: nasi putih, nasi merah, lontong, bubur ayam, tempe goreng, tahu goreng, ayam goreng, ayam bakar, ikan bakar, telur dadar, telur rebus, soto ayam, gado-gado, pecel, sayur asem, sayur bayam, capcay, rendang, nasi goreng, mie goreng, bakso, pisang, pepaya, jeruk, semangka, teh manis, kopi susu, susu, dan sejenisnya. Gunakan nilai yang masuk akal dan tandai sebagai **perkiraan** di UI.
- [ ] **2.2** Buat `meals.js` dan render di tab Pola Makan.
- [ ] **2.3** **Ringkasan harian** di atas: progress ring kalori (terkonsumsi vs target dari profil), plus tiga bar makro (protein, karbo, lemak).
- [ ] **2.4** **Navigasi tanggal:** tombol hari sebelumnya/berikutnya dan "Hari ini".
- [ ] **2.5** **Empat slot makan** (Sarapan, Makan siang, Makan malam, Camilan), masing-masing menampilkan daftar entri, subtotal kkal, dan tombol "+ Tambah".
- [ ] **2.6** **Dialog tambah makanan:** kolom pencarian (tanpa peduli huruf besar/kecil), daftar hasil, pilih jumlah porsi (kelipatan 0.5), lalu simpan. Tampilkan "Terakhir dipakai" dan "Favorit" di bagian atas dialog.
- [ ] **2.7** **Edit dan hapus entri** (geser atau tombol), dengan opsi urungkan lewat toast.
- [ ] **2.8** **Favorit:** tombol bintang pada makanan, tersimpan di `favFoods`.
- [ ] **2.9** **Makanan kustom:** pengguna dapat menambah makanan sendiri (nama, kkal, makro opsional) dan disimpan terpisah.
- [ ] **2.10** Tanpa profil: tampilkan ajakan "Lengkapi profil untuk melihat targetmu" dengan tautan ke tab Akun, tetapi pencatatan tetap bisa dipakai dengan target bawaan 2000 kkal.
- [ ] **2.11** *(Lanjutan)* **Jadwal mingguan:** saran menu 7 hari berdasarkan target kalori, dibuat dari `FOODS`.
- [ ] **2.12** *(Lanjutan)* **Daftar belanja** otomatis dari jadwal mingguan, dengan checklist yang tersimpan.
- [ ] **2.13** *(Lanjutan)* **Resep sederhana:** bahan terjangkau, langkah, kalori per porsi.

Tugas 2.1–2.10 adalah inti. Tugas 2.11–2.13 hanya dikerjakan setelah inti stabil.

**Kriteria selesai:**
- Menambah/mengubah/menghapus makanan memperbarui total kalori dan makro seketika.
- Data per tanggal terpisah dengan benar dan bertahan setelah reload.
- Pencarian responsif untuk 60+ item tanpa jeda terasa.

---

### FASE 3 — Halaman Olahraga · PRIORITAS 3

**Tugas:**
- [ ] **3.1** Isi `EXERCISES` di `data.js`: **minimal 25 latihan**, dengan nilai MET yang wajar. Campuran kardio (jalan, jogging, bersepeda, lompat tali, senam), kekuatan (push-up, squat, plank, sit-up, lunges), dan peregangan/yoga. Sertakan langkah singkat 3–5 poin per latihan.
- [ ] **3.2** Buat `workout.js` dan render di tab Olahraga.
- [ ] **3.3** **Ringkasan mingguan:** progress bar menit aktif minggu ini terhadap target 150 menit, total kalori terbakar, dan **streak** hari aktif beruntun.
- [ ] **3.4** **Pencatat aktivitas:** pilih latihan, isi durasi, kalori dihitung otomatis lewat rumus MET memakai berat dari profil (bawaan 60 kg jika belum ada profil). Pengguna boleh menimpa angka kalori.
- [ ] **3.5** **Katalog latihan** dengan filter: kategori, durasi (≤10, ≤20, ≤30 menit), lokasi (tanpa alat/rumah, luar, gym), tingkat.
- [ ] **3.6** **Detail latihan:** langkah gerakan, tips keselamatan, dan tombol "Catat" atau "Mulai".
- [ ] **3.7** **Rekomendasi sesuai tujuan** dari profil (menurunkan berat → kardio + kekuatan ringan; menaikkan → kekuatan; menjaga → campuran).
- [ ] **3.8** **Timer latihan:** interval kerja/istirahat yang dapat diatur, dengan getar (`navigator.vibrate`) dan/atau bunyi singkat pada pergantian. Timer harus tetap akurat meski layar mati sebentar (hitung dari timestamp, bukan dari hitungan `setInterval`).
- [ ] **3.9** **Riwayat:** daftar aktivitas per hari, dengan hapus entri.
- [ ] **3.10** Tambahkan peringatan kesehatan singkat: "Hentikan latihan jika terasa nyeri dada, pusing, atau sesak. Konsultasikan dengan dokter bila punya kondisi medis."
- [ ] **3.11** *(Lanjutan)* Hubungkan kalori olahraga ke halaman Pola Makan sebagai informasi "kalori terbakar hari ini" (tampilkan saja, **jangan** otomatis menambah jatah makan).

**Kriteria selesai:**
- Kalori terbakar sesuai rumus untuk beberapa kasus uji manual.
- Streak dan menit mingguan benar di batas pergantian hari dan minggu (minggu dimulai Senin).
- Timer berjalan benar saat tab dipindah lalu dikembalikan.

---

### FASE 4 — Keterlibatan Harian dan Penyempurnaan

- [ ] **4.1** **Pengingat** minum air dan makan lewat Notification API. Minta izin hanya setelah pengguna menyalakan pengingat, bukan saat aplikasi pertama dibuka. Tangani kasus izin ditolak dan browser tanpa dukungan. Setelah ini jadi, titik pada ikon lonceng boleh dihidupkan lagi (berdasarkan pengingat/pencapaian yang belum dibaca).
- [ ] **4.2** **Beranda yang terhubung:** ringkasan hari ini di tab Kalkulator atau kartu ringkas (kalori, air, menit olahraga).
- [ ] **4.3** **Pencapaian/badge** sederhana (contoh: 7 hari mencatat berturut-turut, target air tercapai 5 hari).
- [ ] **4.4** **Grafik mingguan** kalori masuk vs target, dan menit olahraga per hari (memakai `charts.js`).
- [ ] **4.5** **Onboarding singkat** 3 langkah untuk pengguna baru yang mengarah ke pengisian profil.
- [ ] **4.6** Audit akhir: Lighthouse (PWA, Performance, Accessibility ≥ 90), uji offline, uji layar kecil (320px), uji tema gelap.
- [ ] **4.7** Perbarui `manifest.json` (nama, deskripsi, ikon, `shortcuts` ke Pola Makan dan Olahraga) dan naikkan versi cache `sw.js`.

---

## 4. Panduan Konten Data

- Nilai gizi adalah **perkiraan**. Cantumkan catatan kecil di UI: "Nilai gizi bersifat perkiraan."
- Utamakan **makanan dan porsi yang lazim di Indonesia** (piring, potong, mangkuk, butir, gelas) dengan berat gram di dalam tanda kurung.
- Setiap `id` unik, huruf kecil, dipisah tanda hubung. Jangan pernah mengubah `id` yang sudah dipakai di data pengguna.
- Simpan `FOODS` dan `EXERCISES` terurut abjad.

---

## 5. Batasan dan Keselamatan

- Jangan memberi diagnosis atau klaim medis. Gunakan bahasa informatif.
- Hormati batas kalori minimum pada bagian 2.5. Jika hasil hitung di bawahnya, tampilkan batas minimum dan saran berkonsultasi dengan ahli gizi.
- Untuk pengguna di bawah 18 tahun atau kondisi khusus (hamil, menyusui, penyakit kronis), tampilkan peringatan bahwa rumus umum mungkin tidak cocok.
- Jangan mengirim data pengguna ke luar perangkat.

---

## 6. Checklist Verifikasi Tiap Fase

Sebelum menandai fase selesai:

1. Tidak ada error di konsol browser.
2. Aplikasi berjalan **offline** setelah muat pertama (cek di DevTools → Application → Service Workers).
3. Data bertahan setelah reload.
4. Tampilan baik di 360px dan 414px, tema terang dan gelap.
5. Fitur lama (BMI, hidrasi) tidak rusak.
6. File baru sudah masuk daftar cache `sw.js` dan versi cache sudah naik.
7. Semua teks UI berbahasa Indonesia dan bebas salah ketik.
8. Tidak ada `localStorage` langsung di luar `storage.js`.

---

## 7. Cara Memulai (untuk opencode)

1. Baca seluruh file pada bagian 0.
2. Mulai dari **Fase 0**, tugas 0.1.
3. Kerjakan tugas berurutan, centang `[x]` pada dokumen ini setelah selesai.
4. Bila ada konflik antara dokumen ini dan pola kode yang sudah ada, **ikuti pola kode yang ada**, lalu catat penyimpangannya di bagian "Catatan Keputusan" di bawah.
5. Bila ada hal yang ambigu, pilih opsi paling sederhana dan catat asumsinya.

---

## Catatan Keputusan

- **21 Okt 2026 — Fase 0.**
  - **0.2:** memilih menyimpan halaman placeholder ("Segera hadir") dan menghapus toast duplikat di `pindahTab()` (`app.js`). Placeholder dihapus bertahap saat tiap halaman nyata dibuat di Fase 1–3.
  - **0.3:** `nutrition.js` dibuat sebagai ES module murni (konstanta `FAKTOR_AKTIVITAS`, `BATAS_KALORI_MIN`, `RASIO_MAKRO_DEFAULT`, `TARGET_MENIT_MINGGUAN`; fungsi `hitungBMR`, `hitungTDEE`, `hitungTargetKalori`, `hitungGramMakro`, `ringkasanNutrisi`, `kaloriOlahraga`). Profil memakai kunci seks lokal `sex: "male"|"female"` sesuai skema 2.4 — berbeda dari `bmi.js` yang memakai `pria|wanita` untuk UI kalkulator; kedua modul tidak saling menimpa.
  - **0.4:** `VERSI_SKEMA = 1`, `migrate()` mengatur versi awal bila belum ada; migrasi nyata baru dibutuhkan bila skema berubah.
  - **0.5:** `--c-teks-mati` digelapkan `#a08e7c` → `#75614d` (kontras di krem ±3,1:1 → ±5,7:1, lolos AA). Label navigasi `.nav__item` dinaikkan `0.68rem` → `0.75rem` (12px).
  - **0.6:** titik lonceng diberi `hidden` + CSS `.header__titik[hidden]`; `aria-label` lonceng diperbaiki dari "Notifikasi, 2 pesan baru" (menyesatkan) menjadi "Notifikasi".
  - `sw.js`: `nutrition.js` masuk app shell, cache naik ke `nutrikala-shell-v2`.
  - Uji otomatis rumus lewat node lolos (BMR 1561,25; TDEE 1874; target lose 1374 → di-clamp ke 1500 + `dibatasi:true`; MET 3,5×60×30 mnt = 105 kkal). Verifikasi browser manual (offline, BMI/hidrasi tetap jalan) harus dicek di `http://localhost/Bmi-Calc/`.
  - Seluruh perubahan masih berupa teks Indonesia, tanpa `innerHTML`, tanpa `localStorage` langsung di luar `storage.js`.