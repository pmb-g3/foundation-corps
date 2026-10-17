import { useEffect, useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { fotoUrl } from '../../lib/foto.js';
import { ambilTransisi } from '../../lib/transisi.js';
import { useEditor } from '../../lib/editor.jsx';
import { EASE } from '../../lib/motion.jsx';
import { Tautan } from '../../lib/router.jsx';
import { Gambar } from '../../components/ui/Gambar.jsx';
import { TombolEdit } from '../../components/layout/Bagian.jsx';
import { IndikatorGulir } from '../../components/layout/IndikatorGulir.jsx';

/**
 * Foto kartu sektor "mengembang" menjadi header (F-04): lapisan foto menempati posisi kartu,
 * lalu bingkainya (clip-path) melebar ke ukuran header, kemudian memudar.
 */
function LapisanTransisi({ transisi, tinggiHeader }) {
  const kurangi = useReducedMotion();
  const [selesai, setSelesai] = useState(false);
  if (!transisi || kurangi || selesai) return null;
  const { rect } = transisi;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const awal = `inset(${rect.top}px ${Math.max(0, vw - rect.left - rect.width)}px ${Math.max(0, vh - rect.top - rect.height)}px ${rect.left}px round 20px)`;
  const akhir = `inset(0px 0px ${Math.max(0, vh - tinggiHeader)}px 0px round 0px)`;
  return (
    <m.div
      className="pointer-events-none fixed inset-0 z-40 bg-hijau"
      initial={{ clipPath: awal, opacity: 1 }}
      animate={{ clipPath: akhir, opacity: [1, 1, 0] }}
      transition={{ clipPath: { duration: 0.65, ease: EASE }, opacity: { duration: 0.95, times: [0, 0.75, 1] } }}
      onAnimationComplete={() => setSelesai(true)}
      aria-hidden
    >
      {transisi.fotoId && <img src={fotoUrl(transisi.fotoId, 1200)} alt="" className="absolute inset-x-0 top-0 h-[100svh] w-full object-cover" />}
      <div className="absolute inset-x-0 top-0 h-[100svh] bg-gradient-to-t from-hijau/90 via-hijau/25 to-transparent" />
    </m.div>
  );
}

/**
 * Kerangka halaman sektor: header foto, judul, angka ringkas, daftar bagian, dan indikator gulir.
 * bagian: [{ id, label, ikon }]
 */
// Header yang baru saja tampil (mis. saat data masih dimuat) tidak diberi animasi masuk lagi.
const headerTerakhir = { sektor: '', waktu: 0 };

export function SektorLayout({ sektor, kartu = {}, stat, bagian = [], children }) {
  const editor = useEditor();
  const [transisi] = useState(() => ambilTransisi(sektor.id));
  const [ulang] = useState(() => headerTerakhir.sektor === sektor.id && Date.now() - headerTerakhir.waktu < 15000);
  const [tinggiHeader, setTinggiHeader] = useState(() => Math.max(520, Math.round(window.innerHeight * 0.72)));
  const kurangiGerak = useReducedMotion();
  const kurangi = kurangiGerak || ulang;
  useEffect(() => {
    headerTerakhir.sektor = sektor.id;
    headerTerakhir.waktu = Date.now();
  }, [sektor.id]);
  const Ikon = sektor.ikon;

  useEffect(() => {
    // tinggi header mengikuti ukuran layar saat dibuka (tidak berubah saat bilah alamat HP muncul/hilang)
    setTinggiHeader(Math.max(520, Math.round(window.innerHeight * 0.72)));
  }, []);

  return (
    <div>
      <LapisanTransisi transisi={transisi} tinggiHeader={tinggiHeader} />
      <header className="relative overflow-hidden bg-hijau" style={{ height: tinggiHeader }}>
        {/* foto setinggi layar, dipotong header → sama persis dengan lapisan transisi */}
        <m.div
          className="absolute inset-x-0 top-0 h-[100svh]"
          initial={transisi || kurangi ? false : { scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <Gambar fotoId={kartu.foto_id} prioritas alt={`Foto sektor ${sektor.label}`} className="absolute inset-0" label={sektor.label} />
        </m.div>
        <div className="absolute inset-0 bg-gradient-to-t from-hijau via-hijau/30 to-hijau/50" aria-hidden />
        <div className="absolute right-4 top-20 z-10 md:right-8 md:top-24">
          <TombolEdit gelap label="Edit foto & judul" onClick={editor.bisa() ? () => editor.buka({ jenis: 'sektor_kartu', sektor: sektor.id }) : undefined} />
        </div>
        <div className="wadah relative flex h-full flex-col justify-end pb-10 md:pb-14">
          <m.div initial={kurangi ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: transisi ? 0.45 : 0.15, duration: 0.6, ease: EASE }}>
            <Tautan ke="/?ke=sektor" className="mb-4 inline-flex min-h-10 items-center gap-1 rounded-full bg-white/10 pl-2 pr-3.5 text-xs font-semibold text-gading backdrop-blur-md hover:bg-white/20">
              <ChevronLeft className="size-4" aria-hidden /> Beranda
            </Tautan>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-emas">
              <Ikon className="size-4" aria-hidden /> Sektor
            </p>
            <h1 className="mt-2 text-[2.6rem] leading-[1.02] text-gading md:text-6xl">{kartu.judul || sektor.label}</h1>
            {kartu.ringkas && <p className="mt-3 max-w-xl text-gading/80">{kartu.ringkas}</p>}
          </m.div>
          {stat && (
            <m.dl
              initial={kurangi ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: transisi ? 0.6 : 0.3, duration: 0.6, ease: EASE }}
              className="mt-6 flex flex-wrap gap-2"
            >
              {stat.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md">
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-gading/65">{s.label}</dt>
                  <dd className="font-judul text-xl leading-tight text-gading tabular-nums">{s.nilai}</dd>
                </div>
              ))}
            </m.dl>
          )}
        </div>
      </header>

      {bagian.length > 1 && (
        <nav aria-label="Bagian halaman" className="sticky top-16 z-30 hidden border-b border-garis bg-krem/90 backdrop-blur-md md:top-[4.5rem] md:block">
          <div className="wadah tanpa-scrollbar flex gap-1 overflow-x-auto py-2">
            {bagian.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => document.getElementById(b.id)?.scrollIntoView({ behavior: kurangiGerak ? 'auto' : 'smooth' })}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-hijau/80 hover:bg-hijau/5 hover:text-hijau"
              >
                {b.ikon && <b.ikon className="size-4" aria-hidden />}
                {b.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {children}
      <IndikatorGulir bagian={bagian} />
    </div>
  );
}
