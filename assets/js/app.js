/* ==========================================================================
   app.js — Titik masuk aplikasi: menyambungkan logika (bmi.js, hydration.js,
   data.js, storage.js) dan tampilan (ui.js). Dimuat sebagai ES Module.
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
} from './data.js';

import {
  muatAirHariIni,
  muatAktivitasHariIni,
  muatInputPengguna,
  muatTabAktif,
  simpanAktivitas,
  simpanHasilTerakhir,
  simpanInputPengguna,
  simpanTabAktif,
  catatRiwayatBMI,
} from './storage.js';

import {
  kurangiGelas,
  muatStatusAir,
  tambahGelas,
} from './hydration.js';

import {
  ambil,
  bacaCentangAktivitas,
  fokusHalaman,
  gulirKe,
  perbaruiSlider,
  renderAktivitas,
  renderAir,
  renderCentangAktivitas,
  renderGender,
  renderHalaman,
  renderHasil,
  renderKutipan,
  renderMenu,
  renderNutrisi,
  renderSapaan,
  renderSlider,
  toast,
} from './ui.js';

/** Daftar tab yang valid (digunakan untuk validasi navigasi). */
const TAB_VALID = ['kalkulator', 'pola-makan', 'olahraga', 'akun'];

/** Status aplikasi (input + turunan yang tidak perlu dihitung ulang). */
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
  statusAir: null,  // status hidrasi hari ini
  centangAktivitas: {}, // aktivitas yang dicentang hari ini
  tabAktif: 'kalkulator',
  scrollPerTab: {}, // posisi gulir per tab (hanya di memori)
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
  renderAktivitas(DURASI_AKTIVITAS[kategori.key]);

  // 4. Hidrasi (target ikut menyesuaikan berat badan)
  perbaruiAir();
  return true;
}

/* --------------------------------------------------------------------------
   Hidrasi
   -------------------------------------------------------------------------- */

/** Hitung ulang & render status air berdasarkan berat badan sekarang. */
function perbaruiAir() {
  state.statusAir = muatStatusAir(state.berat);
  renderAir(state.statusAir);
}

/** Aksi +1 gelas. */
function saatTambahAir() {
  if (!state.statusAir) perbaruiAir();
  state.statusAir = tambahGelas(state.berat);
  renderAir(state.statusAir);
  if (state.statusAir.selesai) {
    toast('Target hidrasi hari ini tercapai. Kerja bagus!');
  } else {
    toast(`Air ditambah. ${state.statusAir.terisi} dari ${state.statusAir.targetGelas} gelas.`);
  }
}

/** Aksi undo (-1 gelas). */
function saatUndoAir() {
  if (!state.statusAir) perbaruiAir();
  state.statusAir = kurangiGelas(state.berat);
  renderAir(state.statusAir);
  toast(`Gelas dikurangi. ${state.statusAir.terisi} dari ${state.statusAir.targetGelas} gelas.`);
}

/* --------------------------------------------------------------------------
   Aktivitas dicentang
   -------------------------------------------------------------------------- */

/** Simpan status centang aktivitas hari ini ke storage. */
function saatCentangAktivitas() {
  state.centangAktivitas = bacaCentangAktivitas();
  const tersimpan = simpanAktivitas({ centang: state.centangAktivitas });
  if (!tersimpan) {
    toast('Pusatat gagal tersimpan (mungkin penyimpanan penuh).');
    return;
  }
  const jumlah = Object.values(state.centangAktivitas).filter(Boolean).length;
  if (jumlah > 0) toast(`Kerja bagus! ${jumlah} aktivitas hari ini selesai.`);
}

/* --------------------------------------------------------------------------
   Aksi tombol
   -------------------------------------------------------------------------- */

/** Aksi utama: "Cek BMI & Rekomendasi Menu". */
function saatCekBMI() {
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
    // Simpan hasil & catat riwayat untuk grafik berikutnya.
    simpanHasilTerakhir({ bmi, kategori });
    catatRiwayatBMI(bmi);
    toast(`BMI-mu ${bmi.toFixed(1).replace('.', ',')} — ${kategori.label}. Semangat!`);
    gulirKe(ambil('hasilJudul')?.closest('.kartu'));
  }
}

