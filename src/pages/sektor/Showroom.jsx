import { useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { CircleCheck, TriangleAlert, Wrench } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { daftarFoto } from '../../lib/foto.js';
import { rupiah } from '../../lib/format.js';
import { bergiliran, muncul, saatTerlihat } from '../../lib/motion.jsx';
import { Gambar } from '../../components/ui/Gambar.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { KotakPesan } from '../../components/ui/Kerangka.jsx';

const baris = (teks) =>
  String(teks || '')
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Foto dapat digeser untuk melihat foto lain (scroll-snap). */
export function GaleriGeser({ fotos, nama, rasio = 'aspect-[16/10]' }) {
  const ref = useRef(null);
  const [aktif, setAktif] = useState(0);
  const daftar = fotos.length ? fotos : [''];
  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={() => {
          const el = ref.current;
          if (el) setAktif(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className={cn('tanpa-scrollbar flex snap-x snap-mandatory overflow-x-auto', rasio)}
      >
        {daftar.map((f, i) => (
          <Gambar key={f + i} fotoId={f} alt={`${nama} — foto ${i + 1}`} ukuran="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="h-full w-full shrink-0 snap-start" label={nama} />
        ))}
      </div>
      {daftar.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
          {daftar.map((_, i) => (
            <span key={i} className={cn('h-1.5 rounded-full transition-all', i === aktif ? 'w-5 bg-gading' : 'w-1.5 bg-gading/50')} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Showroom kartu besar — F-30 (kendaraan) & F-42 (genset).
 * item: { id, nama, sub, foto_ids, spesifikasi, surat?, status, catatan?, tarif? }
 */
export function Showroom({ items = [], kosong = 'Belum ada data.' }) {
  if (!items.length) return <KotakPesan teks={kosong} />;
  return (
    <m.ul variants={bergiliran(0.08)} {...saatTerlihat} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((it) => {
        const rusak = it.status && it.status !== 'Siap';
        return (
          <m.li key={it.id} variants={muncul} className={cn('kartu overflow-hidden', rusak && 'ring-2 ring-bata/40')}>
            <div className="relative">
              <GaleriGeser fotos={daftarFoto(it.foto_ids)} nama={it.nama} />
              {it.status && (
                <span className="absolute left-3 top-3">
                  <Lencana warna={rusak ? 'bata' : 'gelap'} ikon={rusak ? TriangleAlert : CircleCheck} className={rusak ? 'bg-bata text-gading' : ''}>
                    {it.status}
                  </Lencana>
                </span>
              )}
            </div>
            <div className="space-y-4 p-5">
              <div>
                <h3 className="font-judul text-2xl leading-tight text-tinta">{it.nama}</h3>
                {it.sub && <p className="mt-0.5 text-sm text-emas-tua">{it.sub}</p>}
              </div>
              {rusak && it.catatan && (
                <p className="flex gap-2 rounded-xl bg-bata/8 px-3 py-2 text-sm text-bata">
                  <Wrench className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {it.catatan}
                </p>
              )}
              {baris(it.spesifikasi).length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {baris(it.spesifikasi).map((s) => (
                    <li key={s} className="rounded-full bg-krem px-2.5 py-1 text-xs text-tinta ring-1 ring-garis">
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              {baris(it.surat).length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-redup">Kelengkapan surat</p>
                  <ul className="space-y-1 text-sm">
                    {baris(it.surat).map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <CircleCheck className="size-4 shrink-0 text-daun" aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {it.tarif && (
                <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-garis bg-garis text-center">
                  {[
                    ['Per jam', it.tarif.per_jam],
                    ['Per hari', it.tarif.per_hari],
                    ['Per km', it.tarif.per_km]
                  ].map(([l, v]) => (
                    <div key={l} className="bg-gading px-2 py-2.5">
                      <dt className="text-[0.68rem] uppercase tracking-[0.06em] text-redup">{l}</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-tinta">{v ? rupiah(v) : '–'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </m.li>
        );
      })}
    </m.ul>
  );
}
