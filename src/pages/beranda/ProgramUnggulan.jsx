import { useMemo } from 'react';
import * as m from 'motion/react-m';
import { cn } from '../../lib/cn.js';
import { sektorDariId } from '../../lib/sektor.js';
import { navigasi } from '../../lib/router.jsx';
import { bergiliran, muncul, saatTerlihat } from '../../lib/motion.jsx';
import { CarouselMelingkar } from '../../components/ui/CarouselMelingkar.jsx';
import { TombolEdit } from '../../components/layout/Bagian.jsx';

function KartuProgram({ p }) {
  const s = sektorDariId(p.sektor);
  const Ikon = s?.ikon;
  return (
    <div className="kartu flex h-full items-center gap-4 p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hijau/8" style={{ color: s?.warna }}>
        {Ikon && <Ikon className="size-5" aria-hidden />}
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-redup">{s?.label || p.sektor}</p>
        <h3 className="font-judul text-lg leading-snug text-tinta">{p.judul}</h3>
      </div>
    </div>
  );
}

/**
 * F-03 Program unggulan 5 sektor.
 * carousel (bawaan): carousel melingkar — kartu di busur, nomor urut di tengah, berganti tiap 1 detik.
 * grid: daftar ringkas.
 */
export function ProgramUnggulan({ program, varian = 'carousel', onEdit }) {
  const daftar = useMemo(() => program || [], [program]);
  const items = useMemo(
    () =>
      daftar.map((p) => {
        const s = sektorDariId(p.sektor);
        return { id: p.id, judul: p.judul, ringkas: p.ringkas, tag: s?.pendek || p.sektor, ikon: s?.ikon, foto_id: p.foto_id, slug: p.sektor !== 'RUMAH' ? s?.slug : null };
      }),
    [daftar]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <p className="label-bagian flex-1">Program Unggulan</p>
        <TombolEdit label="Edit program" onClick={onEdit} />
      </div>
      {varian === 'carousel' && items.length ? (
        <CarouselMelingkar
          items={items}
          jeda={1000}
          label="Program unggulan"
          onPilihAktif={(it) => it.slug && navigasi(`/sektor/${it.slug}`)}
          className="pt-1"
        />
      ) : (
        <m.ul variants={bergiliran()} {...saatTerlihat} className={cn('grid gap-3')}>
          {daftar.map((p) => (
            <m.li key={p.id} variants={muncul}>
              <KartuProgram p={p} />
            </m.li>
          ))}
        </m.ul>
      )}
    </div>
  );
}
