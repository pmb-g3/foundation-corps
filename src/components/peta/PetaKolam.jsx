import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { List, Maximize2, Search, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { angka, rupiah, rupiahRingkas, tanggal, BULAN_PENDEK } from '../../lib/format.js';
import { hitungKolam, petaParameter, proyeksiBulanan } from '../../lib/budidaya.js';
import { useUkuran } from '../../hooks/useUkuran.js';
import { useLayarLebar } from '../../hooks/useMedia.js';
import { useDebounce } from '../../hooks/useThrottle.js';
import { Laci } from '../ui/Dialog.jsx';
import { Lencana } from '../ui/Lencana.jsx';
import { GrafikBatang } from '../chart/GrafikBatang.jsx';
import { fotoUrl, rasioFoto } from '../../lib/foto.js';
import { adaPoligonKolam, ambilDenah, buatDenahFoto, namaBilik } from './denahKolam.js';

// Warna bilik menurut isi (F-11). Huruf L/N di bilik = pengenal kedua selain warna.
const WARNA = { Lele: 'var(--color-daun)', Nila: 'var(--color-batu)', Kosong: 'var(--color-garis)' };
const warnaBilik = (k) => (k?.status === 'Isi' ? WARNA[k.jenis_ikan] || WARNA.Kosong : WARNA.Kosong);

const SARINGAN = [
  { nilai: 'semua', label: 'Semua' },
  { nilai: 'Lele', label: 'Lele' },
  { nilai: 'Nila', label: 'Nila' },
  { nilai: 'panen', label: 'Panen bulan ini' }
];

function fitDenah(b, W, H, bantalan = 1.3) {
  if (!b) return { s: 1, tx: 0, ty: 0 };
  const s = Math.max(1, Math.min(W / ((b[2] - b[0]) * bantalan), H / ((b[3] - b[1]) * bantalan), 5));
  const cx = (b[0] + b[2]) / 2;
  const cy = (b[1] + b[3]) / 2;
  const tx = Math.min(0, Math.max(W - W * s, W / 2 - cx * s));
  const ty = Math.min(0, Math.max(H - H * s, H / 2 - cy * s));
  return { s, tx, ty };
}

const gabung = (daftar) =>
  daftar.length ? daftar.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]) : null;

