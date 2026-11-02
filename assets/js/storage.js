/* ==========================================================================
   storage.js — Bungkus localStorage yang aman (try/catch di mana-mana).
   Tampilan harus tetap berjalan walau storage kosong / diblokir.
   ========================================================================== */

/** Kunci penyimpanan aplikasi. */
const KEY = {
  input: 'nutrikala:input',
  hasil: 'nutrikala:hasil-terakhir',
  air: 'nutrikala:air',
  aktivitas: 'nutrikala:aktivitas',
  riwayat: 'nutrikala:riwayat-bmi',
  tab: 'nutrikala:tab',
  skema: 'nutrikala:schemaVersion',
  profil: 'nutrikala:profile',
  berat: 'nutrikala:weightLog',
  pengaturan: 'nutrikala:settings',
  logMakan: 'nutrikala:mealLog',
  logOlahraga: 'nutrikala:workoutLog',
  favorit: 'nutrikala:favFoods',
  terbaru: 'nutrikala:recentFoods',
  kustom: 'nutrikala:foodKustom',
  rencana: 'nutrikala:mealPlan',
  belanja: 'nutrikala:shoppingCheck',
  pengingat: 'nutrikala:reminders',
  airRiwayat: 'nutrikala:waterLog',
  badgeDilihat: 'nutrikala:badgesSeen',
  onboarding: 'nutrikala:onboarding',
};

/** Prefiks semua kunci milik NutriKala (untuk ekspor/hapus total). */
const PREFIKS = 'nutrikala:';

/** Versi skema data saat ini. Naikkan bila struktur penyimpanan berubah. */
export const VERSI_SKEMA = 1;

/** Batas entri riwayat BMI. */
export const MAKS_RIWAYAT = 30;

/* --------------------------------------------------------------------------
   Utilitas tanggal
   -------------------------------------------------------------------------- */

/** Tanggal hari ini dalam format YYYY-MM-DD. */
export function tanggalHariIni() {
  const sekarang = new Date();
  const dua = (angka) => String(angka).padStart(2, '0');
  return `${sekarang.getFullYear()}-${dua(sekarang.getMonth() + 1)}-${dua(sekarang.getDate())}`;
}

/* --------------------------------------------------------------------------
   Aman baca / tulis localStorage
   -------------------------------------------------------------------------- */

/** Ambil & parse JSON. Mengembalikan null bila kosong / rusak / diblokir. */
export function amanAmbil(kunci) {
  try {
    const mentah = window.localStorage.getItem(kunci);
    return mentah ? JSON.parse(mentah) : null;
  } catch (err) {
    console.warn('[NutriKala] Gagal membaca storage:', err);
    return null;
  }
}

/** Simpan sebagai JSON. Mengembalikan false bila gagal. */
export function amanSimpan(kunci, nilai) {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
    return true;
  } catch (err) {
    console.warn('[NutriKala] Gagal menulis storage:', err);
    return false;
  }
}

/** Hapus satu kunci (tanpa error bila tidak ada). */
export function amanHapus(kunci) {
  try {
    window.localStorage.removeItem(kunci);
  } catch (err) {
    console.warn('[NutriKala] Gagal menghapus storage:', err);
  }
}

/* --------------------------------------------------------------------------
   Skema & migrasi (persiapan fitur baru; Fase 0 desain.md)
   -------------------------------------------------------------------------- */

/** Baca versi skema tersimpan. Null bila belum pernah ditulis (pengguna lama). */
export function muatSchemaVersion() {
  const data = amanAmbil(KEY.skema);
  const nomor = Number(data);
  return Number.isFinite(nomor) ? nomor : null;
}

function simpanSchemaVersion(nomor) {
  return amanSimpan(KEY.skema, nomor);
}

/**
 * Jalankan migrasi skema. Kosong dulu — saat versi dinaikkan nanti,
 * tambahkan langkah `while` per versi di sini.
 */
export function migrate() {
  let versi = muatSchemaVersion();
  if (versi === null) {
    versi = VERSI_SKEMA;
    simpanSchemaVersion(versi);
  }
  return versi;
}

