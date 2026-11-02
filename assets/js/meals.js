/* ==========================================================================
   meals.js — Halaman Pola Makan: pencatat asupan harian vs target kalori.
   Ring ringkasan kalori + bar makro, navigasi tanggal, 4 slot makan,
   dialog tambah makanan (cari, favorit, terakhir dipakai, makanan kustom).
   Penyimpanan lewat storage.js; target dari profil via nutrition.js.
   ========================================================================== */

import {
  buatRencanaMingguan,
  daftarBelanjaDariRencana,
  FOODS,
  RESEP,
  SLOT_MAKAN,
} from './data.js';
import { hitungTargetKalori, RASIO_MAKRO_DEFAULT } from './nutrition.js';
import { formatDesimal, formatRibuan, toast, toastAksi } from './ui.js';
import {
  catatMakananDipakai,
  muatCentangBelanja,
  muatFavorit,
  muatLogMakan,
  muatLogOlahraga,
  muatMakananKustom,
  muatMakananTerbaru,
  muatProfil,
  muatSeedRencana,
  bersihkanCentangBelanja,
  simpanLogMakan,
  simpanSeedRencana,
  tambahMakananKustom,
  tanggalHariIni,
  ubahCentangBelanja,
  ubahFavorit,
} from './storage.js';

/** Target default bila profil belum diisi (desain.md 2.10). */
const TARGET_DEFAULT_KKAL = 2000;

const LANGKAH_PORSI = 0.5;

const NS_SVG = 'http://www.w3.org/2000/svg';

/** State halaman (di memori). */
const state = {
  tanggal: tanggalHariIni(),
  // dialog: { mode: 'tambah'|'edit', slot, foodId, entriId, porsi }
  dialog: null,
};

/* --------------------------------------------------------------------------
   Utilitas elemen & format
   -------------------------------------------------------------------------- */

function ambil(id) {
  return document.getElementById(id);
}

/** Buat elemen baru dengan kelas & teks (textContent — aman). */
function elemen(tag, kelas, teks) {
  const node = document.createElement(tag);
  if (kelas) node.className = kelas;
  if (teks !== undefined) node.textContent = teks;
  return node;
}

