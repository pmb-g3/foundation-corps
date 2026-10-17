import { Suspense, lazy, useEffect } from 'react';
import { MotionRoot } from './lib/motion.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { DataProvider } from './lib/data.jsx';
import { EditorProvider } from './lib/editor.jsx';
import { useRute } from './lib/router.jsx';
import { sektorDariSlug } from './lib/sektor.js';
import { ToastProvider } from './components/ui/Toast.jsx';
import { HeaderPublik } from './components/layout/HeaderPublik.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { BannerKoneksi, PemuatHalaman } from './components/layout/Pemuat.jsx';
import { KotakPesan } from './components/ui/Kerangka.jsx';
import { muatAdmin, muatSektor } from './lib/pramuat.js';
import Beranda from './pages/beranda/Beranda.jsx';

// Halaman sektor & panel admin dimuat hanya saat dibuka (PRD 6.5).
const HalamanSektor = lazy(muatSektor);
const AdminApp = lazy(muatAdmin);

function GulirKeAtas({ jalur }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [jalur]);
  return null;
}

function Rute() {
  const { jalur, bagian } = useRute();

  if (bagian[0] === 'admin') {
    return (
      <Suspense fallback={<PemuatHalaman />}>
        <GulirKeAtas jalur={jalur} />
        <AdminApp />
      </Suspense>
    );
  }

  let isi;
  let diAtasFoto = true;
  if (bagian.length === 0) {
    isi = <Beranda />;
  } else if (bagian[0] === 'sektor' && sektorDariSlug(bagian[1])) {
    isi = (
      <Suspense fallback={<div className="h-[72svh] min-h-[520px] bg-hijau" aria-hidden />}>
        <HalamanSektor key={bagian[1]} slug={bagian[1]} />
      </Suspense>
    );
  } else {
    diAtasFoto = false;
    isi = (
      <div className="wadah flex min-h-[70dvh] items-center justify-center pt-24">
        <KotakPesan judul="Halaman tidak ditemukan" teks="Alamat ini tidak ada." aksi={<a className="font-semibold text-hijau underline" href="#/">Kembali ke Beranda</a>} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById('konten')?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-hijau focus:px-4 focus:py-2 focus:text-gading"
      >
        Lewati ke konten
      </button>
      <GulirKeAtas jalur={jalur} />
      <HeaderPublik diAtasFoto={diAtasFoto} />
      <main id="konten" tabIndex={-1} className="outline-none">
        {isi}
      </main>
      <Footer />
      <BannerKoneksi />
    </>
  );
}

export default function App() {
  return (
    <MotionRoot>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <EditorProvider>
              <Rute />
            </EditorProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </MotionRoot>
  );
}
