import { useMemo, useState } from 'react';
import { Zap } from 'lucide-react';
import { BULAN_PENDEK, NAMA_BULAN, angka, rupiah, rupiahRingkas } from '../../../lib/format.js';
import { Select } from '../../../components/ui/Isian.jsx';
import { GrafikGaris } from '../../../components/chart/GrafikGaris.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';

/** F-43 Grafik tagihan listrik bulanan; bulan tertinggi ditandai beserta alasan kenaikannya. */
export function GrafikListrik({ rows = [] }) {
  const tahunAda = useMemo(() => [...new Set(rows.map((r) => Number(r.tahun)).filter(Boolean))].sort((a, b) => b - a), [rows]);
  const [tahun, setTahun] = useState(tahunAda[0]);
  if (!rows.length) return <KotakPesan teks="Belum ada data tagihan listrik." />;

  const baris = rows.filter((r) => Number(r.tahun) === Number(tahun));
  const perBulan = Array.from({ length: 12 }, (_, i) => baris.find((r) => Number(r.bulan) === i + 1) || null);
  const terisi = perBulan.filter(Boolean);
  const total = terisi.reduce((t, r) => t + (Number(r.nominal) || 0), 0);
  const kwh = terisi.reduce((t, r) => t + (Number(r.kwh) || 0), 0);
  const maks = terisi.reduce((a, r) => (!a || Number(r.nominal) > Number(a.nominal) ? r : a), null);

  const data = perBulan.map((r, i) => ({
    label: BULAN_PENDEK[i],
    nilai: r ? Number(r.nominal) : null,
    detail: r ? (
      <>
        <p className="tabular-nums text-gading/80">{angka(r.kwh)} kWh</p>
        {r.alasan_naik && <p className="mt-1 text-emas">{r.alasan_naik}</p>}
      </>
    ) : null
  }));

  const siapkanPdf = () => ({
    judul: `Tagihan Listrik ${tahun}`,
    subjudul: 'Sektor Pembangunan',
    ringkasan: [['Total', rupiah(total)], ['Rata-rata/bulan', rupiah(terisi.length ? total / terisi.length : 0)], ['Total kWh', angka(kwh)]],
    tabel: [
      {
        kepala: [['Bulan', 'Nominal', 'kWh', 'Alasan naik']],
        badan: terisi.map((r) => [NAMA_BULAN[r.bulan - 1], rupiah(r.nominal), angka(r.kwh), r.alasan_naik || '']),
        kaki: ['Total', rupiah(total), angka(kwh), ''],
        kolomKanan: [1, 2]
      }
    ],
    namaBerkas: `tagihan-listrik-${tahun}`
  });

  return (
    <div className="kartu p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} aria-label="Pilih tahun" className="w-32">
          {tahunAda.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <dl className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <dt className="text-xs text-redup">Total {tahun}</dt>
            <dd className="font-judul text-xl tabular-nums">{rupiah(total)}</dd>
          </div>
          <div>
            <dt className="text-xs text-redup">Rata-rata</dt>
            <dd className="font-judul text-xl tabular-nums">{rupiahRingkas(terisi.length ? total / terisi.length : 0)}</dd>
          </div>
        </dl>
        <TombolPdf label="Unduh PDF tagihan listrik" siapkan={siapkanPdf} />
      </div>
      <GrafikGaris data={data} format={rupiah} formatSumbu={rupiahRingkas} warna="var(--color-daun)" judulAria={`Tagihan listrik bulanan ${tahun}`} />
      {maks && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-bata/8 px-3 py-2.5 text-sm text-tinta">
          <Zap className="mt-0.5 size-4 shrink-0 text-bata" aria-hidden />
          <span>
            <b className="font-semibold">Tertinggi: {NAMA_BULAN[maks.bulan - 1]}</b> · {rupiah(maks.nominal)}
            {maks.alasan_naik ? ` — ${maks.alasan_naik}` : ''}
          </span>
        </p>
      )}
    </div>
  );
}
