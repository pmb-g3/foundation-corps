import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { kompresFoto } from '../../lib/kompres.js';
import { daftarFoto } from '../../lib/foto.js';
import { useAdmin } from '../../lib/admin.jsx';
import { Gambar } from '../ui/Gambar.jsx';

const kb = (b) => `${Math.round(b / 1024)} KB`;

/**
 * Unggah foto: dikompres otomatis di browser (WebP ±80%, 1.920/1.200 px + 480 px) lalu dikirim ke Drive.
 * nilai: foto_id ("besar|kecil") atau, bila `banyak`, daftar dipisah koma.
 */
export function UnggahFoto({ nilai, ubah, folder, jenis = 'biasa', banyak = false, label = 'Foto' }) {
  const admin = useAdmin();
  const input = useRef(null);
  const [status, setStatus] = useState('');
  const [proses, setProses] = useState(false);
  const daftar = banyak ? daftarFoto(nilai) : nilai ? [nilai] : [];

  const unggah = async (files) => {
    const berkas = [...files].filter((f) => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name));
    if (!berkas.length) return;
    setProses(true);
    let hasil = banyak ? [...daftar] : [];
    try {
      for (const f of banyak ? berkas : berkas.slice(0, 1)) {
        setStatus(`Mengompres ${f.name}…`);
        const k = await kompresFoto(f, jenis);
        setStatus(`Mengunggah (${kb(f.size)} → ${kb(k.besar.ukuran)})…`);
        const r = await admin.jalankan('uploadFoto', { folder, nama: f.name, tipe: k.tipe, besar: k.besar, kecil: k.kecil });
        hasil = banyak ? [...hasil, r.foto_id] : [r.foto_id];
        ubah(banyak ? hasil.join(',') : r.foto_id);
        URL.revokeObjectURL(k.pratinjau);
      }
      setStatus('Foto tersimpan.');
    } catch (e) {
      setStatus(e.message || 'Gagal mengunggah.');
    } finally {
      setProses(false);
      if (input.current) input.current.value = '';
    }
  };

  const hapus = (id) => {
    const sisa = daftar.filter((x) => x !== id);
    ubah(banyak ? sisa.join(',') : '');
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          unggah(e.dataTransfer.files);
        }}
        className={cn('grid gap-2', banyak ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1')}
      >
        {daftar.map((id) => (
          <div key={id} className={cn('group relative overflow-hidden rounded-xl border border-garis', banyak ? 'aspect-square' : 'aspect-[16/9]')}>
            <Gambar fotoId={id} alt={label} maks={480} ukuran="200px" className="absolute inset-0" />
            <button
              type="button"
              onClick={() => hapus(id)}
              aria-label="Hapus foto ini"
              className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-tinta/70 text-gading opacity-90 hover:bg-bata"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        {(banyak || !daftar.length) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={proses}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-garis bg-krem/60 p-3 text-center text-xs text-redup transition-colors hover:border-emas hover:text-hijau',
              banyak ? 'aspect-square' : 'aspect-[16/9]'
            )}
          >
            {proses ? <LoaderCircle className="size-6 animate-spin text-hijau" /> : banyak ? <ImagePlus className="size-6" /> : <UploadCloud className="size-6" />}
            <span className="font-semibold">{banyak ? 'Tambah foto' : 'Pilih atau tarik foto'}</span>
            {!banyak && <span>JPG, PNG, HEIC — dikompres otomatis</span>}
          </button>
        )}
      </div>
      {!banyak && daftar.length > 0 && (
        <button type="button" onClick={() => input.current?.click()} disabled={proses} className="mt-2 text-xs font-semibold text-hijau underline underline-offset-2">
          Ganti foto
        </button>
      )}
      <input ref={input} type="file" accept="image/*,.heic,.heif" multiple={banyak} className="hidden" onChange={(e) => unggah(e.target.files)} />
      {status && (
        <p className="mt-2 text-xs text-redup" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
