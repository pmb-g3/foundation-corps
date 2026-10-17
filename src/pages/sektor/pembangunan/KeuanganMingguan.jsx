import { Fragment, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { CalendarCheck, ChevronDown, Construction, Hammer, Info } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { BULAN_PENDEK, NAMA_BULAN, rupiah, rupiahRingkas, tanggal } from '../../../lib/format.js';
import { infoMinggu, kamisMulai, mingguSejak, statusMinggu } from '../../../lib/mingguan.js';
import { GrafikGaris } from '../../../components/chart/GrafikGaris.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Lencana } from '../../../components/ui/Lencana.jsx';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';

const KELOMPOK = [
  { kunci: 'TambalSulam', judul: 'Tambal Sulam', ikon: Hammer, warna: 'var(--color-kayu)', patokan: 'tambal_mulai' },
  { kunci: 'Proyek', judul: 'Proyek', ikon: Construction, warna: 'var(--color-batu)', patokan: 'proyek_mulai' }
];
const namaBulan = (b) => `${NAMA_BULAN[Number(b.slice(5, 7)) - 1]}`;
const jumlah = (list) => list.reduce((t, r) => t + (Number(r.nominal) || 0), 0);

/** Satu kelompok (Tambal Sulam / Proyek): grafik mingguan M-1…M-n di atas, tabel per minggu di bawah. */
function Kelompok({ k, rows, patokan, hariIni }) {
  const [semua, setSemua] = useState(false);
  const [buka, setBuka] = useState(null);
  const Ikon = k.ikon;

  const { minggu, sebelum, adaMasuk } = useMemo(() => {
    const milik = rows.filter((r) => r.kategori === k.kunci && r.tanggal);
    const awal = patokan || (milik.length ? milik.map((r) => r.tanggal).sort()[0] : hariIni);
    const mulai = kamisMulai(awal);
    const akhir = [hariIni, ...milik.map((r) => r.tanggal)].sort().pop();
    const daftar = mingguSejak(mulai, akhir).map((w) => {
      const isi = milik.filter((r) => r.tanggal >= w.mulai && r.tanggal <= w.selesai).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
      return {
        ...w,
        isi,
        keluar: jumlah(isi.filter((r) => r.jenis === 'Keluar')),
        masuk: jumlah(isi.filter((r) => r.jenis === 'Masuk')),
        status: statusMinggu(w, hariIni)
      };
    });
    return { minggu: daftar, sebelum: milik.filter((r) => r.tanggal < mulai).length, adaMasuk: milik.some((r) => r.jenis === 'Masuk') };
  }, [rows, k.kunci, patokan, hariIni]);

  const total = minggu.reduce((t, w) => t + w.keluar, 0);
  const tertutup = minggu.filter((w) => w.status === 'tutup');
  const rata = tertutup.length ? jumlah(tertutup.map((w) => ({ nominal: w.keluar }))) / tertutup.length : 0;
  const kini = minggu.find((w) => w.status === 'berjalan');
  const maks = minggu.reduce((a, w) => (!a || w.keluar > a.keluar ? w : a), null);
  const urutBaru = [...minggu].reverse();
  const tampil = semua ? urutBaru : urutBaru.slice(0, 8);

  const dataGrafik = minggu.map((w) => ({
    label: `M${w.n}`,
    // minggu berjalan yang belum ada transaksinya tidak digambar (agar garis tidak jatuh ke 0)
    nilai: w.status === 'berjalan' && !w.keluar ? null : w.keluar,
    detail: (
      <p className="text-gading/80">
        {tanggal(w.mulai, 'hariBulan')} – {tanggal(w.selesai, 'hariBulan')} · {namaBulan(w.bulan)} minggu ke-{w.ke}
      </p>
    )
  }));

  const siapkanPdf = () => ({
    judul: `Keuangan Mingguan — ${k.judul}`,
    subjudul: `Sektor Pembangunan · minggu ke-1 mulai ${tanggal(minggu[0]?.mulai || hariIni)} · tutup buku setiap Rabu`,
    ringkasan: [['Total', rupiah(total)], ['Jumlah minggu', String(minggu.length)], ['Rata-rata/minggu (tutup buku)', rupiah(rata)]],
    tabel: [
      {
        kepala: [['Minggu', 'Bulan', 'Mulai (Kamis)', 'Selesai (Rabu)', ...(adaMasuk ? ['Masuk'] : []), 'Nominal']],
        badan: minggu.map((w) => [
          `M-${w.n}`,
          `${namaBulan(w.bulan)} ke-${w.ke} dari ${w.dari}`,
          tanggal(w.mulai, 'pendek'),
          tanggal(w.selesai, 'pendek'),
          ...(adaMasuk ? [rupiah(w.masuk)] : []),
          rupiah(w.keluar)
        ]),
        kaki: ['Total', '', '', '', ...(adaMasuk ? [rupiah(minggu.reduce((t, w) => t + w.masuk, 0))] : []), rupiah(total)],
        kolomKanan: adaMasuk ? [4, 5] : [4]
      }
    ],
    namaBerkas: `keuangan-mingguan-${k.kunci.toLowerCase()}`
  });

  return (
    <section className="kartu overflow-hidden" aria-label={`Keuangan mingguan ${k.judul}`}>
      {/* kepala berwarna */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 text-gading md:px-6" style={{ background: k.warna }}>
        <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
          <Ikon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-isi text-base font-bold uppercase tracking-[0.08em]">{k.judul}</h3>
          <p className="text-xs text-gading/80">
            Minggu ke-1 mulai {minggu[0] ? tanggal(minggu[0].mulai) : '–'}
            {!patokan && ' (otomatis dari transaksi pertama)'}
          </p>
        </div>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tabular-nums">{minggu.length} minggu</span>
        <TombolPdf gelap label={`Unduh PDF keuangan ${k.judul}`} siapkan={siapkanPdf} />
      </div>

      {/* ringkasan */}
      <dl className="grid grid-cols-2 divide-garis border-b border-garis md:grid-cols-4 md:divide-x">
        {[
          ['Total keuangan', rupiah(total), rupiahRingkas(total)],
          ['Rata-rata / minggu', rupiah(rata), rupiahRingkas(rata)],
          ['Minggu berjalan', kini ? `M-${kini.n} · ${rupiah(kini.keluar)}` : '–', kini ? `M-${kini.n} · ${rupiahRingkas(kini.keluar)}` : '–'],
          ['Tertinggi', maks && maks.keluar ? `M-${maks.n} · ${rupiah(maks.keluar)}` : '–', maks && maks.keluar ? `M-${maks.n} · ${rupiahRingkas(maks.keluar)}` : '–']
        ].map(([l, v, ringkas]) => (
          <div key={l} className="border-b border-garis px-5 py-3.5 md:border-b-0 md:px-6">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-redup">{l}</dt>
            <dd className="mt-1 font-judul text-lg tabular-nums text-tinta">
              <span className="lg:hidden">{ringkas}</span>
              <span className="hidden lg:inline">{v}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* grafik mingguan */}
      <div className="px-5 pb-2 pt-5 md:px-6">
        {minggu.some((w) => w.keluar) ? (
          <GrafikGaris data={dataGrafik} format={rupiah} formatSumbu={rupiahRingkas} warna={k.warna} judulAria={`Grafik keuangan mingguan ${k.judul}`} />
        ) : (
          <KotakPesan teks={`Belum ada catatan keuangan ${k.judul}.`} />
        )}
      </div>

      {/* tabel per minggu */}
      <div className="overflow-x-auto border-t border-garis">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="bg-krem/70 text-left text-[0.7rem] uppercase tracking-[0.08em] text-redup">
            <tr>
              <th className="px-5 py-2.5 font-semibold md:px-6">Minggu</th>
              <th className="px-3 py-2.5 font-semibold">Mulai</th>
              <th className="px-3 py-2.5 font-semibold">Selesai</th>
              {adaMasuk && <th className="px-3 py-2.5 text-right font-semibold">Masuk</th>}
              <th className="px-3 py-2.5 text-right font-semibold">Nominal</th>
              <th className="w-10 px-3 py-2.5" aria-label="Rincian" />
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {tampil.map((w) => {
              const terbuka = buka === w.n;
              return (
                <Fragment key={w.n}>
                  <tr
                    className={cn('cursor-pointer transition-colors hover:bg-hijau/[0.03]', w.status === 'berjalan' && 'bg-emas/10', terbuka && 'bg-hijau/[0.04]')}
                    onClick={() => setBuka(terbuka ? null : w.n)}
                  >
                    <td className="px-5 py-3 md:px-6">
                      <p className="font-semibold text-tinta">M-{w.n}</p>
                      <p className="text-[0.7rem] text-redup">
                        {BULAN_PENDEK[Number(w.bulan.slice(5, 7)) - 1]} · minggu ke-{w.ke} dari {w.dari}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-redup">{tanggal(w.mulai, 'pendek')}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="text-redup">{tanggal(w.selesai, 'pendek')}</span>
                      {w.status === 'berjalan' && (
                        <Lencana warna="emas" className="ml-2">
                          Berjalan
                        </Lencana>
                      )}
                    </td>
                    {adaMasuk && <td className="px-3 py-3 text-right tabular-nums text-hijau">{w.masuk ? rupiah(w.masuk) : '–'}</td>}
                    <td className="px-3 py-3 text-right font-semibold tabular-nums" style={{ color: w.keluar ? k.warna : undefined }}>
                      {w.keluar ? rupiah(w.keluar) : <span className="font-normal text-redup">–</span>}
                    </td>
                    <td className="px-3 py-3 text-redup">
                      <button type="button" aria-expanded={terbuka} aria-label={`Rincian M-${w.n}`} className="rounded-full p-1 hover:bg-hijau/5">
                        <ChevronDown className={cn('size-4 transition-transform', terbuka && 'rotate-180')} aria-hidden />
                      </button>
                    </td>
                  </tr>
                  <AnimatePresence initial={false}>
                    {terbuka && (
                      <tr>
                        <td colSpan={adaMasuk ? 6 : 5} className="bg-krem/50 p-0">
                          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            {w.isi.length ? (
                              <ul className="divide-y divide-garis/70 px-5 py-2 md:px-6">
                                {w.isi.map((r) => (
                                  <li key={r.id} className="flex items-center gap-3 py-1.5 text-xs">
                                    <span className="w-16 shrink-0 text-redup">{tanggal(r.tanggal, 'hariBulan')}</span>
                                    <span className="flex-1">{r.uraian || '–'}</span>
                                    <span className={cn('tabular-nums', r.jenis === 'Masuk' ? 'text-hijau' : 'text-bata')}>
                                      {r.jenis === 'Masuk' ? '+' : '−'}
                                      {rupiah(r.nominal)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="px-5 py-3 text-xs text-redup md:px-6">Tidak ada transaksi minggu ini.</p>
                            )}
                          </m.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-emas/50 bg-krem/60 font-semibold">
              <td className="px-5 py-3 md:px-6" colSpan={3}>
                Total {minggu.length} minggu
              </td>
              {adaMasuk && <td className="px-3 py-3 text-right tabular-nums text-hijau">{rupiah(minggu.reduce((t, w) => t + w.masuk, 0))}</td>}
              <td className="px-3 py-3 text-right tabular-nums">{rupiah(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {(minggu.length > 8 || sebelum > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-garis px-5 py-3 md:px-6">
          {sebelum > 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-redup">
              <Info className="size-3.5" aria-hidden /> {sebelum} transaksi sebelum minggu ke-1 tidak dihitung.
            </p>
          ) : (
            <span />
          )}
          {minggu.length > 8 && (
            <Button varian="hantu" ukuran="sm" onClick={() => setSemua(!semua)}>
              {semua ? 'Ringkas' : `Tampilkan semua (${minggu.length} minggu)`}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * F-45 Keuangan Pembangunan: Tambal Sulam lalu Proyek, masing-masing punya minggu ke-1 sendiri
 * (Pengaturan keuangan_pembangunan, diatur di panel admin). Tutup buku setiap Rabu.
 */
export function KeuanganMingguan({ rows = [], patokan = {}, hariIni }) {
  const kini = infoMinggu(hariIni);
  const tanpaKategori = rows.filter((r) => !r.kategori).length;
  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-gading px-4 py-3 text-sm text-redup ring-1 ring-garis">
        <CalendarCheck className="size-4 text-emas-tua" aria-hidden />
        <span>
          Tutup buku setiap <b className="font-semibold text-tinta">Rabu</b> · satu minggu = Kamis–Rabu.
        </span>
        <span>
          Minggu ini: <b className="font-semibold text-tinta">{namaBulan(kini.bulan)} minggu ke-{kini.ke} dari {kini.dari}</b> ({tanggal(kini.mulai, 'hariBulan')} – {tanggal(kini.selesai, 'hariBulan')})
        </span>
      </p>
      {KELOMPOK.map((k) => (
        <Kelompok key={k.kunci} k={k} rows={rows} patokan={patokan?.[k.patokan] || ''} hariIni={hariIni} />
      ))}
      {tanpaKategori > 0 && (
        <p className="text-xs text-redup">{tanpaKategori} transaksi Pembangunan belum diberi kategori Tambal Sulam / Proyek — lengkapi di Kelola Data → Keuangan.</p>
      )}
    </div>
  );
}
