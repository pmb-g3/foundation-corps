import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '../../lib/cn.js';
import { useThrottle } from '../../hooks/useThrottle.js';
import { useMedia } from '../../hooks/useMedia.js';

/**
 * F-61 Indikator gulir (HP/tablet saja): garis tipis ±3 px di tepi kanan yang terisi emas sesuai posisi gulir,
 * ikon kecil per bagian (yang sedang dilihat menyala; ketuk → gulir halus).
 * Muncul saat menggulir, memudar setelah ±1,5 detik diam; hanya ikon yang bisa disentuh.
 * bagian: [{ id, label, ikon }]
 */
export function IndikatorGulir({ bagian = [] }) {
  const kecil = useMedia('(max-width: 1023px)');
  const kurangi = useReducedMotion();
  const [progres, setProgres] = useState(0);
  const [aktif, setAktif] = useState(null);
  const [tampil, setTampil] = useState(false);
  const timer = useRef(null);

  const hitung = useThrottle(() => {
    const doc = document.documentElement;
    const maks = doc.scrollHeight - window.innerHeight;
    setProgres(maks > 0 ? Math.min(1, window.scrollY / maks) : 0);
    let kini = null;
    for (const b of bagian) {
      const el = document.getElementById(b.id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) kini = b.id;
    }
    setAktif(kini);
    setTampil(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTampil(false), 1500);
  }, 100);

  useEffect(() => {
    if (!kecil || !bagian.length) return;
    window.addEventListener('scroll', hitung, { passive: true });
    return () => {
      window.removeEventListener('scroll', hitung);
      clearTimeout(timer.current);
    };
  }, [kecil, bagian, hitung]);

  if (!kecil || bagian.length < 2) return null;

  return (
    <nav
      aria-label="Lompat ke bagian"
      className={cn(
        'pointer-events-none fixed right-1.5 top-1/2 z-40 flex h-[52vh] -translate-y-1/2 flex-col items-center justify-between transition-opacity duration-500',
        tampil ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* garis tipis + isian emas */}
      <span className="absolute inset-y-2 left-1/2 w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-hijau/15" aria-hidden>
        <span className="absolute inset-x-0 top-0 rounded-full bg-emas transition-[height] duration-150" style={{ height: `${progres * 100}%` }} />
      </span>
      {bagian.map((b) => {
        const Ikon = b.ikon;
        const nyala = aktif === b.id;
        return (
          <button
            key={b.id}
            type="button"
            aria-label={b.label}
            aria-current={nyala ? 'location' : undefined}
            tabIndex={tampil ? 0 : -1}
            onClick={() => document.getElementById(b.id)?.scrollIntoView({ behavior: kurangi ? 'auto' : 'smooth' })}
            className={cn(
              'relative flex size-7 items-center justify-center rounded-full transition-all duration-300',
              tampil ? 'pointer-events-auto' : 'pointer-events-none',
              nyala ? 'scale-110 bg-hijau text-emas shadow-angkat' : 'bg-gading/85 text-hijau/60 ring-1 ring-garis backdrop-blur'
            )}
          >
            {Ikon && <Ikon className="size-[0.9rem]" aria-hidden />}
          </button>
        );
      })}
    </nav>
  );
}
