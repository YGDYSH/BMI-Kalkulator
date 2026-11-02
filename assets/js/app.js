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
  DURASI_AKTIVITAS,
  FOODS,
  acakMenu,
  pilihKutipan,
} from './data.js';

import { hitungTargetKalori } from './nutrition.js';

import {
  muatAirHariIni,
  muatAktivitasHariIni,
  muatBadgeDilihat,
  muatInputPengguna,
  muatLogOlahraga,
  muatMakananKustom,
  muatOnboardingDilihat,
  muatProfil,
  muatSemuaLogMakan,
  muatTabAktif,
  catatSnapshotAir,
  selesaiOnboarding,
  simpanAktivitas,
  simpanHasilTerakhir,
  simpanInputPengguna,
  simpanTabAktif,
  tandaiBadgeDilihat,
  tanggalHariIni,
  catatRiwayatBMI,
  muatPengaturan,
} from './storage.js';

import {
  kurangiGelas,
  muatStatusAir,
  targetGelas,
  tambahGelas,
} from './hydration.js';

import { renderProfilePage, hitungPencapaian } from './profile.js';
import { renderMealsPage } from './meals.js';
import { renderWorkoutPage } from './workout.js';
import { mulaiPengingat } from './reminders.js';

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

/** Target default bila profil belum diisi (sinkron dgn meals.js 2.10). */
const TARGET_DEFAULT_KKAL = 2000;

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
  pencapaian: { unlocked: [], baru: [] }, // badge (tugas 4.3)
  onboardLangkah: 1, // langkah onboarding (tugas 4.5)
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
  // Jepretan harian untuk badge "target air" (tugas 4.3).
  catatSnapshotAir(state.statusAir.terisi, state.statusAir.targetGelas);
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
  renderBeranda();
}