/* --------------------------------------------------------------------------
   Input terakhir (gender, usia, berat, tinggi)
   -------------------------------------------------------------------------- */

export function muatInputPengguna(fallback) {
  const data = amanAmbil(KEY.input);
  if (!data || typeof data !== 'object') return { ...fallback };

  const hasil = { ...fallback };
  if (data.gender === 'pria' || data.gender === 'wanita') hasil.gender = data.gender;
  ['usia', 'berat', 'tinggi'].forEach((kunci) => {
    const nilai = Number(data[kunci]);
    if (Number.isFinite(nilai)) hasil[kunci] = nilai;
  });
  return hasil;
}

export function simpanInputPengguna(input) {
  return amanSimpan(KEY.input, {
    gender: input.gender,
    usia: input.usia,
    berat: input.berat,
    tinggi: input.tinggi,
  });
}

/* --------------------------------------------------------------------------
   Hasil BMI terakhir
   -------------------------------------------------------------------------- */

export function simpanHasilTerakhir(hasil) {
  return amanSimpan(KEY.hasil, {
    bmi: hasil.bmi,
    kategori: hasil.kategori.key,
    label: hasil.kategori.label,
    tanggal: tanggalHariIni(),
    waktu: Date.now(),
  });
}

export function muatHasilTerakhir() {
  const data = amanAmbil(KEY.hasil);
  if (!data || !Number.isFinite(Number(data.bmi))) return null;
  return {
    bmi: Number(data.bmi),
    kategori: data.kategori || 'ideal',
    label: data.label || 'Ideal & Seimbang',
    tanggal: data.tanggal || '',
  };
}

/* --------------------------------------------------------------------------
   Riwayat BMI (maksimal 30 entri, untuk grafik tahap berikut)
   -------------------------------------------------------------------------- */

export function muatRiwayatBMI() {
  const data = amanAmbil(KEY.riwayat);
  if (!Array.isArray(data)) return [];
  return data
    .filter((entri) => entri && typeof entri.tanggal === 'string' && Number.isFinite(Number(entri.bmi)))
    .map((entri) => ({ tanggal: entri.tanggal, bmi: Number(entri.bmi) }))
    .slice(-MAKS_RIWAYAT);
}

/** Catat BMI hari ini (menimpa bila tanggal yang sama sudah ada). */
export function catatRiwayatBMI(bmi) {
  if (!Number.isFinite(bmi)) return muatRiwayatBMI();

  const riwayat = muatRiwayatBMI();
  const tanggal = tanggalHariIni();
  const indeksHariIni = riwayat.findIndex((entri) => entri.tanggal === tanggal);

  if (indeksHariIni >= 0) {
    riwayat[indeksHariIni].bmi = bmi;
  } else {
    riwayat.push({ tanggal, bmi });
  }

  // Jaga agar tidak melebihi batas.
  const terpotong = riwayat.slice(-MAKS_RIWAYAT);
  amanSimpan(KEY.riwayat, terpotong);
  return terpotong;
}

/* --------------------------------------------------------------------------
   Hidrasi per tanggal (reset otomatis saat ganti hari)
   -------------------------------------------------------------------------- */

export function muatAirHariIni() {
  const data = amanAmbil(KEY.air);
  const hariIni = tanggalHariIni();

  if (!data || data.tanggal !== hariIni) {
    return { tanggal: hariIni, gelas: 0 };
  }
  const gelas = Number(data.gelas);
  return {
    tanggal: hariIni,
    gelas: Number.isFinite(gelas) && gelas > 0 ? Math.round(gelas) : 0,
  };
}

export function simpanAir(data) {
  return amanSimpan(KEY.air, {
    tanggal: data.tanggal || tanggalHariIni(),
    gelas: Math.max(0, Math.round(data.gelas || 0)),
  });
}

/* --------------------------------------------------------------------------
   Aktivitas dicentang per tanggal
   -------------------------------------------------------------------------- */

