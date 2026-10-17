// Potongan kode yang dimuat saat dibutuhkan (PRD 6.5: React.lazy).
// Dipanggil lebih awal saat kartu sektor disentuh/diarahkan agar pindah halaman terasa instan.
export const muatSektor = () => import('../pages/sektor/HalamanSektor.jsx');
export const muatAdmin = () => import('../pages/admin/AdminApp.jsx');
