import { cn } from '../../lib/cn.js';

// Lencana pil (DESIGN.md: Chips & Badges)
const WARNA = {
  hijau: 'bg-daun/12 text-hijau',
  emas: 'bg-emas/20 text-emas-tua',
  bata: 'bg-bata/12 text-bata',
  batu: 'bg-batu/12 text-batu',
  kayu: 'bg-kayu/12 text-kayu',
  netral: 'bg-garis/70 text-redup',
  gelap: 'bg-hijau text-gading',
  kaca: 'bg-white/15 text-gading backdrop-blur-md border border-white/20'
};

export function Lencana({ warna = 'hijau', titik = false, ikon: Ikon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        WARNA[warna],
        className
      )}
    >
      {titik && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {Ikon && <Ikon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

/** Warna lencana untuk status umum di seluruh sektor. */
export function warnaStatus(status) {
  switch (status) {
    case 'Siap': case 'Selesai': case 'Sudah': case 'Isi': case 'SHM': return 'hijau';
    case 'Perbaikan': case 'Berjalan': case 'Persiapan': case 'Petok': case 'Terjadwal': return 'emas';
    case 'Rusak': case 'Belum': case 'Konsekuensi': case 'Data belum lengkap': return 'bata';
    default: return 'netral';
  }
}
