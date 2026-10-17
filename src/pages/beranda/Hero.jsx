import { useRef } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, CalendarDays } from 'lucide-react';
import { useData, usePengaturan } from '../../lib/data.jsx';
import { useEditor } from '../../lib/editor.jsx';
import { tanggal } from '../../lib/format.js';
import { hijriah } from '../../lib/hijriah.js';
import { EASE } from '../../lib/motion.jsx';
import { FOTO_HERO_BAWAAN } from '../../lib/foto.js';
import { Gambar } from '../../components/ui/Gambar.jsx';
import { TombolEdit } from '../../components/layout/Bagian.jsx';

/** Judul muncul per huruf (PRD 7.2). Pembaca layar membaca teks utuh. */
function JudulPerHuruf({ teks, className }) {
  const kata = String(teks || '').split(' ');
  let urut = 0;
  return (
    <h1 className={className} aria-label={teks}>
      <m.span
        aria-hidden
        initial="tersembunyi"
        animate="tampil"
        variants={{ tersembunyi: {}, tampil: { transition: { staggerChildren: 0.035, delayChildren: 0.25 } } }}
        className="inline"
      >
        {kata.map((k, i) => (
          <span key={i} className={i === 1 ? 'inline-block whitespace-nowrap italic' : 'inline-block whitespace-nowrap'}>
            {Array.from(k).map((h) => (
              <span key={urut++} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <m.span
                  className="inline-block"
                  variants={{ tersembunyi: { y: '105%', opacity: 0 }, tampil: { y: '0%', opacity: 1, transition: { duration: 0.7, ease: EASE } } }}
                >
                  {h}
                </m.span>
              </span>
            ))}
            {i < kata.length - 1 && <span className="inline-block w-[0.28em]" />}
          </span>
        ))}
      </m.span>
    </h1>
  );
}

// Titik fokus foto drone bawaan: masjid (±56% dari kiri, 35% dari atas) tetap terlihat di layar HP tegak.
export const FOKUS_HERO = '56% 40%';

/** F-01 Hero: foto drone memenuhi layar, parallax pelan, judul per huruf. */
export function Hero() {
  const hero = usePengaturan().hero || {};
  const fotoHero = hero.foto_id || FOTO_HERO_BAWAAN;
  const { boot } = useData();
  const editor = useEditor();
  const ref = useRef(null);
  const kurangi = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], kurangi ? ['0%', '0%'] : ['0%', '16%']);
  const redup = useTransform(scrollYProgress, [0, 0.8], [0, kurangi ? 0 : 0.35]);

  return (
    <section ref={ref} id="hero" className="relative h-[100svh] min-h-[600px] overflow-hidden bg-hijau">
      <m.div className="absolute inset-0 will-change-transform" style={{ y }}>
        <m.div
          className="absolute inset-0"
          initial={kurangi ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
        >
          <Gambar
            key={fotoHero}
            fotoId={fotoHero}
            fokus={hero.fokus || FOKUS_HERO}
            prioritas
            alt="Foto drone Pondok Modern Gontor Campus 3"
            className="absolute inset-0"
            label="Foto drone pondok"
          />
        </m.div>
      </m.div>
      <div className="absolute inset-0 bg-gradient-to-t from-hijau via-hijau/35 to-hijau/45" aria-hidden />
      <m.div className="absolute inset-0 bg-hijau" style={{ opacity: redup }} aria-hidden />

      <div className="absolute right-4 top-20 z-10 md:right-8 md:top-24">
        <TombolEdit gelap label="Edit hero" onClick={editor.bisa() ? () => editor.buka({ jenis: 'hero' }) : undefined} />
      </div>

      <div className="wadah relative flex h-full flex-col justify-end pb-24 md:pb-28">
        <m.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
          className="text-xs font-semibold uppercase tracking-[0.32em] text-emas"
        >
          {hero.subjudul || 'Gontor Campus 3'}
        </m.p>
        <JudulPerHuruf teks={hero.judul || 'FOUNDATION Corps'} className="mt-3 text-[3.1rem] leading-[0.95] text-gading sm:text-7xl md:text-[6.5rem]" />
        {hero.tagline && (
          <m.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
            className="mt-5 max-w-xl text-base text-gading/80 md:text-lg"
          >
            {hero.tagline}
          </m.p>
        )}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.6, ease: EASE }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <button
            type="button"
            onClick={() => document.getElementById('jadwal')?.scrollIntoView({ behavior: kurangi ? 'auto' : 'smooth' })}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gading px-5 text-sm font-semibold text-hijau transition-colors hover:bg-white"
          >
            Jadwal hari ini
            <ArrowDown className="size-4" aria-hidden />
          </button>
          {boot?.hari_ini && (
            <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 text-sm text-gading backdrop-blur-md">
              <CalendarDays className="size-4 text-emas" aria-hidden />
              {tanggal(boot.hari_ini)}
              <span className="hidden text-gading/60 sm:inline">· {hijriah(boot.hari_ini)}</span>
            </span>
          )}
        </m.div>
      </div>
    </section>
  );
}
