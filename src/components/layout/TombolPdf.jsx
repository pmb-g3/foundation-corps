import { useState } from 'react';
import { FileDown, LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useToast } from '../ui/Toast.jsx';

/**
 * Ikon unduh PDF kecil & kontras di pojok kartu (F-60).
 * `siapkan()` mengembalikan konfigurasi PDF (lihat lib/pdf.js); library PDF baru dimuat saat ditekan.
 */
export function TombolPdf({ siapkan, label = 'Unduh PDF', className, gelap = false }) {
  const [proses, setProses] = useState(false);
  const toast = useToast();
  const klik = async () => {
    setProses(true);
    try {
      const [{ buatPdf }, konfig] = await Promise.all([import('../../lib/pdf.js'), Promise.resolve(siapkan())]);
      buatPdf(konfig);
      toast.sukses('PDF diunduh.');
    } catch (e) {
      console.error(e);
      toast.galat('PDF gagal dibuat. Coba lagi.');
    } finally {
      setProses(false);
    }
  };
  return (
    <button
      type="button"
      onClick={klik}
      disabled={proses}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
        gelap ? 'bg-white/12 text-gading hover:bg-white/20' : 'bg-hijau text-gading hover:bg-daun',
        className
      )}
    >
      {proses ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <FileDown className="size-4" aria-hidden />}
    </button>
  );
}
