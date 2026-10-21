/* ==========================================================================
   data.js — Kumpulan data statis: menu rumahan, aktivitas, kutipan.
   Semua pilihan disesuaikan kategori BMI.
   ========================================================================== */

/** Pembagian kalori per waktu makan (25% / 40% / 35%). */
export const PEMBAGIAN_KALORI = {
  sarapan: 0.25,
  siang: 0.4,
  malam: 0.35,
};

/** Daftar aktivitas fisik yang ditampilkan (durasi menyesuaikan kategori). */
export const AKTIVITAS = [
  { id: 'jalan', nama: 'Jalan Pagi & Udara Segar', ikon: '🚶' },
  { id: 'yoga', nama: 'Yoga & Peregangan Otot', ikon: '🧘' },
  { id: 'kekuatan', nama: 'Latihan Kekuatan Ringan', ikon: '🏋️' },
];

/**
 * Durasi (menit) tiap aktivitas per kategori BMI.
 * kunci objek: jalan, yoga, kekuatan.
 */
export const DURASI_AKTIVITAS = {
  kurang: { jalan: 20, yoga: 15, kekuatan: 15 },
  ideal: { jalan: 30, yoga: 20, kekuatan: 15 },
  lebih: { jalan: 40, yoga: 25, kekuatan: 20 },
};

/**
 * Inspirasi menu rumahan Indonesia per kategori & waktu makan.
 * Minimal 3 pilihan (disini 4) agar rotasi acak lebih variatif.
 */
export const MENU = {
  kurang: {
    sarapan: [
      { nama: 'Bubur Ayam Kuning Serundeng', tag: 'porsi ayam ekstra' },
      { nama: 'Nasi Uduk Telur Dadar', tag: 'gurih & hangat' },
      { nama: 'Lontong Sayur Kentang', tag: 'karbo hangat' },
      { nama: 'Bubur Kacang Hijau Telur', tag: 'manis bergizi' },
    ],
    siang: [
      { nama: 'Nasi Ayam Serundeng', tag: 'porsi nasi lengkap' },
      { nama: 'Nasi Tongkol Suwir Kemangi', tag: 'protein padat' },
      { nama: 'Mie Goreng Telur Ayam', tag: 'karbo + protein' },
      { nama: 'Nasi Rendang Sapi', tag: 'energi padat' },
    ],
    malam: [
      { nama: 'Sup Ayam Jagung Manis', tag: 'kuah hangat' },
      { nama: 'Nasi Tim Ayam Jamur', tag: 'mengenyangkan' },
      { nama: 'Soto Ayam Hangat', tag: 'kuah kuning' },
      { nama: 'Nasi Liwet Ayam', tag: 'makan malam penuh' },
    ],
  },
  ideal: {
    sarapan: [
      { nama: 'Bubur Ayam Hangat', tag: 'seimbang' },
      { nama: 'Nasi Pecel Lele', tag: 'segar & renyah' },
      { nama: 'Lontong Tahu Tek', tag: 'bumbu kacang' },
      { nama: 'Oat Pisang Madu', tag: 'ringan & fiber' },
    ],
    siang: [
      { nama: 'Nasi Ayam Bakar', tag: 'favorit rumahan' },
      { nama: 'Nasi Campur Rendang', tag: 'porsi seimbang' },
      { nama: 'Nasi Liwet Sunda', tag: 'aromatik' },
      { nama: 'Nasi Tongkol Balado', tag: 'pedas manis' },
    ],
    malam: [
      { nama: 'Sup Ikan Sayur Hangat', tag: 'ringan di perut' },
      { nama: 'Capcay Ayam Tahu', tag: 'sayur melimpah' },
      { nama: 'Nasi Tim Ayam Jamur', tag: 'menenangkan' },
      { nama: 'Sop Bening Bayam Wortel', tag: 'bening & segar' },
    ],
  },
  lebih: {
    sarapan: [
      { nama: 'Bubur Kacang Hijau', tag: 'rendah lemak' },
      { nama: 'Oat Pisang Madu', tag: 'tinggi serat' },
      { nama: 'Nasi Tim Sayur', tag: 'porsi ringan' },
      { nama: 'Bubur Merah Putih Tempe', tag: 'protein nabati' },
    ],
    siang: [
      { nama: 'Nasi Ayam Pepes', tag: 'tanpa minyak berlebih' },
      { nama: 'Nasi Tongkol Bumbu Kuning', tag: 'protein bersih' },
      { nama: 'Capcay Ayam Fillet', tag: 'sayur dominan' },
      { nama: 'Nasi Ayam Rebus Sambal Dabu', tag: 'segar & pedas' },
    ],
    malam: [
      { nama: 'Sup Ikan Fillet Sayur', tag: 'ringan & hangat' },
      { nama: 'Tahu Tempe Sayur Tumis', tag: 'nabati' },
      { nama: 'Sop Ayam Bening', tag: 'kuah jernih' },
      { nama: 'Pepes Tahu Sayur', tag: 'rendah kalori' },
    ],
  },
};

