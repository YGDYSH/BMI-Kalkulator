/* ==========================================================================
   reminders.js — Pengingat minum air & makan lewat Notification API
   (tugas 4.1 desain.md). Izin hanya diminta saat pengguna menyalakan
   pengingat; ditangani bila browser tidak mendukung / izin ditolak.
   Penjadwalan memakai setTimeout ke waktu terdekat & diulang setiap
   terpicu / saat aplikasi kembali terlihat (notifikasi berjalan hanya
   selama aplikasi terbuka — tanpa backend, sesuai aturan proyek).
   ========================================================================== */

import { toast } from './ui.js';
import {
  muatPengingat,
  simpanPengingat,
} from './storage.js';

/** Jam pengingat (0–23). Air tiap ±2–3 jam, makan 3× sehari. */
const JAM_AIR = [8, 10, 12, 15, 17, 19];
const JAM_MAKAN = [7, 13, 19];

const ISI_NOTIF = {
  air: 'Saatnya segelas air 💧 Tubuh tetap segar, semangat harianmu juga.',
  makan: 'Waktunya makan 🍚 Jangan lewatkan porsi makmu hari ini, ya.',
};

const LABEL_TIPE = { air: 'minum air', makan: 'makan' };

/** Referensi timer di memori & callback lonceng dari app.js. */
let timerAktif = null;
let saatLoncengDibuka = null;

/* --------------------------------------------------------------------------
   Utilitas
   -------------------------------------------------------------------------- */

function ambil(id) {
  return document.getElementById(id);
}

/** Tanggal+waktu terdekat pada jam `jam` (besok bila sudah lewat). */
function waktuBerikutnya(jam) {
  const waktu = new Date();
  waktu.setHours(jam, 0, 0, 0);
  if (waktu <= new Date()) waktu.setDate(waktu.getDate() + 1);
  return waktu;
}

function didukung() {
  return 'Notification' in window;
}

function sebutTipe(pengingat) {
  const daftar = [];
  if (pengingat.airAktif) daftar.push(LABEL_TIPE.air);
  if (pengingat.makanAktif) daftar.push(LABEL_TIPE.makan);
  return daftar.length ? daftar.join(' & ') : 'tidak ada yang aktif';
}

/* --------------------------------------------------------------------------
   Pengiriman & penjadwalan notifikasi
   -------------------------------------------------------------------------- */

