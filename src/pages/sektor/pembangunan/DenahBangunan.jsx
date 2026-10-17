import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Building2, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { angka } from '../../../lib/format.js';
import { useLayarLebar } from '../../../hooks/useMedia.js';
import { useDebounce } from '../../../hooks/useThrottle.js';
import { PetaFoto } from '../../../components/peta/PetaFoto.jsx';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';
import { KATEGORI_BANGUNAN, LAINNYA, kategoriDari } from '../../../lib/bangunan.js';

const urutNomor = (a, b) => String(a.nomor).localeCompare(String(b.nomor), 'id', { numeric: true });
const luas = (b) => Number(b.luas_m2) || 0;

function BadgeNomor({ b, pilih }) {
  return (
    <span
      className={cn('inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1 text-[0.7rem] font-bold text-hijau ring-1', pilih ? 'ring-2 ring-emas' : 'ring-hijau/25')}
      style={{ background: kategoriDari(b).warna }}
    >
      {b.nomor}
    </span>
  );
}

/** Kartu bangunan terpilih. */
function InfoBangunan({ b, total, tutup }) {
  const k = kategoriDari(b);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-hijau ring-2 ring-emas" style={{ background: k.warna }}>
          {b.nomor}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-judul text-xl leading-tight text-tinta">{b.nama}</p>
          <p className="mt-0.5 text-xs text-redup">{k.nama}</p>
        </div>
        {tutup && (
          <button type="button" onClick={tutup} aria-label="Tutup info bangunan" className="-m-1 rounded-full p-2 text-redup hover:bg-hijau/5">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <div className="flex items-end justify-between rounded-xl bg-krem/80 px-3 py-2.5">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.06em] text-redup">Luas</p>
          <p className="font-judul text-2xl tabular-nums text-tinta">
            {angka(b.luas_m2)} <span className="text-base">m²</span>
          </p>
        </div>
        <p className="text-xs tabular-nums text-redup">{total ? angka((luas(b) / total) * 100, 1) : 0}% dari total</p>
      </div>
      {b.keterangan && <p className="text-sm text-redup">{b.keterangan}</p>}
    </div>
  );
}

/**
 * F-44 Denah bangunan: denah bernomor dengan pin berwarna per kategori, cari nama/nomor,
 * saring kategori, daftar berkelompok + subtotal luas, ketuk pin ↔ baris (peta memperbesar ke gedung).
 */
