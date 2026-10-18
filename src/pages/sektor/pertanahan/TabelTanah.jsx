import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, Landmark, Ruler, Search, Wallet, X } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { angka, luasHa, rupiah, rupiahRingkas, tanggal } from '../../../lib/format.js';
import { olahTanah, ringkasTanah, WARNA_STATUS_DOKUMEN } from '../../../lib/tanah.js';
import { bergiliran, muncul, saatTerlihat } from '../../../lib/motion.jsx';
import { useDebounce } from '../../../hooks/useThrottle.js';
import { useLayarLebar } from '../../../hooks/useMedia.js';
import { Select } from '../../../components/ui/Isian.jsx';
import { Lencana } from '../../../components/ui/Lencana.jsx';
import { Laci } from '../../../components/ui/Dialog.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { KotakStat, BilahProporsi } from '../../../components/chart/Angka.jsx';
import { PetaFoto } from '../../../components/peta/PetaFoto.jsx';
import { bacaPoligon } from '../../../components/peta/petaLib.js';
import { kelompokLokasi, labelZona, lokasiDari } from '../../../lib/lokasiTanah.js';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';

// Kelompok kolom (F-21). Kolom bertanda * dihitung otomatis.
const KOLOM = [
  { grup: 'Identitas', kunci: 'no', label: 'No', angka: true, lebar: 'w-12' },
  { grup: 'Identitas', kunci: 'nama_pemegang_hak', label: 'Nama Pemegang Hak', urut: true, lebar: 'min-w-[12rem]' },
  { grup: 'Identitas', kunci: 'letak_tanah', label: 'Letak Tanah', urut: true },
  { grup: 'Identitas', kunci: 'zona', label: 'Zona', urut: true },
  { grup: 'Dokumen', kunci: 'kelas_persil', label: 'Kelas/Persil' },
  { grup: 'Dokumen', kunci: 'no_petok', label: 'No. Petok' },
  { grup: 'Dokumen', kunci: 'no_shm', label: 'No. SHM' },
  { grup: 'Dokumen', kunci: 'no_blok_nop', label: 'No. Blok/NOP' },
  { grup: 'Dokumen', kunci: 'status', label: 'Status', urut: true },
  { grup: 'Luas & Nilai', kunci: 'luas_m2', label: 'Luas (m²)', angka: true, urut: true },
  { grup: 'Luas & Nilai', kunci: 'luas_ru', label: 'Luas (ru)*', angka: true, urut: true },
  { grup: 'Luas & Nilai', kunci: 'harga_rp_per_ru', label: 'Harga (Rp/ru)', angka: true, urut: true },
  { grup: 'Luas & Nilai', kunci: 'nilai_perolehan', label: 'Nilai Perolehan (Rp)*', angka: true, urut: true },
  { grup: 'Perolehan', kunci: 'diterima_dibeli_dari', label: 'Diterima/Dibeli dari' },
  { grup: 'Perolehan', kunci: 'tanggal_penerimaan', label: 'Tanggal Penerimaan', urut: true },
  { grup: 'Lain', kunci: 'ket', label: 'Ket.' }
];

const GRUP = ['Identitas', 'Dokumen', 'Luas & Nilai', 'Perolehan', 'Lain'];

function tampilNilai(r, k) {
  const v = r[k.kunci];
  if (k.kunci === 'status') return <Lencana warna={WARNA_STATUS_DOKUMEN[v]}>{v}</Lencana>;
  if (k.kunci === 'luas_m2') return angka(v);
  if (k.kunci === 'luas_ru') return v === null ? '–' : angka(v, 1);
  if (k.kunci === 'harga_rp_per_ru') return teksHarga(r);
  if (k.kunci === 'nilai_perolehan') return v === null || v === '' ? '–' : angka(Math.round(v));
  if (k.kunci === 'tanggal_penerimaan') return v ? tanggal(v, 'pendek') : '–';
  return v === null || v === undefined || v === '' ? '–' : String(v);
}

