import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { fotoUrl } from '../../lib/foto.js';
import { useUkuran } from '../../hooks/useUkuran.js';
import { useInView } from '../../hooks/useInView.js';
import { EASE } from '../../lib/motion.jsx';

const TERLIHAT = 5;
const RADIUS_Y = 100;

/** Posisi kartu pada busur (diadaptasi dari referensi circular-carousel). */
function posisi(i, aktif, total, radiusX) {
  const setengah = Math.floor(TERLIHAT / 2);
  let geser = i - aktif;
  if (geser > setengah) geser -= total;
  if (geser < -setengah) geser += total;
  if (Math.abs(geser) > setengah) return null;
  const sudut = (geser / TERLIHAT) * Math.PI;
  const jarak = Math.abs(geser);
  const maks = setengah + 1;
  return {
    x: Math.sin(sudut) * radiusX,
    y: -Math.cos(sudut) * RADIUS_Y,
    scale: Math.max(0, 1 - (jarak / maks) * 0.3),
    opacity: Math.max(0.3, 1 - (jarak / maks) * 0.7),
    zIndex: TERLIHAT - jarak
  };
}

/**
 * Carousel melingkar: kartu tersusun di busur, kartu aktif di puncak, nomor urut besar di tengah.
 * items: [{ id, judul, ringkas, tag, ikon?, foto_id? }]
 * Berputar otomatis tiap `jeda` ms; berhenti saat ditunjuk/difokus, saat tidak terlihat, atau bila "kurangi gerakan".
 */
export function CarouselMelingkar({ items, jeda = 1000, label = 'Carousel', onPilihAktif, className }) {
  const [aktif, setAktif] = useState(0);
  const [tahan, setTahan] = useState(false);
  const [fokus, setFokus] = useState(false);
  const kurangi = useReducedMotion();
  const [refUkuran, { lebar }] = useUkuran();
  const [refLihat, terlihat] = useInView({ rootMargin: '0px', sekali: false, threshold: 0.3 });
  const wadah = useRef(null);
  const total = items.length;

  const keKartu = useCallback((i) => setAktif(((i % total) + total) % total), [total]);
  const berikut = useCallback(() => keKartu(aktif + 1), [aktif, keKartu]);
  const sebelum = useCallback(() => keKartu(aktif - 1), [aktif, keKartu]);

  useEffect(() => {
    if (kurangi || tahan || fokus || !terlihat || total < 2) return;
    const t = setTimeout(berikut, jeda);
    return () => clearTimeout(t);
  }, [kurangi, tahan, fokus, terlihat, total, jeda, berikut]);

  if (!total) return null;
  const kecil = lebar > 0 && lebar < 420;
  const lebarKartu = kecil ? 160 : 192;
  const radiusX = Math.max(70, Math.min(220, (lebar || 480) / 2 - lebarKartu / 2 - 6));
  const item = items[aktif];

  return (
    <div
      ref={(el) => {
        wadah.current = el;
        refUkuran.current = el;
        refLihat.current = el;
      }}
      tabIndex={0}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      onMouseEnter={() => setTahan(true)}
      onMouseLeave={() => setTahan(false)}
      onTouchStart={() => setTahan(true)}
      onFocus={() => setFokus(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFokus(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') sebelum();
        if (e.key === 'ArrowRight') berikut();
      }}
      className={cn('relative flex flex-col items-center gap-6 rounded-kartu outline-none focus-visible:ring-4 focus-visible:ring-hijau/15', className)}
    >
      {/* lintasan busur */}
      <div className="relative h-[290px] w-full">
        <AnimatePresence initial={false}>
          {items.map((it, i) => {
            const p = posisi(i, aktif, total, radiusX);
            if (!p) return null;
            const ini = i === aktif;
            const Ikon = it.ikon;
            return (
              <m.button
                key={it.id}
                type="button"
                initial={{ opacity: 0, scale: 0.8, x: p.x, y: p.y }}
                animate={{ x: p.x, y: p.y, scale: p.scale, opacity: p.opacity, zIndex: p.zIndex }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.65, ease: EASE }}
                onClick={() => (ini ? onPilihAktif?.(it) : keKartu(i))}
                aria-label={it.judul}
                aria-current={ini}
                className={cn(
                  'absolute left-1/2 top-[176px] -ml-20 -mt-16 flex h-32 w-40 cursor-pointer flex-col items-start justify-between overflow-hidden rounded-2xl border border-white/10 p-4 text-left sm:-ml-24 sm:w-48',
                  'bg-gradient-to-b from-[#2a4d37] to-hijau transition-shadow duration-300',
                  ini ? 'shadow-[0_20px_60px_-12px_rgba(31,61,43,0.55)]' : 'shadow-[0_8px_24px_-4px_rgba(31,61,43,0.3)] hover:shadow-[0_12px_32px_-4px_rgba(31,61,43,0.4)]'
                )}
                style={kecil ? { width: lebarKartu, marginLeft: -lebarKartu / 2 } : undefined}
              >
                {it.foto_id && (
                  <>
                    <img src={fotoUrl(it.foto_id, 480)} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full object-cover opacity-45" />
                    <span className="absolute inset-0 bg-gradient-to-t from-hijau via-hijau/70 to-hijau/20" aria-hidden />
                  </>
                )}
                <span className="relative flex items-center gap-1.5 rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emas">
                  {Ikon && <Ikon className="size-3" aria-hidden />}
                  {it.tag}
                </span>
                <span className="relative w-full">
                  <span className={cn('block font-judul leading-tight transition-colors duration-300', ini ? 'text-base text-gading' : 'text-sm text-gading/80')}>{it.judul}</span>
                  {it.ringkas && (
                    <span className={cn('mt-1 line-clamp-2 block text-xs leading-relaxed transition-colors duration-300', ini ? 'text-gading/70' : 'text-gading/45')}>{it.ringkas}</span>
                  )}
                </span>
              </m.button>
            );
          })}
        </AnimatePresence>

        {/* nomor urut di tengah busur */}
        <m.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center"
          aria-live={tahan || fokus ? 'polite' : 'off'}
        >
          <span className="font-judul text-5xl font-semibold tracking-tight text-hijau/85 tabular-nums">{String(aktif + 1).padStart(2, '0')}</span>
          <span className="mt-1 text-xs text-redup">dari {String(total).padStart(2, '0')}</span>
        </m.div>
      </div>

      {/* kendali */}
      <div className="flex items-center gap-4">
        <m.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={sebelum}
          aria-label="Program sebelumnya"
          className="flex size-10 items-center justify-center rounded-full border border-garis bg-gading text-hijau transition-colors hover:border-emas"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </m.button>
        <div className="flex items-center gap-1.5">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              onClick={() => keKartu(i)}
              aria-label={`Ke program ${i + 1}: ${it.judul}`}
              aria-current={i === aktif}
              className={cn('h-1.5 rounded-full transition-all duration-300', i === aktif ? 'w-6 bg-hijau' : 'w-1.5 bg-hijau/20 hover:bg-hijau/40')}
            />
          ))}
        </div>
        <m.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={berikut}
          aria-label="Program berikutnya"
          className="flex size-10 items-center justify-center rounded-full border border-garis bg-gading text-hijau transition-colors hover:border-emas"
        >
          <ChevronRight className="size-5" aria-hidden />
        </m.button>
      </div>
    </div>
  );
}
