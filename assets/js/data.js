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
 * Kolom pembagian kalori per slot dari total harian (tugas 2.11).
 * `tag` = tag FOODS yang boleh dipilih; `bagian` = porsi kalori slot.
 */
const STRUKTUR_SLOT = {
  breakfast: [
    { tag: 'pokok', bagian: 0.75 },
    { tag: 'minuman', bagian: 0.25 },
  ],
  lunch: [
    { tag: 'pokok', bagian: 0.5 },
    { tag: 'lauk', bagian: 0.3 },
    { tag: 'sayur', bagian: 0.2 },
  ],
  dinner: [
    { tag: 'pokok', bagian: 0.6 },
    { tag: 'lauk', bagian: 0.4 },
  ],
  snack: [{ tag: 'buah', bagian: 1 }],
};

/** PRNG deterministik (mulberry32) supaya rencana stabil per seed. */
function bilAcak(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let a = t;
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMA_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

/** Ambil tanggalhari (YYYY-MM-DD) Senin pada minggu berisi tanggal hari itu. */
function seninDari(tanggalHari) {
  const [y, m, d] = (tanggalHari || '').split('-').map(Number);
  const dasar = Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
    ? new Date(y, m - 1, d)
    : new Date();
  const geser = (dasar.getDay() + 6) % 7; // Senin = 0
  dasar.setDate(dasar.getDate() - geser);
  const dua = (n) => String(n).padStart(2, '0');
  return `${dasar.getFullYear()}-${dua(dasar.getMonth() + 1)}-${dua(dasar.getDate())}`;
}

/** Tanggal berikutnya dari string YYYY-MM-DD. */
function tanggalBerikutnya(tanggal) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const tgl = new Date(y, m - 1, d);
  tgl.setDate(tgl.getDate() + 1);
  const dua = (n) => String(n).padStart(2, '0');
  return `${tgl.getFullYear()}-${dua(tgl.getMonth() + 1)}-${dua(tgl.getDate())}`;
}

/** Porsi kelipatan 0,5 dalam rentang 0,5–2 sesuai target kkal. */
function porsiTarget(targetKkal, kcalPerPorsi) {
  if (!(kcalPerPorsi > 0)) return 1;
  const mentah = Math.round(((targetKkal / kcalPerPorsi) * 2) / 1) / 2;
  return Math.min(2, Math.max(0.5, mentah));
}

/**
 * Saran menu 7 hari (Senin–Minggu) dibangun dari FOODS sesuai target kalori
 * (tugas 2.11). Deterministik: seed sama -> rencana sama. Fungsi murni.
 * @param {number} targetKkal target kalori harian (mis. dari profil)
 * @param {number} seed angka acak tersimpan untuk variasi menu
 * @param {string} tanggalHari tanggal referensi YYYY-MM-DD (bawaan: hari ini)
 * @returns {{ hariIni: string, hari: Array }} 7 baris {tanggal, label, slot, total}
 */
export function buatRencanaMingguan(targetKkal, seed = 1, tanggalHari = '') {
  const target = Math.min(3500, Math.max(1200, Math.round(Number(targetKkal) || 2000)));
  const acak = bilAcak((Math.floor(Number(seed)) || 1) + 7);
  const mulai = tanggalHari ? seninDari(tanggalHari) : seninDari();

  const hasil = [];
  let tanggal = mulai;

  for (let d = 0; d < 7; d++) {
    const slot = {};
    const terpakai = new Set(); // hindari makanan sama dua kali dalam satu hari
    let total = 0;

    for (const kunciSlot of Object.keys(STRUKTUR_SLOT)) {
      let komposisi = STRUKTUR_SLOT[kunciSlot];
      if (kunciSlot === 'snack' && d % 2 === 1) {
        komposisi = [{ tag: 'camilan', bagian: 1 }];
      }
      const targetSlot = target * FRaksi_SLOT[kunciSlot];
      slot[kunciSlot] = komposisi.map((kolom, i) => {
        const pool = FOODS.filter((m) => m.tags.includes(kolom.tag));
        // Pilih acak; bila id sudah terpakai hari itu, geser satu (terbatas).
        let indeks = Math.floor(acak() * pool.length) % pool.length;
        for (let coba = 0; coba < pool.length && terpakai.has(pool[indeks].id); coba++) {
          indeks = (indeks + 1) % pool.length;
        }
        const makanan = pool[indeks];
        const share = targetSlot * shareBagian(komposisi, i);
        const servings = porsiTarget(share, makanan.kcal);
        terpakai.add(makanan.id);
        const kkal = Math.round(makanan.kcal * servings);
        total += kkal;
        return { foodId: makanan.id, servings, kkal };
      });
    }

    hasil.push({
      tanggal,
      label: NAMA_HARI[d],
      slot,
      total: Math.round(total),
    });
    tanggal = tanggalBerikutnya(tanggal);
  }

  return { hariIni: mulai, hari: hasil };
}

