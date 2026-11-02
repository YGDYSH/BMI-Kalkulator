/* ==========================================================================
   profile.js — Halaman Akun: ringkasan kesehatan, form profil, log berat,
   grafik, pengaturan (tema & satuan), serta data & privasi.
   Semua penyimpanan lewat storage.js; perhitungan lewat nutrition.js/bmi.js.
   ========================================================================== */

import { hitungBMI, kategoriBMI } from './bmi.js';
import {
  hitungStreakCatat,
  hitungTargetKalori,
  maksMingguan,
  nomorSenin,
  ringkasanNutrisi,
} from './nutrition.js';
import { dariNomorHari, nomorHari, FOODS } from './data.js';
import { renderLineChart } from './charts.js';
import { formatDesimal, formatRibuan, toast } from './ui.js';
import {
  catatBerat,
  hapusSemuaData,
  hapusProfil,
  kumpulkanSemuaData,
  muatBadgeDilihat,
  muatLogAir,
  muatLogBerat,
  muatMakananKustom,
  muatPengaturan,
  muatProfil,
  muatSemuaLogMakan,
  muatSemuaLogOlahraga,
  simpanPengaturan,
  simpanProfil,
  tanggalHariIni,
  timpaDenganData,
} from './storage.js';

/** Versi aplikasi (ditampilkan di kartu Tentang). */
export const VERSI_APLIKASI = '1.1.0';

const FAKTOR_LB = 2.20462;

/** Simpan rentang grafik berat yang aktif (30 / 90 hari). */
let rentangGrafik = 30;

/* --------------------------------------------------------------------------
   Utilitas tampilan
   -------------------------------------------------------------------------- */

function ambil(id) {
  return document.getElementById(id);
}

/** Tampilan berat sesuai satuan pengaturan (data tetap kg). */
function tampilBerat(kg) {
  const angka = Number(kg);
  if (!Number.isFinite(angka)) return '—';
  const pengaturan = muatPengaturan();
  const tampil = pengaturan.satuan === 'lb' ? angka * FAKTOR_LB : angka;
  const satuan = pengaturan.satuan === 'lb' ? 'lb' : 'kg';
  return `${formatDesimal(tampil)} ${satuan}`;
}

/** Nilai berat murni (angka saja) sesuai satuan — untuk sumbu grafik. */
function nilaiBeratTampil(kg) {
  const pengaturan = muatPengaturan();
  return pengaturan.satuan === 'lb'
    ? Number(kg) * FAKTOR_LB
    : Number(kg);
}

/* --------------------------------------------------------------------------
   Ringkasan kesehatan (BMI, BMR, TDEE, target kalori)
   -------------------------------------------------------------------------- */