export function DenahBangunan({ rows = [], fotoDenah }) {
  const lebar = useLayarLebar();
  const [pilih, setPilih] = useState(null);
  const [kategori, setKategori] = useState(null);
  const [cari, setCari] = useState('');
  const [cariAktif, setCariAktif] = useState('');
  const [panel, setPanel] = useState(false);
  const tunda = useDebounce(setCariAktif, 200);

  const urut = useMemo(() => [...rows].sort(urutNomor), [rows]);
  const total = useMemo(() => rows.reduce((t, b) => t + luas(b), 0), [rows]);
  const cocok = useMemo(() => {
    const q = cariAktif.trim().toLowerCase();
    return urut.filter((b) => (!kategori || kategoriDari(b).nama === kategori) && (!q || String(b.nomor).toLowerCase() === q || String(b.nama).toLowerCase().includes(q)));
  }, [urut, kategori, cariAktif]);
  const idCocok = useMemo(() => new Set(cocok.map((b) => b.id)), [cocok]);
  const adaSaringan = !!kategori || !!cariAktif.trim();

  // ringkasan per kategori (jumlah & luas), urutan tetap
  const perKategori = useMemo(() => {
    const daftar = [...KATEGORI_BANGUNAN, LAINNYA].map((k) => {
      const isi = urut.filter((b) => kategoriDari(b).nama === k.nama);
      return { ...k, isi, luas: isi.reduce((t, b) => t + luas(b), 0) };
    });
    return daftar.filter((k) => k.isi.length);
  }, [urut]);
  const terluas = useMemo(() => urut.reduce((a, b) => (luas(b) > luas(a || {}) ? b : a), null), [urut]);

  const pin = useMemo(
    () => urut.map((b) => ({ id: b.id, x: b.x_persen, y: b.y_persen, label: b.nama, nomor: b.nomor, warna: kategoriDari(b).warna, redup: adaSaringan && !idCocok.has(b.id) })),
    [urut, adaSaringan, idCocok]
  );
  const terpilih = urut.find((b) => b.id === pilih) || null;
  const titikFokus = terpilih && terpilih.x_persen !== '' && terpilih.x_persen !== null && isFinite(Number(terpilih.x_persen)) ? [Number(terpilih.x_persen), Number(terpilih.y_persen)] : null;

  const pilihBangunan = (id) => {
    const baru = id === pilih ? null : id;
    setPilih(baru);
    if (baru) requestAnimationFrame(() => document.getElementById(`bangunan-${baru}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  const siapkanPdf = () => ({
    judul: 'Daftar Ukuran Bangunan',
    subjudul: 'Pondok Modern Gontor Kampus 3',
    ringkasan: [['Jumlah titik bangunan', String(rows.length)], ['Total luas tercatat', `${angka(total)} m²`]],
    tabel: perKategori.map((k) => ({
      judul: k.nama,
      kepala: [['No.', 'Nama bangunan', 'Luas (m²)', 'Keterangan']],
      badan: k.isi.map((b) => [String(b.nomor), b.nama, angka(b.luas_m2), b.keterangan || '']),
      kaki: ['', 'Subtotal', angka(k.luas), ''],
      kolomKanan: [2]
    })),
    namaBerkas: 'daftar-bangunan'
  });

  const daftar = (
    <div>
      {perKategori.map((k) => {
        const isi = k.isi.filter((b) => idCocok.has(b.id));
        if (!isi.length) return null;
        return (
          <section key={k.nama} aria-label={k.nama}>
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-garis bg-gading/95 px-3 py-2 text-xs backdrop-blur">
              <span className="size-2.5 shrink-0 rounded-full ring-1 ring-hijau/25" style={{ background: k.warna }} />
              <span className="flex-1 font-semibold uppercase tracking-[0.06em] text-redup">{k.nama}</span>
              <span className="tabular-nums text-redup">
                {isi.length} · {angka(isi.reduce((t, b) => t + luas(b), 0))} m²
              </span>
            </div>
            <ul role="list">
              {isi.map((b) => (
                <li key={b.id} id={`bangunan-${b.id}`}>
                  <button
                    type="button"
                    onClick={() => pilihBangunan(b.id)}
                    aria-pressed={b.id === pilih}
                    className={cn('flex min-h-11 w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors', b.id === pilih ? 'bg-emas/20' : 'hover:bg-hijau/5')}
                  >
                    <BadgeNomor b={b} pilih={b.id === pilih} />
                    <span className="min-w-0 flex-1 truncate text-sm text-tinta">{b.nama}</span>
                    <span className="shrink-0 text-xs tabular-nums text-redup">{angka(b.luas_m2)} m²</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {!cocok.length && <p className="px-3 py-6 text-center text-sm text-redup">Tidak ada bangunan yang cocok.</p>}
    </div>
  );

  const kakiTotal = (
    <div className="flex items-baseline justify-between border-t-2 border-emas/50 bg-krem/70 px-3 py-2.5 text-sm">
      <span className="font-semibold">{adaSaringan ? `${cocok.length} bangunan tersaring` : 'Total luas'}</span>
      <span className="font-semibold tabular-nums">{angka(cocok.reduce((t, b) => t + luas(b), 0))} m²</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ringkasan */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="kartu p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-redup">Titik bangunan</p>
          <p className="mt-2 font-judul text-3xl tabular-nums">{rows.length}</p>
          <p className="mt-1 text-xs text-redup">{perKategori.length} kategori</p>
        </div>
        <div className="kartu p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-redup">Total luas tercatat</p>
          <p className="mt-2 font-judul text-3xl tabular-nums">{angka(total)}</p>
          <p className="mt-1 text-xs text-redup">m² · {angka(total / 10000, 2)} ha</p>
        </div>
        <div className="kartu col-span-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-redup">Luas per kategori</p>
          <div className="mt-3 flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
            {perKategori.map((k) => (
              <button
                key={k.nama}
                type="button"
                title={`${k.nama}: ${angka(k.luas)} m²`}
                aria-label={`Saring ${k.nama}`}
                onClick={() => setKategori(kategori === k.nama ? null : k.nama)}
                className={cn('h-full transition-opacity first:rounded-l-full last:rounded-r-full', kategori && kategori !== k.nama && 'opacity-30')}
                style={{ width: `${total ? (k.luas / total) * 100 : 0}%`, background: k.warna }}
              />
            ))}
          </div>
          {terluas && (
            <p className="mt-2.5 text-xs text-redup">
              Terluas: <b className="font-semibold text-tinta">{terluas.nomor}. {terluas.nama}</b> · {angka(terluas.luas_m2)} m²
            </p>
          )}
        </div>
      </div>

      {/* saring: cari + chip kategori */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <label className="relative w-full lg:max-w-xs">
          <span className="sr-only">Cari nama atau nomor bangunan</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-redup" aria-hidden />
          <input
            value={cari}
            onChange={(e) => {
              setCari(e.target.value);
              tunda(e.target.value);
            }}
            placeholder="Cari gedung atau nomor, mis. Masjid / 23"
            className="min-h-11 w-full rounded-full border border-garis bg-gading pl-10 pr-4 text-sm focus:border-hijau focus:outline-none focus:ring-4 focus:ring-hijau/10"
          />
        </label>
        <div className="tanpa-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
          <button
            type="button"
            aria-pressed={!kategori}
            onClick={() => setKategori(null)}
            className={cn('min-h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors', !kategori ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-hijau hover:border-emas')}
          >
            Semua ({rows.length})
          </button>
          {perKategori.map((k) => (
            <button
              key={k.nama}
              type="button"
              aria-pressed={kategori === k.nama}
              onClick={() => setKategori(kategori === k.nama ? null : k.nama)}
              className={cn(
                'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
                kategori === k.nama ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-tinta hover:border-emas'
              )}
            >
              <span className="size-2.5 rounded-full ring-1 ring-hijau/25" style={{ background: k.warna }} />
              {k.nama} <span className={kategori === k.nama ? 'text-gading/70' : 'text-redup'}>({k.isi.length})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <PetaFoto
            foto={fotoDenah}
            pin={pin}
            pinTerpilih={pilih}
            onPin={(p) => pilihBangunan(p.id)}
            fokusTitik={titikFokus}
            zoomBebas
            tinggiMaks="74svh"
            labelSemua="Seluruh denah"
            ariaLabel="Denah bangunan pondok bernomor"
          >
            {/* HP: info bangunan melayang di bawah peta */}
            {!lebar && (
              <AnimatePresence>
                {terpilih && (
                  <m.div
                    key={terpilih.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute inset-x-3 bottom-3 rounded-2xl bg-gading/97 p-3.5 shadow-modal"
                    role="status"
                  >
                    <InfoBangunan b={terpilih} total={total} tutup={() => setPilih(null)} />
                  </m.div>
                )}
              </AnimatePresence>
            )}
          </PetaFoto>
          <p className="mt-2.5 text-center text-xs text-redup">Ketuk nomor di denah atau nama di daftar · cubit / tombol + untuk memperbesar</p>
        </div>

        {lebar ? (
          <aside className="flex min-w-0 flex-col gap-3 lg:max-h-[74svh]">
            <AnimatePresence mode="popLayout" initial={false}>
              {terpilih && (
                <m.div key={terpilih.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="kartu p-4">
                  <InfoBangunan b={terpilih} total={total} tutup={() => setPilih(null)} />
                </m.div>
              )}
            </AnimatePresence>
            <div className="kartu flex max-h-[34rem] min-h-0 flex-1 flex-col overflow-hidden lg:max-h-none">
              <div className="flex items-center justify-between border-b border-garis px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-redup">
                  <Building2 className="size-3.5" aria-hidden /> Daftar bangunan
                </p>
                <TombolPdf label="Unduh PDF daftar bangunan" siapkan={siapkanPdf} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{daftar}</div>
              {kakiTotal}
            </div>
          </aside>
        ) : (
          <div className="kartu overflow-hidden">
            <button type="button" onClick={() => setPanel(!panel)} aria-expanded={panel} className="flex min-h-12 w-full items-center gap-2 px-4 text-sm font-semibold text-hijau">
              <Building2 className="size-4" aria-hidden />
              Daftar bangunan ({cocok.length}) · {angka(cocok.reduce((t, b) => t + luas(b), 0))} m²
              <ChevronDown className={cn('ml-auto size-4 transition-transform', panel && 'rotate-180')} aria-hidden />
            </button>
            {panel && (
              <>
                <div className="max-h-96 overflow-y-auto border-t border-garis">{daftar}</div>
                {kakiTotal}
                <div className="flex justify-end border-t border-garis p-2">
                  <TombolPdf label="Unduh PDF daftar bangunan" siapkan={siapkanPdf} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
