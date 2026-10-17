import { useEffect, useMemo, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, animate, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { cn } from '../../lib/cn.js';
import { sektorDariId } from '../../lib/sektor.js';
import { fotoSrcSet, fotoUrl } from '../../lib/foto.js';
import { inisial } from '../../lib/format.js';
import { EASE, bergiliran, muncul } from '../../lib/motion.jsx';
import { useMedia } from '../../hooks/useMedia.js';
import { useInView } from '../../hooks/useInView.js';
import { FotoStaf } from '../../components/ui/Gambar.jsx';
import { KotakPesan } from '../../components/ui/Kerangka.jsx';
import { Segmen } from '../../components/ui/Segmen.jsx';

// Tiga bagian sesuai sektor; tiap sektor = satu kolom foto (diadaptasi dari referensi team-showcase).
const KELOMPOK = [
  { nama: 'Pembangunan', sektor: 'PEMBANGUNAN' },
  { nama: 'Kendaraan', sektor: 'KENDARAAN' },
  { nama: 'Pertanian & Perikanan', sektor: 'PERTANIAN' }
];
// ukuran foto [lebar, tinggi] per kolom (kolom tengah paling besar) & tinggi jendela kolom, per ukuran layar
const UKURAN = {
  hp: { kartu: [[100, 116], [108, 126], [104, 120]], celah: 8, jendela: 340 },
  sm: { kartu: [[130, 142], [142, 156], [136, 148]], celah: 10, jendela: 420 },
  md: { kartu: [[148, 160], [166, 180], [156, 168]], celah: 12, jendela: 500 }
};
// arah geser otomatis (1 = naik, -1 = turun) & kecepatan (px/detik) tiap kolom
const GERAK = [
  { arah: 1, laju: 16 },
  { arah: -1, laju: 13 },
  { arah: 1, laju: 15 }
];
const peringkat = (j) => (/kepala/i.test(j) ? 0 : /wakil/i.test(j) ? 1 : /sekretaris|bendahara/i.test(j) ? 2 : 3);
const sisa = (v, L) => ((v % L) + L) % L;

/** Logo WhatsApp (glyph resmi, 24×24). */
function IkonWA({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/** Petak foto: abu-abu & redup, berwarna penuh saat orangnya ditunjuk (foto atau namanya). */
function KartuFoto({ s, ukuran, aktif, pilih }) {
  const ini = aktif === s.id;
  const redup = aktif !== null && !ini;
  const filter = ini ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.82)';
  const efek = { filter, transform: ini ? 'scale(1.05)' : 'scale(1)' };
  return (
    <div
      className={cn('relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-krem ring-1 ring-garis/70 transition-[opacity,box-shadow] duration-500', redup ? 'opacity-55' : 'opacity-100', ini && 'shadow-angkat')}
      style={{ width: ukuran[0], height: ukuran[1] }}
      onMouseEnter={() => pilih(s, true)}
      onMouseLeave={() => pilih(null, true)}
      onClick={() => pilih(ini ? null : s, false)}
      title={`${s.nama}${s.jabatan ? ` — ${s.jabatan}` : ''}`}
    >
      {s.foto_id ? (
        <img
          src={fotoUrl(s.foto_id, 480)}
          srcSet={fotoSrcSet(s.foto_id, 480)}
          sizes="180px"
          alt={s.nama}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="size-full object-cover transition-[filter,transform] duration-700 ease-halus"
          style={efek}
        />
      ) : (
        <div
          role="img"
          aria-label={s.nama}
          className="flex size-full items-end p-3 transition-[filter,transform] duration-700 ease-halus"
          style={{
            ...efek,
            backgroundImage:
              'radial-gradient(circle at 80% 15%, rgb(201 162 74 / 0.28), transparent 50%), repeating-linear-gradient(135deg, rgb(31 61 43 / 0.04) 0 2px, transparent 2px 12px), linear-gradient(160deg, #F1EADB, #DCCFB4)'
          }}
        >
          <span className="font-judul text-3xl leading-none text-hijau/80 md:text-4xl">{inisial(s.nama)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Satu kolom foto yang bergeser sendiri naik/turun tanpa ujung di dalam jendela setinggi tetap.
 * Berhenti saat ditunjuk; bila nama seseorang di daftar ditunjuk, kolom meluncur menampilkan fotonya.
 */
function KolomGeser({ k, ki, ukuran, celah, jendela, jalan, aktif, fokusId, pilih }) {
  const kurangi = useReducedMotion();
  const [w, h] = ukuran;
  const langkah = h + celah;
  const n = k.anggota.length;
  const L = n * langkah;
  const bergerak = !kurangi && n > 1 && L > jendela * 0.85;
  const salinan = bergerak ? Math.ceil(jendela / L) + 1 : 1;
  const offset = useMotionValue(ki * langkah * 0.45);
  const y = useTransform(offset, (v) => (bergerak ? -sisa(v, L) : 0));
  const { arah, laju } = GERAK[ki];

  useAnimationFrame((_, delta) => {
    if (!bergerak || !jalan) return;
    offset.set(offset.get() + (arah * laju * Math.min(delta, 64)) / 1000);
  });

  // nama di daftar ditunjuk → luncurkan fotonya ke tengah jendela (menunjuk foto tidak menggeser kolom)
  const iFokus = k.anggota.findIndex((s) => s.id === fokusId);
  useEffect(() => {
    if (!bergerak || iFokus < 0) return;
    const v = offset.get();
    const tujuan = iFokus * langkah - (jendela - h) / 2;
    const terdekat = tujuan + L * Math.round((v - tujuan) / L);
    const a = animate(offset, terdekat, { type: 'spring', stiffness: 90, damping: 20 });
    return () => a.stop();
  }, [iFokus, bergerak, langkah, jendela, h, L, offset]);

  const Ikon = k.info?.ikon;
  const isi = Array.from({ length: salinan }, (_, c) => k.anggota.map((s) => ({ s, kunci: `${c}-${s.id}` }))).flat();
  const masker = bergerak ? 'linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)' : undefined;

  return (
    <m.div
      className="flex shrink-0 flex-col gap-2"
      style={{ width: w }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: EASE, delay: ki * 0.12 }}
    >
      <p className="flex items-center gap-1.5 truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-redup">
        {Ikon && <Ikon className="size-3.5 shrink-0" style={{ color: k.info.warna }} aria-hidden />}
        {k.info?.pendek || k.nama}
        <span className="ml-auto tabular-nums text-redup/70">{n}</span>
      </p>
      <div className={cn('relative', kurangi && L > jendela ? 'overflow-y-auto' : 'overflow-hidden')} style={{ height: jendela, WebkitMaskImage: masker, maskImage: masker }}>
        <m.div className="flex flex-col" style={{ y, gap: celah }}>
          {isi.map(({ s, kunci }) => (
            <KartuFoto key={kunci} s={s} ukuran={ukuran} aktif={aktif} pilih={pilih} />
          ))}
          {!n && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-garis text-center text-xs text-redup" style={{ width: w, height: h }}>
              Belum ada staf
            </div>
          )}
        </m.div>
      </div>
    </m.div>
  );
}

/** Baris nama: penanda pil, nama, ikon WhatsApp yang meluncur masuk saat ditunjuk, lalu jabatan. */
function BarisNama({ s, warna, aktif, pilih }) {
  const ini = aktif === s.id;
  const redup = aktif !== null && !ini;
  return (
    <m.li
      variants={muncul}
      className={cn('min-w-0 cursor-pointer transition-opacity duration-300', redup ? 'opacity-50' : 'opacity-100')}
      onMouseEnter={() => pilih(s, true, true)}
      onMouseLeave={() => pilih(null, true)}
      onClick={() => pilih(ini ? null : s, false, true)}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn('mt-[0.3em] h-3 shrink-0 rounded-[5px] transition-all duration-300', ini ? 'w-5' : 'w-4 bg-hijau/20')} style={ini ? { background: warna } : undefined} />
        <span className={cn('min-w-0 text-[15px] font-semibold leading-tight tracking-tight transition-colors duration-300 sm:text-base md:text-[17px]', ini ? 'text-tinta' : 'text-tinta/80')}>
          {s.nama}
          {s.wa && (
            <a
              href={`https://wa.me/${s.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onFocus={() => pilih(s, false, true)}
              title={`Chat WhatsApp ${s.nama}`}
              aria-label={`Hubungi ${s.nama} lewat WhatsApp`}
              className={cn(
                'inline-flex rounded-md align-middle text-[#1FA855] transition-all duration-200 hover:scale-110 hover:bg-[#25D366]/12',
                // tersembunyi: tidak memakan tempat agar nama tidak terpotong
                ini ? 'ml-1.5 w-[22px] translate-x-0 p-1 opacity-100' : 'pointer-events-none ml-0 w-0 -translate-x-2 overflow-hidden p-0 opacity-0'
              )}
            >
              <IkonWA className="size-3.5 shrink-0" />
            </a>
          )}
        </span>
      </div>
      <p className="mt-1.5 truncate pl-[27px] text-[0.62rem] font-medium uppercase tracking-[0.2em] text-redup md:text-[10px]">{s.jabatan || 'Staf'}</p>
    </m.li>
  );
}

/**
 * F-06 Staf Yayasan — tiga bagian per sektor (Pembangunan, Kendaraan, Pertanian & Perikanan).
 * Kiri: tiga kolom foto bergeser otomatis (naik – turun – naik) dalam tinggi tetap, berhenti saat ditunjuk.
 * Kanan: tab sektor + nama & jabatan; menunjuk foto/nama menyorot orang yang sama.
 * Ikon WhatsApp hanya untuk staf yang dicentang "Tampilkan WA di beranda".
 */
export function Staf({ staf, varian = 'grid' }) {
  const [aktif, setAktif] = useState(null);
  const [fokusId, setFokusId] = useState(null); // orang yang ditunjuk dari daftar nama
  const [tab, setTab] = useState(KELOMPOK[0].nama);
  const [ditunjuk, setDitunjuk] = useState(false);
  const sm = useMedia('(min-width: 640px)');
  const md = useMedia('(min-width: 768px)');
  const [refLihat, terlihat] = useInView({ rootMargin: '0px', sekali: false, threshold: 0.1 });
  const lepasTunda = useRef(null);
  const ukuran = md ? UKURAN.md : sm ? UKURAN.sm : UKURAN.hp;

  const kelompok = useMemo(
    () =>
      KELOMPOK.map((k) => ({
        ...k,
        info: sektorDariId(k.sektor),
        anggota: (staf || [])
          .filter((s) => s.kelompok === k.nama)
          .sort((a, b) => peringkat(a.jabatan || '') - peringkat(b.jabatan || '') || String(a.nama).localeCompare(String(b.nama), 'id'))
      })),
    [staf]
  );
  useEffect(() => () => clearTimeout(lepasTunda.current), []);

  // pilih(s, dariHover, dariDaftar): sorot orang & pindah ke tab sektornya; hover-keluar dilepas sedikit tertunda agar tidak berkedip
  const pilih = (s, dariHover, dariDaftar = false) => {
    clearTimeout(lepasTunda.current);
    if (s) {
      setAktif(s.id);
      setFokusId(dariDaftar ? s.id : null);
      setTab(s.kelompok);
    } else if (dariHover) {
      lepasTunda.current = setTimeout(() => {
        setAktif(null);
        setFokusId(null);
      }, 120);
    } else {
      setAktif(null);
      setFokusId(null);
    }
  };

  if (!staf?.length) return <KotakPesan teks="Belum ada data staf." />;

  if (varian === 'daftar') {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {kelompok.map((k) => (
          <div key={k.nama} className="kartu divide-y divide-garis">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-redup">{k.nama}</p>
            {k.anggota.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <FotoStaf nama={s.nama} fotoId={s.foto_id} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-tinta">{s.nama}</p>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] text-redup">{s.jabatan || 'Staf'}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const kini = kelompok.find((k) => k.nama === tab) || kelompok[0];
  const kepala = kini.anggota.find((s) => /kepala/i.test(s.jabatan || '') && !/wakil/i.test(s.jabatan || ''));
  const jalan = terlihat && !ditunjuk && aktif === null;

  return (
    <div
      ref={refLihat}
      className="flex select-none flex-col gap-8 md:flex-row md:items-start md:gap-10 lg:gap-14"
      onMouseEnter={() => setDitunjuk(true)}
      onMouseLeave={() => {
        setDitunjuk(false);
        pilih(null, true);
      }}
    >
      {/* kiri: tiga kolom foto bergeser naik/turun */}
      <div className="-mx-5 flex justify-center gap-2 px-5 sm:gap-3 md:mx-0 md:shrink-0 md:justify-start md:px-0">
        {kelompok.map((k, ki) => (
          <KolomGeser key={k.nama} k={k} ki={ki} ukuran={ukuran.kartu[ki]} celah={ukuran.celah} jendela={ukuran.jendela} jalan={jalan} aktif={aktif} fokusId={fokusId} pilih={pilih} />
        ))}
      </div>

      {/* kanan: tab sektor + nama & jabatan */}
      <div className="w-full min-w-0 flex-1 md:pt-6">
        <Segmen
          pilihan={kelompok.map((k) => ({ nilai: k.nama, label: k.info?.pendek || k.nama, ikon: sm ? k.info?.ikon : undefined }))}
          nilai={tab}
          ubah={(v) => {
            setTab(v);
            setAktif(null);
          }}
          idTata="tab-staf"
          label="Sektor staf"
          className="w-fit"
        />
        <p className="mt-4 text-sm text-redup">
          <b className="font-semibold text-tinta">{kini.anggota.length} staf</b> {kini.nama}
          {kepala ? ` · Kepala Bagian: ${kepala.nama}` : ''}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <m.ul
            key={kini.nama}
            variants={bergiliran(0.05)}
            initial="tersembunyi"
            animate="tampil"
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            className={cn('mt-5 grid gap-x-4 gap-y-4 sm:gap-x-8 sm:gap-y-5', kini.anggota.length > 4 && 'grid-cols-2')}
            role="list"
            aria-label={`Staf ${kini.nama}`}
          >
            {kini.anggota.map((s) => (
              <BarisNama key={s.id} s={s} warna={kini.info?.warna} aktif={aktif} pilih={pilih} />
            ))}
            {!kini.anggota.length && <li className="text-sm text-redup">Belum ada staf di sektor ini.</li>}
          </m.ul>
        </AnimatePresence>
        <p className="mt-8 border-t border-garis pt-4 text-xs text-redup">
          {md ? 'Tunjuk nama' : 'Ketuk nama'} untuk menyorot fotonya{kini.anggota.some((x) => x.wa) ? ' dan memunculkan tombol WhatsApp' : ''}. Foto bergeser otomatis dan berhenti saat ditunjuk.
        </p>
      </div>
    </div>
  );
}
