import * as m from 'motion/react-m';
import { Fish, Wheat } from 'lucide-react';
import { rupiah } from '../../../lib/format.js';
import { bergiliran, muncul, saatTerlihat } from '../../../lib/motion.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';

const GRUP = [
  { kunci: 'Pertanian', label: 'Pertanian', ikon: Wheat },
  { kunci: 'Perikanan', label: 'Perikanan', ikon: Fish }
];

/** F-12 Harga & rencana penjualan komoditas pertanian dan perikanan. */
export function HargaKomoditas({ rows = [] }) {
  if (!rows.length) return <KotakPesan teks="Belum ada data harga." />;
  const siapkanPdf = () => ({
    judul: 'Harga & Rencana Penjualan',
    subjudul: 'Sektor Pertanian & Perikanan',
    tabel: GRUP.map((g) => ({
      judul: g.label,
      kepala: [['Komoditas', 'Harga', 'Satuan', 'Rencana jual', 'Periode']],
      badan: rows.filter((r) => r.sektor === g.kunci).map((r) => [r.komoditas, rupiah(r.harga), r.satuan || '–', r.rencana_jual || '–', r.periode || '–']),
      kolomKanan: [1]
    })),
    namaBerkas: 'harga-komoditas'
  });
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <TombolPdf label="Unduh PDF harga" siapkan={siapkanPdf} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {GRUP.map((g) => {
          const daftar = rows.filter((r) => r.sektor === g.kunci);
          return (
            <section key={g.kunci}>
              <h3 className="mb-3 flex items-center gap-2 font-isi text-sm font-semibold uppercase tracking-[0.08em] text-redup">
                <g.ikon className="size-4 text-emas-tua" aria-hidden /> {g.label}
              </h3>
              <m.ul variants={bergiliran()} {...saatTerlihat} className="kartu divide-y divide-garis">
                {daftar.map((r) => (
                  <m.li key={r.id} variants={muncul} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-tinta">{r.komoditas}</p>
                      <p className="text-xs text-redup">
                        {[r.rencana_jual, r.periode].filter(Boolean).join(' · ') || '–'}
                      </p>
                    </div>
                    <p className="text-right">
                      <span className="font-judul text-lg tabular-nums text-hijau">{rupiah(r.harga)}</span>
                      {r.satuan && <span className="block text-xs text-redup">/{r.satuan}</span>}
                    </p>
                  </m.li>
                ))}
                {!daftar.length && <li className="px-4 py-4 text-sm text-redup">Belum ada data.</li>}
              </m.ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
