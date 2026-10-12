/* ==========================================================================
   app.js — Titik masuk aplikasi: menyambungkan logika (bmi.js) dan
   tampilan (ui.js). Dimuat sebagai ES Module.
   ========================================================================== */

import {
  RENTANG,
  RASIO_MAKRO,
  clampRentang,
  hitungBMI,
  hitungKaloriHarian,
  hitungGramMakro,
  kategoriBMI,
  pesanKategori,
  posisiPenanda,
} from './bmi.js';

import {
  DURASI_AKTIVITAS,
  acakMenu,
  pilihKutipan,
  totalDurasi,
} from './data.js';

import {
  ambil,
  gulirKe,
  perbaruiSlider,
  renderAktivitas,
  renderGender,
  renderHasil,
  renderKutipan,
  renderMenu,
  renderNutrisi,
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
  kategoriMenuTerakhir: '',
  rotasiMenu: {},   // indeks menu terakhir, agar tidak berulang beruntun
  menuTerpilih: null,
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
   Rekomendasi kalori, makro, menu, dan aktivitas
   -------------------------------------------------------------------------- */

/** Terapkan seluruh rekomendasi (kalori/makro/menu/aktivitas) dari state sekarang. */
function terapkanRekomendasi({ acakMenuBaru = false } = {}) {
  const bmi = hitungBMI(state.berat, state.tinggi);
  const kategori = kategoriBMI(bmi);
  if (!kategori) return false;

  // 1. Kalori harian = BMR × 1,3
  const kalori = hitungKaloriHarian(state);
  const rasio = RASIO_MAKRO[kategori.key];
  const gram = hitungGramMakro(kalori, rasio);
  renderNutrisi({ kalori, rasio, gram });

  // 2. Inspirasi menu rumahan (rotasi acak, hindari pengulangan beruntun)
  const kategoriMenuBerubah = state.kategoriMenuTerakhir !== kategori.key;
  if (acakMenuBaru || kategoriMenuBerubah || !state.menuTerpilih) {
    if (acakMenuBaru) state.rotasiMenu = {};
    const menu = acakMenu(kategori.key, state.rotasiMenu);
    state.menuTerpilih = menu;
    state.rotasiMenu = {
      sarapan: menu.sarapan.indeks,
      siang: menu.siang.indeks,
      malam: menu.malam.indeks,
    };
    state.kategoriMenuTerakhir = kategori.key;
  }
  renderMenu(state.menuTerpilih, kalori);

  // 3. Aktivitas fisik (durasi menyesuaikan kategori)
  const durasi = DURASI_AKTIVITAS[kategori.key];
  renderAktivitasDurasi(durasi);
  return true;
}

/** Kirim durasi aktivitas ke UI (wrapper kecil agar mudah dipantau). */
function renderAktivitasDurasi(durasi) {
  renderAktivitas(durasi);
  return totalDurasi(durasi);
}

/** Hanya ganti menu (tanpa menghitung ulang BMI/kalori). */
function saatAcakMenu() {
  const menu = acakMenu(state.kategoriTerakhir || 'ideal', state.rotasiMenu);
  state.menuTerpilih = menu;
  state.rotasiMenu = {
    sarapan: menu.sarapan.indeks,
    siang: menu.siang.indeks,
    malam: menu.malam.indeks,
  };
  const kalori = hitungKaloriHarian(state);
  renderMenu(menu, kalori);
  toast('Menu baru diacak. Selamat makan, ya!');
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
    terapkanRekomendasi({ acakMenuBaru: true });
    toast(`BMI-mu ${bmi.toFixed(1).replace('.', ',')} — ${kategori.label}. Semangat!`);
    gulirKe(ambil('hasilJudul')?.closest('.kartu'));
  }
}

/** Klik salah satu tombol gender. */
function saatGenderDipilih(event) {
  const tombol = event.currentTarget;
  state.gender = tombol.dataset.gender;
  renderGender(state.gender);
  terapkanRekomendasi(); // BMR wanita/pria berbeda, kalori ikut menyesuaikan
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
      // Kalori & durasi ikut menyesuaikan; menu tetap agar tidak berkedip.
      terapkanRekomendasi();
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

  const btnAcakMenu = ambil('btnAcakMenu');
  if (btnAcakMenu) btnAcakMenu.addEventListener('click', saatAcakMenu);

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
  renderKutipan(pilihKutipan());
  pasangSlider();
  pasangGender();
  pasangTombol();
  tampilkanHasil();
  terapkanRekomendasi({ acakMenuBaru: true });
  console.info('[NutriKala] Kalkulator BMI siap.');
}

mulai();
