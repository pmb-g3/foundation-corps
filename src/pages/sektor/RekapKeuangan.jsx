import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { NAMA_BULAN, BULAN_PENDEK, rupiah, rupiahRingkas, tanggal, hariIniWib } from '../../lib/format.js';
import { Segmen } from '../../components/ui/Segmen.jsx';
import { Select } from '../../components/ui/Isian.jsx';
import { GrafikBatang } from '../../components/chart/GrafikBatang.jsx';
import { KotakPesan } from '../../components/ui/Kerangka.jsx';
import { TombolPdf } from '../../components/layout/TombolPdf.jsx';
import { Button } from '../../components/ui/Button.jsx';

const nama = (kunci) => `${NAMA_BULAN[Number(kunci.slice(5, 7)) - 1]} ${kunci.slice(0, 4)}`;
const pendek = (kunci) => `${BULAN_PENDEK[Number(kunci.slice(5, 7)) - 1]} ${kunci.slice(2, 4)}`;

function enamBulanTerakhir(akhir) {
  const [y, mm] = akhir.split('-').map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(y, mm - 1 - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

/**
 * Rekap keuangan sektor — F-13 (Pertanian), F-34 (Kendaraan), F-45 (Pembangunan).
 * Tab Mingguan/Bulanan, grafik pemasukan vs pengeluaran, saldo, tabel rincian, unduh PDF.
 * pisahKategori (F-45): pengeluaran dipisah Tambal Sulam dan Proyek per minggu ke-berapa.
 */
export function RekapKeuangan({ rows = [], sektorLabel, pisahKategori = false }) {
  const hariIni = hariIniWib();
  const [mode, setMode] = useState('mingguan');
  const bulanAda = useMemo(() => {
    const s = new Set(rows.map((r) => r.bulan || String(r.tanggal).slice(0, 7)).filter(Boolean));
    s.add(hariIni.slice(0, 7));
    return [...s].sort().reverse();
  }, [rows, hariIni]);
  const [bulan, setBulan] = useState(bulanAda[0]);
  const [semua, setSemua] = useState(false);

  const bulanBaris = (r) => r.bulan || String(r.tanggal).slice(0, 7);
  const enam = enamBulanTerakhir(hariIni.slice(0, 7));
  const periode = mode === 'mingguan' ? rows.filter((r) => bulanBaris(r) === bulan) : rows.filter((r) => enam.includes(bulanBaris(r)));

  const jumlah = (list, f) => list.filter(f).reduce((t, r) => t + (Number(r.nominal) || 0), 0);
  const masuk = jumlah(periode, (r) => r.jenis === 'Masuk');
  const keluar = jumlah(periode, (r) => r.jenis === 'Keluar');
  const saldo = masuk - keluar;

  const seri = pisahKategori
    ? [
        { kunci: 'tambal', label: 'Tambal Sulam', warna: 'var(--color-kayu)' },
        { kunci: 'proyek', label: 'Proyek', warna: 'var(--color-batu)', tekstur: true }
      ]
    : [
        { kunci: 'masuk', label: 'Pemasukan', warna: 'var(--color-daun)' },
        { kunci: 'keluar', label: 'Pengeluaran', warna: 'var(--color-bata)', tekstur: true }
      ];

  const nilaiDari = (list) =>
    pisahKategori
      ? {
          tambal: jumlah(list, (r) => r.jenis === 'Keluar' && r.kategori === 'TambalSulam'),
          proyek: jumlah(list, (r) => r.jenis === 'Keluar' && r.kategori === 'Proyek')
        }
      : { masuk: jumlah(list, (r) => r.jenis === 'Masuk'), keluar: jumlah(list, (r) => r.jenis === 'Keluar') };

  const dataGrafik =
    mode === 'mingguan'
      ? [1, 2, 3, 4, 5].map((w) => ({
          label: `M${w}`,
          sub: `Minggu ke-${w} · ${nama(bulan)}`,
          nilai: nilaiDari(periode.filter((r) => Number(r.minggu_ke || Math.ceil(Number(String(r.tanggal).slice(8, 10)) / 7)) === w))
        }))
      : enam.map((b) => ({ label: pendek(b), sub: nama(b), nilai: nilaiDari(rows.filter((r) => bulanBaris(r) === b)) }));

  const rincian = [...periode].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  const tampil = semua ? rincian : rincian.slice(0, 12);
  const namaKat = (k) => (k === 'TambalSulam' ? 'Tambal Sulam' : k || '–');

  const siapkanPdf = () => ({
    judul: `Rekap Keuangan — ${sektorLabel}`,
    subjudul: mode === 'mingguan' ? `Mingguan · ${nama(bulan)}` : `Bulanan · ${nama(enam[0])} – ${nama(enam[5])}`,
    ringkasan: [
      ['Pemasukan', rupiah(masuk)],
      ['Pengeluaran', rupiah(keluar)],
      ['Saldo', rupiah(saldo)],
      ...(pisahKategori ? [['Tambal Sulam', rupiah(nilaiDari(periode).tambal)], ['Proyek', rupiah(nilaiDari(periode).proyek)]] : [])
    ],
    tabel: [
      {
        judul: mode === 'mingguan' ? 'Per minggu' : 'Per bulan',
        kepala: [['Periode', ...seri.map((s) => s.label)]],
        badan: dataGrafik.map((d) => [d.sub, ...seri.map((s) => rupiah(d.nilai[s.kunci]))]),
        kaki: ['Total', ...seri.map((s) => rupiah(dataGrafik.reduce((t, d) => t + d.nilai[s.kunci], 0)))],
        kolomKanan: seri.map((_, i) => i + 1)
      },
      {
        judul: 'Rincian',
        kepala: [['Tanggal', 'Uraian', ...(pisahKategori ? ['Kategori'] : []), 'Masuk', 'Keluar']],
        badan: rincian.map((r) => [
          tanggal(r.tanggal, 'pendek'),
          r.uraian || '–',
          ...(pisahKategori ? [namaKat(r.kategori)] : []),
          r.jenis === 'Masuk' ? rupiah(r.nominal) : '',
          r.jenis === 'Keluar' ? rupiah(r.nominal) : ''
        ]),
        kaki: ['Total', '', ...(pisahKategori ? [''] : []), rupiah(masuk), rupiah(keluar)],
        kolomKanan: pisahKategori ? [3, 4] : [2, 3]
      }
    ],
    namaBerkas: `rekap-${sektorLabel.toLowerCase().replace(/[^a-z]+/g, '-')}-${mode === 'mingguan' ? bulan : hariIni.slice(0, 7)}`
  });

  return (
    <div className="kartu overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-garis px-5 py-4 md:px-6">
        <Segmen
          pilihan={[
            { nilai: 'mingguan', label: 'Mingguan' },
            { nilai: 'bulanan', label: 'Bulanan' }
          ]}
          nilai={mode}
          ubah={setMode}
          idTata={`rekap-${sektorLabel}`}
          label="Periode rekap"
        />
        {mode === 'mingguan' && (
          <Select value={bulan} onChange={(e) => setBulan(e.target.value)} aria-label="Pilih bulan" className="w-44">
            {bulanAda.map((b) => (
              <option key={b} value={b}>
                {nama(b)}
              </option>
            ))}
          </Select>
        )}
        <div className="ml-auto">
          <TombolPdf label="Unduh PDF rekap" siapkan={siapkanPdf} />
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-garis border-b border-garis">
        {[
          ['Pemasukan', masuk, 'text-hijau'],
          ['Pengeluaran', keluar, 'text-bata'],
          ['Saldo', saldo, saldo < 0 ? 'text-bata' : 'text-tinta']
        ].map(([l, v, w]) => (
          <div key={l} className="px-4 py-4 md:px-6">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-redup">{l}</dt>
            <dd className={cn('mt-1 font-judul text-lg tabular-nums md:text-2xl', w)}>
              <span className="md:hidden">{rupiahRingkas(v)}</span>
              <span className="hidden md:inline">{rupiah(v)}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="px-5 py-5 md:px-6">
        {rows.length ? (
          <GrafikBatang data={dataGrafik} seri={seri} format={rupiah} formatSumbu={rupiahRingkas} judulAria={`Rekap keuangan ${sektorLabel}`} />
        ) : (
          <KotakPesan teks="Belum ada catatan keuangan." />
        )}
      </div>

      {rincian.length > 0 && (
        <div className="border-t border-garis">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-krem/70 text-left text-xs uppercase tracking-[0.06em] text-redup">
                <tr>
                  <th className="px-5 py-2.5 font-semibold md:px-6">Tanggal</th>
                  <th className="px-3 py-2.5 font-semibold">Uraian</th>
                  {pisahKategori && <th className="px-3 py-2.5 font-semibold">Kategori</th>}
                  <th className="px-3 py-2.5 text-right font-semibold">Masuk</th>
                  <th className="px-5 py-2.5 text-right font-semibold md:px-6">Keluar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-garis">
                {tampil.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-redup md:px-6">{tanggal(r.tanggal, 'hariBulan')}</td>
                    <td className="px-3 py-2.5">{r.uraian || '–'}</td>
                    {pisahKategori && <td className="px-3 py-2.5 text-redup">{namaKat(r.kategori)}</td>}
                    <td className="px-3 py-2.5 text-right tabular-nums text-hijau">{r.jenis === 'Masuk' ? rupiah(r.nominal) : ''}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-bata md:px-6">{r.jenis === 'Keluar' ? rupiah(r.nominal) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rincian.length > 12 && (
            <div className="border-t border-garis px-5 py-3 text-center">
              <Button varian="hantu" ukuran="sm" onClick={() => setSemua(!semua)}>
                {semua ? 'Ringkas' : `Tampilkan semua (${rincian.length})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
