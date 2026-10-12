/* ==========================================================================
   bmi.js — Logika perhitungan kesehatan (murni angka, tanpa DOM)
   ========================================================================== */

/** Rentang valid tiap input beserta nilai awalnya. */
export const RENTANG = {
  usia: { min: 10, max: 90, default: 25 },
  berat: { min: 30, max: 200, default: 65 },
  tinggi: { min: 120, max: 220, default: 165 },
};

/** Faktor aktivitas (aktivitas ringan / jarang olahraga teratur). */
export const FAKTOR_AKTIVITAS = 1.3;

/** Rasio makronutrien per kategori BMI (persen dari kalori harian). */
export const RASIO_MAKRO = {
  kurang: { karbo: 55, protein: 20, lemak: 25 },
  ideal: { karbo: 50, protein: 25, lemak: 25 },
  lebih: { karbo: 45, protein: 30, lemak: 25 },
};

/** Pesan motivasi hangat, berbeda untuk tiap kategori. */
const PESAN = {
  kurang: [
    "Tubuhmu sedang butuh asupan hangat dan cukup. Tambah porsi karbo kompleks pelan-pelan, ya — tanpa buru-buru.",
    "Naik berat yang sehat itu perlahan. Tambah satu camilan sehat tiap hari, seperti pisang atau kacang rebus.",
    "Fokusmu bukan angka, melainkan energi. Pastikan piringmu penuh warna dan tidurmu cukup setiap malam.",
    "Perut kenyang, hati tenang. Makanlah tiga kali teratur dengan menu rumahan hangat kesukaanmu.",
  ],
  ideal: [
    "Beratmu sekarang berada di jalur yang seimbang. Pertahankan porsi dan gerak harianmu, ya!",
    "Kerja bagus! Kebiasaan kecilmu selama ini terlihat membuahkan hasil. Tetap pelan tapi pasti.",
    "Tubuhmu nyaman di angka ini. Jaga pola makan rumahan dan tidur teratur supaya tetap stabil.",
    "Ini angka yang ramah untuk tubuhmu. Sekarang tinggal menjaga ritme makan dan bergerak setiap hari.",
  ],
  lebih: [
    "Tidak ada yang salah dengan tubuhmu hari ini. Kita jalan pelan: porsi sedikit lebih kecil dan jalan pagi lebih sering.",
    "Setiap langkah kecil sudah dihitung. Fokus pada makanan rumahan hangat dan gerak menyegarkan, bukan angka cepat.",
    "Perubahan yang bertahan itu yang paling enak. Menurunkan 0,5 kg per minggu sudah termasuk sukses besar.",
    "Tubuhmu sedang dalam perjalanan, bukan di garis akhir. Bernapas, makan seimbang, lalu lanjut lagi besok.",
  ],
};

/** Batas kategori BMI. */
const BATAS = { kurang: 18.5, ideal: 25 };

/** Lebar tiap segmen bar (flex 2 / 3 / 2 dari total 7). */
const LEBAR_SEGMENT = {
  kurang: (2 / 7) * 100,
  ideal: (3 / 7) * 100,
};

/**
 * Batasi nilai agar selalu berada di rentang aman.
 * Nilai tidak valid (NaN/Infinity) akan memakai nilai default.
 */
export function clampRentang(kunci, nilai) {
  const rentang = RENTANG[kunci];
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return rentang.default;
  return Math.min(rentang.max, Math.max(rentang.min, Math.round(angka)));
}

/**
 * Hitung BMI = berat(kg) / tinggi(m)^2, dibulatkan 1 desimal.
 * Mengembalikan null bila input tidak masuk akal.
 */
export function hitungBMI(berat, tinggiCm) {
  const b = Number(berat);
  const t = Number(tinggiCm) / 100;
  if (!Number.isFinite(b) || !Number.isFinite(t) || b <= 0 || t <= 0) return null;
  const bmi = b / (t * t);
  if (bmi < 5 || bmi > 120) return null; // cegah hasil tidak masuk akal
  return Math.round(bmi * 10) / 10;
}

/** Tentukan kategori BMI lengkap dengan label dan kunci warna. */
export function kategoriBMI(bmi) {
  if (!Number.isFinite(bmi)) return null;
  if (bmi < BATAS.kurang) {
    return { key: 'kurang', label: 'Kurang', rentang: '< 18,5' };
  }
  if (bmi < BATAS.ideal) {
    return { key: 'ideal', label: 'Ideal & Seimbang', rentang: '18,5 – 24,9' };
  }
  return { key: 'lebih', label: 'Lebih', rentang: '≥ 25' };
}

/** Ambil satu pesan motivasi acak sesuai kategori. */
export function pesanKategori(key) {
  const daftar = PESAN[key] || PESAN.ideal;
  const indeks = Math.floor(Math.random() * daftar.length);
  return daftar[indeks];
}

/**
 * Posisi penanda BMI pada bar tiga warna (dalam persen).
 * Mengikuti lebar segmen: Kurang 2/7, Ideal 3/7, Lebih 2/7.
 */
export function posisiPenanda(bmi) {
  if (!Number.isFinite(bmi)) return 50;
  let pos;
  if (bmi < BATAS.kurang) {
    pos = ((bmi - 15) / 3.5) * LEBAR_SEGMENT.kurang;
  } else if (bmi < BATAS.ideal) {
    pos = LEBAR_SEGMENT.kurang + ((bmi - BATAS.kurang) / 6.5) * LEBAR_SEGMENT.ideal;
  } else {
    pos = LEBAR_SEGMENT.kurang + LEBAR_SEGMENT.ideal +
      ((bmi - 25) / 15) * LEBAR_SEGMENT.kurang;
  }
  return Math.min(95, Math.max(5, pos));
}

/** BMR rumus Mifflin-St Jeor sesuai gender. */
export function hitungBMR({ gender, usia, berat, tinggi }) {
  const u = Number(usia);
  const b = Number(berat);
  const t = Number(tinggi);
  if (![u, b, t].every(Number.isFinite)) return null;
  const dasar = 10 * b + 6.25 * t - 5 * u;
  return gender === 'wanita' ? dasar - 161 : dasar + 5;
}

/** Kebutuhan kalori harian = BMR × faktor aktivitas. */
export function hitungKaloriHarian(input, faktor = FAKTOR_AKTIVITAS) {
  const bmr = hitungBMR(input);
  if (!Number.isFinite(bmr) || bmr <= 0) return null;
  return Math.round(bmr * faktor);
}

/** Ubah persentase makro menjadi gram per hari (karbo/protein 4 kkal/g, lemak 9 kkal/g). */
export function hitungGramMakro(kalori, rasio) {
  if (!Number.isFinite(kalori) || kalori <= 0) return null;
  return {
    karbo: Math.round((kalori * rasio.karbo / 100) / 4),
    protein: Math.round((kalori * rasio.protein / 100) / 4),
    lemak: Math.round((kalori * rasio.lemak / 100) / 9),
  };
}
