// Logika kalender (F-05) — diadaptasi dari ReUI Event Calendar: rentang tampilan, indeks kegiatan per hari,
// kategori berwarna. Lokal Indonesia (date-fns `id`), minggu dimulai Sabtu (weekStartsOn = 6).
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { Building2, Landmark, Sprout, Truck, Users } from 'lucide-react';
import { keIso, keTanggal } from '../../lib/format.js';

export const MULAI_MINGGU = 6; // Sabtu

// Kategori & warna (PRD F-05). Ikon = pengenal kedua selain warna (aman buta warna).
export const KATEGORI = [
  { nilai: 'Kegiatan Pondok', warna: 'var(--color-hijau)', ikon: Landmark },
  { nilai: 'Rapat', warna: 'var(--color-emas)', ikon: Users },
  { nilai: 'Pertanian & Perikanan', warna: 'var(--color-daun)', ikon: Sprout },
  { nilai: 'Pembangunan', warna: '#8A5A35', ikon: Building2 },
  { nilai: 'Kendaraan/Perjalanan', warna: '#4F6D7A', ikon: Truck }
];
export const metaKategori = (k) => KATEGORI.find((x) => x.nilai === k) || KATEGORI[0];

// Kategori milik Kepala Bagian (selaras SEKTOR.kategoriKalender di backend)
export const KATEGORI_SEKTOR = { PERTANIAN: 'Pertanian & Perikanan', PEMBANGUNAN: 'Pembangunan', KENDARAAN: 'Kendaraan/Perjalanan' };

// Nama hari pendek gaya pondok (Ahad), mulai Sabtu
export const HARI_PENDEK = ['Sab', 'Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum'];

/** Rentang tanggal yang tampil untuk tampilan & tanggal acuan. */
export function rentangTampilan(tampilan, acuan) {
  if (tampilan === 'minggu') {
    const a = startOfWeek(acuan, { weekStartsOn: MULAI_MINGGU });
    return { mulai: a, selesai: addDays(a, 6) };
  }
  if (tampilan === 'agenda') return { mulai: startOfMonth(acuan), selesai: endOfMonth(acuan) };
  const a = startOfWeek(startOfMonth(acuan), { weekStartsOn: MULAI_MINGGU });
  const b = endOfWeek(endOfMonth(acuan), { weekStartsOn: MULAI_MINGGU });
  return { mulai: a, selesai: b };
}

export function daftarHari(mulai, selesai) {
  const hasil = [];
  for (let d = mulai; d <= selesai; d = addDays(d, 1)) hasil.push(d);
  return hasil;
}

/** Peta 'yyyy-MM-dd' → kegiatan pada hari itu (kegiatan beberapa hari muncul di tiap harinya). */
export function indeksPerHari(kegiatan) {
  const peta = {};
  kegiatan.forEach((k) => {
    const a = String(k.mulai || '').slice(0, 10);
    const b = String(k.selesai || k.mulai || '').slice(0, 10) || a;
    if (!a) return;
    let d = keTanggal(a);
    const akhir = keTanggal(b < a ? a : b);
    let jaga = 0;
    while (d <= akhir && jaga++ < 62) {
      const kunci = keIso(d);
      (peta[kunci] = peta[kunci] || []).push(k);
      d = addDays(d, 1);
    }
  });
  Object.values(peta).forEach((daftar) =>
    daftar.sort((x, y) => Number(!!y.sepanjang_hari) - Number(!!x.sepanjang_hari) || String(x.mulai).localeCompare(String(y.mulai)))
  );
  return peta;
}

/** Geser kegiatan ke tanggal lain, jam & durasi tetap (seret di laptop). */
export function pindahTanggal(k, tanggalBaru) {
  const a = String(k.mulai).slice(0, 10);
  const selisih = Math.round((keTanggal(tanggalBaru) - keTanggal(a)) / 86400000);
  const geser = (s) => {
    if (!s) return s;
    const d = addDays(keTanggal(String(s).slice(0, 10)), selisih);
    return keIso(d) + String(s).slice(10);
  };
  return { ...k, mulai: geser(k.mulai), selesai: geser(k.selesai) };
}

export const DURASI = [
  { nilai: 30, label: '30 menit' },
  { nilai: 60, label: '1 jam' },
  { nilai: 90, label: '1,5 jam' },
  { nilai: 120, label: '2 jam' },
  { nilai: 180, label: '3 jam' },
  { nilai: 240, label: '4 jam' },
  { nilai: 480, label: '8 jam' }
];

export const JAM_MULAI = Array.from({ length: 37 }, (_, i) => {
  const menit = 4 * 60 + i * 30; // 04.00 – 22.00
  return `${String(Math.floor(menit / 60)).padStart(2, '0')}:${String(menit % 60).padStart(2, '0')}`;
});
