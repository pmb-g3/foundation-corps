import { CircleAlert, Settings } from 'lucide-react';
import { useData } from '../../lib/data.jsx';
import { Button } from '../ui/Button.jsx';

/** Tampilan saat potongan halaman (sektor/admin) sedang dimuat. */
export function PemuatHalaman() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center" role="status" aria-label="Memuat">
      <div className="flex flex-col items-center gap-4">
        <span className="relative flex size-12">
          <span className="absolute inset-0 animate-ping rounded-full bg-emas/30" />
          <span className="relative inline-flex size-12 items-center justify-center rounded-full bg-hijau font-judul text-lg text-gading">F</span>
        </span>
        <span className="text-sm text-redup">Memuat…</span>
      </div>
    </div>
  );
}

/** Pemberitahuan bila website belum terhubung ke server atau server gagal dihubungi. */
export function BannerKoneksi() {
  const { boot, galat, muatUlang, memuat } = useData();
  if (!galat) return null;
  if (galat.kode === 'BELUM_DIATUR') {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-xl items-start gap-3 rounded-2xl bg-tinta px-4 py-3 text-sm text-gading shadow-modal md:bottom-5">
        <Settings className="mt-0.5 size-5 shrink-0 text-emas" aria-hidden />
        <p>
          <b>Website belum terhubung ke server.</b> Isi <code className="rounded bg-white/10 px-1">GAS_URL</code> di file{' '}
          <code className="rounded bg-white/10 px-1">public/config.js</code>, lalu push ulang.
        </p>
      </div>
    );
  }
  if (boot) return null; // masih ada data simpanan, tetap tampil
  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-bata px-4 py-3 text-sm text-gading shadow-modal md:bottom-5">
      <CircleAlert className="size-5 shrink-0" aria-hidden />
      <p className="flex-1">{galat.message}</p>
      <Button varian="terang" ukuran="sm" onClick={muatUlang} memuat={memuat}>
        Coba lagi
      </Button>
    </div>
  );
}