function kirim(tipe) {
  if (!didukung() || Notification.permission !== 'granted') return;
  try {
    const notif = new Notification('NutriKala', {
      body: ISI_NOTIF[tipe],
      tag: `nutrikala-${tipe}`,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.warn('[NutriKala] Notifikasi gagal dikirim:', err);
  }
}

/** Atur ulang timer; picu ke waktu terdekat dari jam yang aktif. */
function jadwalUlang() {
  if (timerAktif) {
    clearTimeout(timerAktif);
    timerAktif = null;
  }

  const pengingat = muatPengingat();
  const kandidat = [];
  if (pengingat.airAktif) {
    for (const jam of JAM_AIR) kandidat.push({ tipe: 'air', jam });
  }
  if (pengingat.makanAktif) {
    for (const jam of JAM_MAKAN) kandidat.push({ tipe: 'makan', jam });
  }
  if (kandidat.length === 0) return;

  let terdekat = null;
  for (const item of kandidat) {
    const waktu = waktuBerikutnya(item.jam);
    if (!terdekat || waktu < terdekat.waktu) {
      terdekat = { waktu, tipe: item.tipe };
    }
  }
  if (!terdekat) return;

  const jeda = Math.max(1000, terdekat.waktu.getTime() - Date.now());
  timerAktif = setTimeout(() => {
    kirim(terdekat.tipe);
    jadwalUlang();
  }, jeda);
}

/* --------------------------------------------------------------------------
   Panel pengingat (dibuka dari ikon lonceng)
   -------------------------------------------------------------------------- */

function renderPanel() {
  const pengingat = muatPengingat();

  const pasangan = [
    ['tglPengAir', pengingat.airAktif],
    ['tglPengMakan', pengingat.makanAktif],
  ];
  for (const [id, aktif] of pasangan) {
    const chip = ambil(id);
    if (chip) {
      chip.classList.toggle('profile__chip--aktif', aktif);
      chip.setAttribute('aria-pressed', String(aktif));
    }
  }

  const status = ambil('pengingatStatus');
  if (status) {
    if (!didukung()) {
      status.textContent = 'Browser ini belum mendukung notifikasi. Coba lewat Chrome/Firefox terbaru.';
    } else if (!pengingat.airAktif && !pengingat.makanAktif) {
      status.textContent = 'Belum ada pengingat aktif. Nyalakan di atas untuk mulai.';
    } else {
      const jamAir = `${JAM_AIR[0]}:00, ${JAM_AIR.slice(1).join(':00, ')}:00`;
      const jamMakan = `${JAM_MAKAN.slice(0, 2).join(':00 & ')}:00 & ${JAM_MAKAN[2]}:00`;
      const daftarJam = [];
      if (pengingat.airAktif) daftarJam.push(`air ${jamAir}`);
      if (pengingat.makanAktif) daftarJam.push(`makan ${jamMakan}`);
      status.textContent = `Pengingat aktif untuk ${sebutTipe(pengingat)} — ${daftarJam.join(' · ')}.`;
    }
  }
}

/** Ubah satu pengingat. Bila menyalakan: izin diminta di sini (4.1). */
async function ubahPengingat(tipe) {
  const sekarang = muatPengingat();
  const mauAktif = !(tipe === 'air' ? sekarang.airAktif : sekarang.makanAktif);

  if (mauAktif) {
    if (!didukung()) {
      toast('Browser ini belum mendukung notifikasi.');
      return;
    }
    let izin = Notification.permission;
    if (izin === 'default') {
      try {
        izin = await Notification.requestPermission();
      } catch (err) {
        console.warn('[NutriKala] Permintaan izin gagal:', err);
        izin = 'denied';
      }
    }
    if (izin !== 'granted') {
      toast('Izin notifikasi belum diberikan. Cek pengaturan situs di browsermu.');
      renderPanel();
      return;
    }
  }

  const tersimpan = simpanPengingat(
    tipe === 'air'
      ? { airAktif: mauAktif }
      : { makanAktif: mauAktif },
  );

  if (!tersimpan) {
    toast('Gagal menyimpan pengaturan pengingat. Coba lagi, ya.');
    return;
  }

  renderPanel();
  jadwalUlang();
  toast(mauAktif
    ? 'Pengingat dinyalakan. Sampai jumpa saat waktunya!'
    : 'Pengingat dimatikan.');
}

function bukaPanel() {
  renderPanel();
  const panel = ambil('panelPengingat');
  if (panel) panel.hidden = false;
  if (typeof saatLoncengDibuka === 'function') saatLoncengDibuka();
}

function tutupPanel() {
  const panel = ambil('panelPengingat');
  if (panel) panel.hidden = true;
}

/* --------------------------------------------------------------------------
   Mulai: pasang event & jadwal
   -------------------------------------------------------------------------- */

/**
 * Siapkan panel & pasang pengingat. Dipanggil sekali dari app.js.
 * Tidak pernah meminta izin secara otomatis di sini (aturan 4.1).
 * @param {{ saatLoncengDibuka?: () => void }} opsi
 */
export function mulaiPengingat(opsi = {}) {
  saatLoncengDibuka = typeof opsi.saatLoncengDibuka === 'function'
    ? opsi.saatLoncengDibuka
    : null;

  ambil('btnNotifikasi')?.addEventListener('click', bukaPanel);
  ambil('btnTutupPengingat')?.addEventListener('click', tutupPanel);
  ambil('panelPengingat')?.addEventListener('click', (event) => {
    if (event.target === ambil('panelPengingat')) tutupPanel();
  });
  ambil('tglPengAir')?.addEventListener('click', () => ubahPengingat('air'));
  ambil('tglPengMakan')?.addEventListener('click', () => ubahPengingat('makan'));

  // Segarkan jadwal saat aplikasi kembali terlihat (dari latar).
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) jadwalUlang();
  });

  renderPanelSilent();
  jadwalUlang();
}

/** Render sekali di mulai agar status siap jika panel dibuka cepat. */
function renderPanelSilent() {
  renderPanel();
}
