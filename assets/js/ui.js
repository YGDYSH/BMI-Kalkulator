/* ==========================================================================
   ui.js — Semua urusan tampilan (DOM). Tidak menghitung, hanya merender.
   ========================================================================== */

/** Satuan tampilan tiap slider. */
const SATUAN = {
  usia: 'th',
  berat: 'kg',
  tinggi: 'cm',
};

/** Simpan referensi elemen sekali saja. */
const el = {
  sapaan: document.getElementById('sapaan'),
  bmiNilai: document.getElementById('bmiNilai'),
  bmiKategori: document.getElementById('bmiKategori'),
  bmiPesan: document.getElementById('bmiPesan'),
  skalaPenanda: document.getElementById('skalaPenanda'),
  skalaNilai: document.getElementById('skalaNilai'),
  toast: document.getElementById('toast'),
};

let jedaToast = null;

/* --------------------------------------------------------------------------
   Format angka gaya Indonesia
   -------------------------------------------------------------------------- */

/** Angka desimal memakai koma: 23.9 -> "23,9" */
export function formatDesimal(angka) {
  if (!Number.isFinite(angka)) return '—';
  return angka.toFixed(1).replace('.', ',');
}

/** Angka bulat memakai pemisah ribuan: 1950 -> "1.950" */
export function formatRibuan(angka) {
  if (!Number.isFinite(angka)) return '—';
  return new Intl.NumberFormat('id-ID').format(Math.round(angka));
}

/* --------------------------------------------------------------------------
   Sapaan sesuai jam
   -------------------------------------------------------------------------- */
export function sapaanSekarang() {
  const jam = new Date().getHours();
  if (jam >= 4 && jam < 11) return 'Selamat Pagi 🌤️';
  if (jam >= 11 && jam < 15) return 'Selamat Siang ☀️';
  if (jam >= 15 && jam < 18) return 'Selamat Sore 🌥️';
  return 'Selamat Malam 🌙';
}

export function renderSapaan() {
  if (el.sapaan) el.sapaan.textContent = sapaanSekarang();
}

/* --------------------------------------------------------------------------
   Slider hidup: nilai di kanan label + jejak terisi
   -------------------------------------------------------------------------- */
export function perbaruiSlider(id, nilai) {
  const input = document.getElementById(id);
  if (!input) return;

  const min = Number(input.min);
  const max = Number(input.max);
  const rentang = max - min || 1;
  const persen = Math.min(100, Math.max(0, ((nilai - min) / rentang) * 100));
  input.style.setProperty('--isi', `${persen}%`);

  const output = document.getElementById(`${id}Nilai`);
  if (output) output.textContent = `${nilai} ${SATUAN[id] || ''}`;
}

/** Render semua slider sesuai objek state. */
export function renderSlider(state) {
  Object.keys(SATUAN).forEach((id) => perbaruiSlider(id, state[id]));
}

/* --------------------------------------------------------------------------
   Pilihan gender
   -------------------------------------------------------------------------- */
export function renderGender(gender) {
  document.querySelectorAll('[data-gender]').forEach((tombol) => {
    const aktif = tombol.dataset.gender === gender;
    tombol.classList.toggle('gender__tombol--aktif', aktif);
    tombol.setAttribute('aria-pressed', String(aktif));
  });
}

/* --------------------------------------------------------------------------
   Hasil pengukuran
   -------------------------------------------------------------------------- */
export function renderHasil({ bmi, kategori, pesan, posisi }) {
  if (!Number.isFinite(bmi) || !kategori) return false;

  el.bmiNilai.textContent = formatDesimal(bmi);
  el.bmiKategori.textContent = kategori.label;
  el.bmiKategori.dataset.kategori = kategori.key;
  el.bmiPesan.textContent = pesan;
  el.skalaNilai.textContent = formatDesimal(bmi);
  el.skalaPenanda.style.left = `${posisi}%`;
  return true;
}

/* --------------------------------------------------------------------------
   Nutrisi harian: kalori & makronutrien
   -------------------------------------------------------------------------- */
export function renderNutrisi({ kalori, rasio, gram }) {
  const kaloriNilai = ambil('kaloriNilai');
  if (kaloriNilai) kaloriNilai.textContent = formatRibuan(kalori);

  const makro = [
    { nama: 'Karbo', persen: rasio.karbo, gram: gram.karbo },
    { nama: 'Protein', persen: rasio.protein, gram: gram.protein },
    { nama: 'Lemak', persen: rasio.lemak, gram: gram.lemak },
  ];

  makro.forEach((item) => {
    const persenEl = ambil(`makro${item.nama}Persen`);
    const gramEl = ambil(`makro${item.nama}Gram`);
    if (persenEl) persenEl.textContent = `${item.persen}%`;
    if (gramEl) gramEl.textContent = `± ${item.gram} g`;
  });
}

/* --------------------------------------------------------------------------
   Inspirasi menu rumahan
   -------------------------------------------------------------------------- */