function InfoKolam({ data, tutup }) {
  const { k, h } = data;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: warnaBilik(k) }} />
        <div className="flex-1">
          <p className="font-judul text-2xl leading-none text-tinta">{namaBilik(k)}</p>
          <p className="mt-1 text-sm text-redup">
            {k.blok_induk || 'Kolam'} · {k.status === 'Isi' ? k.jenis_ikan : k.status}
          </p>
        </div>
        {tutup && (
          <button type="button" onClick={tutup} aria-label="Tutup info bilik" className="-m-1 rounded-full p-2 text-redup hover:bg-hijau/5">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {!h ? (
        <p className="rounded-xl bg-krem px-3 py-2.5 text-sm text-redup">{k.status === 'Isi' ? 'Data tebar belum lengkap.' : 'Bilik sedang tidak berisi ikan.'}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-krem/80 p-3">
              <dt className="text-xs text-redup">Perkiraan hidup</dt>
              <dd className="mt-1 font-judul text-xl tabular-nums">{angka(h.ekorKini)} ekor</dd>
            </div>
            <div className="rounded-xl bg-krem/80 p-3">
              <dt className="text-xs text-redup">Umur</dt>
              <dd className="mt-1 font-judul text-xl tabular-nums">{h.umur} hari</dd>
            </div>
          </dl>
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">{h.sisaHari ? `${h.sisaHari} hari lagi panen` : 'Siap panen'}</span>
              <span className="text-xs text-redup">{tanggal(h.tanggalPanen, 'pendek')}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-garis/70">
              <m.div
                className={cn('h-full rounded-full', h.segeraPanen ? 'bg-emas' : 'bg-daun')}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: h.progres }}
                style={{ transformOrigin: 'left' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-garis p-3">
            <p className="text-xs text-redup">Perkiraan profit</p>
            {h.profit === null ? (
              <p className="mt-1 text-sm text-redup">Harga benih, pakan, atau jual belum diisi.</p>
            ) : (
              <p className={cn('mt-1 font-judul text-2xl tabular-nums', h.profit < 0 ? 'text-bata' : 'text-hijau')}>{rupiah(h.profit)}</p>
            )}
            <p className="mt-1 text-xs text-redup">Biomassa panen ±{angka(h.biomassaKg, 0)} kg</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * F-11 Kolam interaktif: blok → bilik, zoom halus, cari & saring, panel info, proyeksi profit 6 bulan.
 * Bila bilik punya poligon (polygon_json), denah digambar di atas foto udara kolam (fotoKolam).
 */
export function PetaKolam({ kolam = [], parameter = [], hariIni, fotoKolam }) {
  const lebarLayar = useLayarLebar();
  const kurangi = useReducedMotion();
  const [refUkuran, { lebar }] = useUkuran();
  const [blok, setBlok] = useState(null);
  const [pilih, setPilih] = useState(null);
  const [cari, setCari] = useState('');
  const [cariAktif, setCariAktif] = useState('');
  const [saring, setSaring] = useState('semua');
  const [daftarBuka, setDaftarBuka] = useState(false);
  const setCariTunda = useDebounce(setCariAktif, 220);

  const pakaiFoto = !!fotoKolam && adaPoligonKolam(kolam);
  const [rasio, setRasio] = useState(() => rasioFoto(fotoKolam) || 1.6);
  useEffect(() => {
    if (!pakaiFoto) return;
    const img = new Image();
    img.onload = () => img.naturalWidth && setRasio(img.naturalWidth / img.naturalHeight);
    img.src = fotoUrl(fotoKolam, 480);
  }, [pakaiFoto, fotoKolam]);
  const denah = useMemo(() => (pakaiFoto ? buatDenahFoto(kolam, rasio) : ambilDenah(kolam)), [kolam, pakaiFoto, rasio]);
  const param = useMemo(() => petaParameter(parameter), [parameter]);
  const data = useMemo(() => {
    const peta = {};
    kolam.forEach((k) => {
      peta[k.shape_id || k.kode_bilik] = { k, h: hitungKolam(k, param, hariIni) };
    });
    return peta;
  }, [kolam, param, hariIni]);

  const bulanIni = (hariIni || '').slice(0, 7);
  const cocok = useMemo(() => {
    const q = cariAktif.trim().toLowerCase();
    if (!q && saring === 'semua') return null;
    return new Set(
      Object.entries(data)
        .filter(([, { k, h }]) => {
          if (q && !String(k.kode_bilik).toLowerCase().includes(q)) return false;
          if (saring === 'Lele' || saring === 'Nila') return k.status === 'Isi' && k.jenis_ikan === saring;
          if (saring === 'panen') return h && h.tanggalPanen.slice(0, 7) === bulanIni;
          return true;
        })
        .map(([id]) => id)
    );
  }, [data, cariAktif, saring, bulanIni]);

  const W = denah.lebar;
  const H = denah.tinggi;
  const view = useMemo(() => {
    const bil = pilih && denah.bilik.find((b) => b.shape_id === pilih);
    if (bil) return fitDenah(bil.bbox, W, H, 3.2);
    if (cocok && cocok.size) return fitDenah(gabung(denah.bilik.filter((b) => cocok.has(b.shape_id)).map((b) => b.bbox)), W, H);
    const bl = blok && denah.blok.find((b) => b.id === blok);
    if (bl) return fitDenah(bl.bbox, W, H, 1.1);
    return { s: 1, tx: 0, ty: 0 };
  }, [pilih, cocok, blok, denah, W, H]);

  const unit = lebar ? W / (lebar * view.s) : 1;
  const diperbesar = view.s > 1.02;
  const tampilLabelBilik = view.s > 1.15 || denah.bilik.length <= 12;

  const pilihBilik = (id) => {
    const b = denah.bilik.find((x) => x.shape_id === id);
    setPilih(id);
    if (b) setBlok(b.blok);
  };
  const reset = () => {
    setPilih(null);
    setBlok(null);
    setCari('');
    setCariAktif('');
    setSaring('semua');
  };

  // daftar memuat semua bilik (juga yang belum punya bentuk di peta); Kolam Besar dll. di atas
  const daftarUrut = Object.keys(data)
    .map((shape_id) => ({ shape_id, adaBentuk: denah.bilik.some((b) => b.shape_id === shape_id) }))
    .sort((a, b) => String(a.shape_id).localeCompare(String(b.shape_id), 'id', { numeric: true }));
  const proyeksi = useMemo(() => proyeksiBulanan(Object.values(data).map((x) => ({ hitung: x.h })), hariIni || '2026-01-01'), [data, hariIni]);
  const totalProfit = proyeksi.reduce((t, b) => t + b.profit, 0);
  const lengkap = proyeksi.every((b) => b.lengkap);
  const terpilih = pilih ? data[pilih] : null;

  const daftar = (
    <ul className="divide-y divide-garis" role="list">
      {daftarUrut.map((b) => {
        const d = data[b.shape_id];
        const redup = cocok && !cocok.has(b.shape_id);
        return (
          <li key={b.shape_id}>
            <button
              type="button"
              onClick={() => {
                pilihBilik(b.shape_id);
                setDaftarBuka(false);
              }}
              className={cn(
                'flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-hijau/5',
                pilih === b.shape_id && 'bg-emas/12',
                redup && 'opacity-40'
              )}
            >
              <span className="size-3 shrink-0 rounded-full" style={{ background: warnaBilik(d?.k) }} />
              <span className="min-w-10 font-semibold tabular-nums">{d?.k.kode_bilik || b.shape_id}</span>
              <span className="flex-1 truncate text-sm text-redup">
                {d ? (d.k.status === 'Isi' ? d.k.jenis_ikan : d.k.status) : 'Belum ada data'}
                {denah.foto && !b.adaBentuk && ' · belum ada di peta'}
              </span>
              {d?.h && (
                <span className={cn('text-xs tabular-nums', d.h.segeraPanen ? 'font-semibold text-emas-tua' : 'text-redup')}>
                  {d.h.sisaHari ? `${d.h.sisaHari} hr` : 'Panen'}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div>
      {/* cari & saring */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[11rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Cari kode bilik</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-redup" aria-hidden />
          <input
            value={cari}
            onChange={(e) => {
              setCari(e.target.value);
              setCariTunda(e.target.value);
              setPilih(null);
            }}
            placeholder="Cari bilik, mis. K12"
            className="min-h-11 w-full rounded-full border border-garis bg-gading pl-10 pr-4 text-sm focus:border-hijau focus:outline-none focus:ring-4 focus:ring-hijau/10"
          />
        </label>
        <div className="tanpa-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {SARINGAN.map((s) => (
            <button
              key={s.nilai}
              type="button"
              aria-pressed={saring === s.nilai}
              onClick={() => {
                setSaring(s.nilai);
                setPilih(null);
              }}
              className={cn(
                'min-h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors',
                saring === s.nilai ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-hijau hover:border-emas'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div ref={refUkuran} className={cn('relative overflow-hidden rounded-kartu border border-garis', denah.foto ? 'bg-hijau' : 'bg-[#E9E1CF]')} style={{ aspectRatio: `${W} / ${H}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full touch-pan-y select-none" role="img" aria-label="Denah kolam">
              <defs>
                <pattern id="ombak-kolam" width="48" height="18" patternUnits="userSpaceOnUse">
                  <path d="M0 9 Q12 3 24 9 T48 9" fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="1.5" />
                  {!kurangi && <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="48 0" dur="7s" repeatCount="indefinite" />}
                </pattern>
                <pattern id="persiapan-kolam" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="10" height="10" fill="var(--color-garis)" />
                  <line x1="0" y1="0" x2="0" y2="10" stroke="rgb(107 103 92 / 0.25)" strokeWidth="3" />
                </pattern>
              </defs>
              <g style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`, transformOrigin: '0 0', transition: 'transform .75s cubic-bezier(.22,1,.36,1)' }}>
                {denah.foto && (
                  <image
                    href={fotoUrl(fotoKolam, lebar > 900 ? 1920 : 1200)}
                    width={W}
                    height={H}
                    preserveAspectRatio="xMidYMid slice"
                    onClick={() => {
                      setPilih(null);
                      setBlok(null);
                    }}
                  />
                )}
                {!denah.foto && denah.blok.map((b) => (
                  <g key={b.id}>
                    <path
                      d={b.d}
                      fill="var(--color-gading)"
                      stroke={blok === b.id ? 'var(--color-emas)' : 'var(--color-garis)'}
                      strokeWidth={(blok === b.id ? 2.5 : 1.5) * unit}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setPilih(null);
                        setBlok(blok === b.id ? null : b.id);
                      }}
                    />
                    <text x={b.label[0]} y={b.label[1]} fontSize={14 * unit} fontWeight={700} fill="var(--color-hijau)" pointerEvents="none">
                      {b.id}
                    </text>
                  </g>
                ))}
                {denah.bilik.map((b) => {
                  const d = data[b.shape_id];
                  const isi = d?.k.status === 'Isi';
                  const redup = cocok && !cocok.has(b.shape_id);
                  const dipilih = pilih === b.shape_id;
                  return (
                    <g
                      key={b.shape_id}
                      style={{ cursor: 'pointer', opacity: redup ? 0.25 : 1, transition: 'opacity .3s' }}
                      onClick={() => {
                        // tingkat 1: ketuk blok dulu (zoom); tingkat 2: ketuk bilik
                        if (!diperbesar && !cocok && denah.blok.length > 1 && blok !== b.blok) {
                          setBlok(b.blok);
                          return;
                        }
                        pilihBilik(b.shape_id);
                      }}
                    >
                      <path
                        d={b.d}
                        fill={d?.k.status === 'Persiapan' ? 'url(#persiapan-kolam)' : denah.foto && !isi ? 'var(--color-gading)' : warnaBilik(d?.k)}
                        fillOpacity={denah.foto ? (isi ? 0.6 : 0.3) : 1}
                      />
                      {isi && <path d={b.d} fill="url(#ombak-kolam)" pointerEvents="none" />}
                      {d?.h?.segeraPanen && (
                        <path d={b.d} fill="none" stroke="var(--color-emas)" strokeWidth={5 * unit} className="animate-denyut-emas" pointerEvents="none" />
                      )}
                      <path
                        d={b.d}
                        fill="none"
                        stroke={dipilih ? 'var(--color-emas)' : denah.foto ? 'rgb(255 255 255 / 0.92)' : 'rgb(255 255 255 / 0.7)'}
                        strokeWidth={(dipilih ? 3.5 : denah.foto ? 2 : 1.5) * unit}
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                      {tampilLabelBilik && (
                        <text
                          x={b.label[0]}
                          y={b.label[1]}
                          textAnchor="middle"
                          fontSize={13 * unit}
                          fontWeight={700}
                          fill={isi || denah.foto ? 'var(--color-gading)' : 'var(--color-hijau)'}
                          stroke={denah.foto ? 'rgb(31 61 43 / 0.85)' : undefined}
                          strokeWidth={denah.foto ? 3 * unit : undefined}
                          paintOrder="stroke"
                          pointerEvents="none"
                        >
                          {d?.k.kode_bilik || b.shape_id}
                          {isi && (
                            <tspan x={b.label[0]} dy={14 * unit} fontSize={10.5 * unit} fontWeight={500} opacity={0.85}>
                              {d.k.jenis_ikan === 'Lele' ? 'L' : 'N'}
                              {d.h ? ` · ${d.h.sisaHari} hr` : ''}
                            </tspan>
                          )}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {(diperbesar || pilih) && (
              <button
                type="button"
                onClick={reset}
                className="absolute left-3 top-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-gading/95 px-3.5 text-xs font-semibold text-hijau shadow-angkat"
              >
                <Maximize2 className="size-3.5" aria-hidden /> Semua kolam
              </button>
            )}
            {diperbesar && (
              <div className={cn('absolute bottom-3 left-3 hidden w-24 overflow-hidden rounded-lg border-2 border-gading shadow-angkat sm:block', denah.foto ? 'bg-hijau' : 'bg-[#E9E1CF]')} style={{ aspectRatio: `${W} / ${H}` }} aria-hidden>
                <svg viewBox={`0 0 ${W} ${H}`} className="size-full">
                  {denah.foto && <image href={fotoUrl(fotoKolam, 480)} width={W} height={H} preserveAspectRatio="xMidYMid slice" opacity={0.85} />}
                  {denah.bilik.map((b) => (
                    <path key={b.shape_id} d={b.d} fill={warnaBilik(data[b.shape_id]?.k)} />
                  ))}
                  <rect x={-view.tx / view.s} y={-view.ty / view.s} width={W / view.s} height={H / view.s} fill="none" stroke="var(--color-emas)" strokeWidth={16} />
                </svg>
              </div>
            )}
            {!lebarLayar && (
              <button
                type="button"
                onClick={() => setDaftarBuka(true)}
                className="absolute bottom-3 right-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-hijau px-3.5 text-xs font-semibold text-gading shadow-angkat"
              >
                <List className="size-4" aria-hidden /> Daftar bilik ({daftarUrut.length})
              </button>
            )}
          </div>

          {/* legenda: warna + huruf/teks (tidak hanya warna) */}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-redup">
            <li className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: WARNA.Lele }} /> Lele (L)</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: WARNA.Nila }} /> Nila (N)</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded border border-redup/30" style={{ background: WARNA.Kosong }} /> Kosong / Persiapan</li>
            <li className="flex items-center gap-1.5"><span className="size-3 rounded border-2 border-emas" /> Panen ≤ 14 hari</li>
            {denah.otomatis && <li className="text-redup/80">· Denah sementara</li>}
          </ul>
        </div>

        {/* laptop: panel info + daftar di samping peta */}
        {lebarLayar && (
          <aside className="flex max-h-[34rem] flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {terpilih && (
                <m.div key={pilih} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="kartu p-4">
                  <InfoKolam data={terpilih} tutup={() => setPilih(null)} />
                </m.div>
              )}
            </AnimatePresence>
            <div className="kartu min-h-0 flex-1 overflow-y-auto">
              <p className="sticky top-0 border-b border-garis bg-gading px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-redup">
                Daftar bilik {cocok ? `· ${cocok.size} cocok` : ''}
              </p>
              {daftar}
            </div>
          </aside>
        )}
      </div>

      {!lebarLayar && (
        <>
          <Laci buka={daftarBuka} tutup={() => setDaftarBuka(false)} judul="Daftar bilik">
            <div className="-mx-5">{daftar}</div>
          </Laci>
          <Laci buka={!!terpilih} tutup={() => setPilih(null)} judul={terpilih ? namaBilik(terpilih.k) : ''}>
            {terpilih && <InfoKolam data={terpilih} />}
          </Laci>
        </>
      )}

      {/* ringkasan: proyeksi profit per bulan panen (6 bulan) */}
      <div className="kartu mt-6 p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-bagian">Proyeksi profit panen · 6 bulan</p>
            <p className="mt-1 font-judul text-3xl tabular-nums text-tinta">{rupiah(totalProfit)}</p>
            {!lengkap && <p className="mt-1 text-xs text-redup">Sebagian harga belum diisi; bulan bertanda belum lengkap.</p>}
          </div>
          <Lencana warna="emas">{Object.values(data).filter((x) => x.h?.segeraPanen).length} bilik panen ≤ 14 hari</Lencana>
        </div>
        <GrafikBatang
          data={proyeksi.map((b) => ({
            label: BULAN_PENDEK[b.tanggal.getMonth()],
            sub: `${b.kolam} bilik${b.lengkap ? '' : ' · harga belum lengkap'}`,
            nilai: { profit: b.profit }
          }))}
          seri={[{ kunci: 'profit', label: 'Profit', warna: 'var(--color-daun)' }]}
          format={rupiah}
          formatSumbu={rupiahRingkas}
          labelNilai
          judulAria="Proyeksi profit per bulan panen"
        />
      </div>
    </div>
  );
}
