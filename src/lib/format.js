// Format angka, uang, luas, dan tanggal gaya Indonesia (tanpa library).
const fmtAngka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const fmtRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const NAMA_HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const angkaAtauNol = (n) => (n === null || n === undefined || n === '' || isNaN(Number(n)) ? 0 : Number(n));
const kosong = (n) => n === null || n === undefined || n === '' || isNaN(Number(n));

export function angka(n, desimal) {
  if (kosong(n)) return '–';
  if (desimal !== undefined) {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal }).format(Number(n));
  }
  return fmtAngka.format(Number(n));
}

/** Rp 1.250.000 */
export function rupiah(n) {
  if (kosong(n)) return '–';
  return fmtRupiah.format(Number(n)).replace(/ /g, ' ');
}

/** Rp 1,2 jt / Rp 15 rb — untuk label grafik */
export function rupiahRingkas(n) {
  const v = angkaAtauNol(n);
  const abs = Math.abs(v);
  const tanda = v < 0 ? '−' : '';
  if (abs >= 1e9) return `${tanda}Rp ${angka(abs / 1e9, 1)} M`;
  if (abs >= 1e6) return `${tanda}Rp ${angka(abs / 1e6, 1)} jt`;
  if (abs >= 1e3) return `${tanda}Rp ${angka(Math.round(abs / 1e3))} rb`;
  return `${tanda}Rp ${angka(abs)}`;
}

export const keHektar = (m2) => angkaAtauNol(m2) / 10000;
export const keRu = (m2, konversi = 14) => angkaAtauNol(m2) / (Number(konversi) || 14);

/** "35.400 m²" */
export const luasM2 = (m2) => (kosong(m2) ? '–' : `${angka(m2)} m²`);
/** "3,54 ha" */
export const luasHa = (m2) => (kosong(m2) ? '–' : `${angka(keHektar(m2), 2)} ha`);

// ------------------------------------------------------------
// Tanggal — string 'yyyy-MM-dd' dari server dibaca sebagai tanggal lokal (tanpa geser zona)
// ------------------------------------------------------------
export function keTanggal(str) {
  if (!str) return null;
  if (str instanceof Date) return str;
  const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const jam = String(str).match(/T(\d{2}):(\d{2})/);
  return new Date(y, m - 1, d, jam ? +jam[1] : 0, jam ? +jam[2] : 0);
}

export function keIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Tanggal hari ini di WIB (yyyy-MM-dd), tidak bergantung zona perangkat. */
export function hariIniWib() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

export function tambahHari(str, n) {
  const d = keTanggal(str);
  d.setDate(d.getDate() + n);
  return keIso(d);
}

export function selisihHari(dari, ke) {
  return Math.round((keTanggal(ke) - keTanggal(dari)) / 86400000);
}

/** "Sabtu, 17 Oktober 2026" | gaya: 'panjang' | 'tanpaHari' | 'pendek' (17 Okt 2026) | 'hariBulan' (17 Okt) */
export function tanggal(str, gaya = 'panjang') {
  const d = keTanggal(str);
  if (!d) return '–';
  const tgl = d.getDate();
  if (gaya === 'pendek') return `${tgl} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
  if (gaya === 'hariBulan') return `${tgl} ${BULAN_PENDEK[d.getMonth()]}`;
  const teks = `${tgl} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
  return gaya === 'tanpaHari' ? teks : `${NAMA_HARI[d.getDay()]}, ${teks}`;
}

export function namaHari(str) {
  const d = keTanggal(str);
  return d ? NAMA_HARI[d.getDay()] : '';
}

/** "20.00" dari 'yyyy-MM-ddT20:00' */
export function jam(str) {
  const m = String(str || '').match(/T?(\d{2}):(\d{2})/);
  return m ? `${m[1]}.${m[2]}` : '';
}

export function inisial(nama) {
  const bersih = String(nama || '')
    .replace(/^(ust\.?|ustadz|ustazah|h\.|hj\.|dr\.|kh\.?|k\.h\.)\s+/gi, '')
    .replace(/[^A-Za-z\s]/g, ' ')
    .trim();
  const kata = bersih.split(/\s+/).filter(Boolean);
  return ((kata[0]?.[0] || '') + (kata[1]?.[0] || '')).toUpperCase() || '·';
}
