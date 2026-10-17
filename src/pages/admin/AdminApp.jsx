import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { AdminProvider } from '../../lib/admin.jsx';
import { navigasi, useRute } from '../../lib/router.jsx';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { AdminLayout } from './AdminLayout.jsx';
import { HALAMAN_ADMIN_SAJA, MENU_ADMIN, menuKabag } from './navigasi.js';
import Login from './Login.jsx';

// Tiap halaman panel dimuat terpisah (PRD 6.5)
const HALAMAN = {
  'hari-ini': lazy(() => import('./HariIni.jsx')),
  undian: lazy(() => import('./undian/Undian.jsx')),
  'edit-website': lazy(() => import('./EditWebsite.jsx')),
  layout: lazy(() => import('./EditorLayout.jsx')),
  data: lazy(() => import('./KelolaData.jsx')),
  impor: lazy(() => import('./ImporExcel.jsx')),
  zona: lazy(() => import('./zona/EditorZona.jsx')),
  media: lazy(() => import('./MediaDrive.jsx')),
  wa: lazy(() => import('./WhatsApp.jsx')),
  pengguna: lazy(() => import('./PenggunaStaf.jsx')),
  sektor: lazy(() => import('./RingkasanSektor.jsx'))
};

function judulHalaman(id, kabag, sektor) {
  const menu = kabag ? menuKabag(sektor) : MENU_ADMIN;
  for (const g of menu) for (const it of g.item) if (it.id === id) return it.label;
  return 'Panel';
}

/** Panel admin: login (F-50) → Admin Utama ke "Hari Ini", Kepala Bagian ke sektornya. */
export default function AdminApp() {
  const auth = useAuth();
  const { bagian } = useRute();
  const id = bagian[1] || '';
  const bawaan = auth.isKabag ? 'sektor' : 'hari-ini';
  const terlarang = auth.isKabag && HALAMAN_ADMIN_SAJA.includes(id);
  const Halaman = HALAMAN[id];

  useEffect(() => {
    if (!auth.masukLogin) return;
    if (!id || !Halaman || terlarang) navigasi(`/admin/${bawaan}`, { ganti: true });
  }, [auth.masukLogin, id, Halaman, terlarang, bawaan]);

  if (!auth.masukLogin) return <Login />;
  if (!Halaman || terlarang) return null;

  return (
    <AdminProvider>
      <AdminLayout judul={judulHalaman(id, auth.isKabag, auth.sektorKabag)}>
        <Suspense fallback={<Kerangka className="mx-auto h-[60vh] w-full max-w-7xl rounded-kartu" />}>
          <Halaman />
        </Suspense>
      </AdminLayout>
    </AdminProvider>
  );
}