function renderRingkasan() {
  const profil = muatProfil();
  const ajakan = ambil('profilAjakan');
  const lencanaNama = ambil('profilLencanaNama');
  const sapaan = ambil('profilSapaan');

  if (!profil) {
    if (ajakan) ajakan.hidden = false;
    if (lencanaNama) lencanaNama.hidden = true;
    ['profilBmi', 'profilBmr', 'profilTdee', 'profilTargetKkal'].forEach((id) => {
      const el = ambil(id);
      if (el) el.textContent = '—';
    });
    const kategoriEl = ambil('profilKategori');
    const peringatanEl = ambil('profilPeringatan');
    if (kategoriEl) kategoriEl.hidden = true;
    if (peringatanEl) peringatanEl.hidden = true;
    return;
  }

  if (ajakan) ajakan.hidden = true;
  if (lencanaNama) {
    lencanaNama.textContent = profil.name || 'Pengguna';
    lencanaNama.hidden = false;
  }
  if (sapaan) {
    sapaan.textContent = profil.name
      ? `Halo, ${profil.name}! Ini kondisimu hari ini.`
      : 'Ini kondisimu hari ini.';
  }

  const bmi = hitungBMI(profil.weightKg, profil.heightCm);
  const kategori = kategoriBMI(bmi);
  const gizi = ringkasanNutrisi(profil);

  const bmiEl = ambil('profilBmi');
  if (bmiEl) bmiEl.textContent = bmi === null ? '—' : formatDesimal(bmi);
  const bmrEl = ambil('profilBmr');
  if (bmrEl) bmrEl.textContent = gizi ? formatRibuan(gizi.bmr) : '—';
  const tdeeEl = ambil('profilTdee');
  if (tdeeEl) tdeeEl.textContent = gizi ? formatRibuan(gizi.tdee) : '—';
  const targetEl = ambil('profilTargetKkal');
  if (targetEl) targetEl.textContent = gizi ? formatRibuan(gizi.target) : '—';

  const kategoriEl = ambil('profilKategori');
  if (kategoriEl) {
    if (kategori) {
      kategoriEl.textContent = `BMI ${kategori.label} · ${kategori.rentang}`;
      kategoriEl.dataset.kategori = kategori.key;
      kategoriEl.hidden = false;
    } else {
      kategoriEl.hidden = true;
    }
  }

  // Peringatan: batas aman kalori & pengguna di bawah 18 tahun (desain.md §5).
  const peringatanEl = ambil('profilPeringatan');
  if (peringatanEl) {
    const catatan = [];
    if (gizi && gizi.dibatasi) {
      catatan.push(
        `Target kalorimu ditahan di batas aman ${formatRibuan(gizi.batasMin)} kkal. ` +
        'Untuk rencana yang lebih cocok, berkonsultasilah dengan ahli gizi.'
      );
    }
    if (profil.usia < 18) {
      catatan.push(
        'Kamu berusia di bawah 18 tahun — rumus umum mungkin kurang cocok ' +
        'untukmu. Minta pendampingan orang tua atau tenaga kesehatan.'
      );
    }
    if (catatan.length > 0) {
      peringatanEl.textContent = catatan.join(' ');
      peringatanEl.hidden = false;
    } else {
      peringatanEl.hidden = true;
    }
  }
}

/* --------------------------------------------------------------------------
   Form profil: isi ulang, baca, validasi, simpan
   -------------------------------------------------------------------------- */

function isiFormDariProfil() {
  const profil = muatProfil();
  if (!profil) return;

  const pasangan = {
    profilNama: profil.name ?? '',
    profilUsia: profil.usia ?? '',
    profilSex: profil.sex ?? '',
    profilTinggi: profil.heightCm ?? '',
    profilBerat: profil.weightKg ?? '',
    profilAktivitas: profil.activity ?? 'sedentary',
    profilTujuan: profil.goal ?? 'maintain',
    profilTargetBerat: profil.targetWeightKg ?? profil.weightKg ?? '',
    profilBeratBaru: profil.weightKg ?? '',
  };
  for (const [id, nilai] of Object.entries(pasangan)) {
    const el = ambil(id);
    if (el) el.value = nilai;
  }
}

/**
 * Baca & validasi form. Mengembalikan objek profil, atau string pesan galat.
 */
function bacaForm() {
  const nama = (ambil('profilNama')?.value || '').trim();
  const usia = Number(ambil('profilUsia')?.value);
  const sex = ambil('profilSex')?.value || '';
  const tinggi = Number(ambil('profilTinggi')?.value);
  const berat = Number(ambil('profilBerat')?.value);
  const aktivitas = ambil('profilAktivitas')?.value || 'sedentary';
  const tujuan = ambil('profilTujuan')?.value || 'maintain';
  const targetBeratRaw = ambil('profilTargetBerat')?.value;

  if (!usia || usia < 10 || usia > 100) {
    return 'Isi usia antara 10 sampai 100 tahun, ya.';
  }
  if (!sex) return 'Pilih jenis kelaminmu dulu, ya.';
  if (!tinggi || tinggi < 100 || tinggi > 250) {
    return 'Isi tinggi badan antara 100 sampai 250 cm, ya.';
  }
  if (!berat || berat < 20 || berat > 300) {
    return 'Isi berat badan antara 20 sampai 300 kg, ya.';
  }
  const targetBerat = Number(targetBeratRaw);
  if (targetBeratRaw !== '' &&
      (!targetBerat || targetBerat < 20 || targetBerat > 300)) {
    return 'Berat target harus antara 20 sampai 300 kg (atau kosongkan).';
  }

  return {
    name: nama,
    usia: Math.round(usia),
    sex,
    heightCm: Math.round(tinggi),
    weightKg: Math.round(berat * 10) / 10,
    activity: aktivitas,
    goal: tujuan,
    targetWeightKg: targetBeratRaw === '' ? null : Math.round(targetBerat * 10) / 10,
  };
}

