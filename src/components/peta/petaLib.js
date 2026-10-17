// Geometri mesin peta (diadaptasi dari referensi peta SVG: fitView, unionBBox, label tetap tajam).
// Semua koordinat data disimpan dalam PERSEN foto (0–100), sehingga pas di semua ukuran layar.

export const VIEW_W = 1000;

/** Persen → unit SVG. */
export const keUnit = ([x, y], viewH) => [(Number(x) / 100) * VIEW_W, (Number(y) / 100) * viewH];

export function bbox(titik) {
  if (!titik || !titik.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  titik.forEach(([x, y]) => {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  });
  return [x0, y0, x1, y1];
}

export function gabungBBox(daftar) {
  const ada = daftar.filter(Boolean);
  if (!ada.length) return null;
  return ada.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]);
}

export const VIEW_PENUH = { s: 1, tx: 0, ty: 0 };

/** Pandangan (skala + geser) yang memuat bbox di tengah, dengan bantalan. */
export function fitView(b, viewH, bantalan = 1.25, maks = 5) {
  if (!b) return VIEW_PENUH;
  const w = Math.max(1, (b[2] - b[0]) * bantalan);
  const h = Math.max(1, (b[3] - b[1]) * bantalan);
  const s = Math.max(1, Math.min(VIEW_W / w, viewH / h, maks));
  const cx = (b[0] + b[2]) / 2;
  const cy = (b[1] + b[3]) / 2;
  return batasiView({ s, tx: VIEW_W / 2 - cx * s, ty: viewH / 2 - cy * s }, viewH);
}

/** Jaga agar peta tidak tergeser keluar bingkai. */
export function batasiView(v, viewH) {
  const s = Math.max(1, Math.min(8, v.s));
  const minTx = VIEW_W - VIEW_W * s;
  const minTy = viewH - viewH * s;
  return { s, tx: Math.min(0, Math.max(minTx, v.tx)), ty: Math.min(0, Math.max(minTy, v.ty)) };
}

export function titikTengah(titik) {
  if (!titik?.length) return [0, 0];
  // titik berat poligon sederhana; cadangan rata-rata
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < titik.length; i++) {
    const [x0, y0] = titik[i];
    const [x1, y1] = titik[(i + 1) % titik.length];
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-6) {
    const n = titik.length;
    return [titik.reduce((t, p) => t + p[0], 0) / n, titik.reduce((t, p) => t + p[1], 0) / n];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export const jalurPoligon = (titik) => (titik?.length ? 'M' + titik.map((p) => p.join(',')).join('L') + 'Z' : '');

/** Baca polygon_json dari server: array [[x,y],...] atau teks JSON. */
export function bacaPoligon(v) {
  let p = v;
  if (typeof v === 'string') {
    try {
      p = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(p) ? p.filter((t) => Array.isArray(t) && t.length >= 2).map((t) => [Number(t[0]), Number(t[1])]) : [];
}

/** Penempatan label tanpa saling tumpuk (dari referensi): yang terpilih dulu, lalu yang terbesar. */
export function aturLabel(items, skalaPx, terpilih) {
  const kotak = [];
  const tampil = new Set();
  const bebas = (b) => !kotak.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  [...items]
    .sort((a, b) => Number(b.id === terpilih) - Number(a.id === terpilih) || (b.luas || 0) - (a.luas || 0))
    .forEach((it) => {
      const x = it.pos[0] * skalaPx;
      const y = it.pos[1] * skalaPx;
      const w = String(it.teks).length * 7 + 14;
      const b = [x - w / 2, y - 12, x + w / 2, y + 12];
      if (bebas(b)) {
        kotak.push(b);
        tampil.add(it.id);
      }
    });
  return tampil;
}
