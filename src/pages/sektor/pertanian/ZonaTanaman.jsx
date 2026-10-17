import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { ArrowRight, MapPin, Navigation, X } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { angka, luasHa, luasM2 } from '../../../lib/format.js';
import { bacaPoligon } from '../../../components/peta/petaLib.js';
import { PetaFoto } from '../../../components/peta/PetaFoto.jsx';
import { AngkaNaik } from '../../../components/chart/Angka.jsx';
import { Gambar } from '../../../components/ui/Gambar.jsx';

const WARNA_ZONA = ['var(--color-daun)', 'var(--color-emas)', 'var(--color-batu)', 'var(--color-kayu)'];

/**
 * F-10 Peta zona tanaman: zona dengan luas, pin komoditas (ketuk → nama, jumlah, keterangan), total luas.
 * tautanLetak: tautan ke posisi sawah di peta tanah pondok.
 */
export function ZonaTanaman({ zona = [], titik = [], fotoDasar, tautanLetak }) {
  const [fokus, setFokus] = useState(null);
  const [pin, setPin] = useState(null);

  const wilayah = useMemo(
    () =>
      zona.map((z, i) => ({
        id: z.id,
        nama: z.nama_zona,
        sub: Number(z.luas_m2) ? luasHa(z.luas_m2) : undefined,
        titik: bacaPoligon(z.polygon_json),
        warna: WARNA_ZONA[i % WARNA_ZONA.length]
      })),
    [zona]
  );
  const pins = useMemo(() => titik.map((t) => ({ id: t.id, x: t.x_persen, y: t.y_persen, label: t.komoditas, data: t })), [titik]);
  const total = zona.reduce((t, z) => t + (Number(z.luas_m2) || 0), 0);
  const zonaFokus = zona.find((z) => z.id === fokus);
  const pinData = pin ? titik.find((t) => t.id === pin) : null;

  return (
    <div className="space-y-5">
      <div className="tanpa-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        <button
          type="button"
          aria-pressed={!fokus}
          onClick={() => {
            setFokus(null);
            setPin(null);
          }}
          className={cn('min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors', !fokus ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-hijau')}
        >
          Semua zona
        </button>
        {zona.map((z) => (
          <button
            key={z.id}
            type="button"
            aria-pressed={fokus === z.id}
            onClick={() => {
              setFokus(z.id);
              setPin(null);
            }}
            className={cn('min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors', fokus === z.id ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-hijau hover:border-emas')}
          >
            {z.nama_zona}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <PetaFoto
          foto={fotoDasar}
          wilayah={wilayah}
          pin={pins}
          fokusId={fokus}
          onFokus={(id) => {
            setFokus(id);
            setPin(null);
          }}
          pinTerpilih={pin}
          onPin={(p) => setPin(p.id === pin ? null : p.id)}
          labelSemua="Semua zona"
          zoomBebas
          pasKeWilayah
          ariaLabel="Peta zona tanaman"
        >
          <AnimatePresence>
            {pinData && (
              <m.div
                key={pinData.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute inset-x-3 bottom-3 rounded-2xl bg-gading/97 p-4 shadow-modal backdrop-blur sm:left-auto sm:w-72"
                role="status"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emas/20 text-emas-tua">
                    <MapPin className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-judul text-xl leading-tight text-tinta">{pinData.komoditas}</p>
                    {pinData.jumlah && <p className="text-sm font-semibold text-hijau">{pinData.jumlah}</p>}
                    {pinData.keterangan && <p className="mt-1 text-sm text-redup">{pinData.keterangan}</p>}
                  </div>
                  <button type="button" onClick={() => setPin(null)} aria-label="Tutup" className="-m-1 rounded-full p-2 text-redup hover:bg-hijau/5">
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </PetaFoto>

        <aside className="space-y-3">
          <div className="rounded-kartu bg-hijau p-5 text-gading">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gading/70">{total ? 'Total luas semua zona' : 'Zona tanam'}</p>
            {total ? (
              <>
                <p className="mt-2 font-judul text-4xl leading-none">
                  <AngkaNaik nilai={total} format={(v) => angka(Math.round(v))} /> <span className="text-xl">m²</span>
                </p>
                <p className="mt-1 text-sm text-emas">{luasHa(total)}</p>
              </>
            ) : (
              <>
                <p className="mt-2 font-judul text-4xl leading-none">{zona.length}</p>
                <p className="mt-1 text-sm text-emas">{titik.length} titik tanaman · luas belum diisi</p>
              </>
            )}
          </div>
          <AnimatePresence mode="wait">
            {zonaFokus ? (
              <m.div key={zonaFokus.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="kartu overflow-hidden">
                {zonaFokus.foto_id && <Gambar fotoId={zonaFokus.foto_id} alt={zonaFokus.nama_zona} ukuran="320px" className="aspect-[16/9]" />}
                <div className="p-4">
                  <p className="font-judul text-xl text-tinta">{zonaFokus.nama_zona}</p>
                  <p className="text-sm text-redup">
                    {Number(zonaFokus.luas_m2) ? `${luasM2(zonaFokus.luas_m2)} · ${luasHa(zonaFokus.luas_m2)}` : 'Luas belum diisi'}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {titik
                      .filter((t) => t.zona_id === zonaFokus.id)
                      .map((t) => (
                        <li key={t.id}>
                          <button type="button" onClick={() => setPin(t.id)} className={cn('rounded-full px-2.5 py-1 text-xs ring-1', pin === t.id ? 'bg-emas/20 ring-emas' : 'bg-krem ring-garis')}>
                            {t.komoditas}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </m.div>
            ) : (
              <m.ul key="daftar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="kartu divide-y divide-garis">
                {zona.map((z, i) => (
                  <li key={z.id}>
                    <button type="button" onClick={() => setFokus(z.id)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-hijau/5">
                      <span className="size-3 shrink-0 rounded-full" style={{ background: WARNA_ZONA[i % WARNA_ZONA.length] }} />
                      <span className="flex-1 text-sm font-medium">{z.nama_zona}</span>
                      <span className="text-xs tabular-nums text-redup">{luasM2(z.luas_m2)}</span>
                    </button>
                  </li>
                ))}
              </m.ul>
            )}
          </AnimatePresence>
          {tautanLetak && (
            <a href={tautanLetak} className="kartu group flex items-center gap-3 p-4 transition-colors hover:border-emas">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emas/15 text-emas-tua">
                <Navigation className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-tinta">Letak sawah pondok</span>
                <span className="block text-xs text-redup">Sawah Depan La-Tansa (bidang 6), utara Jl. Joyoboyo Timur · lihat di peta tanah</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-hijau transition-transform group-hover:translate-x-0.5" aria-hidden />
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
