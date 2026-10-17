import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { sektorDariId } from '../../lib/sektor.js';
import { bergiliran, muncul, saatTerlihat } from '../../lib/motion.jsx';
import { Gambar } from '../../components/ui/Gambar.jsx';
import { IkonTombol } from '../../components/ui/Button.jsx';
import { TombolEdit } from '../../components/layout/Bagian.jsx';

function KartuProgram({ p, ringkas = false }) {
  const s = sektorDariId(p.sektor);
  const Ikon = s?.ikon;
  return (
    <div className={cn('kartu flex h-full gap-4 p-4', ringkas ? 'items-center' : 'flex-col md:p-5')}>
      {p.foto_id && !ringkas ? (
        <Gambar fotoId={p.foto_id} alt={p.judul} ukuran="(min-width: 1024px) 30vw, 85vw" className="aspect-[16/9] rounded-2xl" />
      ) : null}
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hijau/8" style={{ color: s?.warna }}>
          {Ikon && <Ikon className="size-5" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-redup">{s?.label || p.sektor}</p>
          <h3 className="font-judul text-lg leading-snug text-tinta">{p.judul}</h3>
        </div>
      </div>
      {p.ringkas && <p className={cn('text-sm text-redup', ringkas && 'hidden')}>{p.ringkas}</p>}
    </div>
  );
}

/** F-03 Program unggulan 5 sektor: carousel (bawaan) atau daftar/grid. */
export function ProgramUnggulan({ program, varian = 'carousel', onEdit }) {
  const daftar = program || [];
  const [aktif, setAktif] = useState(0);
  const jalur = useRef(null);
  const kurangi = useReducedMotion();
  const [jeda, setJeda] = useState(false);

  const geserKe = (i) => {
    const el = jalur.current?.children[i];
    if (el) jalur.current.scrollTo({ left: el.offsetLeft - jalur.current.offsetLeft, behavior: kurangi ? 'auto' : 'smooth' });
  };

  // auto-geser pelan; berhenti saat disentuh/diarahkan atau "kurangi gerakan"
  useEffect(() => {
    if (varian !== 'carousel' || kurangi || jeda || daftar.length < 2) return;
    const t = setTimeout(() => {
      const el = jalur.current?.children[(aktif + 1) % daftar.length];
      if (el) jalur.current.scrollTo({ left: el.offsetLeft - jalur.current.offsetLeft, behavior: 'smooth' });
    }, 6500);
    return () => clearTimeout(t);
  }, [varian, kurangi, jeda, daftar.length, aktif]);

  const onGulir = () => {
    const el = jalur.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.86));
    setAktif(Math.max(0, Math.min(daftar.length - 1, i)));
  };

  const kepala = (
    <div className="mb-4 flex items-center gap-2">
      <p className="label-bagian flex-1">Program Unggulan</p>
      <TombolEdit label="Edit program" onClick={onEdit} />
      {varian === 'carousel' && daftar.length > 1 && (
        <>
          <IkonTombol ikon={ChevronLeft} label="Program sebelumnya" varian="garis" kecil onClick={() => geserKe(Math.max(0, aktif - 1))} />
          <IkonTombol ikon={ChevronRight} label="Program berikutnya" varian="garis" kecil onClick={() => geserKe((aktif + 1) % daftar.length)} />
        </>
      )}
    </div>
  );

  if (varian !== 'carousel') {
    return (
      <div>
        {kepala}
        <m.ul variants={bergiliran()} {...saatTerlihat} className="grid gap-3">
          {daftar.map((p) => (
            <m.li key={p.id} variants={muncul}>
              <KartuProgram p={p} ringkas />
            </m.li>
          ))}
        </m.ul>
      </div>
    );
  }

  return (
    <div onPointerEnter={() => setJeda(true)} onPointerLeave={() => setJeda(false)} onTouchStart={() => setJeda(true)}>
      {kepala}
      <m.ul
        ref={jalur}
        variants={muncul}
        {...saatTerlihat}
        onScroll={onGulir}
        className="tanpa-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:px-0"
        aria-roledescription="carousel"
      >
        {daftar.map((p, i) => (
          <li key={p.id} className="w-[86%] shrink-0 snap-start lg:w-full" aria-label={`${i + 1} dari ${daftar.length}`}>
            <KartuProgram p={p} />
          </li>
        ))}
      </m.ul>
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
        {daftar.map((p, i) => (
          <span key={p.id} className={cn('h-1.5 rounded-full transition-all duration-300', i === aktif ? 'w-6 bg-emas' : 'w-1.5 bg-garis')} />
        ))}
      </div>
    </div>
  );
}
