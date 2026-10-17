import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, Plus, RotateCw, Search } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin, labelBaris } from '../../lib/admin.jsx';
import { angka, rupiah, tanggal, jam } from '../../lib/format.js';
import { useDebounce } from '../../hooks/useThrottle.js';
import { Button } from '../ui/Button.jsx';
import { Laci, Dialog } from '../ui/Dialog.jsx';
import { Lencana, warnaStatus } from '../ui/Lencana.jsx';
import { KotakPesan, Kerangka } from '../ui/Kerangka.jsx';
import { FotoStaf } from '../ui/Gambar.jsx';
import { FormBaris } from './FormBaris.jsx';

function tampil(d, v, refPeta) {
  if (v === null || v === undefined || v === '') return '–';
  switch (d.tipe) {
    case 'uang': return rupiah(v);
    case 'angka': case 'persen': return angka(v);
    case 'tanggal': return tanggal(v, 'pendek');
    case 'waktu': return `${tanggal(v, 'pendek')} ${jam(v)}`;
    case 'bool': return v ? 'Ya' : 'Tidak';
    case 'pilihan': return d.nama === 'status' || d.nama === 'jenis' ? <Lencana warna={warnaStatus(v)}>{v}</Lencana> : v;
    case 'ref': return refPeta?.[v] ? labelBaris(refPeta[v]) : v;
    case 'json': return Array.isArray(v) ? `${v.length} titik` : 'JSON';
    default: return String(v);
  }
}

/**
 * Tabel data generik untuk satu sheet (Kelola Data & mode edit).
 * saring: { kolom: nilai } — baris disaring & nilai dikunci di formulir (Kabag per sektor).
 */