export function muatAktivitasHariIni() {
  const data = amanAmbil(KEY.aktivitas);
  const hariIni = tanggalHariIni();

  if (!data || data.tanggal !== hariIni) {
    return { tanggal: hariIni, centang: {} };
  }
  return {
    tanggal: hariIni,
    centang: data.centang && typeof data.centang === 'object' ? data.centang : {},
  };
}

export function simpanAktivitas(data) {
  return amanSimpan(KEY.aktivitas, {
    tanggal: data.tanggal || tanggalHariIni(),
    centang: data.centang && typeof data.centang === 'object' ? data.centang : {},
  });
}

/* --------------------------------------------------------------------------
   Tab navigasi terakhir
   -------------------------------------------------------------------------- */

export function muatTabAktif(fallback) {
  const data = amanAmbil(KEY.tab);
  return typeof data === 'string' && data ? data : fallback;
}

export function simpanTabAktif(tab) {
  return amanSimpan(KEY.tab, tab);
}

/* --------------------------------------------------------------------------
   Profil pengguna (nutrikala:profile)
   -------------------------------------------------------------------------- */

/** Kunci nilai profil yang valid + rentang masuk akal (desain.md 1.2). */
export const RENTANG_PROFIL = {
  usia: { min: 10, max: 100, default: 25 },
  tinggiCm: { min: 100, max: 250, default: 165 },
  weightKg: { min: 20, max: 300, default: 60 },
  targetWeightKg: { min: 20, max: 300, default: 60 },
};

const SEX_VALID = ['male', 'female'];
const ACTIVITY_VALID = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOAL_VALID = ['lose', 'maintain', 'gain'];
const SATUAN_VALID = ['kg', 'lb'];
const TEMA_VALID = ['terang', 'gelap'];

/** Amankan angka ke rentang; null bila kosong/tidak valid. */
function angkaProfil(nilai, rentang) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return null;
  return Math.min(rentang.max, Math.max(rentang.min, Math.round(angka)));
}

/** Amankan angka desimal (0,1 kg) untuk berat badan. */
function angkaBeratProfil(nilai, rentang) {
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return null;
  const bulat = Math.round(angka * 10) / 10;
  return Math.min(rentang.max, Math.max(rentang.min, bulat));
}

export function muatProfil() {
  const data = amanAmbil(KEY.profil);
  if (!data || typeof data !== 'object') return null;

  const profil = {
    name: typeof data.name === 'string' ? data.name.slice(0, 40) : '',
    usia: angkaProfil(data.usia, RENTANG_PROFIL.usia),
    sex: SEX_VALID.includes(data.sex) ? data.sex : null,
    heightCm: angkaProfil(data.heightCm, RENTANG_PROFIL.tinggiCm),
    weightKg: angkaBeratProfil(data.weightKg, RENTANG_PROFIL.weightKg),
    activity: ACTIVITY_VALID.includes(data.activity) ? data.activity : 'sedentary',
    goal: GOAL_VALID.includes(data.goal) ? data.goal : 'maintain',
    targetWeightKg: angkaBeratProfil(data.targetWeightKg, RENTANG_PROFIL.targetWeightKg),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  };

  // Profil dianggap valid bila keenam nilai wajib terisi.
  if (profil.usia === null || profil.heightCm === null ||
      profil.weightKg === null || !profil.sex) return null;
  return profil;
}

/** Simpan profil (ditandai updatedAt). Mengembalikan profil yang tersimpan. */
export function simpanProfil(profil) {
  const bersih = {
    ...profil,
    updatedAt: new Date().toISOString(),
  };
  const ok = amanSimpan(KEY.profil, bersih);
  return ok ? bersih : null;
}

export function hapusProfil() {
  amanHapus(KEY.profil);
}

/* --------------------------------------------------------------------------
   Log berat badan (nutrikala:weightLog) — array {date, weightKg}
   -------------------------------------------------------------------------- */

/** Batas entri log berat. */
export const MAKS_LOG_BERAT = 120;

