import { useState } from 'react';
import { ArrowUpRight, FileSpreadsheet, Images, MapPinned, Table2 } from 'lucide-react';
import { useAdmin } from '../../lib/admin.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { sektorDariId, SEKTOR } from '../../lib/sektor.js';
import { useSektor } from '../../hooks/useSektor.js';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { Select } from '../../components/ui/Isian.jsx';
import { RekapKeuangan } from '../sektor/RekapKeuangan.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';
import { BannerContoh } from './BannerContoh.jsx';
import { TAB_ZONA_SEKTOR } from './navigasi.js';

/** A-12 Mode Kabag: ringkasan sektor, pintasan data/impor/foto/zona, dan rekap keuangan sektornya. */
export default function RingkasanSektor() {
  const auth = useAuth();
  const admin = useAdmin();
  const [pilihan, setPilihan] = useState('PERTANIAN');
  const id = auth.isKabag ? auth.sektorKabag : pilihan;
  const sektor = sektorDariId(id);
  const { data } = useSektor(id);

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
          <h2 className="mb-3 text-2xl">Rekap keuangan</h2>
          <RekapKeuangan rows={data.tabel.Keuangan} sektorLabel={sektor.label} pisahKategori={id === 'PEMBANGUNAN'} />
        </>
      )}
    </HalamanAdmin>
  );
}
