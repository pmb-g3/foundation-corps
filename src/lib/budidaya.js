// Perkiraan budidaya lele & nila — rumus PRD Lampiran A.
// Parameter (SR, FCR, berat panen, lama panen, harga) dari sheet Parameter_Budidaya.
import { selisihHari, tambahHari, keTanggal } from './format.js';

const n = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));

/** Hitung kondisi satu bilik kolam pada tanggal `hariIni` (yyyy-MM-dd). Null bila kolam tidak berisi. */
export function hitungKolam(kolam, parameterPerJenis, hariIni) {
  const p = parameterPerJenis[kolam.jenis_ikan];
  const N = n(kolam.jumlah_tebar);
  if (kolam.status !== 'Isi' || !p || !N || !kolam.tanggal_tebar) return null;

  const SR = n(p.sr) ?? 0.8;
  const FCR = n(p.fcr) ?? 1;
  const T = n(p.lama_panen_hari) || 90;
  const wPanen = n(p.berat_panen_g) || 0;
  const wTebar = n(kolam.berat_tebar_g) ?? 0;

  const t = Math.max(0, selisihHari(kolam.tanggal_tebar, hariIni));
  const sisa = Math.max(0, T - t);
  const ekorKini = N * (1 - (1 - SR) * Math.min(1, t / T));
  const biomassa = (N * SR * wPanen) / 1000;
  const pakanKg = Math.max(0, biomassa - (N * wTebar) / 1000) * FCR;

  const hJual = n(p.harga_jual_kg);
  const hPakan = n(p.harga_pakan_kg);
  const hBenih = n(p.harga_benih_ekor);
  const hargaLengkap = hJual !== null && hPakan !== null && hBenih !== null;
  const pendapatan = hJual !== null ? biomassa * hJual : null;
  const biaya = hargaLengkap ? N * hBenih + pakanKg * hPakan + (n(kolam.biaya_lain) || 0) : null;
  const profit = hargaLengkap ? pendapatan - biaya : null;

  return {
    umur: t,
    lamaPanen: T,
    sisaHari: sisa,
    progres: Math.min(1, t / T),
    tanggalPanen: tambahHari(kolam.tanggal_tebar, T),
    ekorKini: Math.round(ekorKini),
    biomassaKg: biomassa,
    pakanKg,
    pendapatan,
    biaya,
    profit,
    hargaLengkap,
    segeraPanen: sisa <= 14
  };
}

/** Peta jenis_ikan → baris parameter. */
export function petaParameter(rows) {
  const peta = {};
  (rows || []).forEach((r) => {
    peta[r.jenis_ikan] = r;
  });
  return peta;
}

/** Profit per bulan perkiraan panen: bulan ini s.d. +5 (6 bulan), PRD Lampiran A. */
export function proyeksiBulanan(hasilKolam, hariIni) {
  const awal = keTanggal(hariIni);
  const bulan = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(awal.getFullYear(), awal.getMonth() + i, 1);
    bulan.push({ kunci: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, tanggal: d, profit: 0, kolam: 0, lengkap: true });
  }
  hasilKolam.forEach(({ hitung }) => {
    if (!hitung) return;
    const k = hitung.tanggalPanen.slice(0, 7);
    const b = bulan.find((x) => x.kunci === k);
    if (!b) return;
    b.kolam += 1;
    if (hitung.profit === null) b.lengkap = false;
    else b.profit += hitung.profit;
  });
  return bulan;
}