export function renderMenu(menu, kalori) {
  const pembagian = { sarapan: 0.25, siang: 0.4, malam: 0.35 };

  for (const waktu of Object.keys(pembagian)) {
    const item = menu[waktu];
    if (!item) continue;
    const namaEl = ambil(`menu${kapital(waktu)}Nama`);
    const kkalEl = ambil(`menu${kapital(waktu)}Kkal`);
    if (namaEl) namaEl.textContent = item.nama;
    if (kkalEl) kkalEl.textContent = `${formatRibuan(kalori * pembagian[waktu])} kkal`;
  }
}

/** Ubah huruf awal menjadi kapital: "sarapan" -> "Sarapan". */
function kapital(kata) {
  return kata.charAt(0).toUpperCase() + kata.slice(1);
}

/* --------------------------------------------------------------------------
   Aktivitas fisik
   -------------------------------------------------------------------------- */
export function renderAktivitas(durasi) {
  const pemetaan = {
    jalan: 'durasiJalan',
    yoga: 'durasiYoga',
    kekuatan: 'durasiKekuatan',
  };

  let total = 0;
  for (const [id, elemenId] of Object.entries(pemetaan)) {
    const menit = durasi[id] || 0;
    total += menit;
    const elemen = ambil(elemenId);
    if (elemen) elemen.textContent = `${menit} mnt`;
  }

  const totalEl = ambil('aktivitasTotal');
  if (totalEl) totalEl.textContent = `${total} menit`;
}

/* --------------------------------------------------------------------------
   Kutipan penutup
   -------------------------------------------------------------------------- */
export function renderKutipan(teks) {
  const elemen = ambil('kutipanTeks');
  if (elemen && teks) elemen.textContent = `“${teks}”`;
}

/* --------------------------------------------------------------------------
   Hidrasi
   -------------------------------------------------------------------------- */
export function renderAir(status) {
  const badge = ambil('airTarget');
  if (badge) badge.textContent = `${status.targetLiter} L`;

  const isi = ambil('airIsi');
  if (isi) isi.style.width = `${status.persen}%`;

  const teks = ambil('airTeks');
  if (teks) {
    teks.textContent = `${status.terisi} dari ${status.targetGelas} gelas`
      + ` · target ${status.targetLiter} L (berat × 34 ml)`;
  }

  const bar = ambil('airBar');
  if (bar) {
    bar.setAttribute('aria-valuemax', String(status.targetGelas));
    bar.setAttribute('aria-valuenow', String(status.terisi));
  }
}

/* --------------------------------------------------------------------------
   Centang aktivitas
   -------------------------------------------------------------------------- */
export function renderCentangAktivitas(centang) {
  document.querySelectorAll('[data-aktivitas]').forEach((centangEl) => {
    centangEl.checked = Boolean(centang[centangEl.dataset.aktivitas]);
  });
}

/** Baca status centang aktivitas langsung dari DOM. */
export function bacaCentangAktivitas() {
  const hasil = {};
  document.querySelectorAll('[data-aktivitas]').forEach((centangEl) => {
    hasil[centangEl.dataset.aktivitas] = Boolean(centangEl.checked);
  });
  return hasil;
}

/* --------------------------------------------------------------------------
   Navigasi tab bawah
   -------------------------------------------------------------------------- */

/**
 * Tampilkan halaman sesuai tab, perbarui state tombol navigasi.
 * Hanya satu `main.halaman` yang terlihat pada satu waktu.
 */
export function renderHalaman(tab) {
  document.querySelectorAll('.halaman[data-page]').forEach((halaman) => {
    const aktif = halaman.dataset.page === tab;
    halaman.hidden = !aktif;
    halaman.classList.toggle('halaman--aktif', aktif);
    if (aktif) {
      // Siapkan fokus untuk pembaca layar saat halaman berubah.
      halaman.setAttribute('tabindex', '-1');
    }
  });

  // Hanya tombol di bottom navigation yang diberi state aktif.
  document.querySelectorAll('.nav__item[data-tab]').forEach((tombol) => {
    const aktif = tombol.dataset.tab === tab;
    tombol.classList.toggle('nav__item--aktif', aktif);
    if (aktif) {
      tombol.setAttribute('aria-current', 'page');
    } else {
      tombol.removeAttribute('aria-current');
    }
  });
}

/** Fokuskan halaman aktif (untuk screen reader setelah pindah tab). */
export function fokusHalaman(tab) {
  const halaman = document.getElementById(`page-${tab}`);
  if (halaman) halaman.focus({ preventScroll: true });
}

/* --------------------------------------------------------------------------
   Toast kecil untuk umpan balik
   -------------------------------------------------------------------------- */
export function toast(pesan) {
  if (!el.toast) return;
  clearTimeout(jedaToast);
  el.toast.textContent = pesan;
  el.toast.hidden = false;
  requestAnimationFrame(() => el.toast.classList.add('tampil'));
  jedaToast = setTimeout(() => {
    el.toast.classList.remove('tampil');
    setTimeout(() => { el.toast.hidden = true; }, 260);
  }, 2600);
}

/* --------------------------------------------------------------------------
   Utilitas DOM lain
   -------------------------------------------------------------------------- */
export function ambil(id) {
  return document.getElementById(id);
}

/** Gulir halus ke elemen, menghormati preferensi kurangi-animasi. */
export function gulirKe(elemen) {
  if (!elemen) return;
  const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  elemen.scrollIntoView({ behavior: kurangiGerak ? 'auto' : 'smooth', block: 'center' });
}
