// URL foto. Nilai foto_id dari server:
//   "IDBESAR" atau "IDBESAR|IDKECIL"  → foto Google Drive (unggahan admin)
//   "lokal:nama"                       → foto bawaan yang ikut di-deploy (folder public/media)
// Foto diambil lewat URL ukuran tertentu (PRD 6.3) agar HP memuat versi kecil.

const dasar = (id) => `https://lh3.googleusercontent.com/d/${id}`;

/** Foto bawaan: nama → lebar yang tersedia (berkas public/media/<nama>-<lebar>.webp) + rasio lebar/tinggi. */
export const FOTO_LOKAL = {
  'hero-drone': { lebar: [480, 1200, 1920], rasio: 1920 / 1080, blur: 32 },
  kolam: { lebar: [480, 1200, 1920], rasio: 1920 / 1356 },
  'tanah-pondok': { lebar: [480, 1200, 2400], rasio: 2071 / 2400 },
  'tanah-latansa': { lebar: [480, 1200, 2400], rasio: 2400 / 1346 },
  'tanah-besuk': { lebar: [480, 1200], rasio: 917 / 1200 },
  'tanah-totok': { lebar: [480, 1200], rasio: 624 / 794 },
  'denah-bangunan': { lebar: [480, 1200, 2400], rasio: 2400 / 1764 }
};
export const FOTO_HERO_BAWAAN = 'lokal:hero-drone';

const namaLokal = (fotoId) => {
  const s = String(fotoId || '').trim();
  return s.startsWith('lokal:') ? s.slice(6) : null;
};
const urlLokal = (nama, w) => `./media/${nama}-${w}.webp`;
const ukuranLokal = (nama) => FOTO_LOKAL[nama]?.lebar || [1200];
/** Ukuran terkecil yang ≥ lebar diminta (atau yang terbesar). */
const pilihLokal = (nama, lebar) => {
  const d = ukuranLokal(nama);
  return d.find((w) => w >= lebar) || d[d.length - 1];
};

export const fotoLokal = (fotoId) => namaLokal(fotoId) !== null;
/** Rasio foto bawaan (agar bingkai peta langsung pas sebelum foto termuat); null bila tidak diketahui. */
export const rasioFoto = (fotoId) => FOTO_LOKAL[namaLokal(fotoId)]?.rasio || null;

export function pecahFoto(fotoId) {
  const [besar = '', kecil = ''] = String(fotoId || '').split('|').map((s) => s.trim());
  return { besar, kecil };
}

/** Daftar foto dari kolom foto_ids ("id1|k1,id2|k2"). */
export function daftarFoto(fotoIds) {
  return String(fotoIds || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function fotoUrl(fotoId, lebar = 1200) {
  const lokal = namaLokal(fotoId);
  if (lokal) return urlLokal(lokal, pilihLokal(lokal, lebar));
  const { besar, kecil } = pecahFoto(fotoId);
  if (!besar) return '';
  if (lebar <= 480 && kecil) return dasar(kecil);
  return `${dasar(besar)}=w${lebar}`;
}

/** srcset 480 / 1200 / 1920 untuk <img>. */
export function fotoSrcSet(fotoId, maks = 1920) {
  const lokal = namaLokal(fotoId);
  if (lokal) {
    const d = ukuranLokal(lokal);
    const pakai = d.filter((w) => w <= maks);
    return (pakai.length ? pakai : [d[0]]).map((w) => `${urlLokal(lokal, w)} ${w}w`).join(', ');
  }
  const { besar, kecil } = pecahFoto(fotoId);
  if (!besar) return undefined;
  const daftar = [`${kecil ? dasar(kecil) : `${dasar(besar)}=w480`} 480w`, `${dasar(besar)}=w1200 1200w`];
  if (maks > 1200) daftar.push(`${dasar(besar)}=w1920 1920w`);
  return daftar.join(', ');
}

/** Versi sangat kecil untuk placeholder blur ('' bila tidak tersedia). */
export function fotoBlur(fotoId) {
  const lokal = namaLokal(fotoId);
  if (lokal) return FOTO_LOKAL[lokal]?.blur ? urlLokal(lokal, FOTO_LOKAL[lokal].blur) : '';
  const { besar } = pecahFoto(fotoId);
  return besar ? `${dasar(besar)}=w32` : '';
}
