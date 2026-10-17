import { useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { cn } from '../../lib/cn.js';
import { bergiliran, muncul } from '../../lib/motion.jsx';
import { FotoStaf } from '../../components/ui/Gambar.jsx';
import { Segmen } from '../../components/ui/Segmen.jsx';
import { KotakPesan } from '../../components/ui/Kerangka.jsx';

const KELOMPOK = ['Pembangunan', 'Kendaraan', 'Pertanian & Perikanan'];

/** F-06 Staf per kelompok: foto ikon kecil (inisial bila belum ada) + nama. No. WA tidak pernah ditampilkan. */
export function Staf({ staf, varian = 'grid' }) {
  const [tab, setTab] = useState(KELOMPOK[0]);
  const pilihan = useMemo(
    () => KELOMPOK.map((k) => ({ nilai: k, label: k, jumlah: (staf || []).filter((s) => s.kelompok === k).length })),
    [staf]
  );
  const daftar = (staf || []).filter((s) => s.kelompok === tab);

  return (
    <div>
      <Segmen pilihan={pilihan} nilai={tab} ubah={setTab} idTata="staf" label="Kelompok staf" className="mb-6 w-fit" />
      <AnimatePresence mode="wait">
        <m.ul
          key={tab}
          variants={bergiliran(0.05)}
          initial="tersembunyi"
          animate="tampil"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className={cn(varian === 'daftar' ? 'kartu divide-y divide-garis' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5')}
        >
          {daftar.map((s) => (
            <m.li
              key={s.id}
              variants={muncul}
              className={cn(varian === 'daftar' ? 'flex items-center gap-3 px-4 py-3' : 'kartu flex flex-col items-center gap-3 px-3 py-5 text-center')}
            >
              <FotoStaf nama={s.nama} fotoId={s.foto_id} ukuran={varian === 'daftar' ? 'md' : 'lg'} />
              <span className="text-sm font-medium leading-snug text-tinta">{s.nama}</span>
            </m.li>
          ))}
        </m.ul>
      </AnimatePresence>
      {!daftar.length && <KotakPesan teks="Belum ada staf di kelompok ini." className="mt-2" />}
    </div>
  );
}