/** Fraksi kalori harian yang diambil tiap slot (0,25+0,4+0,25+0,1 = 1). */
const FRaksi_SLOT = {
  breakfast: 0.25,
  lunch: 0.4,
  dinner: 0.25,
  snack: 0.1,
};

/** Bagian kalori milik kolom i (dinormalisasi di dalam slotnya). */
function shareBagian(komposisi, i) {
  const total = komposisi.reduce((jumlah, k) => jumlah + k.bagian, 0);
  return komposisi[i].bagian / total;
}

/**
 * Daftar belanja otomatis dari rencana mingguan (tugas 2.12): agregasi
 * foodId -> total porsi. Terurut abjad; hanya memakai data rencana.
 */
export function daftarBelanjaDariRencana(rencana) {
  const peta = new Map();
  for (const hari of rencana.hari) {
    for (const entri of Object.values(hari.slot)) {
      for (const item of entri) {
        const makanan = FOODS.find((m) => m.id === item.foodId);
        if (!makanan) continue;
        const ada = peta.get(item.foodId)
          || { id: item.foodId, name: makanan.name, servings: 0, hari: 0 };
        ada.servings += item.servings;
        ada.hari += 1;
        peta.set(item.foodId, ada);
      }
    }
  }
  return [...peta.values()]
    .map((item) => ({ ...item, servings: Math.round(item.servings * 10) / 10 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

/**
 * Resep sederhana bahan terjangkau (tugas 2.13) — ditampilkan di halaman
 * Pola Makan. `kcal` = kalori per porsi, bersifat perkiraan.
 */
export const RESEP = [
  {
    id: 'oat-pisang',
    name: 'Oat pisang hangat',
    porsi: '1 porsi',
    kcal: 220,
    bahan: ['1 mangkuk oat', '1 buah pisang', '200 ml air/susu', 'Secukupnya kayu manis'],
    langkah: [
      'Masak oat dengan air/susu di api kecil ± 5 menit.',
      'Iris pisang, aduk ke dalam oat.',
      'Tambahkan taburan kayu manis, sajikan hangat.',
    ],
  },
  {
    id: 'tempe-kecap',
    name: 'Tempe kecap sayur',
    porsi: '2 porsi',
    kcal: 160,
    bahan: ['200 g tempe', '2 sdm kecap manis', '2 siung bawang putih', '2 sdm air', '1 sdm minyak'],
    langkah: [
      'Iris tempe persegi, tumis bersama bawang putih cincang dengan sedikit minyak.',
      'Masukkan kecap manis dan air, masak sampai bumbu meresap.',
      'Tambahkan sayur rebus di samping sebagai lauk pendamping.',
    ],
  },
  {
    id: 'sup-telur-bayam',
    name: 'Sup telur bayam',
    porsi: '2 porsi',
    kcal: 120,
    bahan: ['2 butir telur', '1 ikat kecil bayam', '1 siung bawang putih', '500 ml air', 'Garam & lada sejumlah kecil'],
    langkah: [
      'Tumis bawang putih, tuang air sampai mendidih.',
      'Masukkan bayam, masak ± 2 menit.',
      'Kocok telur, aduk pelan ke dalam sup sampai matang.',
      'Beri garam dan secukup lada.',
    ],
  },
  {
    id: 'telur-dadar-sayur',
    name: 'Telur dadar sayur',
    porsi: '2 porsi',
    kcal: 150,
    bahan: ['2 butir telur', '1 genggam wortel parut', '1 genggam kol cincang', 'Garam & lada sejumlah kecil', '1 sdm minyak'],
    langkah: [
      'Kocok telur bersama wortel, kol, garam, dan lada.',
      'Panaskan minyak di wajan kecil, tuang adonan.',
      'Matang perlahan (dua sisi) ± 5 menit, potong dua.',
    ],
  },
  {
    id: 'bubur-kacang-hijau-mudah',
    name: 'Bubur kacang hijau sederhana',
    porsi: '3 porsi',
    kcal: 180,
    bahan: ['200 g kacang hijau', '500 ml air', '1 lembar daun pandan', '2 sdm gula pila/gula pasir'],
    langkah: [
      'Rendam kacang hijau ± 1 jam, lanjut masak dengan air & pandan sampai lembek.',
      'Tambahkan gula, aduk sampai larut.',
      'Sajikan hangat, 1 mangkuk = 1 porsi.',
    ],
  },
  {
    id: 'ikan-kembung-bakar',
    name: 'Ikan kembung bakar sederhana',
    porsi: '2 porsi',
    kcal: 200,
    bahan: ['2 ekor ikan kembung', 'Air perasan jeruk nipis', 'Garam & lada sejumlah kecil'],
    langkah: [
      'Bersihkan ikan, lumuri jeruk nipis, garam, dan lada.',
      'Biarkan ± 15 menit sampai bumbu meresap.',
      'Panggang/tumis wajan tanpa banyak minyak sampai matang dua sisi.',
    ],
  },
];

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

/* --------------------------------------------------------------------------
   Helper pencapaian (Fase 4, tugas 4.3) — fungsi murni, mudah diuji node.
   -------------------------------------------------------------------------- */

/** YYYY-MM-DD → angka hari sejak epoch (murni UTC, bebas zona waktu). */
export function nomorHari(tanggal) {
  const [y, m, d] = String(tanggal).split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Streak tanggal beruntun (mundur dari hari ini; bila hari ini kosong,
 * mulai dari kemarin) — dipakai badge "7 hari mencatat" (tugas 4.3).
 * @param {string[]} daftarTanggal tanggal yang punya entri
 * @param {string} hariIni tanggal referensi
 */
export function hitungStreakCatat(daftarTanggal, hariIni) {
  const set = new Set(daftarTanggal.filter((t) => nomorHari(t) !== null));
  let nomor = nomorHari(hariIni);
  if (!Number.isFinite(nomor)) return 0;
  if (!set.has(hariIni)) nomor -= 1; // hari ini belum mencatat: cek sampai kemarin

  let beruntun = 0;
  while (nomor !== null && set.has(dariNomorHari(nomor))) {
    beruntun++;
    nomor -= 1;
  }
  return beruntun;
}

/** Kebalikan nomorHari: angka → 'YYYY-MM-DD' (murni UTC). */
export function dariNomorHari(nomor) {
  const iso = new Date(nomor * 86400000).toISOString();
  return iso.slice(0, 10);
}

/** Senin (nomor hari) minggu yang memuat `tanggal` — murni epoch. */
export function nomorSenin(tanggal) {
  const n = nomorHari(tanggal);
  if (n === null) return null;
  const hari = ((n + 4) % 7 + 7) % 7; // 0=Minggu, 1=Senin, … 6=Sabtu
  return n - ((hari + 6) % 7);        // mundur ke Senin
}

/**
 * Maksimum menit (atau nilai lain) terakumulasi dalam satu minggu Senin–Minggu
 * — dipakai badge "150 menit dalam satu minggu" (tugas 4.3).
 * @param {Object} petaTanggal { 'YYYY-MM-DD': angka }
 * @param {string} hariIni tanggal referensi (batas atas iterasi)
 */
export function maksMingguan(petaTanggal, hariIni) {
  const entri = Object.entries(petaTanggal)
    .map(([tanggal, nilai]) => ({ tanggal, nomor: nomorHari(tanggal), nilai: Number(nilai) || 0 }))
    .filter((e) => e.nomor !== null)
    .sort((a, b) => a.nomor - b.nomor);
  if (entri.length === 0) return 0;

  const batas = nomorHari(hariIni) || 0;
  let maks = 0;
  for (let i = 0; i < entri.length; i++) {
    const senin = nomorSenin(entri[i].tanggal);
    if (senin === null || senin > batas) continue;
    const mingguIni = entri
      .filter((e) => nomorSenin(e.tanggal) === senin)
      .reduce((jumlah, e) => jumlah + e.nilai, 0);
    maks = Math.max(maks, mingguIni);
  }
  return maks;
}