export function muatLogBerat() {
  const data = amanAmbil(KEY.berat);
  if (!Array.isArray(data)) return [];
  return data
    .filter((entri) => entri &&
      typeof entri.date === 'string' && Number.isFinite(Number(entri.weightKg)))
    .map((entri) => ({ date: entri.date, weightKg: Number(entri.weightKg) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-MAKS_LOG_BERAT);
}

/** Catat berat hari ini; satu entri per hari (timpa bila sama). */
export function catatBerat(weightKg) {
  const angka = Number(weightKg);
  if (!Number.isFinite(angka) || angka < RENTANG_PROFIL.weightKg.min ||
      angka > RENTANG_PROFIL.weightKg.max) return null;

  const log = muatLogBerat();
  const tanggal = tanggalHariIni();
  const exist = log.findIndex((entri) => entri.date === tanggal);

  if (exist >= 0) {
    log[exist].weightKg = angka;
  } else {
    log.push({ date: tanggal, weightKg: angka });
  }

  const terpotong = log.slice(-MAKS_LOG_BERAT);
  return amanSimpan(KEY.berat, terpotong) ? terpotong : null;
}

export function hapusLogBerat() {
  amanHapus(KEY.berat);
}

/* --------------------------------------------------------------------------
   Pengaturan (nutrikala:settings) — tema & satuan tampilan
   -------------------------------------------------------------------------- */

export function muatPengaturan() {
  const data = amanAmbil(KEY.pengaturan);
  return {
    tema: data && TEMA_VALID.includes(data.tema) ? data.tema : 'terang',
    satuan: data && SATUAN_VALID.includes(data.satuan) ? data.satuan : 'kg',
  };
}

export function simpanPengaturan(pengaturan) {
  const sekarang = muatPengaturan();
  const tema = TEMA_VALID.includes(pengaturan.tema) ? pengaturan.tema : sekarang.tema;
  const satuan = SATUAN_VALID.includes(pengaturan.satuan) ? pengaturan.satuan : sekarang.satuan;
  return amanSimpan(KEY.pengaturan, { tema, satuan });
}

/* --------------------------------------------------------------------------
   Ekspor / impor / hapus total (Data & Privasi)
   Semua akses localStorage di sini — tempatnya memang di storage.js.
   -------------------------------------------------------------------------- */

/** Kumpulkan seluruh data NutriKala untuk ekspor JSON. */
export function kumpulkanSemuaData() {
  const isi = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const kunci = window.localStorage.key(i);
      if (kunci && kunci.startsWith(PREFIKS)) isi[kunci] = amanAmbil(kunci);
    }
  } catch (err) {
    console.warn('[NutriKala] Gagal mengumpulkan data:', err);
    return null;
  }
  return {
    aplikasi: 'nutrikala',
    versiSkema: muatSchemaVersion() || VERSI_SKEMA,
    diekspor: new Date().toISOString(),
    data: isi,
  };
}

/**
 * Timpa data lokal dengan isi eksporan.
 * Kembalikan jumlah kunci yang dituliskan, atau null bila format tidak valid.
 */
export function timpaDenganData(berkas) {
  if (!berkas || typeof berkas !== 'object') return null;
  if (berkas.aplikasi !== 'nutrikala') return null;
  if (!berkas.data || typeof berkas.data !== 'object') return null;

  const entri = Object.entries(berkas.data).filter(([kunci]) =>
    kunci.startsWith(PREFIKS));
  if (entri.length === 0) return null;

  try {
    // Bersihkan dulu agar impor benar-benar menggantikan, bukan menumpuk.
    const hapusLama = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const kunci = window.localStorage.key(i);
      if (kunci && kunci.startsWith(PREFIKS)) hapusLama.push(kunci);
    }
    hapusLama.forEach((kunci) => window.localStorage.removeItem(kunci));

    let jumlah = 0;
    for (const [kunci, nilai] of entri) {
      if (amanSimpan(kunci, nilai)) jumlah++;
    }
    return jumlah;
  } catch (err) {
    console.warn('[NutriKala] Gagal mengimpor data:', err);
    return null;
  }
}

/** Hapus seluruh data NutriKala dari perangkat. */
export function hapusSemuaData() {
  try {
    const daftar = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const kunci = window.localStorage.key(i);
      if (kunci && kunci.startsWith(PREFIKS)) daftar.push(kunci);
    }
    daftar.forEach((kunci) => window.localStorage.removeItem(kunci));
    return true;
  } catch (err) {
    console.warn('[NutriKala] Gagal menghapus data:', err);
    return false;
  }
}

