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
