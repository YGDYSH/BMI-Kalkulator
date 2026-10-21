/* ==========================================================================
   charts.js — Grafik SVG sederhana untuk riwayat berat (dan lainnya).
   Hanya memakai createElementNS — aman, tanpa innerHTML.
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';

/** Padding dalam viewBox (unit koordinat). */
const PAD = { kiri: 34, kanan: 8, atas: 10, bawah: 18 };

/** Label titik x: "21/10" dari "2026-10-21". */
function labelTanggalPendek(yyyyMmDd) {
  if (typeof yyyyMmDd !== 'string') return String(yyyyMmDd ?? '');
  const bagian = yyyyMmDd.split('-');
  if (bagian.length < 3) return yyyyMmDd;
  return `${Number(bagian[2])}/${Number(bagian[1])}`;
}

function buatElemen(nama, atribut = {}) {
  const node = document.createElementNS(NS, nama);
  for (const [kunci, nilai] of Object.entries(atribut)) {
    node.setAttribute(kunci, nilai);
  }
  return node;
}

/**
 * Gambar grafik garis ke dalam `container`.
 * points: [{ x: tanggal, value: angka }] — minimal 1 titik.
 * options: {
 *   targetValue: number   → garis target putus-putus,
 *   tinggi: number        → tinggi viewBox (default 160),
 *   labelTarget: string   → teks di ujung garis target,
 *   ubahNilai: fn         → tampilan nilai (mis. kg → lb),
 *   warnaGaris, warnaTarget → warna stroke
 * }
 */
export function renderLineChart(container, points, options = {}) {
  if (!container) return;
  container.replaceChildren();

  const bersih = (Array.isArray(points) ? points : [])
    .map((p) => ({ x: p?.x, value: Number(p?.value) }))
    .filter((p) => Number.isFinite(p.value));
  if (bersih.length === 0) return;

  const lebar = 320;                          // viewBox; responsif via CSS 100%×auto
  const tinggi = options.tinggi || 160;
  const ubahNilai = typeof options.ubahNilai === 'function'
    ? options.ubahNilai
    : (v) => v;

  const svg = buatElemen('svg', {
    viewBox: `0 0 ${lebar} ${tinggi}`,
    class: 'grafik',
    role: 'img',
    'aria-label': options.ariaLabel || 'Grafik garis',
    'preserveAspectRatio': 'xMidYMid meet',
  });
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';

  const nilai = bersih.map((p) => p.value);
  const target = Number.isFinite(Number(options.targetValue))
    ? Number(options.targetValue)
    : null;
  const semua = target !== null ? [...nilai, target] : nilai;
  const min = Math.min(...semua);
  const max = Math.max(...semua);

  // Beri ruang agar titik tidak nempel di tepi.
  const rentang = max - min || Math.max(1, max * 0.1);
  const nilaiMin = min - rentang * 0.15;
  const nilaiMax = max + rentang * 0.15;
  const tinggiBerguna = tinggi - PAD.atas - PAD.bawah;
  const lebarBerguna = lebar - PAD.kiri - PAD.kanan;
  const lebarLangkah = bersih.length > 1
    ? lebarBerguna / (bersih.length - 1)
    : 0;

  const koordinatY = (nilaiY) =>
    PAD.atas + ((nilaiMax - nilaiY) / (nilaiMax - nilaiMin)) * tinggiBerguna;
  const koordinatX = (indeks) =>
    bersih.length === 1
      ? PAD.kiri + lebarBerguna / 2
      : PAD.kiri + indeks * lebarLangkah;

  // 1. Label skala Y (min & max tampilan)
  [nilaiMin, nilaiMax].forEach((nilaiY) => {
    const teks = buatElemen('text', {
      x: PAD.kiri - 6,
      y: koordinatY(nilaiY) + 3,
      'text-anchor': 'end',
      'font-size': '9',
    });
    textSet(teks, String(Math.round(ubahNilai(nilaiY))));
    teks.setAttribute('class', 'grafik__label');
    svg.appendChild(teks);
  });

  // 2. Garis target putus-putus (bila ada)
  if (target !== null) {
    const garis = buatElemen('line', {
      x1: PAD.kiri,
      x2: lebar - PAD.kanan,
      y1: koordinatY(target),
      y2: koordinatY(target),
      'stroke-dasharray': '5 4',
      class: 'grafik__target',
    });
    garis.setAttribute('stroke', options.warnaTarget || 'var(--c-ideal)');
    garis.setAttribute('stroke-width', '1.4');
    svg.appendChild(garis);

    const ketTarget = buatElemen('text', {
      x: lebar - PAD.kanan,
      y: koordinatY(target) - 5,
      'text-anchor': 'end',
      'font-size': '9',
    });
    textSet(ketTarget, options.labelTarget ||
      `Target ${Math.round(ubahNilai(target))}`);
    ketTarget.setAttribute('class', 'grafik__label');
    svg.appendChild(ketTarget);
  }

  // 3. Polyline titik-titik
  const titik = bersih.map((p, i) =>
    `${koordinatX(i).toFixed(1)},${koordinatY(p.value).toFixed(1)}`).join(' ');
  const polyline = buatElemen('polyline', {
    points: titik,
    fill: 'none',
    class: 'grafik__garis',
  });
  polyline.setAttribute('stroke', options.warnaGaris || 'var(--c-utama)');
  polyline.setAttribute('stroke-width', '2.4');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  // 4. Titik bulat + label tanggal x hanya setiap ±6 titik (agar tidak padat)
  const langkahLabel = Math.max(1, Math.ceil(bersih.length / 6));
  bersih.forEach((p, i) => {
    const lingkaran = buatElemen('circle', {
      cx: koordinatX(i),
      cy: koordinatY(p.value),
      r: i === bersih.length - 1 ? 4 : 2.6,
      class: 'grafik__titik',
    });
    lingkaran.setAttribute('fill', options.warnaGaris || 'var(--c-utama)');
    svg.appendChild(lingkaran);

    if (i % langkahLabel === 0 || i === bersih.length - 1) {
      const label = buatElemen('text', {
        x: koordinatX(i),
        y: tinggi - 4,
        'text-anchor': 'middle',
        'font-size': '9',
      });
      textSet(label, labelTanggalPendek(p.x));
      label.setAttribute('class', 'grafik__label');
      svg.appendChild(label);
    }
  });

  container.appendChild(svg);
}

/** Set textContent dengan aman. */
function textSet(node, nilai) {
  node.textContent = String(nilai);
}