/** Harga per ru; bila kosong tampilkan keterangannya (Wakaf, dll.), bila keduanya ada digabung. */
function teksHarga(r) {
  const v = r.harga_rp_per_ru;
  const nilai = v === null || v === '' || v === undefined ? '' : angka(Math.round(v));
  if (nilai && r.keterangan_harga) return `${nilai} (${r.keterangan_harga})`;
  return nilai || r.keterangan_harga || '–';
}

function teksPdf(r, k) {
  const v = r[k.kunci];
  if (k.kunci === 'luas_ru') return v === null ? '–' : angka(v, 1);
  if (k.kunci === 'harga_rp_per_ru') return teksHarga(r);
  if (['luas_m2', 'nilai_perolehan'].includes(k.kunci)) return v === null || v === '' ? '–' : angka(Math.round(v));
  if (k.kunci === 'tanggal_penerimaan') return v ? tanggal(v, 'pendek') : '–';
  return v === null || v === undefined || v === '' ? '–' : String(v);
}

/** F-21 Tabel data tanah: ringkasan, cari & saring, kelompok kolom, total mengikuti saringan, detail. */
export function TabelTanah({ rows = [], zona = [], lokasi = [], konversiRu = 14, zonaFilter, setZonaFilter }) {
  const lebar = useLayarLebar();
  const [cari, setCari] = useState('');
  const [cariAktif, setCariAktif] = useState('');
  const [status, setStatus] = useState('');
  const [tahun, setTahun] = useState('');
  const [urut, setUrut] = useState({ kunci: 'no', naik: true });
  const [detail, setDetail] = useState(null);
  const tunda = useDebounce(setCariAktif, 250);

  const namaZona = useMemo(() => Object.fromEntries(zona.map((z) => [z.id, labelZona(z)])), [zona]);
  const kelompok = useMemo(() => kelompokLokasi(zona, lokasi).filter((k) => k.zona.length), [zona, lokasi]);
  const semua = useMemo(() => olahTanah(rows, konversiRu).map((r) => ({ ...r, zona: namaZona[r.zona_id] || '–' })), [rows, konversiRu, namaZona]);
  const daftarTahun = useMemo(() => [...new Set(semua.map((r) => r.tahun).filter(Boolean))].sort().reverse(), [semua]);

  const tersaring = useMemo(() => {
    const q = cariAktif.trim().toLowerCase();
    const hasil = semua.filter(
      (r) =>
        (!zonaFilter || r.zona_id === zonaFilter) &&
        (!status || r.status === status) &&
        (!tahun || r.tahun === tahun) &&
        (!q || [r.nama_pemegang_hak, r.letak_tanah, r.no_shm, r.no_petok, r.no_blok_nop].some((v) => String(v || '').toLowerCase().includes(q)))
    );
    const k = KOLOM.find((x) => x.kunci === urut.kunci);
    return [...hasil].sort((a, b) => {
      const va = a[urut.kunci];
      const vb = b[urut.kunci];
      let c;
      if (k?.angka) c = (Number(va) || 0) - (Number(vb) || 0);
      else c = String(va ?? '').localeCompare(String(vb ?? ''), 'id', { numeric: true });
      return urut.naik ? c : -c;
    });
  }, [semua, zonaFilter, status, tahun, cariAktif, urut]);

  const ring = ringkasTanah(tersaring);
  const zonaDetail = detail?.zona_id || '';
  // peta mini: gambar lokasi zona itu + zona-zona di lokasi yang sama
  const lokasiDetail = useMemo(() => {
    const z = zona.find((x) => x.id === zonaDetail);
    return z ? kelompok.find((k) => k.id === lokasiDari(z, lokasi)) : null;
  }, [zona, zonaDetail, kelompok, lokasi]);
  const wilayahMini = useMemo(
    () =>
      (lokasiDetail?.zona || []).map((z) => ({ id: z.id, nama: z.kode || z.nama_zona, titik: bacaPoligon(z.polygon_json), warna: z.id === zonaDetail ? 'var(--color-emas)' : 'var(--color-gading)' })),
    [lokasiDetail, zonaDetail]
  );
  const sorotMini = useMemo(() => (zonaDetail ? new Set([zonaDetail]) : null), [zonaDetail]);
  const adaSaringan = zonaFilter || status || tahun || cariAktif;
  const hapusSaringan = () => {
    setZonaFilter(null);
    setStatus('');
    setTahun('');
    setCari('');
    setCariAktif('');
  };
  const ubahUrut = (kunci) => setUrut((u) => ({ kunci, naik: u.kunci === kunci ? !u.naik : true }));
  const animasiBaris = tersaring.length <= 80;

  const siapkanPdf = () => ({
    judul: 'Buku Data Tanah Wakaf',
    subjudul: [
      zonaFilter && `Zona: ${namaZona[zonaFilter]}`,
      status && `Status: ${status}`,
      tahun && `Tahun: ${tahun}`,
      cariAktif && `Cari: "${cariAktif}"`
    ]
      .filter(Boolean)
      .join(' · ') || 'Semua data',
    ringkasan: [
      ['Jumlah bidang', angka(ring.bidang)],
      ['Total luas', `${angka(ring.luas)} m² (${luasHa(ring.luas)})`],
      ['Nilai perolehan', rupiah(ring.nilai)],
      ['SHM / Petok', `${ring.shm} / ${ring.petok}`]
    ],
    tabel: [
      {
        kepala: [GRUP.map((g) => ({ content: g, colSpan: KOLOM.filter((k) => k.grup === g).length, styles: { halign: 'center' } })), KOLOM.map((k) => k.label)],
        badan: tersaring.map((r) => KOLOM.map((k) => teksPdf(r, k))),
        kaki: KOLOM.map((k) =>
          k.kunci === 'nama_pemegang_hak' ? `Total (${ring.bidang} bidang)` : k.kunci === 'luas_m2' ? angka(ring.luas) : k.kunci === 'luas_ru' ? angka(ring.ru, 1) : k.kunci === 'nilai_perolehan' ? angka(Math.round(ring.nilai)) : ''
        ),
        kolomKanan: KOLOM.map((k, i) => (k.angka ? i : -1)).filter((i) => i >= 0)
      }
    ],
    namaBerkas: 'data-tanah-wakaf',
    lanskap: true
  });

  return (
    <div className="space-y-5">
      {/* kartu ringkasan (angka berhitung naik) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KotakStat label="Jumlah bidang" nilai={ring.bidang} ikon={Landmark} sub={adaSaringan ? `dari ${semua.length} bidang` : 'Seluruh data'} />
        <KotakStat label="Total luas" nilai={ring.luas} format={(v) => `${angka(Math.round(v))} m²`} ikon={Ruler} sub={luasHa(ring.luas)} />
        <KotakStat label="Nilai perolehan" nilai={ring.nilai} format={(v) => rupiahRingkas(v)} ikon={Wallet} sub="Perkiraan, dari harga per ru" />
        <div className="kartu p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-redup">Dokumen</p>
            <FileText className="size-5 text-emas-tua" aria-hidden />
          </div>
          <p className="mt-3 font-judul text-[2rem] leading-none tabular-nums">{ring.bidang ? Math.round((ring.shm / ring.bidang) * 100) : 0}% <span className="text-base">SHM</span></p>
          <BilahProporsi
            className="mt-3"
            bagian={[
              { label: 'SHM', nilai: ring.shm, warna: 'var(--color-daun)' },
              { label: 'Petok', nilai: ring.petok, warna: 'var(--color-emas)' },
              { label: 'Belum lengkap', nilai: ring.belum, warna: 'var(--color-bata)' }
            ]}
          />
        </div>
      </div>

      {/* kontrol */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Cari data tanah</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-redup" aria-hidden />
          <input
            value={cari}
            onChange={(e) => {
              setCari(e.target.value);
              tunda(e.target.value);
            }}
            placeholder="Cari nama, letak, No. SHM/Petok/NOP"
            className="min-h-11 w-full rounded-full border border-garis bg-gading pl-10 pr-4 text-sm focus:border-hijau focus:outline-none focus:ring-4 focus:ring-hijau/10"
          />
        </label>
        <Select value={zonaFilter || ''} onChange={(e) => setZonaFilter(e.target.value || null)} aria-label="Saring zona" className="w-44">
          <option value="">Semua zona</option>
          {kelompok.map((k) => (
            <optgroup key={k.id} label={k.nama}>
              {k.zona.map((z) => (
                <option key={z.id} value={z.id}>
                  {labelZona(z)}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Saring status dokumen" className="w-40">
          <option value="">Semua status</option>
          <option value="SHM">SHM</option>
          <option value="Petok">Petok saja</option>
          <option value="Data belum lengkap">Belum lengkap</option>
        </Select>
        <Select value={tahun} onChange={(e) => setTahun(e.target.value)} aria-label="Saring tahun perolehan" className="w-32">
          <option value="">Semua tahun</option>
          {daftarTahun.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        {adaSaringan && (
          <Button varian="hantu" ukuran="sm" ikon={X} onClick={hapusSaringan}>
            Hapus saringan
          </Button>
        )}
        <TombolPdf label="Unduh PDF data tanah" siapkan={siapkanPdf} className="ml-auto" />
      </div>

      {!tersaring.length ? (
        <KotakPesan teks="Tidak ada data yang cocok." />
      ) : lebar ? (
        /* laptop: tabel dengan judul kolom & kolom Nama tetap terlihat saat digulir */
        <div className="kartu max-h-[70vh] overflow-auto">
          <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="bg-hijau text-gading">
                {GRUP.map((g, i) => (
                  <th
                    key={g}
                    colSpan={KOLOM.filter((k) => k.grup === g).length}
                    className={cn('border-b border-white/10 px-3 py-2 text-left text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emas', i === 0 && 'sticky left-0 z-30 bg-hijau')}
                  >
                    {g}
                  </th>
                ))}
              </tr>
              <tr className="bg-krem">
                {KOLOM.map((k, i) => (
                  <th
                    key={k.kunci}
                    scope="col"
                    aria-sort={urut.kunci === k.kunci ? (urut.naik ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'whitespace-nowrap border-b border-garis bg-krem px-3 py-2.5 text-xs font-semibold text-redup',
                      k.angka ? 'text-right' : 'text-left',
                      i === 0 && 'sticky left-0 z-30',
                      i === 1 && 'sticky left-12 z-30 border-r border-garis'
                    )}
                  >
                    {k.urut ? (
                      <button type="button" onClick={() => ubahUrut(k.kunci)} className={cn('inline-flex items-center gap-1 hover:text-hijau', k.angka && 'flex-row-reverse')}>
                        {k.label}
                        {urut.kunci === k.kunci ? urut.naik ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                      </button>
                    ) : (
                      k.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <m.tbody variants={bergiliran(0.03)} {...saatTerlihat}>
              <AnimatePresence initial={false}>
                {tersaring.map((r) => (
                  <m.tr
                    key={r.id}
                    layout={animasiBaris ? 'position' : false}
                    variants={muncul}
                    initial={animasiBaris ? undefined : false}
                    exit={{ opacity: 0 }}
                    onClick={() => setDetail(r)}
                    className="group cursor-pointer"
                  >
                    {KOLOM.map((k, i) => (
                      <td
                        key={k.kunci}
                        className={cn(
                          'whitespace-nowrap border-b border-garis bg-gading px-3 py-2.5 group-hover:bg-krem',
                          k.angka && 'text-right tabular-nums',
                          i === 0 && 'sticky left-0 z-10 text-redup',
                          i === 1 && 'sticky left-12 z-10 border-r border-garis font-medium text-tinta',
                          k.kunci === 'ket' && 'max-w-[16rem] truncate'
                        )}
                      >
                        {tampilNilai(r, k)}
                      </td>
                    ))}
                  </m.tr>
                ))}
              </AnimatePresence>
            </m.tbody>
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-[#F3EDE1] font-semibold">
                {KOLOM.map((k, i) => (
                  <td
                    key={k.kunci}
                    className={cn(
                      'whitespace-nowrap border-t-2 border-emas/60 bg-[#F3EDE1] px-3 py-3',
                      k.angka && 'text-right tabular-nums',
                      i === 0 && 'sticky left-0 z-30',
                      i === 1 && 'sticky left-12 z-30 border-r border-garis'
                    )}
                  >
                    {k.kunci === 'nama_pemegang_hak'
                      ? `Total · ${ring.bidang} bidang`
                      : k.kunci === 'luas_m2'
                        ? angka(ring.luas)
                        : k.kunci === 'luas_ru'
                          ? angka(ring.ru, 1)
                          : k.kunci === 'nilai_perolehan'
                            ? angka(Math.round(ring.nilai))
                            : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* HP: kartu per bidang */
        <m.ul variants={bergiliran(0.04)} {...saatTerlihat} className="space-y-2">
          <AnimatePresence initial={false}>
            {tersaring.map((r) => (
              <m.li key={r.id} layout={animasiBaris ? 'position' : false} variants={muncul} exit={{ opacity: 0, x: -12 }}>
                <button type="button" onClick={() => setDetail(r)} className="kartu flex w-full items-start gap-3 p-4 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-tinta">{r.nama_pemegang_hak}</p>
                    <p className="truncate text-sm text-redup">{r.letak_tanah || 'Letak belum diisi'} · {r.zona}</p>
                    <p className="mt-1 text-sm tabular-nums">
                      {angka(r.luas_m2)} m² <span className="text-redup">· {luasHa(r.luas_m2)}</span>
                    </p>
                  </div>
                  <Lencana warna={WARNA_STATUS_DOKUMEN[r.status]}>{r.status}</Lencana>
                </button>
              </m.li>
            ))}
          </AnimatePresence>
          <li className="rounded-kartu bg-hijau px-4 py-3 text-sm text-gading">
            <b>Total {ring.bidang} bidang</b> · {angka(ring.luas)} m² · {rupiahRingkas(ring.nilai)}
          </li>
        </m.ul>
      )}

      <Laci buka={!!detail} tutup={() => setDetail(null)} judul={detail?.nama_pemegang_hak} deskripsi={detail ? `${detail.letak_tanah || '–'} · ${detail.zona}` : ''}>
        {detail && (
          <div className="space-y-5">
            <Lencana warna={WARNA_STATUS_DOKUMEN[detail.status]}>{detail.status}</Lencana>
            {GRUP.map((g) => (
              <section key={g}>
                <p className="label-bagian mb-2">{g}</p>
                <dl className="divide-y divide-garis rounded-xl border border-garis">
                  {KOLOM.filter((k) => k.grup === g && k.kunci !== 'status').map((k) => (
                    <div key={k.kunci} className="flex gap-3 px-3 py-2 text-sm">
                      <dt className="w-40 shrink-0 text-redup">{k.label}</dt>
                      <dd className={cn('flex-1', k.angka && 'tabular-nums')}>{k.kunci === 'nilai_perolehan' && detail.nilai_perolehan !== null ? rupiah(detail.nilai_perolehan) : tampilNilai(detail, k)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
            {detail.zona_id && lokasiDetail && (
              <section>
                <p className="label-bagian mb-2">Posisi zona · {lokasiDetail.nama}</p>
                <PetaFoto foto={lokasiDetail.foto_id} wilayah={wilayahMini} sorot={sorotMini} petaMini={false} tinggiMaks="50svh" ariaLabel="Peta mini zona" />
              </section>
            )}
            <p className="text-xs text-redup">* Luas ru = luas m² ÷ {konversiRu}; nilai perolehan = luas ru × harga per ru.</p>
          </div>
        )}
      </Laci>
    </div>
  );
}