/* --------------------------------------------------------------------------
   Log makan per tanggal (nutrikala:mealLog) — { "YYYY-MM-DD": [entri...] }
   -------------------------------------------------------------------------- */

function muatObjekAntarTanggal(kunci) {
  const data = amanAmbil(kunci);
  return data && typeof data === 'object' ? data : {};
}

export function muatLogMakan(tanggal) {
  const data = muatObjekAntarTanggal(KEY.logMakan);
  const entri = data[tanggal];
  if (!Array.isArray(entri)) return [];
  return entri.filter((item) =>
    item && typeof item.id === 'string' && typeof item.foodId === 'string' &&
    Number.isFinite(Number(item.servings)));
}

/** Seluruh log makan per tanggal (untuk badge & grafik mingguan). */
export function muatSemuaLogMakan() {
  return muatObjekAntarTanggal(KEY.logMakan);
}

export function simpanLogMakan(tanggal, entri) {
  const data = muatObjekAntarTanggal(KEY.logMakan);
  if (entri.length === 0) {
    delete data[tanggal];
  } else {
    data[tanggal] = entri;
  }
  return amanSimpan(KEY.logMakan, data);
}

/* --------------------------------------------------------------------------
   Log olahraga per tanggal (nutrikala:workoutLog) — { "YYYY-MM-DD": [entri...] }
   Entri: { id, exerciseId, name, minutes, kcal, kcalManual, icon, addedAt }
   -------------------------------------------------------------------------- */

function entriOlahragaValid(item) {
  return item
    && typeof item.id === 'string'
    && typeof item.exerciseId === 'string'
    && typeof item.name === 'string'
    && Number.isFinite(Number(item.minutes)) && Number(item.minutes) > 0
    && Number(item.minutes) <= 600
    && Number.isFinite(Number(item.kcal)) && Number(item.kcal) >= 0
    && Number(item.kcal) <= 5000;
}

export function muatLogOlahraga(tanggal) {
  const data = muatObjekAntarTanggal(KEY.logOlahraga);
  const entri = data[tanggal];
  if (!Array.isArray(entri)) return [];
  return entri.filter(entriOlahragaValid);
}

export function simpanLogOlahraga(tanggal, entri) {
  const data = muatObjekAntarTanggal(KEY.logOlahraga);
  if (!Array.isArray(entri) || entri.length === 0) {
    delete data[tanggal];
  } else {
    data[tanggal] = entri.filter(entriOlahragaValid);
  }
  return amanSimpan(KEY.logOlahraga, data);
}

/** Seluruh log olahraga per tanggal (untuk ringkasan mingguan & streak). */
export function muatSemuaLogOlahraga() {
  const data = muatObjekAntarTanggal(KEY.logOlahraga);
  const bersih = {};
  for (const [tanggal, entri] of Object.entries(data)) {
    if (Array.isArray(entri)) {
      const valid = entri.filter(entriOlahragaValid);
      if (valid.length > 0) bersih[tanggal] = valid;
    }
  }
  return bersih;
}

/* --------------------------------------------------------------------------
   Makanan favorit (nutrikala:favFoods) — array id makanan
   -------------------------------------------------------------------------- */

export function muatFavorit() {
  const data = amanAmbil(KEY.favorit);
  if (!Array.isArray(data)) return [];
  return data.filter((id) => typeof id === 'string').slice(-60);
}

/** Tambah/hapus id dari favorit. Kembalikan favorit terbaru + status. */
export function ubahFavorit(id, aktif) {
  if (typeof id !== 'string') return muatFavorit();
  const daftar = muatFavorit();
  const indeks = daftar.indexOf(id);
  if (aktif && indeks === -1) daftar.push(id);
  if (!aktif && indeks !== -1) daftar.splice(indeks, 1);
  amanSimpan(KEY.favorit, daftar);
  return daftar;
}