export function TabelData({ sheet, saring, onBerubah, ringkas = false }) {
  const admin = useAdmin();
  const [data, setData] = useState(null);
  const [galat, setGalat] = useState(null);
  const [cari, setCari] = useState('');
  const [cariAktif, setCariAktif] = useState('');
  const [batas, setBatas] = useState(50);
  const [edit, setEdit] = useState(null); // null | 'baru' | baris
  const [proses, setProses] = useState(false);
  const [konfirmHapus, setKonfirmHapus] = useState(false);
  const [refPeta, setRefPeta] = useState({});
  const tunda = useDebounce(setCariAktif, 200);

  const muat = useCallback(
    async (paksa) => {
      try {
        setGalat(null);
        const d = await admin.ambilSheet(sheet, paksa);
        setData(d);
      } catch (e) {
        setGalat(e);
      }
    },
    [admin, sheet]
  );

  useEffect(() => {
    setData(null);
    setEdit(null);
    muat(false);
  }, [sheet, muat]);

  const skema = data?.skema;
  const khusus = !!skema?.khusus;
  const kolomTampil = useMemo(() => {
    if (!skema) return [];
    return skema.kolom.filter((d) => !['json', 'teks_panjang', 'foto_banyak'].includes(d.tipe) && d.nama !== 'hash_password').slice(0, ringkas ? 3 : 6);
  }, [skema, ringkas]);
  const kolomFoto = skema?.kolom.find((d) => d.tipe === 'foto');

  // nama untuk kolom referensi di tabel
  useEffect(() => {
    if (!skema) return;
    skema.kolom
      .filter((d) => d.tipe === 'ref' && kolomTampil.includes(d))
      .forEach((d) =>
        admin
          .ambilSheet(d.ref)
          .then((r) => setRefPeta((p) => ({ ...p, [d.nama]: Object.fromEntries(r.baris.map((x) => [x.id, x])) })))
          .catch(() => {})
      );
  }, [skema, kolomTampil, admin]);

  const baris = useMemo(() => {
    if (!data) return [];
    const q = cariAktif.trim().toLowerCase();
    return data.baris.filter(
      (r) =>
        Object.entries(saring || {}).every(([k, v]) => String(r[k]) === String(v)) &&
        (!q || Object.values(r).some((v) => typeof v !== 'object' && String(v ?? '').toLowerCase().includes(q)))
    );
  }, [data, saring, cariAktif]);

  const simpan = async (isi) => {
    setProses(true);
    try {
      await admin.simpan(sheet, isi);
      setEdit(null);
      await muat(true);
      onBerubah?.();
    } catch {
      /* pesan sudah tampil */
    } finally {
      setProses(false);
    }
  };

  const hapus = async () => {
    setProses(true);
    try {
      await admin.hapus(sheet, edit.id);
      setKonfirmHapus(false);
      setEdit(null);
      await muat(true);
      onBerubah?.();
    } catch {
      /* pesan sudah tampil */
    } finally {
      setProses(false);
    }
  };

  if (galat) return <KotakPesan jenis="galat" teks={galat.message} onUlang={() => muat(true)} />;
  if (!data) return <Kerangka className="h-64 w-full rounded-kartu" />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[10rem] flex-1">
          <span className="sr-only">Cari</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-redup" aria-hidden />
          <input
            value={cari}
            onChange={(e) => {
              setCari(e.target.value);
              tunda(e.target.value);
            }}
            placeholder={`Cari di ${skema?.judul || sheet}`}
            className="min-h-11 w-full rounded-full border border-garis bg-gading pl-10 pr-4 text-sm focus:border-hijau focus:outline-none focus:ring-4 focus:ring-hijau/10"
          />
        </label>
        <Button varian="hantu" ukuran="sm" ikon={RotateCw} onClick={() => muat(true)}>
          Muat ulang
        </Button>
        {!khusus && (
          <Button ukuran="sm" ikon={Plus} onClick={() => setEdit('baru')}>
            Tambah
          </Button>
        )}
      </div>
      {khusus && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-emas/12 px-3 py-2 text-sm text-tinta">
          <Lock className="size-4 text-emas-tua" aria-hidden /> Diubah lewat menu {skema.khusus}.
        </p>
      )}

      <div className="kartu overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead className="bg-krem/80 text-left text-xs uppercase tracking-[0.06em] text-redup">
            <tr>
              {kolomFoto && <th className="w-12 px-3 py-2.5" />}
              {kolomTampil.map((d) => (
                <th key={d.nama} className={cn('px-3 py-2.5 font-semibold', ['uang', 'angka'].includes(d.tipe) && 'text-right')}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {baris.slice(0, batas).map((r) => (
              <tr
                key={r.id}
                onClick={() => !khusus && setEdit(r)}
                className={cn('transition-colors', !khusus && 'cursor-pointer hover:bg-krem/70', String(r.id).startsWith('contoh-') && 'bg-emas/[0.06]')}
              >
                {kolomFoto && (
                  <td className="px-3 py-2">
                    <FotoStaf nama={labelBaris(r)} fotoId={r[kolomFoto.nama]} ukuran="sm" />
                  </td>
                )}
                {kolomTampil.map((d) => (
                  <td key={d.nama} className={cn('max-w-[16rem] truncate px-3 py-2.5', ['uang', 'angka'].includes(d.tipe) && 'text-right tabular-nums')}>
                    {tampil(d, r[d.nama], refPeta[d.nama])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!baris.length && <p className="px-4 py-8 text-center text-sm text-redup">Belum ada data.</p>}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-redup">
        <span>
          {baris.length} baris{baris.some((r) => String(r.id).startsWith('contoh-')) ? ' · baris berlatar emas = data contoh' : ''}
        </span>
        {baris.length > batas && (
          <Button varian="hantu" ukuran="sm" onClick={() => setBatas(batas + 50)}>
            Tampilkan lebih banyak
          </Button>
        )}
      </div>

      <Laci buka={!!edit} tutup={() => setEdit(null)} judul={edit === 'baru' ? `Tambah ${skema?.judul || ''}` : `Ubah ${skema?.judul || ''}`} lebar="max-w-lg">
        {edit && (
          <FormBaris
            key={edit === 'baru' ? 'baru' : edit.id}
            sheet={sheet}
            skema={skema}
            awal={edit === 'baru' ? null : edit}
            kunci={saring}
            memuat={proses}
            onSimpan={simpan}
            onBatal={() => setEdit(null)}
            onHapus={edit !== 'baru' ? () => setKonfirmHapus(true) : undefined}
          />
        )}
      </Laci>
      <Dialog
        buka={konfirmHapus}
        tutup={() => setKonfirmHapus(false)}
        judul="Hapus data ini?"
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setKonfirmHapus(false)}>
              Batal
            </Button>
            <Button varian="bahaya" memuat={proses} onClick={hapus}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-redup">Data yang dihapus tidak bisa dikembalikan dari website (masih ada di backup harian).</p>
      </Dialog>
    </div>
  );
}
