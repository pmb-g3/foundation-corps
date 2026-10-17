import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { ArrowLeft, ArrowRight, Layers, MapPin, Navigation, X } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { angka, luasHa, luasM2 } from '../../../lib/format.js';
import { WARNA_ZONA, kelompokLokasi, labelZona, lokasiDari } from '../../../lib/lokasiTanah.js';
import { bacaPoligon } from '../../../components/peta/petaLib.js';
import { PetaFoto } from '../../../components/peta/PetaFoto.jsx';
import { useInView } from '../../../hooks/useInView.js';

/** Kartu info zona terpilih: luas m² · ha · ru, porsi di lokasi, jumlah bidang, tautan peta rinci. */
function InfoZona({ z, warna, lokasiAktif, rinci, induk, jumlahBidang, konversiRu, bukaLokasi, tutup }) {
  const porsi = lokasiAktif.luas ? ((Number(z.luas_m2) || 0) / lokasiAktif.luas) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-hijau" style={{ background: warna }}>
          {z.kode || '•'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-judul text-xl leading-tight text-tinta">{z.nama_zona}</p>
          <p className="mt-0.5 text-xs text-redup">{lokasiAktif.nama}</p>
        </div>
        {tutup && (
          <button type="button" onClick={tutup} aria-label="Tutup info zona" className="-m-1 rounded-full p-2 text-redup hover:bg-hijau/5">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-krem/80 px-2 py-2.5">
          <dt className="text-[0.68rem] uppercase tracking-[0.06em] text-redup">Hektar</dt>
          <dd className="mt-0.5 font-judul text-lg tabular-nums text-tinta">{angka((Number(z.luas_m2) || 0) / 10000, 2)}</dd>
        </div>
        <div className="rounded-xl bg-krem/80 px-2 py-2.5">
          <dt className="text-[0.68rem] uppercase tracking-[0.06em] text-redup">m²</dt>
          <dd className="mt-0.5 font-judul text-lg tabular-nums text-tinta">{angka(z.luas_m2)}</dd>
        </div>
        <div className="rounded-xl bg-krem/80 px-2 py-2.5">
          <dt className="text-[0.68rem] uppercase tracking-[0.06em] text-redup">Ru</dt>
          <dd className="mt-0.5 font-judul text-lg tabular-nums text-tinta">{angka((Number(z.luas_m2) || 0) / (Number(konversiRu) || 14), 0)}</dd>
        </div>
      </dl>
      <div>
        <div className="flex justify-between text-xs text-redup">
          <span>Porsi di {lokasiAktif.nama}</span>
          <span className="tabular-nums">{angka(porsi, 1)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-garis/70">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, porsi)}%`, background: warna }} />
        </div>
      </div>
      {z.keterangan && <p className="text-sm leading-relaxed text-redup">{z.keterangan}</p>}
      <p className="text-xs text-redup">{jumlahBidang} bidang bersertifikat · tabel Data Tanah ikut tersaring</p>
      {rinci && (
        <button
          type="button"
          onClick={() => bukaLokasi(rinci.id)}
          className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-hijau px-3.5 text-left text-sm font-semibold text-gading transition-colors hover:bg-daun"
        >
          <Layers className="size-4 shrink-0 text-emas" aria-hidden />
          <span className="flex-1">Peta rinci: {rinci.nama}</span>
          <ArrowRight className="size-4" aria-hidden />
        </button>
      )}
      {induk && (
        <p className="text-xs text-redup">Bagian dari bidang {labelZona(induk)} — luasnya sudah terhitung di sana.</p>
      )}
    </div>
  );
}

/**
 * F-20 Peta tanah interaktif, banyak lokasi (kompleks pondok, sawah, Besuk, Totok Kerot).
 * Pilih lokasi → peta & daftar zona; ketuk zona (di peta atau daftar) → info + tabel F-21 tersaring.
 * Bila lokasi punya foto drone yang sejajar, foto drone → peta berganti mengikuti gulir (PRD F-20).
 */
export function PetaTanah({ zona = [], bidang = [], lokasi = [], konversiRu = 14, zonaTerpilih, onPilihZona }) {
  const kurangi = useReducedMotion();
  const kelompok = useMemo(() => kelompokLokasi(zona, lokasi), [zona, lokasi]);
  const [aktifId, setAktifId] = useState(() => kelompok.find((k) => k.zona.length)?.id || kelompok[0]?.id);
  const [hover, setHover] = useState(null);

  // zona dipilih dari luar (mis. tabel) di lokasi lain → pindah lokasi
  useEffect(() => {
    if (!zonaTerpilih) return;
    const z = zona.find((x) => x.id === zonaTerpilih);
    const id = z && lokasiDari(z, lokasi);
    if (id && id !== aktifId) setAktifId(id);
  }, [zonaTerpilih]); // eslint-disable-line react-hooks/exhaustive-deps

  const aktif = kelompok.find((k) => k.id === aktifId) || kelompok[0];
  const warnaZona = useMemo(() => Object.fromEntries((aktif?.zona || []).map((z, i) => [z.id, WARNA_ZONA[i % WARNA_ZONA.length]])), [aktif]);
  const wilayah = useMemo(
    () => (aktif?.zona || []).map((z) => ({ id: z.id, nama: z.kode ? `${z.kode} · ${z.nama_zona}` : z.nama_zona, sub: luasHa(z.luas_m2), titik: bacaPoligon(z.polygon_json), warna: warnaZona[z.id] })),
    [aktif, warnaZona]
  );
  const z = aktif?.zona.find((x) => x.id === zonaTerpilih) || null;
  const rinciDari = (zonaId) => kelompok.find((k) => k.induk && k.induk === zonaId);
  const induk = aktif?.induk ? zona.find((x) => x.id === aktif.induk) : null;
  const lokasiInduk = induk ? kelompok.find((k) => k.id === lokasiDari(induk, lokasi)) : null;
  const jumlahBidang = (id) => bidang.filter((b) => b.zona_id === id).length;

  const bukaLokasi = (id, zonaId = null) => {
    setAktifId(id);
    setHover(null);
    onPilihZona(zonaId);
  };

  // garis zona tergambar bertahap saat peta terlihat / lokasi berganti
  const [refLihat, terlihat] = useInView({ rootMargin: '0px', threshold: 0.25 });
  const garis = useMotionValue(kurangi ? 1 : 0);
  useEffect(() => {
    if (kurangi || !terlihat) return;
    garis.set(0);
    const a = animate(garis, 1, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => a.stop();
  }, [aktifId, terlihat, kurangi, garis]);

  // foto drone → peta datar dikendalikan gulir (hanya bila lokasi punya foto drone)
  const modeGulir = !!aktif?.foto_drone_id && !kurangi;
  const refGulir = useRef(null);
  const { scrollYProgress } = useScroll({ target: refGulir, offset: ['start start', 'end end'] });
  const campur = useTransform(scrollYProgress, [0.15, 0.55], [0, 1]);
  const garisGulir = useTransform(scrollYProgress, [0.45, 0.85], [0, 1]);

  if (!aktif) return <p className="text-sm text-redup">Belum ada lokasi peta tanah.</p>;

  const peta = (
    <PetaFoto
      key={aktif.id}
      foto={modeGulir ? aktif.foto_drone_id : aktif.foto_id}
      fotoKedua={modeGulir ? aktif.foto_id : undefined}
      campur={modeGulir ? campur : 0}
      wilayah={wilayah}
      progresGaris={modeGulir ? garisGulir : garis}
      fokusId={zonaTerpilih && z ? zonaTerpilih : null}
      onFokus={onPilihZona}
      hoverId={hover}
      onHover={setHover}
      zoomBebas
      isiOpasitas={0.3}
      tinggiMaks={modeGulir ? 'calc(100svh - 12rem)' : '76svh'}
      labelSemua={`Semua · ${aktif.nama}`}
      ariaLabel={`Peta zona tanah ${aktif.nama}`}
    >
      {modeGulir && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-hijau/80 px-3 py-1.5 text-xs font-semibold text-gading backdrop-blur">
          Gulir: foto drone → peta
        </div>
      )}
    </PetaFoto>
  );

  const daftarZona = (
    <ul className="divide-y divide-garis" role="list">
      {aktif.zona.map((x) => {
        const pilih = x.id === zonaTerpilih;
        const rinci = rinciDari(x.id);
        return (
          <li key={x.id}>
            <button
              type="button"
              onClick={() => onPilihZona(pilih ? null : x.id)}
              onMouseEnter={() => setHover(x.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(x.id)}
              onBlur={() => setHover(null)}
              aria-pressed={pilih}
              className={cn('flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left transition-colors', pilih ? 'bg-emas/15' : hover === x.id ? 'bg-hijau/5' : 'hover:bg-hijau/5')}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold text-hijau" style={{ background: warnaZona[x.id] }}>
                {x.kode || '•'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-tinta">{x.nama_zona}</span>
                {rinci && <span className="block text-xs text-emas-tua">Ada peta rinci</span>}
              </span>
              <span className="text-right text-sm tabular-nums text-tinta">
                {angka((Number(x.luas_m2) || 0) / 10000, 2)}
                <span className="ml-0.5 text-xs text-redup">ha</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      {/* pilih lokasi */}
      <div className="tanpa-scrollbar -mx-5 mb-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Lokasi tanah">
        {kelompok.map((k) => {
          const pilih = k.id === aktif.id;
          return (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={pilih}
              onClick={() => bukaLokasi(k.id)}
              className={cn(
                'min-w-[11.5rem] shrink-0 snap-start rounded-2xl border px-4 py-3 text-left transition-colors',
                pilih ? 'border-hijau bg-hijau text-gading shadow-angkat' : 'border-garis bg-gading text-tinta hover:border-emas'
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {k.induk ? <Layers className={cn('size-3.5', pilih ? 'text-emas' : 'text-emas-tua')} aria-hidden /> : <MapPin className={cn('size-3.5', pilih ? 'text-emas' : 'text-emas-tua')} aria-hidden />}
                {k.nama}
              </span>
              <span className={cn('mt-1 block text-xs tabular-nums', pilih ? 'text-gading/75' : 'text-redup')}>
                {k.zona.length} zona · {luasHa(k.luas)}
                {k.induk ? ' · rincian' : ''}
              </span>
              {k.jarak && (
                <span className={cn('mt-1 flex items-center gap-1 text-xs', pilih ? 'text-emas' : 'text-emas-tua')}>
                  <Navigation className="size-3" aria-hidden /> {k.jarak}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div ref={refGulir} className={modeGulir ? 'relative h-[200vh]' : undefined}>
        <div ref={refLihat} className={cn('grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]', modeGulir && 'sticky top-20 md:top-32')}>
          <div className="min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={aktif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                {peta}
              </m.div>
            </AnimatePresence>
            <p className="mt-2.5 text-center text-xs text-redup">
              Ketuk zona untuk detail · cubit / tombol + untuk memperbesar{aktif.keterangan ? ` · ${aktif.keterangan}` : ''}
            </p>
          </div>

          <aside className="flex min-w-0 flex-col gap-3 lg:max-h-[76svh]">
            {lokasiInduk && (
              <button
                type="button"
                onClick={() => bukaLokasi(lokasiInduk.id, induk.id)}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-garis bg-gading px-3.5 text-sm font-semibold text-hijau hover:border-emas"
              >
                <ArrowLeft className="size-4" aria-hidden /> Kembali ke {lokasiInduk.nama}
              </button>
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              {z && (
                <m.div key={z.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="kartu p-4" role="status">
                  <InfoZona
                    z={z}
                    warna={warnaZona[z.id]}
                    lokasiAktif={aktif}
                    rinci={rinciDari(z.id)}
                    induk={induk}
                    jumlahBidang={jumlahBidang(z.id)}
                    konversiRu={konversiRu}
                    bukaLokasi={(id) => bukaLokasi(id)}
                    tutup={() => onPilihZona(null)}
                  />
                </m.div>
              )}
            </AnimatePresence>
            <div className="kartu flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="border-b border-garis px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-redup">Zona di {aktif.nama}</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{daftarZona}</div>
              <div className="flex items-baseline justify-between border-t-2 border-emas/50 bg-krem/60 px-3 py-2.5 text-sm">
                <span className="font-semibold">{aktif.induk ? 'Jumlah rincian' : 'Total lokasi'}</span>
                <span className="tabular-nums">
                  <b className="font-semibold">{luasHa(aktif.luas)}</b> <span className="text-xs text-redup">· {luasM2(aktif.luas)}</span>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
