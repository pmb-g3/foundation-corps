// Terapkan tema dari Pengaturan (Editor Layout, F-52) ke variabel CSS Tailwind.
export const TEMA_BAWAAN = {
  warna: { hijau_tua: '#1F3D2B', hijau_daun: '#3E6B4A', krem: '#F5EFE3', emas: '#C9A24A', teks: '#1C1C1A', merah_bata: '#A8432F' },
  huruf: { judul: 'Fraunces', isi: 'Plus Jakarta Sans' }
};

const PETA_WARNA = {
  hijau_tua: '--color-hijau',
  hijau_daun: '--color-daun',
  krem: '--color-krem',
  emas: '--color-emas',
  teks: '--color-tinta',
  merah_bata: '--color-bata'
};

const CADANGAN_HURUF = {
  judul: '"Iowan Old Style", Georgia, serif',
  isi: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
};

// Huruf yang sudah dimuat index.html
const SUDAH_DIMUAT = new Set(['Fraunces', 'Plus Jakarta Sans']);

function muatHuruf(nama) {
  if (!nama || SUDAH_DIMUAT.has(nama)) return;
  SUDAH_DIMUAT.add(nama);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(nama).replace(/%20/g, '+')}:wght@400..700&display=swap`;
  document.head.appendChild(l);
}

/** Warna heksadesimal valid #RRGGBB. */
const hexValid = (v) => /^#[0-9a-fA-F]{6}$/.test(String(v || ''));

/** Gelapkan/terangkan warna (untuk emas-tua yang kontras di latar terang). */
function campur(hex, ke, persen) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(ke.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - persen) + ((b >> s) & 255) * persen));
  return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function terapkanTema(tema) {
  const t = tema && tema.warna ? tema : TEMA_BAWAAN;
  const root = document.documentElement.style;
  Object.entries(PETA_WARNA).forEach(([k, varCss]) => {
    const v = t.warna[k];
    if (hexValid(v)) root.setProperty(varCss, v);
  });
  if (hexValid(t.warna.emas)) root.setProperty('--color-emas-tua', campur(t.warna.emas, '#000000', 0.42));
  if (hexValid(t.warna.hijau_tua)) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.warna.hijau_tua);
  }
  const huruf = t.huruf || {};
  if (huruf.judul) {
    muatHuruf(huruf.judul);
    root.setProperty('--font-judul', `"${huruf.judul}", ${CADANGAN_HURUF.judul}`);
  }
  if (huruf.isi) {
    muatHuruf(huruf.isi);
    root.setProperty('--font-isi', `"${huruf.isi}", ${CADANGAN_HURUF.isi}`);
  }
}
