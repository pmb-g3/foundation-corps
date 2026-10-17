import { cn } from '../../lib/cn.js';
import { CircleAlert, Inbox, RotateCw } from 'lucide-react';
import { Button } from './Button.jsx';

/** Blok kerangka (skeleton) berkilau selama data dimuat. */
export function Kerangka({ className }) {
  return <div className={cn('kerangka rounded-xl', className)} aria-hidden />;
}

/** Pesan kosong / galat yang singkat (F-62). */
export function KotakPesan({ jenis = 'kosong', judul, teks, aksi, onUlang, className }) {
  const Ikon = jenis === 'galat' ? CircleAlert : Inbox;
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-kartu border border-dashed border-garis px-6 py-10 text-center', className)}>
      <span className={cn('flex size-12 items-center justify-center rounded-full', jenis === 'galat' ? 'bg-bata/10 text-bata' : 'bg-hijau/8 text-hijau')}>
        <Ikon className="size-6" aria-hidden />
      </span>
      {judul && <p className="font-judul text-lg text-tinta">{judul}</p>}
      {teks && <p className="max-w-sm text-sm text-redup">{teks}</p>}
      {onUlang && (
        <Button varian="sekunder" ukuran="sm" ikon={RotateCw} onClick={onUlang}>
          Coba lagi
        </Button>
      )}
      {aksi}
    </div>
  );
}
