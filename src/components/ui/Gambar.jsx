import { useState } from 'react';
import { cn } from '../../lib/cn.js';
import { fotoBlur, fotoSrcSet, fotoUrl } from '../../lib/foto.js';
import { useInView } from '../../hooks/useInView.js';
import { inisial } from '../../lib/format.js';

/**
 * Foto Drive dengan lazy load ±300 px sebelum terlihat, placeholder blur kecil,
 * dan srcset 480/1.200/1.920 px (PRD 6.5). `prioritas` untuk foto hero, `fokus` = object-position.
 * Bila foto belum ada, tampil latar pola hijau yang rapi.
 */
export function Gambar({ fotoId, alt = '', className, imgClassName, fokus, ukuran = '100vw', prioritas = false, maks = 1920, label, children }) {
  const [ref, dekat] = useInView({ rootMargin: '300px 0px' });
  const [selesai, setSelesai] = useState(false);
  const [rusak, setRusak] = useState(false);
  const muat = prioritas || dekat;
  const blur = fotoBlur(fotoId);
  // posisi relative hanya bila pemanggil tidak memberi absolute/fixed (agar tidak bentrok)
  const posisi = /\b(absolute|fixed)\b/.test(className || '') ? '' : 'relative';

  return (
    <div ref={ref} className={cn(posisi, 'overflow-hidden bg-hijau', className)}>
      {(!fotoId || rusak) && <LatarKosong label={label} />}
      {fotoId && !rusak && muat && !selesai && blur && (
        <img src={blur} alt="" aria-hidden style={fokus ? { objectPosition: fokus } : undefined} className={cn('absolute inset-0 size-full scale-110 object-cover blur-xl', imgClassName)} />
      )}
      {fotoId && !rusak && muat && (
        <img
          src={fotoUrl(fotoId, 1200)}
          srcSet={fotoSrcSet(fotoId, maks)}
          sizes={ukuran}
          alt={alt}
          loading={prioritas ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={prioritas ? 'high' : 'auto'}
          onLoad={() => setSelesai(true)}
          onError={() => setRusak(true)}
          style={fokus ? { objectPosition: fokus } : undefined}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-700 ease-halus',
            selesai ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
        />
      )}
      {children}
    </div>
  );
}

/** Latar pengganti foto: gradien hijau + pola daun halus. */
export function LatarKosong({ label, className }) {
  return (
    <div
      className={cn('absolute inset-0 flex items-end', className)}
      style={{
        backgroundColor: 'var(--color-hijau)',
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgb(201 162 74 / 0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgb(245 239 227 / 0.08), transparent 45%), repeating-linear-gradient(135deg, rgb(245 239 227 / 0.04) 0 2px, transparent 2px 14px), linear-gradient(135deg, var(--color-hijau), var(--color-daun))'
      }}
      aria-hidden
    >
      {label && <span className="m-4 text-xs font-semibold uppercase tracking-[0.18em] text-gading/50">{label}</span>}
    </div>
  );
}

/** Foto ikon staf: bulat, inisial bila belum ada foto (F-06). */
export function FotoStaf({ nama, fotoId, ukuran = 'md', className }) {
  const kelasUkuran = { sm: 'size-8 text-[0.7rem]', md: 'size-11 text-sm', lg: 'size-14 text-base' }[ukuran];
  if (fotoId) {
    return (
      <Gambar
        fotoId={fotoId}
        alt={nama}
        maks={480}
        ukuran="64px"
        className={cn('shrink-0 rounded-full ring-1 ring-garis', kelasUkuran, className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-hijau/8 font-semibold text-hijau ring-1 ring-garis',
        kelasUkuran,
        className
      )}
    >
      {inisial(nama)}
    </span>
  );
}
