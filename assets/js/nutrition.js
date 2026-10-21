/* ==========================================================================
   nutrition.js — Rumus gizi untuk profil pengguna (fungsi murni, tanpa DOM).
   Halaman Akun, Pola Makan, dan Olahraga memakai modul ini.
   ========================================================================== */

/** Faktor aktivitas TDEE (Mifflin-St Jeor). */
export const FAKTOR_AKTIVITAS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Batas kalori minimum yang aman (Batasan & Keselamatan, bagian 5 desain.md). */
export const BATAS_KALORI_MIN = {
  male: 1500,
  female: 1200,
};

/** Kalori per gram makronutrien. */
export const KALORI_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

/** Rasio makro default: protein 20%, lemak 25%, karbo 55%. */
export const RASIO_MAKRO_DEFAULT = { protein: 20, carbs: 55, fat: 25 };

/** Target aktivitas mingguan (acuan WHO): 150 menit sedang. */
export const TARGET_MENIT_MINGGUAN = 150;

/**
 * BMR rumus Mifflin-St Jeor.
 * profil: { sex: "male"|"female", age, weightKg, heightCm }
 * Mengembalikan null bila input tidak masuk akal.
 */
export function hitungBMR(profil) {
  if (!profil) return null;
  const usia = Number(profil.age);
  const berat = Number(profil.weightKg);
  const tinggi = Number(profil.heightCm);
  if (![usia, berat, tinggi].every(Number.isFinite)) return null;
  if (usia < 10 || usia > 100) return null;
  if (berat < 20 || berat > 300) return null;
  if (tinggi < 100 || tinggi > 250) return null;

  const dasar = 10 * berat + 6.25 * tinggi - 5 * usia;
  return profil.sex === 'female' ? dasar - 161 : dasar + 5;
}

/** TDEE = BMR × faktor aktivitas. Null bila BMR/faktor tidak valid. */
export function hitungTDEE(profil) {
  const bmr = hitungBMR(profil);
  if (bmr === null) return null;
  const faktor = FAKTOR_AKTIVITAS[profil.activity];
  if (!Number.isFinite(faktor)) return null;
  return Math.round(bmr * faktor);
}

/**
 * Target kalori harian sesuai tujuan:
 * lose = TDEE − 500 · maintain = TDEE · gain = TDEE + 300.
 * Tidak akan menyarankan di bawah batas aman (1200 kkal wanita / 1500 pria);
 * bila terpotong, hasilnya ditandai `dibatasi: true`.
 */
export function hitungTargetKalori(profil) {
  const tdee = hitungTDEE(profil);
  if (tdee === null) return null;

  const penyesuaian = { lose: -500, maintain: 0, gain: 300 };
  const selisih = penyesuaian[profil.goal];
  if (!Number.isFinite(selisih)) return null;

  let target = tdee + selisih;
  const batas = profil.sex === 'female' ? BATAS_KALORI_MIN.female : BATAS_KALORI_MIN.male;
  const dibatasi = target < batas;
  if (dibatasi) target = batas;

  return { tdee, target: Math.round(target), batasMin: batas, dibatasi };
}

/**
 * Konversi kalori harian menjadi gram makro sesuai rasio (persen).
 * Contoh: hitungGramMakro(2000, RASIO_MAKRO_DEFAULT) → { protein: 100, ... }
 */
export function hitungGramMakro(kalori, rasio = RASIO_MAKRO_DEFAULT) {
  const k = Number(kalori);
  if (!Number.isFinite(k) || k <= 0) return null;
  const gramSimpan = (persen, kaloriPerGram) =>
    (k * persen) / 100 / kaloriPerGram;
  return {
    protein: Math.round(gramSimpan(rasio.protein, KALORI_PER_GRAM.protein)),
    carbs: Math.round(gramSimpan(rasio.carbs, KALORI_PER_GRAM.carbs)),
    fat: Math.round(gramSimpan(rasio.fat, KALORI_PER_GRAM.fat)),
  };
}

/** Ringkasan gizi lengkap dari profil: BMR, TDEE, target kalori, dan gram makro. */
export function ringkasanNutrisi(profil) {
  const target = hitungTargetKalori(profil);
  if (target === null) return null;
  const bmr = hitungBMR(profil);
  const gram = hitungGramMakro(target.target, RASIO_MAKRO_DEFAULT);
  return { bmr: Math.round(bmr), tdee: target.tdee, ...target, makro: gram };
}

/**
 * Kalori terbakar dari latihan: MET × berat(kg) × (menit / 60).
 * `met` dan `weightKg` wajib positif; minta berat dari profil, default 60 kg.
 */
export function kaloriOlahraga(met, weightKg, minutes) {
  const m = Number(met);
  const b = Number(weightKg);
  const menit = Number(minutes);
  if (![m, b, menit].every(Number.isFinite)) return null;
  if (m <= 0 || b <= 0 || menit <= 0) return null;
  return Math.round(m * b * (menit / 60));
}
