import { Suspense, lazy } from 'react';
import { sektorDariSlug } from '../../lib/sektor.js';
import { useEditor } from '../../lib/editor.jsx';
import { navigasi } from '../../lib/router.jsx';
import { useSektor } from '../../hooks/useSektor.js';
import { usePengaturan } from '../../lib/data.jsx';
import { KotakPesan, Kerangka } from '../../components/ui/Kerangka.jsx';
import { SektorLayout } from './SektorLayout.jsx';

const HALAMAN = {
  PERTANIAN: lazy(() => import('./pertanian/Pertanian.jsx')),
  PERTANAHAN: lazy(() => import('./pertanahan/Pertanahan.jsx')),
  KENDARAAN: lazy(() => import('./kendaraan/Kendaraan.jsx')),
  PEMBANGUNAN: lazy(() => import('./pembangunan/Pembangunan.jsx'))
};

/** Halaman sektor: data diambil saat dibuka (getSektor), lalu ditampilkan oleh halaman sektor masing-masing. */
export default function HalamanSektor({ slug }) {
  const sektor = sektorDariSlug(slug);
  const { data, galat, muatUlang } = useSektor(sektor.id);
  const editor = useEditor();
  const pengaturan = usePengaturan();
  const Halaman = HALAMAN[sektor.id];

  // pensil edit: Admin semua sektor, Kabag hanya sektornya (server tetap memeriksa ulang)
  const boleh = editor.bisa(sektor.id);
  const edit = {
    tabel: (sheet, judul, saring) => (boleh ? () => editor.buka({ jenis: 'tabel', sheet, judul, sektor: sektor.id, saring, setelahSimpan: muatUlang }) : undefined),
    tautan: (ke) => (boleh ? () => navigasi(ke) : undefined)
  };

  // header foto langsung tampil (dari data beranda) selama data sektor dimuat → transisi foto tetap mulus
  const sementara = (
    <SektorLayout sektor={sektor} kartu={(pengaturan.sektor_kartu || {})[sektor.id] || {}}>
      <div className="wadah space-y-4 py-14">
        {galat ? (
          <KotakPesan jenis="galat" judul="Data sektor gagal dimuat" teks={galat.message} onUlang={muatUlang} />
        ) : (
          <>
            <Kerangka className="h-8 w-48" />
            <Kerangka className="h-72 w-full rounded-kartu" />
            <Kerangka className="h-40 w-full rounded-kartu" />
          </>
        )}
      </div>
    </SektorLayout>
  );

  if (!data) return sementara;
  return (
    <Suspense fallback={sementara}>
      <Halaman sektor={sektor} data={data} edit={edit} />
    </Suspense>
  );
}
