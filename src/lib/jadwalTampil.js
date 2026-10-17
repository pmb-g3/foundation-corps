// Jadwal Subuh Berkah di beranda: sebelum jam ganti (06.00 WIB) subuh hari ini,
// sesudahnya jadwal esok hari — staf bisa mengecek tugasnya sejak sehari sebelumnya.
// Aturan yang sama dipakai server (tanggalJadwalTampil_ di Util.gs).
export const JAM_GANTI_BAWAAN = 6;

const FORMAT_WIB = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23'
});

/** { tanggal: 'yyyy-mm-dd', jam: 0–23 } menurut WIB. */
export function waktuWIB(d = new Date()) {
  const p = Object.fromEntries(FORMAT_WIB.formatToParts(d).map((x) => [x.type, x.value]));
  return { tanggal: `${p.year}-${p.month}-${p.day}`, jam: Number(p.hour) };
}

function tambahHari(str, n) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Tanggal jadwal yang semestinya tampil sekarang. */
export function tanggalTampil(jamGanti = JAM_GANTI_BAWAAN, d = new Date()) {
  const w = waktuWIB(d);
  return w.jam >= jamGanti ? tambahHari(w.tanggal, 1) : w.tanggal;
}

/**
 * Kartu utama & pratinjau berikutnya dari data bootstrap.
 * esok: true bila kartu utama adalah jadwal besok (setelah jam ganti).
 * Server lama tanpa tanggal_tampil → tetap menampilkan hari ini.
 */
export function susunJadwal(jadwal) {
  if (!jadwal?.hari_ini) return null;
  const esok = !!jadwal.besok && jadwal.tanggal_tampil === jadwal.besok.tanggal;
  return {
    utama: esok ? jadwal.besok : jadwal.hari_ini,
    berikut: esok ? jadwal.lusa : jadwal.besok,
    esok,
    jamGanti: jadwal.jam_ganti ?? JAM_GANTI_BAWAAN
  };
}