/** Aksi tombol Simpan Profil. */
function saatSimpanProfil(onProfilTersimpan) {
  const hasil = bacaForm();
  if (typeof hasil === 'string') {
    toast(hasil);
    return;
  }

  const tersimpan = simpanProfil(hasil);
  if (!tersimpan) {
    toast('Profil gagal tersimpan. Cek penyimpanan perangkatmu, ya.');
    return;
  }

  // Target berat kosong dapat dianggap sama dengan berat sekarang.
  const profilLengkap = {
    ...tersimpan,
    targetWeightKg: tersimpan.targetWeightKg ?? tersimpan.weightKg,
  };

  isiFormDariProfil();
  renderRingkasan();
  renderKartuBerat();
  flashLencanaSimpan();
  toast('Profil tersimpan. Targetmu sudah diperbarui!');

  if (typeof onProfilTersimpan === 'function') {
    onProfilTersimpan(profilLengkap);
  }
}

/** Tampilkan lencana "Tersimpan" sejenak di kartu profil. */
function flashLencanaSimpan() {
  const lencana = ambil('profilStatusSimpan');
  if (!lencana) return;
  lencana.hidden = false;
  setTimeout(() => { lencana.hidden = true; }, 1800);
}

/* --------------------------------------------------------------------------
   Riwayat berat & grafik
   -------------------------------------------------------------------------- */

/** Titik grafik: log berat difilter N hari terakhir (ASC). */
function titikGrafik(hari) {
  const semua = muatLogBerat();
  const mulai = new Date();
  mulai.setDate(mulai.getDate() - (hari - 1));
  const dua = (angka) => String(angka).padStart(2, '0');
  const tanggalMulai = `${mulai.getFullYear()}-${dua(mulai.getMonth() + 1)}-${dua(mulai.getDate())}`;
  return semua.filter((entri) => entri.date >= tanggalMulai);
}

function renderKartuBerat() {
  const profil = muatProfil();
  const pengaturan = muatPengaturan();
  const titik = titikGrafik(rentangGrafik);

  // Lencana berat terakhir
  const terakhir = ambil('profilBeratTerakhir');
  const logSemua = muatLogBerat();
  if (terakhir) {
    const entriTerakhir = logSemua[logSemua.length - 1];
    terakhir.textContent = entriTerakhir
      ? `${tampilBerat(entriTerakhir.weightKg)} · ${entriTerakhir.date.split('-').reverse().join('/')}`
      : 'Belum ada data';
  }

  // Grafik
  const wadah = ambil('grafikBerat');
  if (wadah) {
    if (titik.length === 0) {
      wadah.replaceChildren();
      const pesan = document.createElement('p');
      pesan.className = 'profile__grafikKosong';
      pesan.textContent = 'Belum ada data berat dalam rentang ini. Catat dulu ya!';
      wadah.appendChild(pesan);
    } else {
      const ubahNilai = pengaturan.satuan === 'lb' ? nilaiBeratTampil : undefined;
      renderLineChart(wadah, titik.map((p) => ({ x: p.date, value: p.weightKg })), {
        targetValue: profil?.targetWeightKg ?? null,
        labelTarget: profil?.targetWeightKg
          ? `Target ${tampilBerat(profil.targetWeightKg)}`
          : '',
        ubahNilai,
        ariaLabel: `Grafik berat badan ${rentangGrafik} hari terakhir`,
      });
    }
  }
}