/** Kutipan penutup yang menemani pengguna. */
export const KUTIPAN = [
  'Kesehatan bukan soal sempurna, melainkan soal kebiasaan kecil yang kamu ulang setiap hari.',
  'Tubuhmu berbicara dengan pelan; belajarlah mendengarkannya setiap pagi.',
  'Makan yang hangat, bergerak yang ringan, tidur yang cukup — itu sudah cinta untuk diri sendiri.',
  'Perubahan besar selalu dimulai dari satu porsi sehat dan satu langkah kecil.',
  'Hari ini tidak perlu sempurna, cukup sedikit lebih baik dari kemarin.',
];

/**
 * Pilih menu acak per waktu makan untuk kategori tertentu.
 * `rotasi` berisi indeks terakhir tiap waktu agar tidak langsung berulang.
 */
export function acakMenu(kategoriKey, rotasi = {}) {
  const kunci = MENU[kategoriKey] ? kategoriKey : 'ideal';
  const hasil = {};

  for (const waktu of Object.keys(PEMBAGIAN_KALORI)) {
    const daftar = MENU[kunci][waktu];
    let indeks = Math.floor(Math.random() * daftar.length);

    // Hindari pilihan identik dengan sebelumnya bila daftar lebih dari satu.
    if (daftar.length > 1 && indeks === rotasi[waktu]) {
      indeks = (indeks + 1) % daftar.length;
    }
    hasil[waktu] = { ...daftar[indeks], indeks };
  }
  return hasil;
}

/** Ambil satu kutipan acak. */
export function pilihKutipan() {
  return KUTIPAN[Math.floor(Math.random() * KUTIPAN.length)];
}

/** Total durasi aktivitas (menit) dari objek durasi. */
export function totalDurasi(durasi) {
  return Object.values(durasi).reduce((jumlah, menit) => jumlah + menit, 0);
}

/**
 * Daftar makanan Indonesia (Fase 2). Nilai gizi PER PORSI dan bersifat
 * PERKIRAAN (catatan ditampilkan di UI). Terurut abjad; JANGAN mengubah id
 * yang sudah dipakai data pengguna.
 */
