/* ==========================================================================
   workout.js — Halaman Olahraga: ringkasan mingguan, riwayat per hari,
   katalog latihan + filter + detail, pencatat aktivitas (rumus MET),
   rekomendasi sesuai tujuan profil, dan timer interval akurat (timestamp).
   ========================================================================== */

import {
  EXERCISES,
  KATEGORI_LATIHAN,
  TEMPAT_LATIHAN,
  TINGKAT_LATIHAN,
} from './data.js';
import { TARGET_MENIT_MINGGUAN, kaloriOlahraga } from './nutrition.js';
import { formatDesimal, formatRibuan, toast, toastAksi } from './ui.js';
import {
  muatLogOlahraga,
  muatProfil,
  muatSemuaLogOlahraga,
  simpanLogOlahraga,
  tanggalHariIni,
} from './storage.js';

const TARGET_MINGGU = TARGET_MENIT_MINGGUAN;
const LANGKAH_MENIT = 5;
const BERAT_DEFAULT = 60;

const state = {
  tanggal: tanggalHariIni(),
  terpasang: false,
  filter: { kategori: 'semua', durasi: 0, tempat: 'semua', level: 'semua' },
  dialog: null,
  detailId: null,
  timerInterval: null,
};

/* --------------------------------------------------------------------------
   Utilitas elemen & format
   -------------------------------------------------------------------------- */

function ambil(id) {
  return document.getElementById(id);
}

function elemen(tag, kelas, teks) {
  const node = document.createElement(tag);
  if (kelas) node.className = kelas;
  if (teks !== undefined) node.textContent = teks;
  return node;
}

function uuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `wo-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function geserTanggal(tanggal, hari) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const dari = new Date(y, m - 1, d);
  dari.setDate(dari.getDate() + hari);
  const dua = (n) => String(n).padStart(2, '0');
  return `${dari.getFullYear()}-${dua(dari.getMonth() + 1)}-${dua(dari.getDate())}`;
}

function labelTanggal(tanggal) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const diformat = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const dasar = diformat.format(new Date(y, m - 1, d));
  return tanggal === tanggalHariIni() ? `${dasar} · hari ini` : dasar;
}

/** Tanggal Senin dari minggu yang memuat tanggal (YYYY-MM-DD). */
function seninDari(tanggal) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const obj = new Date(y, m - 1, d);
  const geser = (obj.getDay() + 6) % 7; // Minggu=0 → mundur 6
  return geserTanggal(tanggal, -geser);
}

function beratTubuh() {
  const profil = muatProfil();
  const berat = Number(profil && profil.weightKg);
  return Number.isFinite(berat) && berat >= 20 && berat <= 300 ? berat : BERAT_DEFAULT;
}

function cariLatihan(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/* --------------------------------------------------------------------------
   Ringkasan mingguan (tugas 3.3): menit, kkal, streak
   -------------------------------------------------------------------------- */

function ringkasanMinggu() {
  const semua = muatSemuaLogOlahraga();
  const senin = seninDari(tanggalHariIni());
  let menitAwal = 0;
  let kkalAwal = 0;
  let hariAktif = 0;

  for (let i = 0; i < 7; i++) {
    const tanggal = geserTanggal(senin, i);
    const log = semua[tanggal];
    if (!log) continue;
    let menitHari = 0;
    for (const entri of log) {
      menitHari += Number(entri.minutes) || 0;
      kkalAwal += Number(entri.kcal) || 0;
    }
    if (menitHari > 0) hariAktif++;
    menitAwal += menitHari;
  }

  return {
    menit: menitAwal,
    kkal: Math.round(kkalAwal),
    hariAktif,
    streak: hitungStreak(semua),
  };
}

/** Streak = hari aktif beruntun (datenya kembali dari hari ini/kemarin). */
function hitungStreak(semua) {
  const aktif = (tanggal) => {
    const log = semua[tanggal];
    return log && log.some((entri) => (Number(entri.minutes) || 0) > 0);
  };

  let mulai = tanggalHariIni();
  if (!aktif(mulai)) {
    const kemarin = geserTanggal(mulai, -1);
    if (!aktif(kemarin)) return 0;
    mulai = kemarin;
  }

  let beruntun = 0;
  let kursor = mulai;
  while (aktif(kursor)) {
    beruntun++;
    kursor = geserTanggal(kursor, -1);
  }
  return beruntun;
}

function renderRingkasan() {
  const ringkas = ringkasanMinggu();
  const persen = Math.min(100, Math.round((ringkas.menit / TARGET_MINGGU) * 100));

  const label = ambil('woMenitLabel');
  if (label) {
    label.textContent = `${ringkas.menit} / ${TARGET_MINGGU} menit aktif minggu ini`;
  }
  const barIsi = ambil('woMenitBar');
  if (barIsi) barIsi.style.width = `${persen}%`;
  const barWadah = barIsi ? barIsi.parentElement : null;
  if (barWadah) barWadah.setAttribute('aria-valuenow', String(persen));

  const kkalEl = ambil('woKkal');
  if (kkalEl) kkalEl.textContent = `${formatRibuan(ringkas.kkal)} kkal`;

  const hariEl = ambil('woHariAktif');
  if (hariEl) hariEl.textContent = `${ringkas.hariAktif} dari 7 hari`;

  const streakEl = ambil('woStreak');
  if (streakEl) {
    streakEl.hidden = ringkas.streak < 2;
    streakEl.textContent = `🔥 ${ringkas.streak} hari beruntun`;
  }
}

/* --------------------------------------------------------------------------
   Rekomendasi sesuai tujuan profil (tugas 3.7)
   -------------------------------------------------------------------------- */

const KATEGORI_REKO = {
  lose: {
    urutan: ['kardio', 'kekuatan', 'peregangan'],
    teks: 'Untuk menurunkan berat: utamakan kardio, dingin dengan kekuatan ringan.',
  },
  gain: {
    urutan: ['kekuatan', 'peregangan', 'kardio'],
    teks: 'Untuk menaikkan berat: fokus latihan kekuatan, sambil jaga peregangan.',
  },
  maintain: {
    urutan: ['kardio', 'kekuatan', 'peregangan'],
    teks: 'Untuk menjaga: campuriah kardio, kekuatan, dan peregangan setiap minggu.',
  },
};

function renderRekomendasi() {
  const wadah = ambil('woRekoChips');
  const teks = ambil('woRekoTeks');
  if (!wadah) return;
  wadah.replaceChildren();

  const profil = muatProfil();
  const rute = KATEGORI_REKO[profil && profil.goal] || KATEGORI_REKO.maintain;
  if (teks) {
    teks.textContent = profil
      ? rute.teks
      : 'Tanpa profil: campuran kardio, kekuatan, dan peregangan. Lengkapi profil di tab Akun untuk rekomendasi spesifik.';
  }

  const terpilih = [];
  for (const kategori of rute.urutan) {
    for (const latihan of EXERCISES) {
      if (latihan.category === kategori && terpilih.length < 6) terpilih.push(latihan);
    }
  }

  for (const latihan of terpilih) {
    const chip = elemen('button', 'wo__chipLatihan', `${latihan.icon} ${latihan.name}`);
    chip.type = 'button';
    chip.dataset.latihanId = latihan.id;
    wadah.appendChild(chip);
  }
}

/* --------------------------------------------------------------------------
   Riwayat per hari (tugas 3.9) + navigasi tanggal
   -------------------------------------------------------------------------- */

function totalHari(tanggal) {
  const log = muatLogOlahraga(tanggal);
  let menit = 0;
  let kkal = 0;
  for (const entri of log) {
    menit += Number(entri.minutes) || 0;
    kkal += Number(entri.kcal) || 0;
  }
  return { log, menit, kkal: Math.round(kkal) };
}

function renderRiwayat() {
  const wadah = ambil('woRiwayat');
  if (!wadah) return;
  wadah.replaceChildren();

  const tanggalLabel = ambil('woTanggalLabel');
  if (tanggalLabel) tanggalLabel.textContent = labelTanggal(state.tanggal);

  const tombolHariIni = ambil('woHariIni');
  if (tombolHariIni) tombolHariIni.hidden = state.tanggal === tanggalHariIni();
  const tombolBerikut = ambil('woHariBerikut');
  if (tombolBerikut) tombolBerikut.disabled = state.tanggal >= tanggalHariIni();

  const { log, menit, kkal } = totalHari(state.tanggal);
  if (log.length === 0) {
    wadah.appendChild(elemen('p', 'wo__kosong',
      'Belum ada aktivitas tercatat di hari ini. Coba catat satu latihan kecil, ya.'));
    return;
  }

  const daftar = elemen('ul', 'wo__daftar');
  for (const entri of log) {
    daftar.appendChild(buatBarisRiwayat(entri));
  }
  wadah.appendChild(daftar);

  const ringkasHari = elemen('p', 'wo__riwayatRingkas',
    `Subtotal: ${formatRibuan(menit)} menit · ${formatRibuan(kkal)} kkal`);
  wadah.appendChild(ringkasHari);
}

function buatBarisRiwayat(entri) {
  const baris = elemen('li', 'wo__baris');
  const teks = elemen('div', 'wo__barisTeks');
  teks.appendChild(elemen('span', 'wo__barisNama',
    `${entri.icon ? entri.icon + ' ' : ''}${entri.name}`));
  const catatan = entri.kcalManual ? ' (kalori manual)' : '';
  teks.appendChild(elemen('span', 'wo__barisKet',
    `${formatDesimal(Number(entri.minutes))} menit · ${formatRibuan(Math.round(Number(entri.kcal)))} kkal${catatan}`));
  baris.appendChild(teks);

  const btnHapus = elemen('button', 'wo__aksi wo__aksi--hapus', '🗑️');
  btnHapus.type = 'button';
  btnHapus.dataset.aksi = 'hapus';
  btnHapus.dataset.entriId = entri.id;
  btnHapus.setAttribute('aria-label', `Hapus ${entri.name} dari riwayat`);
  baris.appendChild(btnHapus);
  return baris;
}

function hapusEntriRiwayat(entriId) {
  const log = muatLogOlahraga(state.tanggal);
  const indeks = log.findIndex((item) => item.id === entriId);
  const entri = log[indeks];
  if (!entri) return;
  log.splice(indeks, 1);
  if (!simpanLogOlahraga(state.tanggal, log)) {
    toast('Gagal menghapus. Coba lagi, ya.');
    return;
  }
  renderSemua();

  toastAksi(`${entri.name} dihapus dari riwayat.`, 'Urungkan', () => {
    const logKini = muatLogOlahraga(state.tanggal);
    logKini.splice(Math.min(indeks, logKini.length), 0, entri);
    simpanLogOlahraga(state.tanggal, logKini);
    renderSemua();
    toast('Entri dikembalikan.');
  });
}

function geserHari(hari) {
  if (hari > 0 && state.tanggal >= tanggalHariIni()) return;
  state.tanggal = geserTanggal(state.tanggal, hari);
  renderRiwayat();
}

/* --------------------------------------------------------------------------
   Katalog latihan + filter (tugas 3.5)
   -------------------------------------------------------------------------- */

function satufilterLatihan() {
  return EXERCISES.filter((latihan) => {
    if (state.filter.kategori !== 'semua' && latihan.category !== state.filter.kategori) return false;
    if (state.filter.tempat !== 'semua' && latihan.place !== state.filter.tempat) return false;
    if (state.filter.level !== 'semua' && latihan.level !== state.filter.level) return false;
    if (state.filter.durasi > 0 && latihan.minutes > state.filter.durasi) return false;
    return true;
  });
}

function renderKatalog() {
  const wadah = ambil('woKatalog');
  if (!wadah) return;
  wadah.replaceChildren();

  const hasil = satufilterLatihan();
  if (hasil.length === 0) {
    wadah.appendChild(elemen('p', 'wo__kosong',
      'Tidak ada latihan yang cocok dengan filter. Longgarkan filternya sedikit.'));
    return;
  }

  const daftar = elemen('ul', 'wo__katalogDaftar');
  for (const latihan of hasil) {
    daftar.appendChild(buatKartuLatihan(latihan));
  }
  wadah.appendChild(daftar);
}

function buatKartuLatihan(latihan) {
  const item = elemen('li', 'wo__kartuItem');
  const kartu = elemen('button', 'wo__kartu');
  kartu.type = 'button';
  kartu.dataset.latihanId = latihan.id;
  kartu.setAttribute('aria-label', `Detail ${latihan.name}`);

  const kepala = elemen('div', 'wo__kartuKepala');
  kepala.appendChild(elemen('span', 'wo__kartuIkon', `${latihan.icon} `));
  kepala.appendChild(elemen('span', 'wo__kartuNama', latihan.name));
  kartu.appendChild(kepala);

  const chipEl = elemen('div', 'wo__kartuChip');
  chipEl.appendChild(elemen('span', 'wo__chip',
    KATEGORI_LATIHAN[latihan.category]));
  chipEl.appendChild(elemen('span', 'wo__chip',
    `${latihan.minutes} mnt`));
  chipEl.appendChild(elemen('span', 'wo__chip',
    TINGKAT_LATIHAN[latihan.level]));
  kartu.appendChild(chipEl);

  item.appendChild(kartu);
  return item;
}

/* --------------------------------------------------------------------------
   Detail latihan (tugas 3.6): langkah, tips, tombol Catat / Mulai
   -------------------------------------------------------------------------- */

function bukaDetail(id) {
  const detail = ambil('woDetail');
  const latihan = cariLatihan(id);
  if (!detail || !latihan) return;
  state.detailId = id;
  detail.replaceChildren();

  const kepala = elemen('div', 'kartu__kepala');
  const judul = elemen('h3', 'kartu__judul', `${latihan.name}`);
  const tutup = elemen('button', 'wo__detailTutup', '×');
  tutup.type = 'button';
  tutup.dataset.aksi = 'tutup-detail';
  tutup.setAttribute('aria-label', 'Tutup detail latihan');
  kepala.appendChild(judul);
  kepala.appendChild(tutup);
  detail.appendChild(kepala);

  const chipEl = elemen('div', 'wo__detailChip');
  const chip = (teks) => chipEl.appendChild(elemen('span', 'wo__chip', teks));
  chip(`MET ${latihan.met}`);
  chip(KATEGORI_LATIHAN[latihan.category]);
  chip(TEMPAT_LATIHAN[latihan.place]);
  chip(TINGKAT_LATIHAN[latihan.level]);
  detail.appendChild(chipEl);

  const daftar = elemen('ol', 'wo__langkah');
  for (const langkah of latihan.steps) daftar.appendChild(elemen('li', '', langkah));
  detail.appendChild(daftar);

  if (latihan.tips) {
    const tips = elemen('p', 'wo__tips', `💡 ${latihan.tips}`);
    detail.appendChild(tips);
  }

  const aksi = elemen('div', 'wo__detailAksi');
  const btnCatat = elemen('button', 'tombol tombol--utama', 'Catat latihan');
  btnCatat.type = 'button';
  btnCatat.dataset.aksi = 'buka-catat';
  btnCatat.dataset.latihanId = latihan.id;
  aksi.appendChild(btnCatat);

  const btnTimer = elemen('button', 'tombol tombol--garis',
    `Mulai interval (${latihan.minutes} mnt)`);
  btnTimer.type = 'button';
  btnTimer.dataset.aksi = 'mulai-timer';
  btnTimer.dataset.latihanId = latihan.id;
  aksi.appendChild(btnTimer);
  detail.appendChild(aksi);

  detail.hidden = false;
}

function tutupDetail() {
  state.detailId = null;
  const detail = ambil('woDetail');
  if (detail) {
    detail.hidden = true;
    detail.replaceChildren();
  }
}

/* --------------------------------------------------------------------------
   Dialog pencatat (tugas 3.4): cari latihan + menit + kalori MET/manual
   -------------------------------------------------------------------------- */

function bukaDialog(latihanId = null) {
  state.dialog = {
    latihanId,
    menit: null,
    manual: false,
  };

  const inputCari = ambil('woCari');
  if (inputCari) {
    inputCari.value = '';
    if (!latihanId) inputCari.focus();
  }
  const manual = ambil('woManualCek');
  if (manual) manual.checked = false;
  const manualAngka = ambil('woManualAngka');
  if (manualAngka) {
    manualAngka.value = '';
    manualAngka.hidden = true;
  }

  if (latihanId) {
    const latihan = cariLatihan(latihanId);
    if (latihan) state.dialog.menit = latihan.minutes;
  }
  if (!state.dialog.menit) state.dialog.menit = 20;

  renderHasilDialog('');
  renderDialogPorsi();
  renderPreviewKkal();

  const dialogEl = ambil('woDialog');
  if (dialogEl) dialogEl.hidden = false;
}

function tutupDialog() {
  state.dialog = null;
  const dialog = ambil('woDialog');
  if (dialog) dialog.hidden = true;
}

function renderDialogPorsi() {
  const label = ambil('woPorsiLatihan');
  const latihan = state.dialog ? cariLatihan(state.dialog.latihanId) : null;
  if (label) {
    label.textContent = latihan
      ? `${latihan.minutes} mnt · ${TEMPAT_LATIHAN[latihan.place]}`
      : 'Pilih latihan dulu';
  }
  const menitEl = ambil('woMenitNilai');
  if (menitEl && state.dialog) menitEl.textContent = formatDesimal(state.dialog.menit);
}

function ubahMenit(langkah) {
  if (!state.dialog) return;
  const baru = Math.max(5, Math.min(600, state.dialog.menit + langkah));
  state.dialog.menit = baru;
  renderDialogPorsi();
  renderPreviewKkal();
}

function polarKcal() {
  if (!state.dialog) return null;
  const latihan = cariLatihan(state.dialog.latihanId);
  if (!latihan) return { kkal: null, manual: false };

  const manualCek = ambil('woManualCek');
  const manualAngka = ambil('woManualAngka');
  if (manualCek && manualCek.checked && manualAngka) {
    const nilai = Number(manualAngka.value);
    if (Number.isFinite(nilai) && nilai > 0 && nilai <= 5000) {
      return { kkal: Math.round(nilai), manual: true };
    }
    return { kkal: null, manual: true };
  }
  const kcal = kaloriOlahraga(latihan.met, beratTubuh(), state.dialog.menit);
  return { kkal: kcal, manual: false };
}

function renderPreviewKkal() {
  const pakai = polarKcal();
  const previewEl = ambil('woPreviewKkal');
  if (!previewEl) return;
  if (!state.dialog || !cariLatihan(state.dialog.latihanId)) {
    previewEl.textContent = 'Pilih latihan dulu.';
    return;
  }
  if (pakai.manual && pakai.kkal === null) {
    previewEl.textContent = 'Isi angka kalori manual (1–5000 kkal).';
    return;
  }
  previewEl.textContent = `${formatRibuan(pakai.kkal)} kkal` +
    (pakai.manual ? ' (manual)' : ` (MET × ${formatDesimal(beratTubuh())} kg)`);
}

function simpanEntri() {
  if (!state.dialog) return;
  const latihan = cariLatihan(state.dialog.latihanId);
  const pakai = polarKcal();
  if (!latihan) {
    toast('Pilih latihan dulu di daftar.');
    return;
  }
  if (pakai.kkal === null) {
    toast(pakai.manual ? 'Isi kalori manual (1–5000) dulu, ya.' : 'Kalori tidak valid.');
    return;
  }

  const entri = {
    id: uuid(),
    exerciseId: latihan.id,
    name: latihan.name,
    icon: latihan.icon,
    minutes: state.dialog.menit,
    kcal: pakai.kkal,
    kcalManual: pakai.manual,
    addedAt: new Date().toISOString(),
  };
  const log = muatLogOlahraga(state.tanggal);
  log.push(entri);
  if (!simpanLogOlahraga(state.tanggal, log)) {
    toast('Gagal menyimpan. Coba lagi, ya.');
    return;
  }

  tutupDialog();
  renderSemua();
  toast(`${latihan.icon || ''} ${latihan.name} tercatat — semangat!`.trim());
}

function renderHasilDialog(kata) {
  const wadah = ambil('woHasil');
  if (!wadah) return;
  wadah.replaceChildren();

  const kataBersih = (kata || '').trim().toLowerCase();
  let hasil;
  if (!kataBersih) {
    // Tanpa kata: sorot 8 yang sering dianjurkan (short list biar ringan).
    hasil = ['jalan-cepat', 'jogging-santai', 'squat', 'push-up', 'plank',
      'lompat-tali', 'yoga-yin', 'treadmill-incline']
      .map(cariLatihan).filter(Boolean);
  } else {
    hasil = EXERCISES.filter((e) => e.name.toLowerCase().includes(kataBersih));
  }

  if (hasil.length === 0) {
    wadah.appendChild(elemen('p', 'wo__kosong', 'Tidak ketemu. Isi filternya lain?'));
    return;
  }

  const daftar = elemen('ul', 'wo__hasilDaftar');
  for (const latihan of hasil) {
    const baris = elemen('li');
    const tombol = elemen('button', 'wo__hasilTombol');
    tombol.type = 'button';
    tombol.dataset.latihanId = latihan.id;
    tombol.appendChild(elemen('span', 'wo__hasilNama',
      `${latihan.icon ? latihan.icon + ' ' : ''}${latihan.name}`));
    tombol.appendChild(elemen('span', 'wo__hasilKet',
      `${KATEGORI_LATIHAN[latihan.category]} · MET ${latihan.met} · ${latihan.minutes} mnt`));
    baris.appendChild(tombol);
    daftar.appendChild(baris);
  }
  wadah.appendChild(daftar);
}

/* --------------------------------------------------------------------------
   Timer interval (tugas 3.8) — hitung dari timestamp agar akurat
   -------------------------------------------------------------------------- */

const timer = {
  aktif: false,
  berjalan: false,
  fase: 'kerja',
  kerjaMs: 2 * 60 * 1000,
  istirahatMs: 1 * 60 * 1000,
  putaranTotal: 4,
  putaranKini: 1,
  sisaCicilan: 0,
  mulaiEpoch: 0,
};

function bunyi() {
  try {
    const Ktx = window.AudioContext || window.webkitAudioContext;
    if (!Ktx) return;
    const ctx = new Ktx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => ctx.close();
  } catch (err) {
    console.warn('[NutriKala] Bunyi timer gagal:', err);
  }
}

function getar(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function sisaFaseMs() {
  if (!timer.berjalan) return timer.sisaCicilan;
  return Math.max(0, timer.sisaCicilan - (Date.now() - timer.mulaiEpoch));
}

function formatMmS(ms) {
  const totalDetik = Math.max(0, Math.ceil(ms / 1000));
  const mnt = Math.floor(totalDetik / 60);
  const dtk = totalDetik % 60;
  const dua = (n) => String(n).padStart(2, '0');
  return `${dua(mnt)}:${dua(dtk)}`;
}

function renderTampilanTimer() {
  const sisa = sisaFaseMs();
  const angka = ambil('woTimerAngka');
  if (angka) angka.textContent = formatMmS(sisa);

  const faseEl = ambil('woTimerFase');
  if (faseEl) {
    if (!timer.aktif) {
      faseEl.textContent = 'Siap';
    } else if (timer.berjalan) {
      faseEl.textContent = timer.fase === 'kerja'
        ? `Putaran ${timer.putaranKini}/${timer.putaranTotal} · Kerja`
        : `Putaran ${timer.putaranKini}/${timer.putaranTotal} · Istirahat`;
    } else {
      faseEl.textContent = 'Jeda';
    }
  }

  const putaranInfo = ambil('woTimerPutaranInfo');
  if (putaranInfo) {
    putaranInfo.textContent = `Total ${timer.putaranTotal} putaran` +
      (timer.aktif ? ` · ${timer.fase === 'kerja' ? 'kerja' : 'istirahat'}` : '');
  }

  // Bar sisa fase
  const durasiFase = timer.fase === 'kerja' ? timer.kerjaMs : timer.istirahatMs;
  const persen = durasiFase > 0
    ? Math.min(100, Math.round((sisa / durasiFase) * 100)) : 0;
  const barIsi = ambil('woTimerBar');
  if (barIsi) barIsi.style.width = `${persen}%`;

  const btn = ambil('woTimerMulai');
  if (btn) {
    btn.textContent = !timer.aktif
      ? 'Mulai'
      : timer.berjalan ? 'Jeda' : 'Lanjut';
  }
}

function pindahFase() {
  if (timer.fase === 'kerja') {
    if (timer.putaranKini >= timer.putaranTotal) {
      // Selesai!
      timer.aktif = false;
      timer.berjalan = false;
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      berhentiNilai();
      getar([300, 200, 300]);
      bunyi();
      toast('Sesi latihan selesai 🎉');
      renderTampilanTimer();
      return;
    }
    timer.fase = 'istirahat';
    timer.sisaCicilan = timer.istirahatMs;
  } else {
    timer.putaranKini++;
    timer.fase = 'kerja';
    timer.sisaCicilan = timer.kerjaMs;
  }
  timer.mulaiEpoch = Date.now();
  getar(300);
  bunyi();
}

function berhentiNilai() {
  timer.fase = 'kerja';
  timer.putaranKini = 1;
  timer.sisaCicilan = timer.kerjaMs;
  timer.mulaiEpoch = 0;
}

function mulaiAtauJeda() {
  const btn = ambil('woTimerMulai');
  if (!timer.aktif) {
    // Mulai baru: baca pengaturan
    const kerja = Number(ambil('woTimerKerja')?.value);
    const istirahat = Number(ambil('woTimerIstirahat')?.value);
    const putaran = Number(ambil('woTimerPutaran')?.value);
    const kerjaOk = Number.isFinite(kerja) && kerja >= 1 && kerja <= 60;
    const istirahatOk = Number.isFinite(istirahat) && istirahat >= 0 && istirahat <= 30;
    const putaranOk = Number.isFinite(putaran) && putaran >= 1 && putaran <= 20;
    if (!kerjaOk || !istirahatOk || !putaranOk) {
      toast('Isi kerja 1–60, istirahat 0–30, putaran 1–20.');
      return;
    }
    timer.kerjaMs = kerja * 60 * 1000;
    timer.istirahatMs = istirahat * 60 * 1000;
    timer.putaranTotal = putaran;
    berhentiNilai();
    timer.aktif = true;
    timer.berjalan = true;
    timer.mulaiEpoch = Date.now();
    timer.sisaCicilan = timer.kerjaMs;
    getar(200);

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (!timer.aktif) return;
      const sisa = sisaFaseMs();
      if (sisa <= 0) {
        pindahFase();
      }
      renderTampilanTimer();
    }, 500);
    renderTampilanTimer();
    return;
  }

  if (timer.berjalan) {
    // Jeda
    timer.sisaCicilan = sisaFaseMs();
    timer.berjalan = false;
  } else {
    // Lanjut
    timer.mulaiEpoch = Date.now();
    timer.berjalan = true;
  }
  renderTampilanTimer();
}

function resetTimer() {
  timer.aktif = false;
  timer.berjalan = false;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  berhentiNilai();
  renderTampilanTimer();
}

/** Buat timer siap sesuai latihan (dari tombol "Mulai" di detail). */
function siapTimerDariLatihan(id) {
  const latihan = cariLatihan(id);
  if (!latihan) return;
  const kerja = Math.max(1, Math.round(latihan.minutes / 4));
  const inputKerja = ambil('woTimerKerja');
  const inputIstirahat = ambil('woTimerIstirahat');
  const inputPutaran = ambil('woTimerPutaran');
  if (inputKerja) inputKerja.value = String(Math.min(60, kerja));
  if (inputIstirahat) inputIstirahat.value = istirahatDefault(latihan);
  if (inputPutaran) inputPutaran.value = '4';
  resetTimer();
  const wadah = ambil('woTimer');
  if (wadah) wadah.scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast(`Timer siap untuk ${latihan.name}. Cek pengaturan, lalu tekan Mulai.`);
}

function istirahatDefault(latihan) {
  return latihan.category === 'kekuatan' ? '1' : '2';
}

/* --------------------------------------------------------------------------
   Pasang event (sekali)
   -------------------------------------------------------------------------- */

function pasangEvent() {
  if (!ambil('woHariSebelum') || ambil('woHariSebelum').dataset.woTerpasang) return;
  ambil('woHariSebelum').dataset.woTerpasang = '1';

  ambil('woHariSebelum').addEventListener('click', () => geserHari(-1));
  ambil('woHariBerikut').addEventListener('click', () => geserHari(1));
  ambil('woHariIni').addEventListener('click', () => {
    state.tanggal = tanggalHariIni();
    renderRiwayat();
  });

  // Pencatat: buka dialog
  ambil('woBukaDialog').addEventListener('click', () => bukaDialog(null));

  // Filter katalog
  const pasangFilter = (id, kunci, angka = false) => {
    const node = ambil(id);
    if (!node) return;
    node.addEventListener('change', () => {
      state.filter[kunci] = angka ? Number(node.value) || 0 : node.value;
      renderKatalog();
    });
  };
  pasangFilter('woFiltKategori', 'kategori');
  pasangFilter('woFiltDurasi', 'durasi', true);
  pasangFilter('woFiltTempat', 'tempat');
  pasangFilter('woFiltLevel', 'level');

  // Rekomendasi & katalog & detail (delegasi klik)
  const wadahKlik = [
    'woRekoChips',
    'woKatalog',
    'woDetail',
  ];
  for (const id of wadahKlik) {
    ambil(id)?.addEventListener('click', (event) => {
      const tombol = event.target.closest('[data-latihan-id], [data-aksi]');
      if (!tombol) return;
      if (tombol.dataset.aksi === 'tutup-detail') tutupDetail();
      if (tombol.dataset.aksi === 'buka-catat') {
        bukaDialog(tombol.dataset.latihanId);
      }
      if (tombol.dataset.aksi === 'mulai-timer') {
        siapTimerDariLatihan(tombol.dataset.latihanId);
      }
      if (tombol.dataset.latihanId && !tombol.dataset.aksi) {
        bukaDetail(tombol.dataset.latihanId);
      }
    });
  }

  // Riwayat: hapus entri (delegasi)
  ambil('woRiwayat').addEventListener('click', (event) => {
    const tombol = event.target.closest('[data-aksi="hapus"]');
    if (tombol) hapusEntriRiwayat(tombol.dataset.entriId);
  });

  // Dialog: pencarian + menit + manual + tutup + pilih
  ambil('woCari').addEventListener('input', (event) =>
    renderHasilDialog(event.target.value || ''));
  ambil('woTutupDialog').addEventListener('click', tutupDialog);
  ambil('woDialog').addEventListener('click', (event) => {
    if (event.target === ambil('woDialog')) tutupDialog();
    const tombol = event.target.closest('[data-latihan-id]');
    if (tombol && state.dialog) {
      state.dialog.latihanId = tombol.dataset.latihanId;
      const latihan = cariLatihan(state.dialog.latihanId);
      if (latihan) state.dialog.menit = latihan.minutes;
      renderHasilDialog(ambil('woCari')?.value || '');
      renderDialogPorsi();
      renderPreviewKkal();
      const tombolSimpan = ambil('woSimpanEntri');
      if (tombolSimpan) tombolSimpan.disabled = false;
    }
  });
  ambil('woMenitKurang').addEventListener('click', () => ubahMenit(-LANGKAH_MENIT));
  ambil('woMenitTambah').addEventListener('click', () => ubahMenit(LANGKAH_MENIT));
  ambil('woManualCek').addEventListener('change', (event) => {
    if (state.dialog) state.dialog.manual = event.target.checked;
    const manualAngka = ambil('woManualAngka');
    if (manualAngka) manualAngka.hidden = !event.target.checked;
    renderPreviewKkal();
  });
  ambil('woManualAngka').addEventListener('input', renderPreviewKkal);
  ambil('woSimpanEntri').addEventListener('click', simpanEntri);

  // Timer
  ambil('woTimerMulai').addEventListener('click', mulaiAtauJeda);
  ambil('woTimerReset').addEventListener('click', resetTimer);
}

/* --------------------------------------------------------------------------
   Render seluruh halaman
   -------------------------------------------------------------------------- */

function renderSemua() {
  renderRingkasan();
  renderRekomendasi();
  renderRiwayat();
  renderKatalog();
  if (!state.detailId) tutupDetail();
  renderTampilanTimer();
}

/**
 * Siapkan halaman Olahraga. Dipanggil sekali dari app.js; konten diperbarui
 * saat tanggal berubah, entri disimpan, atau timer berjalan.
 * @param {HTMLElement} container - elemen main#page-olahraga
 */
export function renderWorkoutPage(container) {
  if (!container) return;
  if (state.terpasang) {
    renderSemua();
    return;
  }
  pasangEvent();
  state.terpasang = true;
  renderSemua();
}