/** Klik salah satu tombol gender. */
function saatGenderDipilih(event) {
  const tombol = event.currentTarget;
  state.gender = tombol.dataset.gender;
  renderGender(state.gender);
  simpanInputPengguna(state);
  terapkanRekomendasi(); // BMR wanita/pria berbeda, kalori ikut menyesuaikan
}

/** Klik "Acak Inspirasi Menu". */
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
   Navigasi tab bawah
   -------------------------------------------------------------------------- */

/** Pindah ke tab lain: tampilkan halaman, simpan posisi gulir, simpan pilihan. */
function pindahTab(tab) {
  if (!TAB_VALID.includes(tab) || tab === state.tabAktif) return;

  // Ingat posisi gulir tab sebelumnya.
  state.scrollPerTab[state.tabAktif] = window.scrollY || 0;

  state.tabAktif = tab;
  renderHalaman(tab);
  simpanTabAktif(tab);

  // Kembalikan posisi gulir tab yang dituju (bila pernah dikunjungi).
  const posisi = state.scrollPerTab[tab] || 0;
  window.scrollTo({ top: posisi, left: 0, behavior: 'auto' });
  fokusHalaman(tab);

  if (tab !== 'kalkulator') {
    toast('Fitur ini sedang disiapkan. Segera hadir!');
  }
}

function pasangNavigasi() {
  document.querySelectorAll('[data-tab]').forEach((tombol) => {
    tombol.addEventListener('click', () => pindahTab(tombol.dataset.tab));
  });
}

/* --------------------------------------------------------------------------
   PWA: daftarkan service worker
   -------------------------------------------------------------------------- */
function daftarkanServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.info('[NutriKala] Service worker terpasang.'))
      .catch((err) => console.warn('[NutriKala] Gagal memasang service worker:', err));
  });
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
      if (Number(input.value) !== state[id]) input.value = String(state[id]);
      perbaruiSlider(id, state[id]);
      tampilkanHasil();
      terapkanRekomendasi();
      simpanInputPengguna(state);
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

  const btnTambahAir = ambil('btnTambahAir');
  if (btnTambahAir) btnTambahAir.addEventListener('click', saatTambahAir);

  const btnUndoAir = ambil('btnUndoAir');
  if (btnUndoAir) btnUndoAir.addEventListener('click', saatUndoAir);

  const btnNotifikasi = ambil('btnNotifikasi');
  if (btnNotifikasi) {
    btnNotifikasi.addEventListener('click', () => {
      toast('Belum ada kabar baru. Cek lagi nanti ya!');
    });
  }

  document.querySelectorAll('[data-aktivitas]').forEach((centang) => {
    centang.addEventListener('change', saatCentangAktivitas);
  });
}

/* --------------------------------------------------------------------------
   Mulai aplikasi
   -------------------------------------------------------------------------- */

/** Muat nilai awal: utamakan penyimpanan, fallback ke nilai di HTML. */
function muatNilaiAwal() {
  const tersimpan = muatInputPengguna({
    gender: state.gender,
    usia: state.usia,
    berat: state.berat,
    tinggi: state.tinggi,
  });

  state.gender = tersimpan.gender;
  ['usia', 'berat', 'tinggi'].forEach((id) => {
    const input = ambil(id);
    const nilai = clampRentang(id, tersimpan[id]);
    state[id] = nilai;
    if (input) input.value = String(nilai);
  });
}

function mulai() {
  // Tab terakhir yang dibuka (default: kalkulator), bila tidak valid pakai awal.
  const tabTersimpan = muatTabAktif('kalkulator');
  state.tabAktif = TAB_VALID.includes(tabTersimpan) ? tabTersimpan : 'kalkulator';

  muatNilaiAwal();
  renderSapaan();
  renderGender(state.gender);
  renderSlider(state);
  renderKutipan(pilihKutipan());
  renderHalaman(state.tabAktif);
  pasangNavigasi();
  pasangSlider();
  pasangGender();
  pasangTombol();
  tampilkanHasil();
  terapkanRekomendasi({ acakMenuBaru: true });

  // Muat aktivitas yang sudah dicentang hari ini.
  state.centangAktivitas = muatAktivitasHariIni().centang || {};
  renderCentangAktivitas(state.centangAktivitas);

  daftarkanServiceWorker();
  console.info('[NutriKala] Kalkulator BMI siap.');
}

mulai();