export const FOODS = [
  { id: 'apel', name: 'Apel', portion: '1 buah (120 g)', kcal: 62, protein: 0.4, carbs: 16, fat: 0.2, tags: ['buah'] },
  { id: 'ayam-bakar', name: 'Ayam bakar', portion: '1 potong (100 g)', kcal: 190, protein: 27, carbs: 4, fat: 7, tags: ['lauk'] },
  { id: 'ayam-goreng', name: 'Ayam goreng', portion: '1 potong (100 g)', kcal: 295, protein: 26, carbs: 8, fat: 18, tags: ['lauk'] },
  { id: 'bakso-sapi', name: 'Bakso sapi', portion: '5 buah (150 g)', kcal: 260, protein: 16, carbs: 20, fat: 13, tags: ['lauk'] },
  { id: 'bakwan-jagung', name: 'Bakwan jagung', portion: '1 buah (50 g)', kcal: 85, protein: 2, carbs: 11, fat: 4, tags: ['camilan'] },
  { id: 'brokoli-kukus', name: 'Brokoli kukus', portion: '1 mangkuk (150 g)', kcal: 50, protein: 4, carbs: 9, fat: 0.5, tags: ['sayur'] },
  { id: 'bubur-ayam', name: 'Bubur ayam', portion: '1 mangkuk (250 g)', kcal: 265, protein: 12, carbs: 37, fat: 7, tags: ['pokok'] },
  { id: 'bubur-kacang-hijau', name: 'Bubur kacang hijau', portion: '1 mangkuk (200 g)', kcal: 230, protein: 8, carbs: 36, fat: 6, tags: ['camilan'] },
  { id: 'bubur-oat-susu', name: 'Bubur oat susu', portion: '1 mangkuk (250 g)', kcal: 220, protein: 9, carbs: 31, fat: 6, tags: ['pokok'] },
  { id: 'bubur-sumsum', name: 'Bubur sumsum', portion: '1 mangkuk (200 g)', kcal: 150, protein: 3, carbs: 32, fat: 1, tags: ['camilan'] },
  { id: 'capcay', name: 'Capcay', portion: '1 piring (200 g)', kcal: 130, protein: 8, carbs: 10, fat: 6, tags: ['sayur'] },
  { id: 'donat-kentang', name: 'Donat kentang', portion: '1 buah (60 g)', kcal: 190, protein: 3, carbs: 22, fat: 9, tags: ['camilan'] },
  { id: 'gado-gado', name: 'Gado-gado', portion: '1 piring (250 g)', kcal: 260, protein: 11, carbs: 21, fat: 15, tags: ['sayur'] },
  { id: 'gudeg-jogja', name: 'Gudeg Jogja', portion: '1 porsi (150 g)', kcal: 180, protein: 7, carbs: 28, fat: 4, tags: ['lauk'] },
  { id: 'ikan-bakar', name: 'Ikan bakar', portion: '1 potong (100 g)', kcal: 180, protein: 26, carbs: 2, fat: 7, tags: ['lauk'] },
  { id: 'ikan-kembung-goreng', name: 'Ikan kembung goreng', portion: '1 ekor (100 g)', kcal: 235, protein: 24, carbs: 3, fat: 14, tags: ['lauk'] },
  { id: 'jeruk', name: 'Jeruk', portion: '1 buah (130 g)', kcal: 62, protein: 1, carbs: 16, fat: 0.2, tags: ['buah'] },
  { id: 'jus-jeruk', name: 'Jus jeruk', portion: '1 gelas (200 ml)', kcal: 110, protein: 1.5, carbs: 25, fat: 0.4, tags: ['minuman'] },
  { id: 'kacang-tanah-goreng', name: 'Kacang tanah goreng', portion: '1 mangkuk (50 g)', kcal: 285, protein: 12, carbs: 9, fat: 23, tags: ['camilan'] },
  { id: 'kentang-goreng', name: 'Kentang goreng', portion: '8 potong (100 g)', kcal: 250, protein: 3.5, carbs: 30, fat: 13, tags: ['camilan'] },
  { id: 'kentang-rebus', name: 'Kentang rebus', portion: '1 buah (150 g)', kcal: 130, protein: 3, carbs: 29, fat: 0.2, tags: ['pokok'] },
  { id: 'kering-tempe', name: 'Kering tempe', portion: '2 sdm (30 g)', kcal: 115, protein: 6, carbs: 9, fat: 6, tags: ['lauk'] },
  { id: 'ketoprak', name: 'Ketoprak', portion: '1 piring (250 g)', kcal: 380, protein: 13, carbs: 39, fat: 20, tags: ['pokok'] },
  { id: 'ketupat', name: 'Ketupat', portion: '1 potong (100 g)', kcal: 130, protein: 2.5, carbs: 28, fat: 0.5, tags: ['pokok'] },
  { id: 'klepon', name: 'Klepon', portion: '2 buah (140 g)', kcal: 240, protein: 2, carbs: 42, fat: 6, tags: ['camilan'] },
  { id: 'kopi-hitam', name: 'Kopi hitam', portion: '1 gelas (200 ml)', kcal: 5, protein: 0, carbs: 1, fat: 0, tags: ['minuman'] },
  { id: 'kopi-susu', name: 'Kopi susu', portion: '1 gelas (200 ml)', kcal: 130, protein: 3, carbs: 17, fat: 5, tags: ['minuman'] },
  { id: 'lontong', name: 'Lontong', portion: '1 potong (100 g)', kcal: 135, protein: 2, carbs: 30, fat: 0.5, tags: ['pokok'] },
  { id: 'lontong-sayur', name: 'Lontong sayur', portion: '1 mangkuk (300 g)', kcal: 275, protein: 7, carbs: 38, fat: 10, tags: ['pokok'] },
  { id: 'mie-ayam', name: 'Mie ayam', portion: '1 mangkuk (350 g)', kcal: 405, protein: 18, carbs: 52, fat: 13, tags: ['pokok'] },
  { id: 'mie-goreng', name: 'Mie goreng', portion: '1 porsi (200 g)', kcal: 355, protein: 10, carbs: 41, fat: 16, tags: ['pokok'] },
  { id: 'nasi-goreng', name: 'Nasi goreng', portion: '1 piring (200 g)', kcal: 350, protein: 10, carbs: 44, fat: 13, tags: ['pokok'] },
  { id: 'nasi-kuning', name: 'Nasi kuning', portion: '1 piring (200 g)', kcal: 240, protein: 5, carbs: 44, fat: 5, tags: ['pokok'] },
  { id: 'nasi-merah', name: 'Nasi merah', portion: '1 piring (150 g)', kcal: 160, protein: 3.5, carbs: 34, fat: 1, tags: ['pokok'] },
  { id: 'nasi-putih', name: 'Nasi putih', portion: '1 piring (150 g)', kcal: 195, protein: 3.6, carbs: 42, fat: 0.3, tags: ['pokok'] },
  { id: 'nasi-uduk', name: 'Nasi uduk', portion: '1 piring (200 g)', kcal: 265, protein: 5.5, carbs: 41, fat: 8, tags: ['pokok'] },
  { id: 'pempek', name: 'Pempek', portion: '2 buah (120 g)', kcal: 330, protein: 8, carbs: 38, fat: 15, tags: ['camilan'] },
  { id: 'pepaya', name: 'Pepaya', portion: '1 potong (150 g)', kcal: 68, protein: 1, carbs: 17, fat: 0.3, tags: ['buah'] },
  { id: 'perkedel-kentang', name: 'Perkedel kentang', portion: '1 buah (50 g)', kcal: 120, protein: 2, carbs: 13, fat: 6.5, tags: ['lauk'] },
  { id: 'pisang', name: 'Pisang', portion: '1 buah (100 g)', kcal: 95, protein: 1, carbs: 24, fat: 0.3, tags: ['buah'] },
  { id: 'pisang-goreng', name: 'Pisang goreng', portion: '4 potong (100 g)', kcal: 235, protein: 2, carbs: 34, fat: 10, tags: ['camilan'] },
  { id: 'rendang-sapi', name: 'Rendang sapi', portion: '1 porsi (100 g)', kcal: 350, protein: 22, carbs: 8, fat: 26, tags: ['lauk'] },
  { id: 'roti-bakar-mentega', name: 'Roti bakar mentega', portion: '2 keping (60 g)', kcal: 195, protein: 6, carbs: 30, fat: 5.5, tags: ['pokok'] },
  { id: 'roti-tawar-gandum', name: 'Roti tawar gandum', portion: '1 lembar (25 g)', kcal: 70, protein: 2.5, carbs: 12, fat: 1, tags: ['pokok'] },
  { id: 'sayur-asem', name: 'Sayur asem', portion: '1 mangkuk (200 g)', kcal: 90, protein: 3, carbs: 13, fat: 2.5, tags: ['sayur'] },
  { id: 'sayur-bayam', name: 'Sayur bayam', portion: '1 mangkuk (200 g)', kcal: 60, protein: 3, carbs: 7, fat: 2, tags: ['sayur'] },
  { id: 'semangka', name: 'Semangka', portion: '1 potong (200 g)', kcal: 64, protein: 1, carbs: 15, fat: 0.2, tags: ['buah'] },
  { id: 'singkong-rebus', name: 'Singkong rebus', portion: '1 batang (150 g)', kcal: 190, protein: 2, carbs: 44, fat: 0.5, tags: ['pokok'] },
  { id: 'siomay-bandung', name: 'Siomay Bandung', portion: '1 porsi (200 g)', kcal: 320, protein: 13, carbs: 32, fat: 15, tags: ['camilan'] },
  { id: 'sop-buntut', name: 'Sop buntut', portion: '1 mangkuk (400 g)', kcal: 500, protein: 30, carbs: 26, fat: 29, tags: ['pokok'] },
  { id: 'soto-ayam', name: 'Soto ayam', portion: '1 mangkuk (300 g)', kcal: 285, protein: 18, carbs: 22, fat: 13, tags: ['pokok'] },
  { id: 'spageti-bolognaise', name: 'Spageti bolognese', portion: '1 piring (250 g)', kcal: 420, protein: 17, carbs: 55, fat: 12, tags: ['pokok'] },
  { id: 'susu-uht', name: 'Susu UHT', portion: '1 gelas (200 ml)', kcal: 125, protein: 6.5, carbs: 9.5, fat: 6, tags: ['minuman'] },
  { id: 'tahu-bacem', name: 'Tahu bacem', portion: '2 potong (80 g)', kcal: 150, protein: 10, carbs: 9, fat: 8, tags: ['lauk'] },
  { id: 'tahu-goreng', name: 'Tahu goreng', portion: '2 potong (80 g)', kcal: 140, protein: 10, carbs: 3, fat: 10, tags: ['lauk'] },
  { id: 'teh-manis', name: 'Teh manis', portion: '1 gelas (250 ml)', kcal: 90, protein: 0, carbs: 22, fat: 0, tags: ['minuman'] },
  { id: 'telur-ceplok', name: 'Telur ceplok', portion: '1 butir (60 g)', kcal: 145, protein: 7, carbs: 4, fat: 12, tags: ['lauk'] },
  { id: 'telur-dadar', name: 'Telur dadar', portion: '1 buah (60 g)', kcal: 120, protein: 8, carbs: 2, fat: 9, tags: ['lauk'] },
  { id: 'telur-rebus', name: 'Telur rebus', portion: '1 butir (50 g)', kcal: 78, protein: 6, carbs: 0.5, fat: 5.5, tags: ['lauk'] },
  { id: 'tempe-goreng', name: 'Tempe goreng', portion: '2 potong (60 g)', kcal: 150, protein: 8, carbs: 7, fat: 9, tags: ['lauk'] },
  { id: 'tempe-mendoan', name: 'Tempe mendoan', portion: '2 potong (80 g)', kcal: 195, protein: 9, carbs: 14, fat: 11, tags: ['lauk'] },
  { id: 'udang-rebus', name: 'Udang rebus', portion: '5 ekor (100 g)', kcal: 90, protein: 20, carbs: 0.5, fat: 1, tags: ['lauk'] },
  { id: 'wortel-rebus', name: 'Wortel rebus', portion: '1 mangkuk (150 g)', kcal: 55, protein: 1.2, carbs: 11, fat: 0.3, tags: ['sayur'] },
  { id: 'yogurt-polos', name: 'Yogurt polos', portion: '1 cup (150 g)', kcal: 95, protein: 5, carbs: 11, fat: 3, tags: ['minuman'] },
];