/* --------------------------------------------------------------------------
   Makanan terakhir dipakai (nutrikala:recentFoods) — array id, maks 10
   -------------------------------------------------------------------------- */

export const MAKS_TERBARU = 10;

export function muatMakananTerbaru() {
  const data = amanAmbil(KEY.terbaru);
  if (!Array.isArray(data)) return [];
  return data.filter((id) => typeof id === 'string').slice(0, MAKS_TERBARU);
}

/** Catat id makanan yang baru dipakai (paling depan, tanpa duplikat). */
export function catatMakananDipakai(id) {
  if (typeof id !== 'string') return muatMakananTerbaru();
  const daftar = muatMakananTerbaru().filter((item) => item !== id);
  daftar.unshift(id);
  const terpotong = daftar.slice(0, MAKS_TERBARU);
  amanSimpan(KEY.terbaru, terpotong);
  return terpotong;
}

/* --------------------------------------------------------------------------
   Makanan kustom (nutrikala:foodKustom) — array objek makanan
   -------------------------------------------------------------------------- */

export const MAKS_KUSTOM = 50;

/** Validasi bentuk makanan kustom; kembalikan objek bersih atau null. */
export function bersihkanMakananKustom(makanan) {
  if (!makanan || typeof makanan !== 'object') return null;
  const nama = typeof makanan.name === 'string'
    ? makanan.name.trim().slice(0, 40) : '';
  const kcal = Number(makanan.kcal);
  if (!nama || !Number.isFinite(kcal) || kcal <= 0 || kcal > 5000) return null;
  const makro = (nilai, maks) => {
    const angka = Number(nilai);
    return Number.isFinite(angka) && angka >= 0 && angka <= maks
      ? Math.round(angka * 10) / 10 : 0;
  };
  return {
    id: typeof makanan.id === 'string' ? makanan.id : '',
    name: nama,
    portion: typeof makanan.portion === 'string' ? makanan.portion.slice(0, 30) : '',
    kcal: Math.round(kcal),
    protein: makro(makanan.protein, 400),
    carbs: makro(makanan.carbs, 400),
    fat: makro(makanan.fat, 300),
    kustom: true,
    tags: ['camilan'],
  };
}

export function muatMakananKustom() {
  const data = amanAmbil(KEY.kustom);
  if (!Array.isArray(data)) return [];
  return data
    .map(bersihkanMakananKustom)
    .filter(Boolean);
}