/** Aksi tombol "Catat" berat hari ini. */
function saatCatatBerat() {
  const profil = muatProfil();
  if (!profil) {
    toast('Isi profil dulu di atas, lalu catat beratmu di sini.');
    return;
  }

  const input = ambil('profilBeratBaru');
  const nilai = input ? input.value : '';
  const tersimpan = catatBerat(nilai);
  if (!tersimpan) {
    toast('Masukkan berat antara 20 sampai 300 kg, ya.');
    return;
  }

  // Berat hari ini juga memperbarui berat di profil (data terbaru).
  const profilBaru = { ...profil, weightKg: Math.round(Number(nilai) * 10) / 10 };
  simpanProfil(profilBaru);

  isiFormDariProfil();
  renderRingkasan();
  renderKartuBerat();
  const terakhirEntri = muatLogBerat();
  const adaHariIni = terakhirEntri.some((e) => e.date === tanggalHariIni());
  toast(adaHariIni
    ? 'Berat hari ini tercatat (menimpa catatan sebelumnya).'
    : 'Berat tercatat.');
}

/* --------------------------------------------------------------------------
   Grafik mingguan (tugas 4.4): kalori masuk vs target + menit olahraga/hari
   -------------------------------------------------------------------------- */

/** Senin–Minggu minggu berisi hari ini → array 7 tanggal. */
function hariMingguIni() {
  const hariIni = tanggalHariIni();
  const mulai = nomorHari(hariIni);
  if (mulai === null) return [];
  const senin = nomorSenin(hariIni);
  const hasil = [];
  for (let i = 0; i < 7; i++) hasil.push(dariNomorHari(senin + i));
  return hasil;
}

/** Kkal & menit per hari minggu ini (siap grafik). */
function dataGrafikMingguan() {
  const hari = hariMingguIni();
  const semuaMakan = muatSemuaLogMakan();
  const semuaOlahraga = muatSemuaLogOlahraga();
  const katalog = [...FOODS, ...muatMakananKustom()];

  const kkal = [];
  const menit = [];
  for (const tanggal of hari) {
    let kkalHari = 0;
    for (const entri of (Array.isArray(semuaMakan[tanggal]) ? semuaMakan[tanggal] : [])) {
      const makanan = katalog.find((m) => m.id === entri.foodId);
      if (makanan) kkalHari += makanan.kcal * (Number(entri.servings) || 0);
    }
    kkal.push(Math.round(kkalHari));
    let menitHari = 0;
    for (const entri of (Array.isArray(semuaOlahraga[tanggal]) ? semuaOlahraga[tanggal] : [])) {
      menitHari += Number(entri.minutes) || 0;
    }
    menit.push(menitHari);
  }
  return { hari, kkal, menit };
}

/** Grafik minggu = grafik garis bila ada data; pesan ramah bila kosong. */
function renderGrafikMingguan() {
  const { hari, kkal, menit } = dataGrafikMingguan();
  const profil = muatProfil();
  const targetKkal = profil
    ? (hitungTargetKalori(profil)?.target ?? 2000)
    : 2000;

  const wadahKkal = ambil('akunGrafikKalori');
  if (wadahKkal) {
    const totalKkal = kkal.reduce((a, b) => a + b, 0);
    if (totalKkal === 0) {
      wadahKkal.replaceChildren();
      wadahKkal.appendChild(pesanGrafikKosong(
        'Belum ada kalori masuk minggu ini. Catat makananmu di Pola Makan, ya.'));
    } else {
      renderLineChart(wadahKkal, hari.map((t, i) => ({ x: t, value: kkal[i] })), {
        targetValue: targetKkal,
        labelTarget: `Target ${formatRibuan(targetKkal)}`,
        warnaGaris: 'var(--c-utama)',
        warnaTarget: 'var(--c-ideal)',
        ariaLabel: 'Grafik kalori masuk minggu ini dibanding target',
      });
    }
  }

  const wadahMenit = ambil('akunGrafikMenit');
  if (wadahMenit) {
    const totalMenit = menit.reduce((a, b) => a + b, 0);
    if (totalMenit === 0) {
      wadahMenit.replaceChildren();
      wadahMenit.appendChild(pesanGrafikKosong(
        'Belum ada latihan minggu ini. 10 menit jalan cepat pun cukup untuk mulai.'));
    } else {
      renderLineChart(wadahMenit, hari.map((t, i) => ({ x: t, value: menit[i] })), {
        targetValue: TARGET_MENIT_HARIAN,
        labelTarget: `Acuan ${TARGET_MENIT_HARIAN} mnt`,
        warnaGaris: 'var(--c-ideal)',
        warnaTarget: 'var(--c-madu)',
        ariaLabel: 'Grafik menit olahraga per hari minggu ini',
      });
    }
  }
}