/** Aksi undo (-1 gelas). */
function saatUndoAir() {
  if (!state.statusAir) perbaruiAir();
  state.statusAir = kurangiGelas(state.berat);
  renderAir(state.statusAir);
  toast(`Gelas dikurangi. ${state.statusAir.terisi} dari ${state.statusAir.targetGelas} gelas.`);
  renderBeranda();
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
   Pra-isi kalkulator BMI dari profil (Fase 1, tugas 1.4)
   -------------------------------------------------------------------------- */

/**
 * Terapkan profil ke kalkulator BMI (gender, usia, berat, tinggi).
 * Kalkulator tetap bisa dipakai tanpa profil — profil hanya isi awal.
 */
function terapkanProfilKeKalkulator(profil) {
  if (!profil) return;
  state.gender = profil.sex === 'female' ? 'wanita' : 'pria';
  // Slider kalkulator punya rentang sendiri (mis. 10–90 th); ikuti batasnya.
  state.usia = clampRentang('usia', profil.usia);
  state.berat = clampRentang('berat', profil.weightKg);
  state.tinggi = clampRentang('tinggi', profil.heightCm);

  ['usia', 'berat', 'tinggi'].forEach((id) => {
    const input = ambil(id);
    if (input) input.value = String(state[id]);
  });
  renderGender(state.gender);
  renderSlider(state);
  simpanInputPengguna(state);
  tampilkanHasil();
  terapkanRekomendasi();
}

/** Callback dari halaman Akun: profil disimpan/diimpor/dihapus. */
function saatProfilTersimpan(profil) {
  if (profil) {
    terapkanProfilKeKalkulator(profil);
  }
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

  // Ringkasan beranda di segarkan saat kembali ke tab Kalkulator (4.2).
  if (tab === 'kalkulator') renderBeranda();

  // Badge dianggap "dilihat" saat halaman Akun dibuka (4.3).
  if (tab === 'akun') {
    tandaiBadgeDilihat(state.pencapaian.unlocked);
    state.pencapaian.baru = [];
    const titik = ambil('headerTitik');
    if (titik) titik.hidden = true;
  }

  // Kembalikan posisi gulir tab yang dituju (bila pernah dikunjungi).
  const posisi = state.scrollPerTab[tab] || 0;
  window.scrollTo({ top: posisi, left: 0, behavior: 'auto' });
  fokusHalaman(tab);
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

  // Lonceng & panel pengingat dipasang lewat mulaiPengingat() (reminders.js).

  document.querySelectorAll('[data-aktivitas]').forEach((centang) => {
    centang.addEventListener('change', saatCentangAktivitas);
  });
}

/* --------------------------------------------------------------------------
   Ringkasan hari ini di beranda (tugas 4.2)
   -------------------------------------------------------------------------- */

/** Total kkal dari log makan suatu tanggal (FOODS + makanan kustom). */
function kkalLogHari(tanggal) {
  const katalog = [...FOODS, ...muatMakananKustom()];
  const log = muatSemuaLogMakan()[tanggal] || [];
  let jumlah = 0;
  for (const entri of log) {
    const makanan = katalog.find((m) => m.id === entri.foodId);
    if (makanan) jumlah += makanan.kcal * (Number(entri.servings) || 0);
  }
  return Math.round(jumlah);
}

/** Target kalori harian (sinkron dengan default Pola Makan: 2000). */
function targetKaloriBeranda() {
  const profil = muatProfil();
  if (profil) {
    const hitungan = hitungTargetKalori(profil);
    if (hitungan) return hitungan.target;
  }
  return TARGET_DEFAULT_KKAL;
}

/** Render kartu "Ringkasan Hari Ini" (dipanggil saat buka tab Kalkulator). */
function renderBeranda() {
  const hariIni = tanggalHariIni();

  const tanggalEl = ambil('berandaTanggal');
  if (tanggalEl) {
    tanggalEl.textContent = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short', day: 'numeric', month: 'short',
    }).format(new Date());
  }

  const kkalEl = ambil('berandaKkal');
  const kkalKet = ambil('berandaKkalKet');
  const target = targetKaloriBeranda();
  if (kkalEl) kkalEl.textContent = `${formatRibuan(kkalLogHari(hariIni))} kkal`;
  if (kkalKet) {
    kkalKet.textContent = `dari target ${formatRibuan(target)} kkal`;
  }

  const airEl = ambil('berandaAir');
  const airKet = ambil('berandaAirKet');
  if (!state.statusAir) perbaruiAir();
  if (airEl) {
    airEl.textContent = `${state.statusAir.terisi}/${state.statusAir.targetGelas} gelas`;
  }
  if (airKet) {
    airKet.textContent = state.statusAir.selesai
      ? 'target tercapai 🧊'
      : `target ${state.statusAir.targetLiter} L`;
  }

  const menitJumlah = muatLogOlahraga(hariIni)
    .reduce((jumlah, entri) => jumlah + (Number(entri.minutes) || 0), 0);
  const menitEl = ambil('berandaMenit');
  const menitKet = ambil('berandaMenitKet');
  if (menitEl) menitEl.textContent = `${formatRibuan(menitJumlah)} mnt`;
  if (menitKet) {
    menitKet.textContent = menitJumlah >= 30
      ? 'gerak hari ini mantap!'
      : menitJumlah > 0
        ? 'tambah sedikit lagi, ya'
        : 'belum tercatat';
  }
}

/* --------------------------------------------------------------------------
   Pencapaian & titik lonceng (tugas 4.3)
   -------------------------------------------------------------------------- */

/** Hitung pencapaian dan hidupkan/matiin titik lonceng bila ada yang baru. */
function perbaruiTitikPencapaian() {
  state.pencapaian = hitungPencapaian();
  const titik = ambil('headerTitik');
  if (titik) titik.hidden = state.pencapaian.baru.length === 0;
}

/** Ketika lonceng/panel dibuka: tandai badge dilihat, matikan titik. */
function saatLoncengDibuka() {
  const pencapaian = state.pencapaian || hitungPencapaian();
  if (pencapaian.baru.length > 0) {
    tandaiBadgeDilihat(pencapaian.unlocked);
    state.pencapaian.baru = [];
  }
  const titik = ambil('headerTitik');
  if (titik) titik.hidden = true;
}

/* --------------------------------------------------------------------------
   Onboarding 3 langkah (tugas 4.5)
   -------------------------------------------------------------------------- */

