// Tanggal Hijriah memakai kalender Umm al-Qura bawaan browser (Intl), tanpa library.
import { keTanggal } from './format.js';

export const BULAN_HIJRIAH = [
  'Muharram', 'Safar', "Rabi'ul Awal", "Rabi'ul Akhir", 'Jumadil Awal', 'Jumadil Akhir',
  'Rajab', "Sya'ban", 'Ramadhan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah'
];

let fmt = null;
function formatter() {
  if (fmt) return fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch {
    fmt = false;
  }
  return fmt;
}

/** { hari, bulan (1–12), tahun } atau null bila browser tidak mendukung. */
export function bagianHijriah(str) {
  const f = formatter();
  const d = keTanggal(str);
  if (!f || !d) return null;
  const parts = {};
  f.formatToParts(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)).forEach((p) => {
    parts[p.type] = p.value;
  });
  const hari = parseInt(parts.day, 10);
  const bulan = parseInt(parts.month, 10);
  const tahun = parseInt(parts.year || parts.relatedYear, 10);
  if (!hari || !bulan || !tahun) return null;
  return { hari, bulan, tahun };
}

/** "5 Rabi'ul Akhir 1448 H" */
export function hijriah(str) {
  const h = bagianHijriah(str);
  return h ? `${h.hari} ${BULAN_HIJRIAH[h.bulan - 1]} ${h.tahun} H` : '';
}

/** "5 Rab. Akhir" — ringkas untuk sel kalender */
export function hijriahPendek(str) {
  const h = bagianHijriah(str);
  return h ? String(h.hari) : '';
}
