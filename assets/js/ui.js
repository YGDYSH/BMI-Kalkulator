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