/** Naikkan ke langkah n; "Lanjut" berubah jadi tuntas di langkah 3. */
function renderOnboarding(langkah) {
  let langkahKini;
  if (typeof langkah === 'number') langkahKini = langkah;
  else langkahKini = state.onboardLangkah;

  state.onboardLangkah = langkahKini;

  for (let i = 1; i <= 3; i++) {
    const bagian = ambil(`onboardLangkah${i}`);
    if (bagian) bagian.hidden = i !== langkahKini;
  }

  const label = ambil('onboardLangkah');
  if (label) label.textContent = `${langkahKini} dari 3`;
  const judul = ambil('onboardJudul');
  if (judul) {
    judul.textContent = langkahKini === 1
      ? 'Selamat Datang'
      : langkahKini === 2
        ? 'Lengkapi Profilmu'
        : 'Catat & Bergerak';
  }

  const btnLanjut = ambil('btnOnboardLanjut');
  if (btnLanjut) btnLanjut.hidden = langkahKini === 3;
  const btnSelesai = ambil('btnOnboardSelesai');
  if (btnSelesai) btnSelesai.hidden = langkahKini !== 3;
}

function tampilkanOnboarding() {
  state.onboardLangkah = 1;
  renderOnboarding(1);
  const overlay = ambil('onboardOverlay');
  if (overlay) overlay.hidden = false;
}

function tutupOnboarding() {
  selesaiOnboarding();
  const overlay = ambil('onboardOverlay');
  if (overlay) overlay.hidden = true;
}

function pasangOnboarding() {
  if (muatOnboardingDilihat()) return;

  ambil('btnOnboardLanjut')?.addEventListener('click', () =>
    renderOnboarding(Math.min(3, state.onboardLangkah + 1)));
  ambil('btnOnboardSelesai')?.addEventListener('click', () => {
    tutupOnboarding();
    toast('Selamat mencoba! Lanjutkan di tab Kalkulator ya.');
  });
  ambil('btnOnboardLewati')?.addEventListener('click', tutupOnboarding);
  // "Isi profil sekarang" memakai data-tab="akun" (pasangNavigasi) dan
  // onboarding ikut dituntaskan supaya tak muncul lagi.
  ambil('btnOnboardIsiProfil')?.addEventListener('click', tutupOnboarding);

  tampilkanOnboarding();
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
  // Tab dari URL (manifest shortcuts, tugas 4.7) — contoh ./?tab=olahraga.
  const tabUrl = new URLSearchParams(window.location.search).get('tab');
  const tabTersimpan = muatTabAktif(
    TAB_VALID.includes(tabUrl) ? tabUrl : 'kalkulator');
  state.tabAktif = TAB_VALID.includes(tabTersimpan) ? tabTersimpan : 'kalkulator';

  muatNilaiAwal();

  // Profil (jika sudah diisi) mengambil isi awal kalkulator (tugas 1.4).
  if (muatProfil()) {
    terapkanProfilKeKalkulator(muatProfil());
  }

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

  // Ringkasan hari ini di beranda (tugas 4.2).
  renderBeranda();

  // Halaman Akun (Fase 1): siapkan sekali di awal agar tab langsung hidup.
  renderProfilePage(ambil('page-akun'), {
    onProfilTersimpan: saatProfilTersimpan,
  });

  // Halaman Pola Makan (Fase 2): siapkan sekali di awal.
  renderMealsPage(ambil('page-pola-makan'));

  // Halaman Olahraga (Fase 3): siapkan sekali di awal.
  renderWorkoutPage(ambil('page-olahraga'));

  // Pencapaian (4.3): hitung badge & titik lonceng; disandarkan ke panel.
  perbaruiTitikPencapaian();
  if (state.tabAktif === 'akun') {
    // Langsung dibuka di Akun (mis. ?tab=akun): badge dianggap dilihat.
    tandaiBadgeDilihat(state.pencapaian.unlocked);
    state.pencapaian.baru = [];
    const titik = ambil('headerTitik');
    if (titik) titik.hidden = true;
  }

  // Pengingat (4.1): panel lonceng + notifikasi; tidak minta izin otomatis.
  mulaiPengingat({ saatLoncengDibuka });

  // Onboarding 3 langkah (4.5) untuk pengguna baru.
  pasangOnboarding();

  daftarkanServiceWorker();
  console.info('[NutriKala] Kalkulator BMI siap.');
}

mulai();
