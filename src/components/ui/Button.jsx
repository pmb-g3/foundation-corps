import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';

// Tombol pil Elegan Alami (DESIGN.md). Tinggi minimal 44 px (PRD 6.1).
const VARIAN = {
  primer: 'bg-hijau text-gading hover:bg-daun shadow-[0_1px_0_rgb(255_255_255/0.08)_inset]',
  sekunder: 'border-[1.5px] border-hijau text-hijau hover:bg-hijau/5',
  emas: 'border-[1.5px] border-emas text-tinta hover:bg-emas/10',
  hantu: 'text-hijau hover:bg-hijau/5',
  bahaya: 'bg-bata text-gading hover:brightness-110',
  bahayaLembut: 'bg-bata/10 text-bata hover:bg-bata/15',
  terang: 'bg-gading text-hijau hover:bg-white',
  kaca: 'bg-white/10 text-gading border border-white/25 backdrop-blur-md hover:bg-white/20'
};

const UKURAN = {
  sm: 'min-h-11 px-4 text-sm gap-1.5',
  md: 'min-h-12 px-5 text-[0.95rem] gap-2',
  lg: 'min-h-14 px-7 text-base gap-2.5'
};

export function Button({ varian = 'primer', ukuran = 'md', memuat = false, ikon: Ikon, href, className, children, disabled, ...props }) {
  const kelas = cn(
    'inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap select-none',
    'transition-[background-color,color,box-shadow,filter,transform] duration-200 ease-halus active:scale-[0.98]',
    'disabled:opacity-50 disabled:active:scale-100',
    VARIAN[varian],
    UKURAN[ukuran],
    className
  );
  const isi = (
    <>
      {memuat ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Ikon ? <Ikon className="size-4 shrink-0" aria-hidden /> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <a href={href} className={kelas} {...props}>
        {isi}
      </a>
    );
  }
  return (
    <button type="button" className={kelas} disabled={disabled || memuat} aria-busy={memuat || undefined} {...props}>
      {isi}
    </button>
  );
}

const VARIAN_IKON = {
  hantu: 'text-hijau hover:bg-hijau/8',
  garis: 'border border-garis bg-gading text-hijau hover:border-emas',
  gelap: 'bg-hijau text-gading hover:bg-daun',
  kaca: 'bg-white/12 text-gading border border-white/25 backdrop-blur-md hover:bg-white/20',
  emas: 'bg-emas/15 text-emas-tua hover:bg-emas/25'
};

/** Tombol ikon bulat 44 px; `label` wajib untuk pembaca layar. */
export function IkonTombol({ ikon: Ikon, label, varian = 'hantu', kecil = false, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200',
        kecil ? 'size-9' : 'size-11',
        VARIAN_IKON[varian],
        className
      )}
      {...props}
    >
      <Ikon className={kecil ? 'size-4' : 'size-5'} aria-hidden />
    </button>
  );
}