/** Tambah makanan kustom; id dibuat di sini bila belum ada. */
export function tambahMakananKustom(makanan) {
  const bersih = bersihkanMakananKustom(makanan);
  if (!bersih) return null;
  if (!bersih.id) {
    bersih.id = `kustom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  const daftar = muatMakananKustom();
  daftar.push(bersih);
  return amanSimpan(KEY.kustom, daftar.slice(-MAKS_KUSTOM)) ? bersih : null;
}

/* --------------------------------------------------------------------------
   Rencana menu mingguan & checklist belanja (tugas 2.11 / 2.12)
   Isi rencana dihitung dari FOODS (data.js); di sini hanya seed & centangan.
   -------------------------------------------------------------------------- */

/** Seed rencana; dibuat sekali dan dipakai ulang agar menu stabil. */
export function muatSeedRencana() {
  const angka = Number(amanAmbil(KEY.rencana));
  if (Number.isFinite(angka) && angka > 0) return Math.floor(angka);
  const baru = Math.floor(Math.random() * 1e9) + 1;
  amanSimpan(KEY.rencana, baru);
  return baru;
}

/** Simpan seed baru (tombol "Acak ulang"). */
export function simpanSeedRencana(seed) {
  if (!Number.isFinite(Number(seed)) || Number(seed) <= 0) return false;
  return amanSimpan(KEY.rencana, Math.floor(Number(seed)));
}

/** Daftar id makanan yang sudah dicentang pada daftar belanja. */
export function muatCentangBelanja() {
  const data = amanAmbil(KEY.belanja);
  if (!Array.isArray(data)) return [];
  return data.filter((id) => typeof id === 'string');
}

/** Tambah/hapus centang belanja. Kembalikan daftar terbaru. */
export function ubahCentangBelanja(id, aktif) {
  if (typeof id !== 'string') return muatCentangBelanja();
  const daftar = muatCentangBelanja();
  const indeks = daftar.indexOf(id);
  if (aktif && indeks === -1) daftar.push(id);
  if (!aktif && indeks !== -1) daftar.splice(indeks, 1);
  amanSimpan(KEY.belanja, daftar);
  return daftar;
}

/** Kosongkan checklist belanja (dipakai saat menu diacak ulang). */
export function bersihkanCentangBelanja() {
  amanHapus(KEY.belanja);
}

/* --------------------------------------------------------------------------
   Pengingat harian (nutrikala:reminders) — tugas 4.1
   { airAktif: bool, makanAktif: bool }
   -------------------------------------------------------------------------- */

export function muatPengingat() {
  const data = amanAmbil(KEY.pengingat);
  return {
    airAktif: Boolean(data && data.airAktif),
    makanAktif: Boolean(data && data.makanAktif),
  };
}

export function simpanPengingat(pengingat) {
  const sekarang = muatPengingat();
  const baru = {
    airAktif: typeof pengingat.airAktif === 'boolean'
      ? pengingat.airAktif : sekarang.airAktif,
    makanAktif: typeof pengingat.makanAktif === 'boolean'
      ? pengingat.makanAktif : sekarang.makanAktif,
  };
  return amanSimpan(KEY.pengingat, baru) ? baru : null;
}

/* --------------------------------------------------------------------------
   Jepretan air harian (nutrikala:waterLog) — untuk badge target air (4.3)
   Array { date, gelas, targetGelas } — satu entri per hari.
   -------------------------------------------------------------------------- */

export const MAKS_LOG_AIR = 60;

export function muatLogAir() {
  const data = amanAmbil(KEY.airRiwayat);
  if (!Array.isArray(data)) return [];
  return data
    .filter((entri) => entri && typeof entri.date === 'string')
    .map((entri) => ({
      date: entri.date,
      gelas: Number.isFinite(Number(entri.gelas)) ? Number(entri.gelas) : 0,
      targetGelas: Number.isFinite(Number(entri.targetGelas))
        ? Number(entri.targetGelas) : 0,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-MAKS_LOG_AIR);
}

/** Simpan snapshot air hari ini (timpa bila tanggal sama). */
export function catatSnapshotAir(gelas, targetGelas) {
  const hariIni = tanggalHariIni();
  const isi = Math.max(0, Math.round(Number(gelas) || 0));
  const target = Math.max(0, Math.round(Number(targetGelas) || 0));

  const log = muatLogAir();
  const indeks = log.findIndex((entri) => entri.date === hariIni);
  if (indeks >= 0) {
    log[indeks] = { date: hariIni, gelas: isi, targetGelas: target };
  } else {
    log.push({ date: hariIni, gelas: isi, targetGelas: target });
  }
  return amanSimpan(KEY.airRiwayat, log.slice(-MAKS_LOG_AIR));
}

/* --------------------------------------------------------------------------
   Pencapaian (badge) & onboarding (tugas 4.3 / 4.5)
   -------------------------------------------------------------------------- */

/** Daftar id badge yang sudah pernah dilihat pengguna (titik lonceng). */
export function muatBadgeDilihat() {
  const data = amanAmbil(KEY.badgeDilihat);
  if (!Array.isArray(data)) return [];
  return data.filter((id) => typeof id === 'string');
}

export function tandaiBadgeDilihat(ids) {
  const baru = (Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === 'string');
  if (baru.length === 0) return muatBadgeDilihat();

  const lama = muatBadgeDilihat();
  const gabung = [...new Set([...lama, ...baru])];
  amanSimpan(KEY.badgeDilihat, gabung);
  return gabung;
}

/** True bila onboarding sudah pernah ditampilkan/dituntaskan. */
export function muatOnboardingDilihat() {
  return amanAmbil(KEY.onboarding) === true;
}

export function selesaiOnboarding() {
  return amanSimpan(KEY.onboarding, true);
}