/** UUID: crypto.randomUUID bila ada, fallback acak sederhana. */
function uuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `ent-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Tanggal "kemarin"/"besok" dari string YYYY-MM-DD. */
function geserTanggal(tanggal, hari) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const dari = new Date(y, m - 1, d);
  dari.setDate(dari.getDate() + hari);
  const dua = (nilai) => String(nilai).padStart(2, '0');
  return `${dari.getFullYear()}-${dua(dari.getMonth() + 1)}-${dua(dari.getDate())}`;
}

/** Label tanggal ramah: "Rab, 21 Okt". */
function labelTanggal(tanggal) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const tanggalObj = new Date(y, m - 1, d);
  const diformat = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const dasar = diformat.format(tanggalObj);
  return tanggal === tanggalHariIni() ? `${dasar} · hari ini` : dasar;
}

/* --------------------------------------------------------------------------
   Sumber data makanan & target
   -------------------------------------------------------------------------- */

function semuaMakanan() {
  return [...FOODS, ...muatMakananKustom()];
}

function cariMakanan(id) {
  return semuaMakanan().find((m) => m.id === id) || null;
}

/** Pencarian sederhana TANPA peduli huruf besar/kecil. */
function cariDenganKata(kata) {
  const kataBersih = (kata || '').trim().toLowerCase();
  if (!kataBersih) return semuaMakanan();
  return semuaMakanan().filter((m) =>
    m.name.toLowerCase().includes(kataBersih));
}

/**
 * Target kalori & rasio makro. Bila profil belum diisi:
 * target bawaan 2000 kkal + rasio default (tugas 2.10).
 */
function infoTarget() {
  const profil = muatProfil();
  if (profil) {
    const hitungan = hitungTargetKalori(profil);
    if (hitungan) {
      const rasioTujuan = profil.goal === 'lose'
        ? { protein: 30, carbs: 40, fat: 30 }
        : { protein: RASIO_MAKRO_DEFAULT.protein, carbs: RASIO_MAKRO_DEFAULT.carbs, fat: RASIO_MAKRO_DEFAULT.fat };
      return {
        target: hitungan.target,
        profilAda: true,
        rasio: rasioTujuan,
      };
    }
  }
  return {
    target: TARGET_DEFAULT_KKAL,
    profilAda: false,
    rasio: RASIO_MAKRO_DEFAULT,
  };
}

/* --------------------------------------------------------------------------
   Render ringkasan harian: ring kalori + bar makro
   -------------------------------------------------------------------------- */

/** Bangun bagian ring SVG (tanpa angka; angka dirender terpisah). */
function bangunRing(persen) {
  const svg = document.createElementNS(NS_SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.classList.add('meal__ringSvg');
  svg.setAttribute('aria-hidden', 'true');

  const sifat = { cx: '50', cy: '50', r: '42', fill: 'none', 'stroke-width': '9' };
  const latar = document.createElementNS(NS_SVG, 'circle');
  for (const [kunci, nilai] of Object.entries(sifat)) latar.setAttribute(kunci, nilai);
  latar.classList.add('meal__ringBelakang');

  const nilaiSifat = { ...sifat, 'stroke-linecap': 'round', transform: 'rotate(-90 50 50)' };
  const isi = document.createElementNS(NS_SVG, 'circle');
  for (const [kunci, nilai] of Object.entries(nilaiSifat)) isi.setAttribute(kunci, nilai);
  isi.classList.add('meal__ringIsi');
  const keliling = 2 * Math.PI * 42;
  const terisi = Math.min(1, Math.max(0, persen / 100));
  isi.setAttribute('stroke-dasharray', keliling.toFixed(1));
  isi.setAttribute('stroke-dashoffset', (keliling * (1 - terisi)).toFixed(1));
  if (terisi >= 1) isi.classList.add('meal__ringPenuh');

  svg.appendChild(latar);
  svg.appendChild(isi);
  return svg;
}

/** Hitung total kalori & makro dari log tanggal aktif. */
function hitungTotalHari() {
  const log = muatLogMakan(state.tanggal);
  let kkal = 0;
  const makro = { protein: 0, carbs: 0, fat: 0 };
  for (const entri of log) {
    const makanan = cariMakanan(entri.foodId);
    if (!makanan) continue;
    const porsi = Number(entri.servings) || 0;
    kkal += makanan.kcal * porsi;
    makro.protein += (makanan.protein || 0) * porsi;
    makro.carbs += (makanan.carbs || 0) * porsi;
    makro.fat += (makanan.fat || 0) * porsi;
  }
  return {
    kkal: Math.round(kkal),
    makro: {
      protein: Math.round(makro.protein),
      carbs: Math.round(makro.carbs),
      fat: Math.round(makro.fat),
    },
  };
}

function renderRingkasan() {
  const target = infoTarget();
  const total = hitungTotalHari();
  const persen = target.target > 0 ? Math.round((total.kkal / target.target) * 100) : 0;

  // Ring
  const ringWadah = ambil('mealRing');
  if (ringWadah) {
    ringWadah.replaceChildren();
    ringWadah.appendChild(bangunRing(persen));
    const nomor = elemen('span', 'meal__ringAngka', formatRibuan(total.kkal));
    const satuan = elemen('span', 'meal__ringSatuan', 'dari ' + formatRibuan(target.target) + ' kkal');
    ringWadah.appendChild(nomor);
    ringWadah.appendChild(satuan);
  }

  // Label tanggal
  const tanggalEl = ambil('mealTanggalLabel');
  if (tanggalEl) tanggalEl.textContent = labelTanggal(state.tanggal);

  // Bar makro: target gram = kalori target × rasio / kalori-per-gram
  const targetGram = {
    protein: (target.target * target.rasio.protein / 100) / 4,
    carbs: (target.target * target.rasio.carbs / 100) / 4,
    fat: (target.target * target.rasio.fat / 100) / 9,
  };
  const wadahMakro = ambil('mealMakro');
  if (wadahMakro) {
    wadahMakro.replaceChildren();
    const daftar = [
      { nama: 'Protein', kunci: 'protein', warna: 'var(--c-kurang)' },
      { nama: 'Karbo', kunci: 'carbs', warna: 'var(--c-ideal)' },
      { nama: 'Lemak', kunci: 'fat', warna: 'var(--c-utama)' },
    ];
    for (const item of daftar) {
      const terisi = total.makro[item.kunci];
      const targetItem = Math.round(targetGram[item.kunci]);
      const persenMakro = targetItem > 0
        ? Math.min(100, Math.round((terisi / targetItem) * 100))
        : 0;

      const baris = elemen('div', 'meal__makroBaris');
      const atas = elemen('div', 'meal__makroAtas');
      atas.appendChild(elemen('span', 'meal__makroNama', item.nama));
      atas.appendChild(elemen('span', 'meal__makroNilai',
        `${terisi} / ${targetItem} g`));
      baris.appendChild(atas);

      const batang = elemen('div', 'meal__makroBar');
      const isiBar = elemen('span', 'meal__makroIsi');
      isiBar.style.width = `${persenMakro}%`;
      isiBar.style.background = item.warna;
      batang.appendChild(isiBar);
      baris.appendChild(batang);
      wadahMakro.appendChild(baris);
    }
  }

  // Rujukan ke tab Akun bila profil belum diisi (tugas 2.10)
  const tautanAkun = ambil('mealKeAkun');
  if (tautanAkun) tautanAkun.hidden = target.profilAda;

  // Teks sisa kalori hari ini
  const sisaEl = ambil('mealSisaTeks');
  if (sisaEl) {
    const sisa = target.target - total.kkal;
    sisaEl.textContent = sisa >= 0
      ? `Sisa ${formatRibuan(sisa)} kkal lagi hari ini`
      : `Melebihi target ${formatRibuan(Math.abs(sisa))} kkal`;
  }

  // Informasi kalori terbakar dari log olahraga tanggal ini (tugas 3.11).
  // Hanya informasi — tidak otomatis menambah jatah makan.
  const bakarEl = ambil('mealBakarTeks');
  if (bakarEl) {
    const kkalBakar = Math.round(muatLogOlahraga(state.tanggal)
      .reduce((jumlah, entri) => jumlah + (Number(entri.kcal) || 0), 0));
    bakarEl.hidden = kkalBakar <= 0;
    bakarEl.textContent = kkalBakar > 0
      ? `🔥 Dibakar olahraga: ± ${formatRibuan(kkalBakar)} kkal`
      : '';
  }
}

/* --------------------------------------------------------------------------
   Render 4 slot makan
   -------------------------------------------------------------------------- */

function renderSlotSemua() {
  for (const slot of Object.keys(SLOT_MAKAN)) {
    const daftarEl = ambil(`mealDaftar-${slot}`);
    const totalEl = ambil(`mealTotal-${slot}`);
    if (!daftarEl || !totalEl) continue;

    daftarEl.replaceChildren();
    const entri = muatLogMakan(state.tanggal)
      .filter((item) => item.slot === slot);

    let subtotal = 0;
    for (const item of entri) {
      const makanan = cariMakanan(item.foodId);
      if (!makanan) continue;
      const porsi = Number(item.servings) || 0;
      const kkal = Math.round(makanan.kcal * porsi);
      subtotal += kkal;
      daftarEl.appendChild(buatBarisEntri(item, makanan, porsi, kkal));
    }
    totalEl.textContent = `${formatRibuan(subtotal)} kkal`;
  }
}

/** Satu baris entri dengan tombol bintang/ubah/hapus. */
function buatBarisEntri(entri, makanan, porsi, kkal) {
  const baris = elemen('li', 'meal__baris');

  const teks = elemen('div', 'meal__barisTeks');
  const teksPorsi = porsi === 1
    ? '1 porsi'
    : `${formatDesimal(porsi)} porsi`;
  teks.appendChild(elemen('span', 'meal__barisNama', makanan.name));
  teks.appendChild(elemen('span', 'meal__barisKet',
    `${teksPorsi} · ${formatRibuan(kkal)} kkal`));
  baris.appendChild(teks);

  const aksi = elemen('div', 'meal__barisAksi');

  const favoritOn = muatFavorit().includes(makanan.id);
  const btnBintang = elemen('button',
    favoritOn ? 'meal__aksi meal__bintang--aktif' : 'meal__aksi', favoritOn ? '★' : '☆');
  btnBintang.type = 'button';
  btnBintang.dataset.aksi = 'bintang';
  btnBintang.dataset.foodId = makanan.id;
  btnBintang.setAttribute('aria-pressed', String(favoritOn));
  btnBintang.setAttribute('aria-label', `Favorit ${makanan.name}`);
  aksi.appendChild(btnBintang);

  const btnEdit = elemen('button', 'meal__aksi', '✏️');
  btnEdit.type = 'button';
  btnEdit.dataset.aksi = 'edit';
  btnEdit.dataset.entriId = entri.id;
  btnEdit.setAttribute('aria-label', `Ubah porsi ${makanan.name}`);
  aksi.appendChild(btnEdit);

  const btnHapus = elemen('button', 'meal__aksi meal__aksi--hapus', '🗑️');
  btnHapus.type = 'button';
  btnHapus.dataset.aksi = 'hapus';
  btnHapus.dataset.entriId = entri.id;
  btnHapus.setAttribute('aria-label', `Hapus ${makanan.name}`);
  aksi.appendChild(btnHapus);

  baris.appendChild(aksi);
  return baris;
}

/* --------------------------------------------------------------------------
   Navigasi tanggal
   -------------------------------------------------------------------------- */

function renderNavigasiTanggal() {
  const btnHariIni = ambil('btnHariIni');
  if (btnHariIni) btnHariIni.hidden = state.tanggal === tanggalHariIni();
  const tombolBerikut = ambil('btnHariBerikut');
  if (tombolBerikut) tombolBerikut.disabled = state.tanggal >= tanggalHariIni();
}

function geserHari(hari) {
  if (hari > 0 && state.tanggal >= tanggalHariIni()) return;
  state.tanggal = geserTanggal(state.tanggal, hari);
  renderSemua();
}

/* --------------------------------------------------------------------------
   Dialog tambah/ubah makanan
   -------------------------------------------------------------------------- */

function bukaDialog(mode, slot, entri = null) {
  state.dialog = {
    mode,
    slot,
    entriId: entri ? entri.id : null,
    foodId: entri ? entri.foodId : null,
    porsi: entri ? Number(entri.servings) || 1 : 1,
  };

  const judul = ambil('mealDialogJudul');
  if (judul) {
    judul.textContent = mode === 'edit'
      ? 'Ubah Porsi'
      : `Tambah Makanan · ${SLOT_MAKAN[slot]}`;
  }

  const inputCari = ambil('mealCari');
  if (inputCari) {
    inputCari.value = '';
    inputCari.disabled = mode === 'edit';
  }

  const formCustom = ambil('mealCustomForm');
  if (formCustom) formCustom.hidden = true;
  const btnCustom = ambil('btnBukaCustom');
  if (btnCustom) btnCustom.disabled = mode === 'edit';

  const tombolSimpan = ambil('btnSimpanEntri');
  if (tombolSimpan) {
    tombolSimpan.disabled = mode === 'edit' ? !cariMakanan(state.dialog.foodId) : true;
    tombolSimpan.textContent = mode === 'edit'
      ? 'Simpan perubahan'
      : `Simpan ke ${SLOT_MAKAN[slot]}`;
  }

  renderHasilDialog('');
  renderPorsi();

  const dialog = ambil('mealDialog');
  if (dialog) {
    dialog.hidden = false;
    if (mode === 'tambah' && inputCari) inputCari.focus();
  }
}

function tutupDialog() {
  state.dialog = null;
  const dialog = ambil('mealDialog');
  if (dialog) dialog.hidden = true;
}

/** Tampilkan porsi aktif + preview kkal. */
function renderPorsi() {
  const porsiEl = ambil('mealPorsiNilai');
  if (porsiEl && state.dialog) porsiEl.textContent = formatDesimal(state.dialog.porsi);

  const makanan = state.dialog ? cariMakanan(state.dialog.foodId) : null;
  const porsiLabel = ambil('mealPorsiMakanan');
  if (porsiLabel) {
    porsiLabel.textContent = makanan
      ? `${makanan.name} · ${makanan.portion} · ` +
        `${formatRibuan(makanan.kcal * (state.dialog ? state.dialog.porsi : 1))} kkal`
      : 'Pilih makanan dulu';
  }
}

function ubahPorsi(langkah) {
  if (!state.dialog) return;
  if (!state.dialog.foodId) {
    toast('Pilih makanan dulu di daftar.');
    return;
  }
  const baru = Math.max(LANGKAH_PORSI, state.dialog.porsi + langkah);
  state.dialog.porsi = Math.round(baru * 10) / 10;
  renderPorsi();
}

/** Render hasil dialog: bagian terbaru/favorit (tanpa kata kunci) + carian. */
function renderHasilDialog(kata) {
  const wadah = ambil('mealHasil');
  const wadahTerakhir = ambil('mealTerakhir');
  const wadahFavorit = ambil('mealFavorit');
  if (!wadah) return;
  wadah.replaceChildren();
  if (wadahTerakhir) wadahTerakhir.replaceChildren();
  if (wadahFavorit) wadahFavorit.replaceChildren();

  if (state.dialog?.mode === 'edit') {
    // Ubah porsi: hanya satu makanan (yang entri-nya sedang diubah).
    const makanan = cariMakanan(state.dialog.foodId);
    if (makanan) wadah.appendChild(buatBarisHasil(makanan, true));
    return;
  }

  if (kata.trim()) {
    const hasil = cariDenganKata(kata);
    if (hasil.length === 0) {
      wadah.appendChild(elemen('p', 'meal__hasilKosong',
        'Tidak ketemu. Coba kata lain, atau tambahkan makanan sendiri di bawah.'));
      return;
    }
    hasil.forEach((m) => wadah.appendChild(buatBarisHasil(m)));
    return;
  }

  tampilkanChips(wadahTerakhir, 'Terakhir dipakai', muatMakananTerbaru());
  tampilkanChips(wadahFavorit, 'Favorit', muatFavorit());
  semuaMakanan().forEach((m) => wadah.appendChild(buatBarisHasil(m)));
}

/** Satu baris hasil: tombol pilih + tombol bintang favorit. */
function buatBarisHasil(makanan, terpilih = false) {
  const baris = elemen('div', 'meal__hasilBaris');
  if (terpilih) baris.classList.add('meal__hasilBaris--terpilih');

  const utama = elemen('button', 'meal__hasilUtama');
  utama.type = 'button';
  utama.dataset.foodId = makanan.id;
  utama.setAttribute('aria-label',
    `Pilih ${makanan.name}, ${makanan.kcal} kkal per porsi`);
  utama.appendChild(elemen('span', 'meal__hasilNama', makanan.name));
  utama.appendChild(elemen('span', 'meal__hasilKet',
    `${makanan.portion} · ${formatRibuan(makanan.kcal)} kkal` +
    (makanan.kustom ? ' · milikmu' : '')));
  baris.appendChild(utama);

  if (terpilih) return baris;

  const aktif = muatFavorit().includes(makanan.id);
  const bintang = elemen('button',
    aktif ? 'meal__bintang meal__bintang--aktif' : 'meal__bintang',
    aktif ? '★' : '☆');
  bintang.type = 'button';
  bintang.dataset.bintang = makanan.id;
  bintang.setAttribute('aria-pressed', String(aktif));
  bintang.setAttribute('aria-label',
    aktif ? `Hapus ${makanan.name} dari favorit` : `Jadikan favorit ${makanan.name}`);
  baris.appendChild(bintang);
  return baris;
}

/** Daftar chip (Terakhir dipakai / Favorit) di atas hasil pencarian. */
function tampilkanChips(wadah, judul, daftarId) {
  if (!wadah) return;
  const bersih = daftarId.filter((id) => cariMakanan(id));
  if (bersih.length === 0) return;
  wadah.appendChild(elemen('h3', 'meal__bagianJudul', judul));
  const wadahChip = elemen('div', 'meal__chipWadah');
  for (const id of bersih) {
    const makanan = cariMakanan(id);
    if (!makanan) continue;
    const chip = elemen('button', 'meal__chipMakanan', makanan.name);
    chip.type = 'button';
    chip.dataset.foodId = id;
    chip.setAttribute('aria-label',
      `Pilih ${makanan.name}, ${makanan.kcal} kkal`);
    wadahChip.appendChild(chip);
  }
  wadah.appendChild(wadahChip);
}

/* --------------------------------------------------------------------------
   Simpan / ubah / hapus entri
   -------------------------------------------------------------------------- */

function simpanEntri() {
  const dialog = state.dialog;
  if (!dialog) return;
  const makanan = cariMakanan(dialog.foodId);
  if (!makanan) {
    toast('Pilih makanan dulu di daftar.');
    return;
  }

  const log = muatLogMakan(state.tanggal);
  if (dialog.mode === 'edit') {
    const indeks = log.findIndex((item) => item.id === dialog.entriId);
    if (indeks >= 0) {
      log[indeks].servings = dialog.porsi;
      log[indeks].addedAt = new Date().toISOString();
    }
  } else {
    log.push({
      id: uuid(),
      foodId: makanan.id,
      slot: dialog.slot,
      servings: dialog.porsi,
      addedAt: new Date().toISOString(),
    });
    catatMakananDipakai(makanan.id);
  }

  if (!simpanLogMakan(state.tanggal, log)) {
    toast('Gagal menyimpan (penyimpanan penuh?).');
    return;
  }

  tutupDialog();
  renderSemua();
  toast(dialog.mode === 'edit'
    ? 'Porsi diperbarui.'
    : `${makanan.name} ditambah ke ${SLOT_MAKAN[dialog.slot]}.`);
}

/** Hapus entri + tawaran urungkan lewat toast. */
function hapusEntri(entriId) {
  const log = muatLogMakan(state.tanggal);
  const indeks = log.findIndex((item) => item.id === entriId);
  if (indeks < 0) return;

  const entri = log[indeks];
  const makanan = cariMakanan(entri.foodId);
  const tanggalEntri = state.tanggal;
  const indeksAsli = indeks;

  const sisa = log.filter((item) => item.id !== entriId);
  if (!simpanLogMakan(state.tanggal, sisa)) {
    toast('Gagal menghapus. Coba lagi, ya.');
    return;
  }
  renderSemua();

  toastAksi(
    `${makanan ? makanan.name : 'Makanan'} dihapus.`,
    'Urungkan',
    () => {
      const logKini = muatLogMakan(state.tanggal);
      logKini.splice(Math.min(indeksAsli, logKini.length), 0, entri);
      simpanLogMakan(state.tanggal, logKini);
      renderSemua();
      toast('Entri dikembalikan.');
    },
  );
}

function ubahStatusFavorit(foodId, tombol) {
  const aktifBaru = !muatFavorit().includes(foodId);
  const daftar = ubahFavorit(foodId, aktifBaru);
  const makanan = cariMakanan(foodId);
  if (tombol) {
    tombol.textContent = aktifBaru ? '★' : '☆';
    tombol.classList.toggle('meal__bintang--aktif', aktifBaru);
    tombol.setAttribute('aria-pressed', String(aktifBaru));
  }
  toast(aktifBaru
    ? `${makanan.name} masuk favorit ★`
    : `${makanan.name} dikeluarkan dari favorit.`);
  if (state.dialog) renderHasilDialog(ambil('mealCari')?.value || '');
  renderSlotSemua();
}

/* --------------------------------------------------------------------------
   Makanan kustom (tugas 2.9)
   -------------------------------------------------------------------------- */

function kustomMakananBaru(event) {
  event.preventDefault();
  const nama = ambil('mealCustomNama')?.value || '';
  const kcal = ambil('mealCustomKkal')?.value || '';
  const protein = ambil('mealCustomProtein')?.value || '';
  const carbs = ambil('mealCustomCarbs')?.value || '';
  const fat = ambil('mealCustomFat')?.value || '';

  const makanan = tambahMakananKustom({
    name: nama,
    kcal,
    protein: protein === '' ? 0 : protein,
    carbs: carbs === '' ? 0 : carbs,
    fat: fat === '' ? 0 : fat,
  });

  if (!makanan) {
    toast('Isi nama dan kalori (1–5000 kkal), ya.');
    return;
  }

  // Langsung pilih dengan porsi 1
  if (state.dialog) {
    state.dialog.foodId = makanan.id;
    state.dialog.porsi = 1;
    const tombolSimpan = ambil('btnSimpanEntri');
    if (tombolSimpan) tombolSimpan.disabled = false;
  }
  const formCustom = ambil('mealCustomForm');
  if (formCustom) formCustom.hidden = true;
  if (ambil('mealCustomNama')) ambil('mealCustomNama').value = '';
  if (ambil('mealCustomKkal')) ambil('mealCustomKkal').value = '';
  if (ambil('mealCustomProtein')) ambil('mealCustomProtein').value = '';
  if (ambil('mealCustomCarbs')) ambil('mealCustomCarbs').value = '';
  if (ambil('mealCustomFat')) ambil('mealCustomFat').value = '';

  renderHasilDialog(ambil('mealCari')?.value || '');
  renderPorsi();
  toast(`${makanan.name} tersimpan sebagai makanan milikmu.`);
}

/* --------------------------------------------------------------------------
   Rencana mingguan (2.11), daftar belanja (2.12), resep (2.13)
   -------------------------------------------------------------------------- */

/** Rencana minggu aktif dari target & seed tersimpan. */
function rencanaAktif() {
  const target = infoTarget();
  return buatRencanaMingguan(target.target, muatSeedRencana(), tanggalHariIni());
}

function renderRencana() {
  const wadahHari = ambil('mealRencanaHari');
  const ketEl = ambil('mealRencanaKet');
  if (!wadahHari) return;

  const target = infoTarget();
  const rencana = buatRencanaMingguan(target.target, muatSeedRencana(), tanggalHariIni());

  if (ketEl) {
    const singkat = (t) => {
      const [y, m, d] = t.split('-').map(Number);
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
        .format(new Date(y, m - 1, d));
    };
    ketEl.textContent =
      `Saran menu ± ${formatRibuan(target.target)} kkal/hari · ` +
      `${singkat(rencana.hari[0].tanggal)} – ${singkat(rencana.hari[6].tanggal)}`;
  }

  // Jaga <details> yang sedang terbuka saat re-render.
  const terbuka = new Set(
    [...wadahHari.querySelectorAll('details[open]')].map((d) => d.dataset.hari));

  wadahHari.replaceChildren();
  for (const hari of rencana.hari) {
    const hariIni = hari.tanggal === tanggalHariIni();

    const detail = elemen('details', 'meal__rencanaItem');
    detail.dataset.hari = hari.tanggal;
    if (hariIni || terbuka.has(hari.tanggal)) detail.open = true;

    const kepala = elemen('summary', 'meal__rencanaKepala');
    kepala.appendChild(elemen('span', 'meal__rencanaHariLabel',
      hariIni ? `${hari.label} · hari ini` : hari.label));
    kepala.appendChild(elemen('span', 'meal__rencanaHariTotal',
      `± ${formatRibuan(hari.total)} kkal`));
    detail.appendChild(kepala);

    const isi = elemen('div', 'meal__rencanaIsi');
    for (const kunciSlot of Object.keys(SLOT_MAKAN)) {
      const baris = elemen('div', 'meal__rencanaSlot');
      baris.appendChild(elemen('span', 'meal__rencanaNama', SLOT_MAKAN[kunciSlot]));
      const teks = hari.slot[kunciSlot]
        .map((item) => {
          const makanan = FOODS.find((m) => m.id === item.foodId);
          return makanan
            ? `${makanan.name} × ${formatDesimal(item.servings)}`
            : '';
        })
        .filter(Boolean)
        .join(', ');
      baris.appendChild(elemen('span', 'meal__rencanaTeks', teks));
      isi.appendChild(baris);
    }
    detail.appendChild(isi);
    wadahHari.appendChild(detail);
  }
}

/** Acak ulang menu: seed baru + kosongkan checklist belanja. */
function acakUlangRencana() {
  simpanSeedRencana(Math.floor(Math.random() * 1e9) + 1);
  bersihkanCentangBelanja();
  renderRencana();
  renderBelanja();
  toast('Menu baru siap. Checklist belanja dikosongkan.');
}

/* --- Daftar belanja -------------------------------------------------------- */

function renderBelanja() {
  const daftarEl = ambil('mealBelanjaDaftar');
  const sisaEl = ambil('mealBelanjaSisa');
  if (!daftarEl) return;

  const belanja = daftarBelanjaDariRencana(rencanaAktif());
  const centang = new Set(muatCentangBelanja());
  daftarEl.replaceChildren();

  let sudahBeli = 0;
  for (const item of belanja) {
    const cek = document.createElement('input');
    cek.type = 'checkbox';
    cek.className = 'meal__belanjaCek';
    cek.id = `belanja-${item.id}`;
    cek.checked = centang.has(item.id);
    cek.dataset.belanjaId = item.id;
    cek.setAttribute('aria-label', `Tandai ${item.name} sudah dibeli`);
    if (cek.checked) sudahBeli++;

    const teks = elemen('label', 'meal__belanjaTeks');
    teks.htmlFor = cek.id;
    teks.appendChild(elemen('span', 'meal__belanjaNama', item.name));
    teks.appendChild(elemen('span', 'meal__belanjaKet',
      `${formatDesimal(item.servings)} porsi · dipakai ${item.hari} hari`));

    const baris = elemen('li', 'meal__belanjaBaris');
    baris.appendChild(cek);
    baris.appendChild(teks);
    daftarEl.appendChild(baris);
  }

  if (sisaEl) sisaEl.textContent = belanja.length
    ? `${sudahBeli}/${belanja.length} dibeli`
    : 'Masih kosong';
  daftarEl.hidden = belanja.length === 0;
}

/* --- Resep sederhana --------------------------------------------------------- */

/** Resep dirender sekali (detail buka-tutup bawaan <details>). */
function renderResep() {
  const wadah = ambil('mealResepDaftar');
  if (!wadah || wadah.childElementCount > 0) return;

  for (const resep of RESEP) {
    const detail = elemen('details', 'meal__resepItem');

    const kepala = elemen('summary', 'meal__resepKepala');
    kepala.appendChild(elemen('span', 'meal__resepNama', resep.name));
    kepala.appendChild(elemen('span', 'meal__resepKet',
      `${resep.porsi} · ± ${formatRibuan(resep.kcal)} kkal/porsi`));
    detail.appendChild(kepala);

    const isi = elemen('div', 'meal__resepIsi');

    const jBahan = elemen('h3', 'meal__resepJudulKecil', 'Bahan');
    const daftarBahan = elemen('ul', 'meal__resepBahan');
    for (const bahan of resep.bahan) {
      daftarBahan.appendChild(elemen('li', '', bahan));
    }
    isi.appendChild(jBahan);
    isi.appendChild(daftarBahan);

    const jLangkah = elemen('h3', 'meal__resepJudulKecil', 'Cara membuat');
    const daftarLangkah = elemen('ol', 'meal__resepLangkah');
    for (const langkah of resep.langkah) {
      daftarLangkah.appendChild(elemen('li', '', langkah));
    }
    isi.appendChild(jLangkah);
    isi.appendChild(daftarLangkah);

    detail.appendChild(isi);
    wadah.appendChild(detail);
  }
}

/* --------------------------------------------------------------------------
   Event delegasi dialog & slot
   -------------------------------------------------------------------------- */

function pasangEvent() {
  // Rencana: acak ulang + centang belanja (delegasi)
  ambil('btnAcakRencana')?.addEventListener('click', acakUlangRencana);
  ambil('mealBelanjaDaftar')?.addEventListener('change', (event) => {
    const cek = event.target.closest('[data-belanja-id]');
    if (cek) ubahCentangBelanja(cek.dataset.belanjaId, cek.checked);
    renderBelanja();
  });

  // Navigasi tanggal
  ambil('btnHariSebelum')?.addEventListener('click', () => geserHari(-1));
  ambil('btnHariBerikut')?.addEventListener('click', () => geserHari(1));
  ambil('btnHariIni')?.addEventListener('click', () => {
    state.tanggal = tanggalHariIni();
    renderSemua();
  });

  // Tombol tambah per slot
  document.querySelectorAll('[data-slot-tambah]').forEach((tombol) => {
    tombol.addEventListener('click', () =>
      bukaDialog('tambah', tombol.dataset.slotTambah));
  });

  // Dialog: pencarian (input kecil langsung diproses; daftarnya juga ringan)
  ambil('mealCari')?.addEventListener('input', (event) =>
    renderHasilDialog(event.target.value || ''));
  ambil('btnTutupDialog')?.addEventListener('click', tutupDialog);
  ambil('mealDialog')?.addEventListener('click', (event) => {
    if (event.target === ambil('mealDialog')) tutupDialog();
  });
  ambil('btnPorsiKurang')?.addEventListener('click', () => ubahPorsi(-LANGKAH_PORSI));
  ambil('btnPorsiTambah')?.addEventListener('click', () => ubahPorsi(LANGKAH_PORSI));
  ambil('btnSimpanEntri')?.addEventListener('click', simpanEntri);

  // Dialog: pilih makanan & bintang (delegasi)
  ambil('mealDialog')?.addEventListener('click', (event) => {
    const tombol = event.target.closest('[data-food-id], [data-bintang]');
    if (!tombol || !state.dialog) return;

    if (tombol.dataset.bintang !== undefined) {
      ubahStatusFavorit(tombol.dataset.bintang, tombol);
      return;
    }
    if (state.dialog.mode === 'tambah') {
      state.dialog.foodId = tombol.dataset.foodId;
      state.dialog.porsi = state.dialog.porsi || 1;
      const tombolSimpan = ambil('btnSimpanEntri');
      if (tombolSimpan) tombolSimpan.disabled = false;
      renderPorsi();
    }
  });

  // Slot: aksi ubah/hapus/bintang baris entri (delegasi)
  document.querySelectorAll('.meal__slot').forEach((slotEl) => {
    slotEl.addEventListener('click', (event) => {
      const tombol = event.target.closest('[data-aksi]');
      if (!tombol) return;
      if (tombol.dataset.aksi === 'hapus') hapusEntri(tombol.dataset.entriId);
      if (tombol.dataset.aksi === 'edit') {
        const entri = muatLogMakan(state.tanggal)
          .find((item) => item.id === tombol.dataset.entriId);
        if (entri) bukaDialog('edit', entri.slot, entri);
      }
      if (tombol.dataset.aksi === 'bintang') {
        ubahStatusFavorit(tombol.dataset.foodId, tombol);
      }
    });
  });

  // Form makanan kustom
  ambil('btnBukaCustom')?.addEventListener('click', () => {
    const form = ambil('mealCustomForm');
    if (form) {
      form.hidden = false;
      ambil('mealCustomNama')?.focus();
    }
  });
  ambil('mealCustomForm')?.addEventListener('submit', kustomMakananBaru);

  // Tautan ke tab Akun dari kartu ringkasan (sudah dibawa pasangNavigasi app.js)
}

/* --------------------------------------------------------------------------
   Render seluruh halaman
   -------------------------------------------------------------------------- */

function renderSemua() {
  renderRingkasan();
  renderNavigasiTanggal();
  renderSlotSemua();
  renderRencana();
  renderBelanja();
  renderResep();
}

/**
 * Siapkan halaman Pola Makan. Dipanggil sekali dari app.js; konten
 * diperbarui tiap kali tanggal berubah atau entri disimpan.
 * @param {HTMLElement} container - elemen main#page-pola-makan
 */
export function renderMealsPage(container) {
  if (!container) return;
  if (ambil('btnHariSebelum')) { // sudah pernah dipasang
    renderSemua();
    return;
  }
  pasangEvent();
  renderSemua();
}
