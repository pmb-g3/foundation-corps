import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarCheck, FileSpreadsheet, Images, MapPinned, Save, Table2 } from 'lucide-react';
import { useAdmin } from '../../lib/admin.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { sektorDariId, SEKTOR } from '../../lib/sektor.js';
import { useSektor } from '../../hooks/useSektor.js';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { Field, Input, Select } from '../../components/ui/Isian.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useRute } from '../../lib/router.jsx';
import { hariIniWib, namaHari, tambahHari, tanggal } from '../../lib/format.js';
import { kamisMulai } from '../../lib/mingguan.js';
import { KeuanganMingguan } from '../sektor/pembangunan/KeuanganMingguan.jsx';
import { RekapKeuangan } from '../sektor/RekapKeuangan.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';
import { BannerContoh } from './BannerContoh.jsx';
import { TAB_ZONA_SEKTOR } from './navigasi.js';

/** Patokan minggu ke-1 (Kamis) keuangan mingguan Tambal Sulam & Proyek — Pengaturan keuangan_pembangunan. */
function PatokanMinggu({ nilai, onTersimpan }) {
  const admin = useAdmin();
  const [f, setF] = useState({ tambal_mulai: '', proyek_mulai: '', ...(nilai || {}) });
  const [proses, setProses] = useState(false);
  useEffect(() => setF({ tambal_mulai: '', proyek_mulai: '', ...(nilai || {}) }), [nilai]);
  const petunjuk = (t) => {
    if (!t) return 'Kosong = mulai dari minggu transaksi pertama.';
    const k = kamisMulai(t);
    return k === t ? `${namaHari(t)} — tutup buku pertama Rabu, ${tanggal(tambahHari(t, 6), 'pendek')}.` : `${namaHari(t)}, bukan Kamis → minggu ke-1 dihitung mulai Kamis, ${tanggal(k, 'pendek')}.`;
  };
  const simpan = async () => {
    setProses(true);
    try {
      await admin.simpanPengaturan('keuangan_pembangunan', f, 'Patokan minggu ke-1 tersimpan.');
      onTersimpan?.();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };
  return (
    <section className="kartu mb-6 space-y-4 p-5">
      <h3 className="flex items-center gap-2 font-isi text-base font-semibold">
        <CalendarCheck className="size-5 text-emas-tua" aria-hidden /> Minggu ke-1 keuangan mingguan
      </h3>
      <p className="text-sm text-redup">Tutup buku setiap Rabu, jadi minggu ke-1 sebaiknya dimulai hari Kamis. Tambal Sulam dan Proyek boleh berbeda.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tambal Sulam — minggu ke-1 mulai" petunjuk={petunjuk(f.tambal_mulai)}>
          {(p) => <Input {...p} type="date" value={f.tambal_mulai} max={hariIniWib()} onChange={(e) => setF({ ...f, tambal_mulai: e.target.value })} />}
        </Field>
        <Field label="Proyek — minggu ke-1 mulai" petunjuk={petunjuk(f.proyek_mulai)}>
          {(p) => <Input {...p} type="date" value={f.proyek_mulai} max={hariIniWib()} onChange={(e) => setF({ ...f, proyek_mulai: e.target.value })} />}
        </Field>
      </div>
      <Button ikon={Save} memuat={proses} onClick={simpan}>
        Simpan patokan
      </Button>
    </section>
  );
}

/** A-12 Mode Kabag: ringkasan sektor, pintasan data/impor/foto/zona, dan rekap keuangan sektornya. */
export default function RingkasanSektor() {
  const auth = useAuth();
  const admin = useAdmin();
  const { query } = useRute();
  const [pilihan, setPilihan] = useState(() => (sektorDariId(query.get('sektor')) ? query.get('sektor') : 'PERTANIAN'));
  const id = auth.isKabag ? auth.sektorKabag : pilihan;
  const sektor = sektorDariId(id);
  const { data, muatUlang } = useSektor(id);

  const pintasan = [
    { label: 'Impor Excel', ikon: FileSpreadsheet, href: '#/admin/impor' },
    { label: 'Media & Foto', ikon: Images, href: '#/admin/media' },
    ...(TAB_ZONA_SEKTOR[id] ? [{ label: 'Editor Zona', ikon: MapPinned, href: `#/admin/zona?tab=${TAB_ZONA_SEKTOR[id][0]}` }] : []),
    { label: 'Lihat halaman publik', ikon: ArrowUpRight, href: `#/sektor/${sektor.slug}` }
  ];

  return (
    <HalamanAdmin
      label={auth.isKabag ? 'Kepala Bagian' : 'Sektor'}
      judul={`Sektor ${sektor.label}`}
      keterangan="Data yang Anda simpan langsung tampil di halaman publik sektor ini."
      aksi={
        !auth.isKabag && (
          <Select value={pilihan} onChange={(e) => setPilihan(e.target.value)} aria-label="Pilih sektor" className="w-56">
            {SEKTOR.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        )
      }
    >
      <BannerContoh />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {pintasan.map((p) => (
          <a key={p.label} href={p.href} className="kartu flex min-h-24 flex-col justify-between p-4 transition-shadow hover:shadow-angkat">
            <p.ikon className="size-5 text-emas-tua" aria-hidden />
            <span className="text-sm font-semibold text-hijau">{p.label}</span>
          </a>
        ))}
      </div>

      <h2 className="mb-3 text-2xl">Tabel data</h2>
      {!data ? (
        <Kerangka className="h-32 w-full rounded-kartu" />
      ) : (
        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Object.entries(data.tabel).map(([nama, rows]) => (
            <a key={nama} href={`#/admin/data?sheet=${nama}`} className="kartu p-4 transition-shadow hover:shadow-angkat">
              <Table2 className="size-4 text-redup" aria-hidden />
              <p className="mt-3 font-judul text-3xl leading-none tabular-nums">{rows.length}</p>
              <p className="mt-1 truncate text-xs text-redup">{admin.skema[nama]?.judul || nama.replace(/_/g, ' ')}</p>
            </a>
          ))}
        </div>
      )}

      {data?.tabel?.Keuangan && (
        <>
          <h2 className="mb-3 text-2xl">{id === 'PEMBANGUNAN' ? 'Keuangan mingguan' : 'Rekap keuangan'}</h2>
          {id === 'PEMBANGUNAN' ? (
            <>
              <PatokanMinggu nilai={data.pengaturan?.keuangan_pembangunan} onTersimpan={muatUlang} />
              <KeuanganMingguan rows={data.tabel.Keuangan} patokan={data.pengaturan?.keuangan_pembangunan} hariIni={data.hari_ini || hariIniWib()} />
            </>
          ) : (
            <RekapKeuangan rows={data.tabel.Keuangan} sektorLabel={sektor.label} />
          )}
        </>
      )}
    </HalamanAdmin>
  );
}
