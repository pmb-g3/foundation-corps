import * as m from 'motion/react-m';
import { CircleCheck, CircleDashed } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { daftarFoto } from '../../../lib/foto.js';
import { bergiliran, muncul, saatTerlihat } from '../../../lib/motion.jsx';
import { Lencana, warnaStatus } from '../../../components/ui/Lencana.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { GaleriGeser } from '../Showroom.jsx';

const poin = (t) =>
  String(t || '')
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-•\d.)\s]+/, '').trim())
    .filter(Boolean);

function Daftar({ judul, isi, ikon: Ikon, warna }) {
  if (!isi.length) return null;
  return (
    <div>
      <p className="label-bagian mb-3">{judul}</p>
      <m.ul variants={bergiliran(0.12, 0.1)} {...saatTerlihat} className="space-y-2.5">
        {isi.map((p) => (
          <m.li key={p} variants={muncul} className="flex items-start gap-2.5">
            <Ikon className={cn('mt-0.5 size-5 shrink-0', warna)} aria-hidden />
            <span className="text-[0.95rem] leading-relaxed text-tinta">{p}</span>
          </m.li>
        ))}
      </m.ul>
    </div>
  );
}

/** F-41 Proyek: foto di satu sisi, "Proses yang dikerjakan" & "Program ke depan" muncul berurutan saat digulir. */
export function Proyek({ rows = [] }) {
  if (!rows.length) return <KotakPesan teks="Belum ada proyek." />;
  return (
    <div className="space-y-10 md:space-y-14">
      {rows.map((p, i) => (
        <m.article key={p.id} variants={muncul} {...saatTerlihat} className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          <div className={cn('overflow-hidden rounded-kartu', i % 2 === 1 && 'md:order-2')}>
            <GaleriGeser fotos={daftarFoto(p.foto_ids)} nama={p.nama} rasio="aspect-[4/3]" />
          </div>
          <div className="space-y-6">
            <div>
              {p.status && <Lencana warna={warnaStatus(p.status)}>{p.status}</Lencana>}
              <h3 className="mt-2 text-3xl leading-tight text-tinta">{p.nama}</h3>
            </div>
            <Daftar judul="Proses yang dikerjakan" isi={poin(p.proses_dikerjakan)} ikon={CircleCheck} warna="text-daun" />
            <Daftar judul="Program ke depan" isi={poin(p.program_kedepan)} ikon={CircleDashed} warna="text-emas-tua" />
          </div>
        </m.article>
      ))}
    </div>
  );
}
