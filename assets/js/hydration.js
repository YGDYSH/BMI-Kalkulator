/* ==========================================================================
   hydration.js — Logika target air minum harian.
   Target = berat badan × 34 ml (tampil dibulatkan 0,1 liter).
   1 gelas = 250 ml. Status tersimpan per tanggal via storage.js.
   ========================================================================== */

import {
  muatAirHariIni,
  simpanAir,
  tanggalHariIni,
} from './storage.js';

export const ML_PER_GELAS = 250;
export const ML_PER_KG = 34;

/** Target air harian dalam mililiter (dibulatkan ke bulat terdekat). */
export function targetAirMl(berat) {
  const b = Number(berat);
  if (!Number.isFinite(b) || b <= 0) return 1500; // fallback aman
  return Math.round(b * ML_PER_KG);
}

/** Target air dalam liter, dibulatkan 0,1 (contoh: 2210 ml -> "2,2"). */
export function targetAirLiter(berat) {
  return (targetAirMl(berat) / 1000).toFixed(1).replace('.', ',');
}

/** Jumlah gelas yang dibutuhkan (dibulatkan ke atas, minimal 1). */
export function targetGelas(berat) {
  return Math.max(1, Math.ceil(targetAirMl(berat) / ML_PER_GELAS));
}

/**
 * Susun objek status hidrasi lengkap.
 * `gelas` di-clamp antara 0 dan target agar angka tetap masuk akal.
 */
export function statusAir(berat, gelas) {
  const target = targetGelas(berat);
  const terisi = Math.max(0, Math.min(target, Number(gelas) || 0));
  return {
    terisi,
    targetGelas: target,
    targetMl: targetAirMl(berat),
    targetLiter: targetAirLiter(berat),
    persen: target > 0 ? Math.round((terisi / target) * 100) : 0,
    selesai: terisi >= target,
  };
}

/** Baca status hidrasi hari ini (otomatis nol bila tanggal sudah berganti). */
export function muatStatusAir(berat) {
  const data = muatAirHariIni();
  return statusAir(berat, data.gelas);
}

/** Tambah satu gelas, lalu simpan. Mengembalikan status terbaru. */
export function tambahGelas(berat) {
  const data = muatAirHariIni();
  const sebelum = statusAir(berat, data.gelas);
  const baru = Math.min(sebelum.targetGelas, sebelum.terisi + 1);
  simpanAir({ tanggal: tanggalHariIni(), gelas: baru });
  return statusAir(berat, baru);
}

/** Urungkan satu gelas (tidak akan turun di bawah nol). */
export function kurangiGelas(berat) {
  const data = muatAirHariIni();
  const baru = Math.max(0, data.gelas - 1);
  simpanAir({ tanggal: tanggalHariIni(), gelas: baru });
  return statusAir(berat, baru);
}