/** Pesan sederhana ketika grafik belum punya data. */
function pesanGrafikKosong(teks) {
  const pesan = document.createElement('p');
  pesan.className = 'profile__grafikKosong';
  pesan.textContent = teks;
  return pesan;
}

/* --------------------------------------------------------------------------
   Pencapaian (tugas 4.3): lencana kecil dari kebiasaan mencatat
   -------------------------------------------------------------------------- */

/** Acuan ringan 20 menit/hari untuk grafik menit. */
const TARGET_MENIT_HARIAN = 20;

/** Daftar badge + syaratnya (id jangan berubah — dipakai di storage). */
const DAFTAR_BADGE = [
  { id: 'catat-7', nama: 'Sefrekan Raajin', ket: 'Mencatat (makanan/olahraga/berat) 7 hari beruntun' },
  { id: 'air-5', nama: 'Teman Segar', ket: 'Target air minum tercapai 5 hari' },
  { id: 'makan-25', nama: 'Saudagar Catatan', ket: 'Mencatat 25 entri makanan' },
  { id: 'menit-150', nama: 'Sehat Sepanjang Minggu', ket: '150 menit latihan dalam satu minggu (WHO)' },
];

/**
 * Hitung pencapaian dari seluruh data tersimpan.
 * Dikembalikan { BARIS, keadaan, unlocked, baru } — dipakai app.js untuk titik.
 */
export function hitungPencapaian() {
  const hariIni = tanggalHariIni();
  const semuaMakan = muatSemuaLogMakan();
  const semuaOlahraga = muatSemuaLogOlahraga();

  // Tanggal yang "dicatat" = punya entri makanan / olahraga / berat.
  const tanggalDicatat = new Set();
  let jumlahEntriMakan = 0;
  for (const [tanggal, entri] of Object.entries(semuaMakan)) {
    if (Array.isArray(entri) && entri.length > 0) {
      tanggalDicatat.add(tanggal);
      jumlahEntriMakan += entri.length;
    }
  }
  const petaMenit = {};
  for (const [tanggal, entri] of Object.entries(semuaOlahraga)) {
    if (!Array.isArray(entri)) continue;
    if (entri.length > 0) tanggalDicatat.add(tanggal);
    let menit = 0;
    for (const item of entri) menit += Number(item.minutes) || 0;
    if (menit > 0) petaMenit[tanggal] = menit;
  }
  for (const entri of muatLogBerat()) tanggalDicatat.add(entri.date);

  const hariAirTercapai = muatLogAir()
    .filter((e) => e.targetGelas > 0 && e.gelas >= e.targetGelas).length;

  const keadaan = {
    'catat-7': hitungStreakCatat([...tanggalDicatat], hariIni) >= 7,
    'air-5': hariAirTercapai >= 5,
    'makan-25': jumlahEntriMakan >= 25,
    'menit-150': maksMingguan(petaMenit, hariIni) >= 150,
  };

  const dilihat = new Set(muatBadgeDilihat());
  const unlocked = DAFTAR_BADGE.filter((b) => keadaan[b.id]).map((b) => b.id);
  return {
    BARIS: DAFTAR_BADGE,
    keadaan,
    unlocked,
    baru: unlocked.filter((id) => !dilihat.has(id)),
  };
}

