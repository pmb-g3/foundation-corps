import { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { tanggal } from '../../lib/format.js';
import { Gambar } from '../../components/ui/Gambar.jsx';
import { Button, IkonTombol } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Isian.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Kerangka, KotakPesan } from '../../components/ui/Kerangka.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { UnggahFoto } from '../../components/data/UnggahFoto.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';

const SEMUA_FOLDER = ['Hero', 'Pertanian', 'Perikanan', 'Pertanahan', 'Kendaraan', 'Pembangunan', 'Genset', 'Denah', 'Staf', 'Program'];

/** A-09 Media Drive: semua foto terunggah (dikompres WebP), per folder; unggah, salin ID, hapus. */
export default function MediaDrive() {
  const admin = useAdmin();
  const auth = useAuth();
  const toast = useToast();
  const folderBoleh = auth.isAdmin ? SEMUA_FOLDER : admin.info?.sektor?.[auth.sektorKabag]?.folder || [];
  const [folder, setFolder] = useState('');
  const [daftar, setDaftar] = useState(null);
  const [unggahKe, setUnggahKe] = useState('');
  const [baru, setBaru] = useState('');
  const [hapus, setHapus] = useState(null);
  const [proses, setProses] = useState(false);

  const muat = useCallback(async () => {
    setDaftar(null);
    try {
      setDaftar(await admin.jalankan('listMedia', { folder: folder || undefined }));
    } catch {
      setDaftar([]);
    }
  }, [admin, folder]);

  useEffect(() => {
    if (admin.info) muat();
  }, [folder, admin.info]); // eslint-disable-line react-hooks/exhaustive-deps

  const salin = (teks) => {
    navigator.clipboard?.writeText(teks).then(() => toast.sukses('ID foto disalin.'));
  };

  const konfirmHapus = async () => {
    setProses(true);
    try {
      await admin.hapus('Media', hapus.id, 'Foto dihapus dari Drive.');
      setHapus(null);
      muat();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  return (
    <HalamanAdmin
      label="Foto"
      judul={auth.isAdmin ? 'Media Drive' : 'Media & Foto'}
      keterangan="Foto otomatis dikompres ke WebP sebelum diunggah. Hapus foto yang tidak dipakai lagi."
      aksi={
        <Button varian="hantu" ukuran="sm" ikon={RefreshCw} onClick={muat}>
          Muat ulang
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="kartu space-y-4 self-start p-5">
          <h2 className="font-isi text-base font-semibold">Unggah foto</h2>
          <Select value={unggahKe || folderBoleh[0] || ''} onChange={(e) => setUnggahKe(e.target.value)} aria-label="Folder tujuan">
            {folderBoleh.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
          <UnggahFoto
            nilai={baru}
            ubah={(v) => {
              setBaru(v);
              if (v) muat();
            }}
            folder={unggahKe || folderBoleh[0]}
            jenis={['Hero', 'Denah', 'Pertanahan'].includes(unggahKe) ? 'besar' : 'biasa'}
            banyak
          />
          <p className="text-xs text-redup">Untuk memasang foto ke data (kendaraan, proyek, staf…), unggah langsung dari formulir di Kelola Data.</p>
        </section>

        <section className="min-w-0">
          <div className="tanpa-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1">
            {['', ...folderBoleh].map((f) => (
              <button
                key={f || 'semua'}
                type="button"
                onClick={() => setFolder(f)}
                className={cn('min-h-10 shrink-0 rounded-full px-3.5 text-sm', folder === f ? 'bg-hijau font-semibold text-gading' : 'border border-garis bg-gading text-hijau hover:border-emas')}
              >
                {f || 'Semua'}
              </button>
            ))}
          </div>
          {!daftar ? (
            <Kerangka className="h-72 w-full rounded-kartu" />
          ) : !daftar.length ? (
            <KotakPesan teks="Belum ada foto di folder ini." />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {daftar.map((f) => (
                <li key={f.id} className="kartu overflow-hidden">
                  <Gambar fotoId={f.foto_id} alt={f.nama_file} maks={480} ukuran="240px" className="aspect-[4/3]" />
                  <div className="space-y-1 p-3">
                    <p className="truncate text-xs font-medium" title={f.nama_file}>
                      {f.nama_file}
                    </p>
                    <p className="text-[0.7rem] text-redup">
                      {f.folder} · {f.ukuran_kb} KB · {tanggal(f.dibuat_pada, 'hariBulan')}
                    </p>
                    <div className="flex gap-1 pt-1">
                      <IkonTombol ikon={Copy} label="Salin ID foto" kecil onClick={() => salin(f.foto_id)} />
                      <a href={`https://drive.google.com/file/d/${f.file_id}/view`} target="_blank" rel="noreferrer" aria-label="Buka di Drive" className="flex size-9 items-center justify-center rounded-full text-hijau hover:bg-hijau/5">
                        <ExternalLink className="size-4" />
                      </a>
                      <IkonTombol ikon={Trash2} label="Hapus foto" kecil onClick={() => setHapus(f)} className="ml-auto text-bata" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Dialog
        buka={!!hapus}
        tutup={() => setHapus(null)}
        judul="Hapus foto ini?"
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setHapus(null)}>
              Batal
            </Button>
            <Button varian="bahaya" memuat={proses} onClick={konfirmHapus}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-redup">Foto dipindah ke tempat sampah Drive. Data yang masih memakai foto ini akan tampil tanpa foto.</p>
      </Dialog>
    </HalamanAdmin>
  );
}
