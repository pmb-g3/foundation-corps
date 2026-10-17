// Keuangan mingguan — tutup buku setiap RABU (sama dengan rabuTutup_ di Util.gs).
// Satu minggu = Kamis s/d Rabu dan masuk ke bulan tempat Rabu-nya berada;
// "minggu ke-n" = Rabu ke-n di bulan itu (biasanya 4, kadang 5 dalam sebulan).
import { tambahHari } from './format.js';

const hariKe = (t) => {
  const [y, m, d] = String(t).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12).getDay(); // 0 = Ahad … 3 = Rabu, 4 = Kamis
};

export const rabuTutup = (t) => tambahHari(String(t).slice(0, 10), (3 - hariKe(t) + 7) % 7);
export const kamisMulai = (t) => tambahHari(rabuTutup(t), -6);

/** Banyaknya Rabu (= minggu tutup buku) dalam bulan 'yyyy-mm'. */
export function jumlahMinggu(bulan) {
  const [y, m] = bulan.split('-').map(Number);
  const hari = new Date(y, m, 0).getDate();
  const rabuPertama = 1 + ((3 - new Date(y, m - 1, 1, 12).getDay() + 7) % 7);
  return Math.floor((hari - rabuPertama) / 7) + 1;
}

/** { mulai (Kamis), selesai (Rabu), bulan, ke, dari } untuk tanggal mana pun. */
export function infoMinggu(t) {
  const selesai = rabuTutup(t);
  const bulan = selesai.slice(0, 7);
  return { mulai: tambahHari(selesai, -6), selesai, bulan, ke: Math.ceil(Number(selesai.slice(8, 10)) / 7), dari: jumlahMinggu(bulan) };
}

/** Semua minggu tutup buku dalam satu bulan. */
export function mingguBulan(bulan) {
  const [y, m] = bulan.split('-').map(Number);
  const rabuPertama = 1 + ((3 - new Date(y, m - 1, 1, 12).getDay() + 7) % 7);
  return Array.from({ length: jumlahMinggu(bulan) }, (_, i) => infoMinggu(`${bulan}-${String(rabuPertama + i * 7).padStart(2, '0')}`));
}

/**
 * Minggu berurutan M-1, M-2, … sejak patokan (digeser ke Kamis bila bukan Kamis) sampai minggu yang memuat `sampai`.
 * → [{ n, mulai, selesai, bulan, ke, dari }]
 */
export function mingguSejak(patokan, sampai) {
  const awal = kamisMulai(patokan);
  const hasil = [];
  for (let mulai = awal, n = 1; mulai <= sampai && n <= 520; mulai = tambahHari(mulai, 7), n++) {
    hasil.push({ n, ...infoMinggu(mulai) });
  }
  return hasil;
}

export const statusMinggu = (w, hariIni) => (w.selesai < hariIni ? 'tutup' : w.mulai <= hariIni ? 'berjalan' : 'nanti');