function renderPencapaian() {
  const wadah = ambil('akunBadgeDaftar');
  if (!wadah) return;

  const { BARIS, keadaan, unlocked, baru } = hitungPencapaian();
  wadah.replaceChildren();

  for (const badge of BARIS) {
    const terbuka = keadaan[badge.id];
    const item = elemenList('li', 'profile__badgeItem' + (terbuka ? ' profile__badgeItem--terbuka' : ''));
    item.setAttribute('role', 'listitem');

    const ikon = elemenList('span', 'profile__badgeIkon', terbuka ? '🏆' : '🔒');
    const teks = elemenList('span', 'profile__badgeTeks');
    teks.appendChild(elemenList('span', 'profile__badgeNama', badge.nama));
    teks.appendChild(elemenList('span', 'profile__badgeKet', badge.ket));
    item.appendChild(ikon);
    item.appendChild(teks);

    const keadaanTeks = terbuka
      ? (baru.includes(badge.id) ? 'Baru!' : 'Terbuka')
      : 'Terkunci';
    item.appendChild(elemenList('span',
      'profile__badgeKeadaan' + (terbuka ? ' profile__badgeKeadaan--terbuka' : ''),
      keadaanTeks));

    wadah.appendChild(item);
  }
  void unlocked;
}

/** createElement + className + textContent dalam satu langkah kecil. */
function elemenList(tag, kelas, teks) {
  const node = document.createElement(tag);
  if (kelas) node.className = kelas;
  if (teks !== undefined) node.textContent = teks;
  return node;
}

/* --------------------------------------------------------------------------
   Pengaturan: tema & satuan
   -------------------------------------------------------------------------- */

function terapkanTema(tema) {
  const root = document.documentElement;
  if (tema === 'gelap') {
    root.dataset.tema = 'gelap';
  } else {
    delete root.dataset.tema;
  }
  const metaTema = document.querySelector('meta[name="theme-color"]');
  if (metaTema) {
    metaTema.setAttribute('content', tema === 'gelap' ? '#221a13' : '#ea580c');
  }
  tandaiChip('[data-tema]', tema);
}

function terapkanSatuan(satuan) {
  tandaiChip('[data-satuan]', satuan);
}

function tandaiChip(pilihData, nilaiAktif) {
  document.querySelectorAll(pilihData).forEach((chip) => {
    const aktif = chip.dataset.tema === nilaiAktif || chip.dataset.satuan === nilaiAktif;
    chip.classList.toggle('profile__chip--aktif', aktif);
    chip.setAttribute('aria-pressed', String(aktif));
  });
}

function renderPengaturan() {
  const pengaturan = muatPengaturan();
  terapkanTema(pengaturan.tema);
  terapkanSatuan(pengaturan.satuan);
}

/* --------------------------------------------------------------------------
   Data & privasi: ekspor, impor, hapus
   -------------------------------------------------------------------------- */

