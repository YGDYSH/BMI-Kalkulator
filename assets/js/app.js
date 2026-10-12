/* ==========================================================================
   app.js — Titik masuk aplikasi: menyambungkan logika (bmi.js) dan
   tampilan (ui.js). Dimuat sebagai ES Module.
   ========================================================================== */

import {
  RENTANG,
  clampRentang,
  hitungBMI,
  kategoriBMI,
  pesanKategori,
  posisiPenanda,
} from './bmi.js';

import {
  ambil,
  gulirKe,
  perbaruiSlider,
  renderGender,
  renderHasil,
  renderSapaan,
  renderSlider,
  toast,
} from './ui.js';

/** Status input terakhir dari pengguna. */
const state = {
  gender: 'pria',
  usia: RENTANG.usia.default,
  berat: RENTANG.berat.default,
  tinggi: RENTANG.tinggi.default,
  kategoriTerakhir: '',
  pesanTerakhir: '',
};

/* --------------------------------------------------------------------------
   Perhitungan & render hasil
   -------------------------------------------------------------------------- */

/** Susun objek hasil BMI dari state sekarang. */
function buatHasil() {
  const bmi = hitungBMI(state.berat, state.tinggi);
  const kategori = kategoriBMI(bmi);
  if (!kategori) return null;

  // Pesan diganti hanya saat kategori berubah, agar tidak berisik saat digeser.
  if (kategori.key !== state.kategoriTerakhir) {
    state.kategoriTerakhir = kategori.key;
    state.pesanTerakhir = pesanKategori(kategori.key);
  }

  return {
    bmi,
    kategori,
    pesan: state.pesanTerakhir,
    posisi: posisiPenanda(bmi),
  };
}

/** Render hasil ke layar. Kembalikan false bila input tidak valid. */
function tampilkanHasil() {
  const hasil = buatHasil();
  if (!hasil) {
    toast('Ups, periksa lagi berat dan tinggimu ya.');
    return false;
  }
  renderHasil(hasil);
  return true;
}

/* --------------------------------------------------------------------------
   Aksi tombol
   -------------------------------------------------------------------------- */

/** Aksi utama: "Cek BMI & Rekomendasi Menu". */
function saatCekBMI() {
  // Paksa pesan baru agar pengguna merasa mendapat rekomendasi segar.
  const bmi = hitungBMI(state.berat, state.tinggi);
  const kategori = kategoriBMI(bmi);
  if (!kategori) {
    toast('Ups, periksa lagi berat dan tinggimu ya.');
    return;
  }
  state.kategoriTerakhir = kategori.key;
  state.pesanTerakhir = pesanKategori(kategori.key);

  if (tampilkanHasil()) {
    toast(`BMI-mu ${bmi.toFixed(1).replace('.', ',')} — ${kategori.label}. Semangat!`);
    gulirKe(ambil('hasilJudul')?.closest('.kartu'));
  }
}

/** Klik salah satu tombol gender. */
function saatGenderDipilih(event) {
  const tombol = event.currentTarget;
  state.gender = tombol.dataset.gender;
  renderGender(state.gender);
}

/* --------------------------------------------------------------------------
   Pasang event listener
   -------------------------------------------------------------------------- */

function pasangSlider() {
  ['usia', 'berat', 'tinggi'].forEach((id) => {
    const input = ambil(id);
    if (!input) return;

    const terima = () => {
      state[id] = clampRentang(id, input.value);
      // Pastikan nilai di dalam input ikut terkoreksi bila di luar rentang.
      if (Number(input.value) !== state[id]) input.value = String(state[id]);
      perbaruiSlider(id, state[id]);
      tampilkanHasil();
    };

    input.addEventListener('input', terima);
    input.addEventListener('change', terima);
  });
}

function pasangGender() {
  document.querySelectorAll('[data-gender]').forEach((tombol) => {
    tombol.addEventListener('click', saatGenderDipilih);
  });
}

function pasangTombol() {
  const btnCek = ambil('btnCek');
  if (btnCek) btnCek.addEventListener('click', saatCekBMI);

  const btnNotifikasi = ambil('btnNotifikasi');
  if (btnNotifikasi) {
    btnNotifikasi.addEventListener('click', () => {
      toast('Belum ada kabar baru. Cek lagi nanti ya!');
    });
  }
}

/* --------------------------------------------------------------------------
   Mulai aplikasi
   -------------------------------------------------------------------------- */
/** Ambil nilai awal langsung dari elemen slider di HTML. */
function muatNilaiAwal() {
  ['usia', 'berat', 'tinggi'].forEach((id) => {
    const input = ambil(id);
    if (input) state[id] = clampRentang(id, input.value);
  });
}

function mulai() {
  muatNilaiAwal();
  renderSapaan();
  renderGender(state.gender);
  renderSlider(state);
  pasangSlider();
  pasangGender();
  pasangTombol();
  tampilkanHasil();
  console.info('[NutriKala] Kalkulator BMI siap.');
}

mulai();
