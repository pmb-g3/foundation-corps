// Kategori bangunan untuk denah (F-44).
// Kategori = kolom `fungsi` di sheet Bangunan (urutan & warna tetap; nomor + daftar jadi pengenal kedua).
// Warna pastel agar nomor hijau tua di dalam pin tetap terbaca di atas denah.
export const KATEGORI_BANGUNAN = [
  { nama: 'Ibadah & Sanitasi', warna: '#8DB8CC' },
  { nama: 'Gedung Santri', warna: '#E2BE6E' },
  { nama: 'Kantor, Aula & Klinik', warna: '#C7A3D9' },
  { nama: 'Hunian Guru, Staf & Tamu', warna: '#F0A88A' },
  { nama: 'Usaha & Produksi', warna: '#8CC084' },
  { nama: 'Dapur, Gudang & Layanan', warna: '#D9B48F' },
  { nama: 'Olahraga & Lapangan', warna: '#7FC4B8' }
];
export const LAINNYA = { nama: 'Lainnya', warna: '#F5EFE3' };
export const kategoriDari = (b) => KATEGORI_BANGUNAN.find((k) => k.nama === String(b.fungsi || '').trim()) || LAINNYA;
