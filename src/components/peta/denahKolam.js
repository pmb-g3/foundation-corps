// ============================================================
// Denah kolam (F-11). Urutan sumber denah:
// 1. Foto udara kolam + poligon tiap bilik (kolom polygon_json, digambar di Editor Zona → Bilik Kolam).
// 2. DENAH_ASLI (path SVG) bila diisi.
// 3. Denah otomatis dari blok_induk + kode_bilik (cadangan bila belum ada poligon).
// ============================================================
import { bacaPoligon, bbox, gabungBBox, jalurPoligon, titikTengah } from './petaLib.js';

/**
 * Contoh bentuk DENAH_ASLI:
 * {
 *   lebar: 1000, tinggi: 640,
 *   blok:  [{ id: 'Blok A', d: 'M40,40 H480 V300 H40 Z' }],
 *   bilik: { K1: { d: 'M60,90 H200 V180 H60 Z', blok: 'Blok A' } }
 * }
 */
export const DENAH_ASLI = null;

/** 'B1' → 'Bilik B1'; nama panjang (mis. 'Kolam Besar') tampil apa adanya. */
export const namaBilik = (k) => (/^[A-Za-z]{0,3}\d+[A-Za-z]?$/.test(String(k?.kode_bilik || '')) ? `Bilik ${k.kode_bilik}` : k?.kode_bilik || 'Bilik');

const urutAlami = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true });

function persegi(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x + rr} Q${x},${y + h} ${x},${y + h - rr} V${y + rr} Q${x},${y} ${x + rr},${y} Z`;
}

/** Bbox kasar dari path berisi perintah M/L/H/V/Q/C dengan koordinat absolut. */
function bboxPath(d) {
  const angka = String(d).match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const xs = [];
  const ys = [];
  // asumsi pasangan x,y; H/V menambah satu nilai — cukup untuk bbox kasar
  for (let i = 0; i + 1 < angka.length; i += 2) {
    xs.push(angka[i]);
    ys.push(angka[i + 1]);
  }
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

export function buatDenahOtomatis(kolam) {
  const LEBAR = 1000;
  const grup = new Map();
  [...(kolam || [])]
    .sort((a, b) => urutAlami(a.kode_bilik, b.kode_bilik))
    .forEach((k) => {
      const blok = k.blok_induk || 'Kolam';
      if (!grup.has(blok)) grup.set(blok, []);
      grup.get(blok).push(k);
    });
  const namaBlok = [...grup.keys()].sort(urutAlami);
  const nBlok = Math.max(1, namaBlok.length);
  const kolomBlok = nBlok <= 2 ? nBlok : nBlok <= 4 ? 2 : 3;
  const celah = 36;
  const pad = 22;
  const judul = 34;
  const jarak = 14;
  const lebarBlok = (LEBAR - celah * (kolomBlok + 1)) / kolomBlok;

  const ukuranBlok = namaBlok.map((nama) => {
    const n = grup.get(nama).length;
    const c = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(n * 1.6))));
    const r = Math.ceil(n / c);
    const cw = (lebarBlok - pad * 2 - (c - 1) * jarak) / c;
    const ch = cw * 0.7;
    return { nama, c, r, cw, ch, tinggi: pad * 2 + judul + r * ch + (r - 1) * jarak };
  });

  const blok = [];
  const bilik = [];
  let y = celah;
  for (let i = 0; i < ukuranBlok.length; i += kolomBlok) {
    const baris = ukuranBlok.slice(i, i + kolomBlok);
    const tinggiBaris = Math.max(...baris.map((b) => b.tinggi));
    baris.forEach((b, j) => {
      const x = celah + j * (lebarBlok + celah);
      blok.push({ id: b.nama, d: persegi(x, y, lebarBlok, tinggiBaris, 30), bbox: [x, y, x + lebarBlok, y + tinggiBaris], label: [x + pad, y + pad + 14] });
      grup.get(b.nama).forEach((k, idx) => {
        const cx = x + pad + (idx % b.c) * (b.cw + jarak);
        const cy = y + pad + judul + Math.floor(idx / b.c) * (b.ch + jarak);
        bilik.push({
          shape_id: k.shape_id || k.kode_bilik,
          blok: b.nama,
          d: persegi(cx, cy, b.cw, b.ch, 16),
          bbox: [cx, cy, cx + b.cw, cy + b.ch],
          label: [cx + b.cw / 2, cy + b.ch / 2]
        });
      });
    });
    y += tinggiBaris + celah;
  }
  return { lebar: LEBAR, tinggi: Math.max(300, y), blok, bilik, otomatis: true };
}

/** Denah di atas foto: poligon persen → unit SVG (lebar 1000, tinggi mengikuti rasio foto). */
export function buatDenahFoto(kolam, rasio = 1.6) {
  const LEBAR = 1000;
  const TINGGI = LEBAR / rasio;
  const bilik = [];
  const kotakBlok = new Map();
  (kolam || []).forEach((k) => {
    const t = bacaPoligon(k.polygon_json);
    if (t.length < 3) return;
    const u = t.map(([x, y]) => [(x / 100) * LEBAR, (y / 100) * TINGGI]);
    const bb = bbox(u);
    const blok = k.blok_induk || 'Kolam';
    bilik.push({ shape_id: k.shape_id || k.kode_bilik, blok, d: jalurPoligon(u), bbox: bb, label: titikTengah(u) });
    kotakBlok.set(blok, gabungBBox([kotakBlok.get(blok), bb]));
  });
  const blok = [...kotakBlok].map(([id, b]) => ({ id, d: '', bbox: [b[0] - 20, b[1] - 20, b[2] + 20, b[3] + 20], label: [b[0], b[1] - 10] }));
  return { lebar: LEBAR, tinggi: TINGGI, blok, bilik, otomatis: false, foto: true };
}

/** Ada bilik yang sudah punya poligon di foto? */
export const adaPoligonKolam = (kolam) => (kolam || []).some((k) => bacaPoligon(k.polygon_json).length >= 3);

export function ambilDenah(kolam) {
  if (!DENAH_ASLI) return buatDenahOtomatis(kolam);
  const blok = DENAH_ASLI.blok.map((b) => ({ ...b, bbox: bboxPath(b.d), label: b.label || [bboxPath(b.d)[0] + 20, bboxPath(b.d)[1] + 30] }));
  const bilik = Object.entries(DENAH_ASLI.bilik).map(([shape_id, b]) => {
    const bb = bboxPath(b.d);
    return { shape_id, blok: b.blok, d: b.d, bbox: bb, label: b.label || [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2] };
  });
  return { lebar: DENAH_ASLI.lebar, tinggi: DENAH_ASLI.tinggi, blok, bilik, otomatis: false };
}