function saatEksporData() {
  const isi = kumpulkanSemuaData();
  if (!isi) {
    toast('Data tidak bisa diekspor (penyimpanan terblokir?).');
    return;
  }

  const namaBerkas = `nutrikala-data-${tanggalHariIni()}.json`;
  try {
    const blob = new Blob([JSON.stringify(isi, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const tautan = document.createElement('a');
    tautan.href = url;
    tautan.download = namaBerkas;
    tautan.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Data diekspor ke ${namaBerkas}.`);
  } catch (err) {
    console.warn('[NutriKala] Gagal mengekspor:', err);
    toast('Gagal mengekspor data. Coba lagi, ya.');
  }
}

function saatImporData() {
  const input = ambil('inputImporData');
  if (!input) return;
  input.value = '';
  input.click();
}

function bacaBerkasImpor(berkas, onProfilTersimpan) {
  const pembaca = new FileReader();
  pembaca.onerror = () => toast('Berkas tidak bisa dibaca. Coba lagi, ya.');
  pembaca.onload = () => {
    try {
      const isi = JSON.parse(String(pembaca.result));
      const jumlah = timpaDenganData(isi);
      if (jumlah === null) {
        toast('Berkas bukan data NutriKala yang sah.');
        return;
      }
      // Segarkan seluruh halaman sesuai data baru.
      renderPengaturan();
      isiFormDariProfil();
      renderRingkasan();
      renderKartuBerat();
      if (typeof onProfilTersimpan === 'function') {
        onProfilTersimpan(muatProfil());
      }
      toast(`Data berhasil diimpor (${jumlah} bagian).`);
    } catch (err) {
      console.warn('[NutriKala] Impor gagal:', err);
      toast('Berkas rusak atau bukan JSON sah.');
    }
  };
  pembaca.readAsText(berkas);
}

function saatHapusData(onProfilTersimpan) {
  const yakin = window.confirm(
    'Hapus semua data NutriKala (profil, catatan berat, hidrasi, dsb) ' +
    'dari perangkat ini? Tindakan ini tidak bisa dibatalkan.'
  );
  if (!yakin) return;

  if (!hapusSemuaData()) {
    toast('Gagal menghapus data. Coba lagi, ya.');
    return;
  }

  renderPengaturan();
  hapusProfil(); // aman bila sudah ikut terhapus
  kosongkanFormProfil();
  renderRingkasan();
  renderKartuBerat();
  if (typeof onProfilTersimpan === 'function') onProfilTersimpan(null);
  toast('Semua data terhapus. Besok kita mulai yang baru.');
}

function kosongkanFormProfil() {
  ['profilNama', 'profilUsia', 'profilSex', 'profilTinggi', 'profilBerat',
    'profilTargetBerat', 'profilBeratBaru'].forEach((id) => {
    const el = ambil(id);
    if (el) el.value = '';
  });
  const aktivitas = ambil('profilAktivitas');
  if (aktivitas) aktivitas.value = 'sedentary';
  const tujuan = ambil('profilTujuan');
  if (tujuan) tujuan.value = 'maintain';
}

/* --------------------------------------------------------------------------
   Pasang seluruh halaman Akun
   -------------------------------------------------------------------------- */

/**
 * Siapkan halaman Akun. Dipanggil sekali dari app.js; memutakhirkan
 * seluruh bagian sesuai data tersimpan dan memasang event.
 * @param {HTMLElement} container  - elemen main#page-akun
 * @param {{ onProfilTersimpan?: (profil: object|null) => void }} opsi
 */
export function renderProfilePage(container, opsi = {}) {
  if (!container) return;
  const { onProfilTersimpan } = opsi;

  const versiEl = ambil('profilVersi');
  if (versiEl) versiEl.textContent = `v${VERSI_APLIKASI}`;

  renderPengaturan();
  isiFormDariProfil();
  renderRingkasan();
  renderKartuBerat();

  // Fase 4: grafik minggu Keenam ini (4.4) + lencana pencapaian (4.3).
  renderGrafikMingguan();
  renderPencapaian();

  ambil('btnSimpanProfil')
    ?.addEventListener('click', () => saatSimpanProfil(onProfilTersimpan));

  ambil('btnCatatBerat')
    ?.addEventListener('click', () => saatCatatBerat());

  document.querySelectorAll('[data-rentang]').forEach((chip) => {
    chip.addEventListener('click', () => {
      rentangGrafik = Number(chip.dataset.rentang) === 90 ? 90 : 30;
      document.querySelectorAll('[data-rentang]').forEach((c) => {
        const aktif = Number(c.dataset.rentang) === rentangGrafik;
        c.classList.toggle('profile__chip--aktif', aktif);
        c.setAttribute('aria-pressed', String(aktif));
      });
      renderKartuBerat();
    });
  });

  document.querySelectorAll('[data-tema]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const tema = chip.dataset.tema === 'gelap' ? 'gelap' : 'terang';
      simpanPengaturan({ tema });
      terapkanTema(tema);
    });
  });

  document.querySelectorAll('[data-satuan]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const satuan = chip.dataset.satuan === 'lb' ? 'lb' : 'kg';
      simpanPengaturan({ satuan });
      terapkanSatuan(satuan);
      renderRingkasan();
      renderKartuBerat();
      toast(satuan === 'lb' ? 'Satuan lb diaktifkan (tampilan saja).' : 'Satuan kg diaktifkan.');
    });
  });

  ambil('btnEksporData')?.addEventListener('click', saatEksporData);
  ambil('btnImporData')?.addEventListener('click', saatImporData);
  ambil('btnHapusData')
    ?.addEventListener('click', () => saatHapusData(onProfilTersimpan));
  ambil('inputImporData')?.addEventListener('change', (event) => {
    const berkas = event.target.files?.[0];
    if (berkas) bacaBerkasImpor(berkas, onProfilTersimpan);
  });
}
