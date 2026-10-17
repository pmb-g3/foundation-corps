import { useRef } from 'react';
import * as m from 'motion/react-m';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { SEKTOR } from '../../lib/sektor.js';
import { luasHa } from '../../lib/format.js';
import { muatSektor } from '../../lib/pramuat.js';
import { catatTransisi } from '../../lib/transisi.js';
import { bergiliran, muncul, saatTerlihat } from '../../lib/motion.jsx';
import { Gambar } from '../../components/ui/Gambar.jsx';

function statSektor(id, r) {
  if (!r) return '';
  switch (id) {
    case 'PERTANIAN': return `${r.kolam_isi}/${r.kolam} kolam terisi · ${luasHa(r.luas_m2)}`;
    case 'PERTANAHAN': return `${r.bidang} bidang · ${luasHa(r.luas_m2)}`;
    case 'KENDARAAN': return `${r.unit} unit · ${r.siap} siap jalan`;
    case 'PEMBANGUNAN': return `${r.proyek_berjalan} proyek berjalan · ${r.genset} genset`;
    default: return '';
  }
}

// Bento: ukuran kotak berbeda (F-04)
const BENTO = {
  PERTANIAN: 'col-span-2 h-72 md:row-span-2 md:h-auto',
  PERTANAHAN: 'col-span-2 h-48 md:h-auto',
  KENDARAAN: 'col-span-1 h-48 md:h-auto',
  PEMBANGUNAN: 'col-span-1 h-48 md:h-auto'
};

function KartuSektor({ s, kartu, ringkasan, kelas, besar }) {
  const ref = useRef(null);
  const Ikon = s.ikon;
  return (
    <m.a
      ref={ref}
      href={`#/sektor/${s.slug}`}
      variants={muncul}
      onPointerEnter={() => muatSektor()}
      onTouchStart={() => muatSektor()}
      onClick={() => catatTransisi(ref.current, kartu.foto_id, s.id)}
      className={cn('group relative block overflow-hidden rounded-kartu bg-hijau outline-offset-4', kelas)}
    >
      <Gambar
        fotoId={kartu.foto_id}
        alt=""
        ukuran={besar ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
        className="absolute inset-0"
        imgClassName="transition-transform duration-[900ms] ease-halus group-hover:scale-[1.05] group-active:scale-[1.05]"
        label={s.label}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-hijau/90 via-hijau/25 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 md:p-6">
        <div className="min-w-0 flex-1">
          <span className="mb-2 inline-flex size-9 items-center justify-center rounded-full bg-white/12 text-emas backdrop-blur-md">
            <Ikon className="size-4" aria-hidden />
          </span>
          <h3 className={cn('leading-tight text-gading', besar ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl')}>{kartu.judul || s.label}</h3>
          {kartu.ringkas && <p className={cn('mt-1 text-sm text-gading/75', !besar && 'hidden sm:block')}>{kartu.ringkas}</p>}
          {ringkasan && <p className="mt-2 text-xs font-medium text-emas">{statSektor(s.id, ringkasan)}</p>}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gading text-hijau transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </div>
    </m.a>
  );
}

/** F-04 Pilihan sektor: bento (bawaan), grid, atau carousel. */
export function PilihanSektor({ kartu = {}, ringkasan = {}, varian = 'bento' }) {
  if (varian === 'carousel') {
    return (
      <m.div variants={bergiliran()} {...saatTerlihat} className="tanpa-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:mx-0 md:px-0">
        {SEKTOR.map((s) => (
          <KartuSektor key={s.id} s={s} kartu={kartu[s.id] || {}} ringkasan={ringkasan[s.id]} kelas="h-80 w-[80%] shrink-0 snap-start md:w-[40%]" besar />
        ))}
      </m.div>
    );
  }
  const bento = varian === 'bento';
  return (
    <m.div
      variants={bergiliran(0.08)}
      {...saatTerlihat}
      className={cn('grid grid-cols-2 gap-3 md:gap-4', bento ? 'md:h-[560px] md:grid-cols-4 md:grid-rows-2' : 'md:grid-cols-2')}
    >
      {SEKTOR.map((s) => (
        <KartuSektor
          key={s.id}
          s={s}
          kartu={kartu[s.id] || {}}
          ringkasan={ringkasan[s.id]}
          kelas={bento ? BENTO[s.id] : 'col-span-2 h-56 md:col-span-1 md:h-72'}
          besar={bento ? s.id === 'PERTANIAN' : true}
        />
      ))}
    </m.div>
  );
}