/** Kategori slot makan (kunci sesuai skema data desain.md 2.4). */
export const SLOT_MAKAN = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Camilan',
};

/**
 * Katalog latihan (Fase 3): kardio, kekuatan, peregangan. `met` adalah nilai
 * rata-rata Compendium of Physical Activities untuk orang dewasa umum.
 * `steps` = langkah gerakan 3-5 poin; `tips` = catatan keselamatan.
 * `place`: tanpa-alat | luar | gym ; `level`: pemula | sedang | mahir.
 * Terurut abjad; JANGAN mengubah id yang sudah dipakai data pengguna.
 */
export const EXERCISES = [
  {
    "id": "aerobik-air",
    "name": "Aerobik air",
    "category": "kardio",
    "met": 4,
    "place": "gym",
    "level": "pemula",
    "minutes": 30,
    "icon": "💦",
    "steps": [
      "Berdiri di kolam dengan air sebatas pinggang/pinggul.",
      "Gerakkan selangkah langkah samping + ayunan tangan.",
      "Naikkan lutut bergantian dan tekan air dengan tangan.",
      "Terus bergerak 25-30 menit.",
      "Rehat di tepi bila perlu."
    ]
  },
  {
    "id": "aerobik-rumah",
    "name": "Aerobik di rumah",
    "category": "kardio",
    "met": 5,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 20,
    "icon": "💃",
    "steps": [
      "Pemanasan jalan di tempat 3 menit.",
      "Ikuti gerak dasar: langkah kaki + ayunan tangan, 8 hitungan tiap sisi.",
      "Naikkan lutut sedikit lebih tinggi tiap pergantian irama.",
      "Putar musik yang nyaman dan terus bergerak 15-20 menit.",
      "Akhiri dengan jalan santai + regang bahu 2 menit."
    ],
    "tips": "Pakai alas kaki empuk; jaga di area bebas barang bertajam."
  },
  {
    "id": "bersepeda-cepat",
    "name": "Bersepeda cepat",
    "category": "kardio",
    "met": 8,
    "place": "luar",
    "level": "sedang",
    "minutes": 30,
    "icon": "🚴",
    "steps": [
      "Cek rem dan tekanan ban sebelum berangkat.",
      "Pemanasan pedal ringan 5 menit.",
      "Naikkan kecepatan hingga napas lebih cepat namun masih bisa bicara, tahan 15 menit.",
      "Santai 3 menit, lalu tambah 1 putaran lebih ngebut bila kuat.",
      "Pendinginan pedal lambat 5 menit."
    ],
    "tips": "Pakai helm; pilih jalur yang tidak padat kendaraan."
  },
  {
    "id": "bersepeda-santai",
    "name": "Bersepeda santai",
    "category": "kardio",
    "met": 5.8,
    "place": "luar",
    "level": "pemula",
    "minutes": 30,
    "icon": "🚴‍♀️",
    "steps": [
      "Setel sadel agar kaki hampir lurus saat pedal di titik terbawah.",
      "Pedal dengan tempo ringan dan santai.",
      "Jaga ritme napas: kamu harus tetap bisa bernyanyi sambil mengayuh.",
      "Akhiri pelan dan regangkan tungkai setelah turun."
    ],
    "tips": "Perhatikan jalanan licin, terutama pagi berkabut."
  },
  {
    "id": "burpee",
    "name": "Burpee",
    "category": "kardio",
    "met": 8,
    "place": "tanpa-alat",
    "level": "mahir",
    "minutes": 10,
    "icon": "🔥",
    "steps": [
      "Mulai berdiri, lalu jongkok dengan telapak tangan menapak lantai.",
      "Lompat kaki ke belakang sampai posisi plank.",
      "Tawar 1 push-up (opsional saat masih belajar).",
      "Lompat kaki kembali ke posisi jongkok.",
      "Tegak sambil melompat kecil, lalu ulangi 8-12 kali."
    ],
    "tips": "Gerak intens: hentikan bila pusing atau sesak berlebihan."
  },
  {
    "id": "elliptical",
    "name": "Elliptical",
    "category": "kardio",
    "met": 5,
    "place": "gym",
    "level": "pemula",
    "minutes": 30,
    "icon": "🌀",
    "steps": [
      "Naik mesin dengan dua kaki aman di pedal.",
      "Tarik napas dan cairkan bahu; mulai gerak ringan 5 menit.",
      "Gerakkan lengan & kaki secara kooperatif.",
      "Gelombang 20 menit tempo sedang.",
      "Pendinginan 5 menit pelan."
    ]
  },
  {
    "id": "hiking-santai",
    "name": "Hiking jalur ringan",
    "category": "kardio",
    "met": 6,
    "place": "luar",
    "level": "sedang",
    "minutes": 60,
    "icon": "🥾",
    "steps": [
      "Gunakan sepatu yang melindungi pergelangan.",
      "Mulai dengan pace santai; jaga bicara masih memungkinkan.",
      "Minum sedikit tiap 20 menit.",
      "Turun dengan langkah pendek dan pelan agar lutut terlindungi.",
      "Regang tungkai setelah selesai jalur."
    ],
    "tips": "Berpergian dengan teman; bawa air dan bekal ringan."
  },
  {
    "id": "jalan-cepat",
    "name": "Jalan cepat",
    "category": "kardio",
    "met": 4.3,
    "place": "luar",
    "level": "pemula",
    "minutes": 30,
    "icon": "🚶",
    "steps": [
      "Berdiri tegak, pandangan ke arah depan.",
      "Langkah lebih cepat dan panjang dari jalan biasa.",
      "Ayun tangan menyertai langkah.",
      "Pertahankan 25-30 menit; bicara masih memungkinkan.",
      "Tutup dengan jalan santai 3 menit."
    ],
    "tips": "Gunakan sepatu dengan sol empuk agar lutut terlindungi."
  },
  {
    "id": "treadmill-incline",
    "name": "Jalan mendaki (treadmill)",
    "category": "kardio",
    "met": 6.3,
    "place": "gym",
    "level": "sedang",
    "minutes": 30,
    "icon": "⛰️",
    "steps": [
      "Setel incline 5-8% dan kecepatan santai.",
      "Jalan tanpa memegang pegangan bila stabil.",
      "Pertahankan 25-30 menit.",
      "Turunkan incline bertahap untuk pendinginan."
    ],
    "tips": "Awas keringat membuat pegangan licin; dasarkan ritme ke nyaman bicara."
  },
  {
    "id": "jalan-santai",
    "name": "Jalan santai",
    "category": "kardio",
    "met": 3,
    "place": "luar",
    "level": "pemula",
    "minutes": 20,
    "icon": "🚶‍♀️",
    "steps": [
      "Langkah ringan dan melepas lelah.",
      "Bahu dilonggarkan, tarik napas secara tertib.",
      "Nikmati pemandangan hijau di sekitarmu.",
      "Akhiri di tempat tenang sambil regang kaki sedikit."
    ]
  },
  {
    "id": "jogging-santai",
    "name": "Jogging santai",
    "category": "kardio",
    "met": 6,
    "place": "luar",
    "level": "pemula",
    "minutes": 30,
    "icon": "🏃",
    "steps": [
      "Mulai dari jalan 3 menit.",
      "Jog dengan irama santai 10 menit.",
      "Selang-seling jalan-jog bila perlu.",
      "Jaga postur tegak dan bahu longgar.",
      "Akhiri jalan santai dan regang tungkai."
    ],
    "tips": "Mendarat lembut di tengah kaki, bukan menghentak tumit."
  },
  {
    "id": "jogging-interval",
    "name": "Lari interval",
    "category": "kardio",
    "met": 8,
    "place": "luar",
    "level": "mahir",
    "minutes": 25,
    "icon": "🏃‍♂️",
    "steps": [
      "Pemanasan jogging ringan 5 menit.",
      "Fase sprint 1 menit dengan napas teratur.",
      "Recovery jog 90 detik.",
      "Ulangi siklus 5-6 kali.",
      "Pendinginan jalan + regang kaki 5 menit."
    ],
    "tips": "Sesuaikan dengan kondisi; batalkan bila lutut perih."
  },
  {
    "id": "mesin-angkat-kaki",
    "name": "Latihan kaki (mesin)",
    "category": "kekuatan",
    "met": 3.5,
    "place": "gym",
    "level": "pemula",
    "minutes": 30,
    "icon": "🦿",
    "steps": [
      "Atur sadel mesin sesuai tinggi kaki.",
      "Angkat beban dengan kontraksi otot tungkai.",
      "Turunkan dengan kontrol 3 detik.",
      "2-3 set @ 10-12 rep, rehat 60 detik."
    ],
    "tips": "Pilih beban ringan dulu; posisi badan jangan melengkung ke belakang."
  },
  {
    "id": "lompat-tali",
    "name": "Lompat tali",
    "category": "kardio",
    "met": 8.8,
    "place": "tanpa-alat",
    "level": "sedang",
    "minutes": 15,
    "icon": "🪢",
    "steps": [
      "Pegang ujung tali di samping pinggang, lompatan kecil.",
      "Putar tali dari pergelangan, bukan seluruh lengan.",
      "Mulai 30 detik lompat + 30 detik jalan di tempat.",
      "Ulangi siklus 8-10 kali.",
      "Tutup dengan regang betis dan punggung bawah."
    ],
    "tips": "Pilih lantai tidak terlalu keras; lutut tetap sedikit melentur saat mendarat."
  },
  {
    "id": "lunges",
    "name": "Lunges",
    "category": "kekuatan",
    "met": 4,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 15,
    "icon": "🦵",
    "steps": [
      "Berdiri tegak, lalu majukkan satu kaki jauh ke depan.",
      "Turunkan lutut belakang hingga hampir menyentuh lantai.",
      "Tumpuan bobot ada di tumit kaki depan.",
      "Dorongan kaki depan untuk berdiri kembali.",
      "Lakukan 10-12 kali per kaki × 2 set."
    ],
    "tips": "Lutut depan tidak melewati ujung kaki jauh; siku tetap stabil."
  },
  {
    "id": "peregangan-total",
    "name": "Peregangan total",
    "category": "peregangan",
    "met": 2.8,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 15,
    "icon": "🧘‍♀️",
    "steps": [
      "Regang leher & bahu dulu, 10-15 detik tiap arah.",
      "Regang punggung atas & samping badan.",
      "Regang tungkai belakang ( hamstring ) dan tungkai depan.",
      "Tutup dengan tarik napas dalam 5 kali."
    ]
  },
  {
    "id": "plank",
    "name": "Plank",
    "category": "kekuatan",
    "met": 3.5,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 10,
    "icon": "🧱",
    "steps": [
      "Siku tepat di bawah bahu, telapak lantai area kecil.",
      "Tubuh membentuk satu garis: kepala–pinggul–tumit.",
      "Tarik perut ke dalam dan jaga napas tertib.",
      "Tahan 20-45 detik per putaran × 3 putaran.",
      "Rehat 60 detik di antar putaran."
    ],
    "tips": "Jangan menurunkan pinggul; bila pegal, turunkan ke lutut sesaat."
  },
  {
    "id": "push-up",
    "name": "Push-up",
    "category": "kekuatan",
    "met": 4,
    "place": "tanpa-alat",
    "level": "sedang",
    "minutes": 15,
    "icon": "💪",
    "steps": [
      "Tangan di lantai selebar bahu, badan lurus.",
      "Turunkan dada hingga hampir menyentuh lantai.",
      "Siku membentuk 45 derajat dari badan.",
      "Dorong tubuh naik dengan tenaga lengan dan dada.",
      "Lakukan 2-3 set @ 8-15 kali, rehat 60 detik."
    ],
    "tips": "Pinggul tetap sejajar punggung; mulai versi lutut bila sulit."
  },
  {
    "id": "regang-leher-bahu",
    "name": "Regang leher & bahu",
    "category": "peregangan",
    "met": 2.5,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 10,
    "icon": "🙆",
    "steps": [
      "Miringkan kepala ke kanan sampai regang di leher, tahan 15 detik.",
      "Regang bahu: tuum?ka? (gunakan sedikit tekanan tangan).",
      "Tarik satu tangan melintang ke dada.",
      "Ulangi sisi kiri dengan jeda yang sama."
    ]
  },
  {
    "id": "renang-santai",
    "name": "Renang santai",
    "category": "kardio",
    "met": 5.3,
    "place": "gym",
    "level": "pemula",
    "minutes": 45,
    "icon": "🏊",
    "steps": [
      "Pemanasan mengapung + 2 lintasan dengan gaya apa pun yang mudah.",
      "Berenang terus dengan irama nyaman 10-15 menit.",
      "Rehat di tepi sesuai butuh.",
      "Akhiri 1 lintasan pelan dan regang bahu di tepi kolam."
    ],
    "tips": "Hanya berenang di kolam yang ada penjaga; hindari makan besar langsung sebelumnya."
  },
  {
    "id": "rowing-machine",
    "name": "Rowing (dayung)",
    "category": "kardio",
    "met": 7,
    "place": "gym",
    "level": "sedang",
    "minutes": 25,
    "icon": "🚣",
    "steps": [
      "Genggam handle dengan genggaman santai.",
      "Gerak dasar: kaki dorong → tarik tangan ke perut → pinggul menjauh.",
      "Atur ritme 20-24 kali dorong per menit.",
      "Berjalan terus 20-25 menit.",
      "Akhiri regang punggung atas setelah selesai."
    ],
    "tips": "Dorongan dari kaki dahulu, bukan tarikan tangan sejak awal."
  },
  {
    "id": "senam-zumba",
    "name": "Senam (zumba)",
    "category": "kardio",
    "met": 6,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 30,
    "icon": "🕺",
    "steps": [
      "Pemanasan jalan sambil mengayun lengan 3 menit.",
      "Ikuti gerak dasar program video/irama dengan cara yang menyenangkan.",
      "Fokus gerak besar: lutut naik, tangan berputar, pinggul bergerak.",
      "Terus bergerak 25-30 menit.",
      "Sediakan air minum di sisi."
    ],
    "tips": "Amankan ruangan agar tidak tersandung benda di lantai."
  },
  {
    "id": "sit-up",
    "name": "Sit-up",
    "category": "kekuatan",
    "met": 4.3,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 10,
    "icon": "🧎",
    "steps": [
      "Telentang, lutut ditekuk, telapak kaki menapak.",
      "Tangan santai di samping telinga (jangan menarik kepala).",
      "Angkat badan dari lantai sambil buang napas.",
      "Turunkan pelan dengan kontrol.",
      "Lakukan 2-3 set @ 12-15 kali."
    ],
    "tips": "Gerakan dari perut, bukan tarikan kepala agar leher tidak pegal."
  },
  {
    "id": "squat",
    "name": "Squat",
    "category": "kekuatan",
    "met": 5,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 15,
    "icon": "🏋️",
    "steps": [
      "Kaki terbuka selebar bahu, ujung kaki sedikit keluar.",
      "Dudukkan panggul ke belakang seperti akan duduk kursi.",
      "Jaga punggung netral dan pandangan ke depan.",
      "Turun sampai paha kira-kira 90 derajat.",
      "Dorong tumit untuk berdiri; 3 set @ 10-15 rep."
    ],
    "tips": "Lutut tetap searah ujung kaki; jangan biarkan menekuk ke dalam."
  },
  {
    "id": "tai-chi",
    "name": "Tai chi",
    "category": "peregangan",
    "met": 3,
    "place": "luar",
    "level": "pemula",
    "minutes": 30,
    "icon": "☯️",
    "steps": [
      "Berdiri tenang, tarik napas perlahan.",
      "Gerakan lambat mengalir mengikuti video atau guru.",
      "Pindah bobot dengan lembut antara kaki.",
      "Selaraskan napas dan irama gerakan.",
      "Akhiri berdiri tenang 1 menit."
    ]
  },
  {
    "id": "tari-tradisional",
    "name": "Tari tradisional",
    "category": "kardio",
    "met": 5.5,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 30,
    "icon": "🎭",
    "steps": [
      "Pemanasan jalan & ayunan tangan 3 menit.",
      "Ikuti koreografi sederhana di video.",
      "Tekankan gerak lengan, pinggul, dan langkah kaki.",
      "Ganti gerak tiap lagu/repetisi supaya variasi.",
      "Akhiri jalan santai 2 menit."
    ]
  },
  {
    "id": "yoga-mengalir",
    "name": "Yoga mengalir",
    "category": "peregangan",
    "met": 4,
    "place": "tanpa-alat",
    "level": "sedang",
    "minutes": 30,
    "icon": "🧘",
    "steps": [
      "Mulai dari posisi duduk & tarik napas.",
      "Ikuti aliran (vinyasa sederhana): anjing ke bawah, posisi low, dll.",
      "Gerakkan satu sisi tubuh lalu sisi lain seimbang.",
      "Tarik napas 4 hitungan masuk, 4 keluar.",
      "Akhiri savasana (berbaring tenang) 3 menit."
    ],
    "tips": "Gunakan matras; berhenti bila ada titik nyeri tajam."
  },
  {
    "id": "yoga-yin",
    "name": "Yoga yin (lembut)",
    "category": "peregangan",
    "met": 2.5,
    "place": "tanpa-alat",
    "level": "pemula",
    "minutes": 20,
    "icon": "🕯️",
    "steps": [
      "Pilih posisi regang ringan; tahan 2-3 menit per posisi.",
      "Gunakan bantal/pile sebagai penyangga bila perlu.",
      "Rilekskan otot yang sedang diregangkan.",
      "Napas lambat dan tenang sepanjang sesi."
    ]
  }
];

/** Nama kategori latihan (label pemilih filter). */
export const KATEGORI_LATIHAN = {
  kardio: 'Kardio',
  kekuatan: 'Kekuatan',
  peregangan: 'Peregangan',
};

/** Nama lokasi latihan. */
export const TEMPAT_LATIHAN = {
  'tanpa-alat': 'Tanpa alat / rumah',
  luar: 'Luar ruang',
  gym: 'Gym',
};

/** Nama tingkat latihan. */
export const TINGKAT_LATIHAN = {
  pemula: 'Pemula',
  sedang: 'Sedang',
  mahir: 'Mahir',
};
