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
};

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
