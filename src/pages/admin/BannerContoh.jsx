import { TriangleAlert } from 'lucide-react';
import { useAdmin } from '../../lib/admin.jsx';

/** Pengingat bila data contoh dari setup() belum dihapus. */
export function BannerContoh() {
  const { info } = useAdmin();
  if (!info?.jumlah_contoh) return null;
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-emas/40 bg-emas/12 px-4 py-3 text-sm text-tinta">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-emas-tua" aria-hidden />
      <p>
        Masih ada <b>{info.jumlah_contoh} baris data contoh</b>. Sebelum website tayang, buka editor Apps Script lalu jalankan{' '}
        <code className="rounded bg-white/70 px-1">hapusDataContoh()</code>.
      </p>
    </div>
  );
}
