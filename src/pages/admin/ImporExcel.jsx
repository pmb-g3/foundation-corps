import { useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Isian.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { Kerangka, KotakPesan } from '../../components/ui/Kerangka.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';
import { NAMA_GRUP } from './KelolaData.jsx';

const BATCH = 300; // GAS dibatasi 6 menit per panggilan → kirim per batch

/** A-06 Impor Excel (F-58): template, pratinjau + baris bermasalah ditandai, lalu simpan per batch. */
export default function ImporExcel() {
  const admin = useAdmin();
  const auth = useAuth();
  const input = useRef(null);
  const [sheet, setSheet] = useState('');
  const [berkas, setBerkas] = useState(null);
  const [rows, setRows] = useState([]);
  const [hasil, setHasil] = useState(null); // { ringkas, baris }
  const [selesai, setSelesai] = useState(null);
  const [proses, setProses] = useState('');

  const pilihan = useMemo(
    () => Object.entries(admin.skema).filter(([n, s]) => !s.khusus && n !== 'Pengaturan' && (auth.isAdmin || s.akses === auth.sektorKabag || s.akses === 'PER_BARIS')),
    [admin.skema, auth]
  );
  if (!admin.info) return <Kerangka className="h-[60vh] w-full rounded-kartu" />;
  const aktif = sheet || pilihan[0]?.[0];
  const skema = admin.skema[aktif];

  const reset = () => {
    setBerkas(null);
    setRows([]);
    setHasil(null);
    setSelesai(null);
    if (input.current) input.current.value = '';
  };

  const kirimBatch = async (simpan) => {
    const gabung = { ringkas: { baru: 0, ubah: 0, salah: 0 }, baris: [], disimpan: 0 };
    for (let i = 0; i < rows.length; i += BATCH) {
      const potong = rows.slice(i, i + BATCH);
      setProses(`${simpan ? 'Menyimpan' : 'Memeriksa'} baris ${i + 1}–${i + potong.length} dari ${rows.length}…`);
      const r = await admin.jalankan('importExcel', { sheet: aktif, rows: potong, simpan });
      ['baru', 'ubah', 'salah'].forEach((k) => (gabung.ringkas[k] += r.ringkas[k]));
      gabung.baris.push(...r.baris.map((b) => ({ ...b, baris: b.baris + i })));
      gabung.disimpan += r.disimpan || 0;
    }
    return gabung;
  };

  const baca = async (file) => {
    reset();
    if (!file) return;
    setBerkas(file);
    setProses('Membaca berkas…');
    try {
      const { bacaExcel } = await import('../../lib/excel.js');
      const r = await bacaExcel(file);
      setRows(r);
      if (!r.length) throw new Error('Berkas tidak berisi data.');
      setHasil(null);
      const cek = await (async () => {
        const gabung = { ringkas: { baru: 0, ubah: 0, salah: 0 }, baris: [] };
        for (let i = 0; i < r.length; i += BATCH) {
          const potong = r.slice(i, i + BATCH);
          setProses(`Memeriksa baris ${i + 1}–${i + potong.length} dari ${r.length}…`);
          const h = await admin.jalankan('importExcel', { sheet: aktif, rows: potong, simpan: false });
          ['baru', 'ubah', 'salah'].forEach((k) => (gabung.ringkas[k] += h.ringkas[k]));
          gabung.baris.push(...h.baris.map((b) => ({ ...b, baris: b.baris + i })));
        }
        return gabung;
      })();
      setHasil(cek);
    } catch (e) {
      setHasil({ galat: e.message });
    } finally {
      setProses('');
    }
  };

  const simpan = async () => {
    try {
      const r = await kirimBatch(true);
      setSelesai(r);
      admin.lupakanSheet(aktif);
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  const unduh = async (denganData) => {
    setProses('Menyiapkan template…');
    try {
      const [{ unduhTemplate }, isi] = await Promise.all([import('../../lib/excel.js'), denganData ? admin.ambilSheet(aktif, true) : null]);
      unduhTemplate(aktif, skema, isi ? isi.baris : null);
    } catch (e) {
      console.error(e);
    } finally {
      setProses('');
    }
  };

  const bermasalah = hasil?.baris?.filter((b) => b.pesan.length) || [];

  return (
    <HalamanAdmin label="Data" judul="Impor Excel" keterangan="Unggah .xlsx sesuai template. Baris bermasalah ditandai dan dilewati; sisanya tersimpan setelah Anda konfirmasi.">
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="kartu space-y-4 p-5">
          <label className="block text-sm font-semibold">
            1. Tabel tujuan
            <Select
              value={aktif}
              onChange={(e) => {
                setSheet(e.target.value);
                reset();
              }}
              className="mt-1.5"
            >
              {pilihan.map(([n, s]) => (
                <option key={n} value={n}>
                  {s.judul} · {NAMA_GRUP[s.grup] || s.grup}
                </option>
              ))}
            </Select>
          </label>
          <div>
            <p className="text-sm font-semibold">2. Template</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Button varian="sekunder" ukuran="sm" ikon={Download} onClick={() => unduh(false)}>
                Template kosong
              </Button>
              <Button varian="hantu" ukuran="sm" ikon={Download} onClick={() => unduh(true)}>
                Dengan data saat ini
              </Button>
            </div>
            <p className="mt-2 text-xs text-redup">Baris ber-id akan diperbarui. Foto diunggah lewat Kelola Data.</p>
          </div>
          <div>
            <p className="text-sm font-semibold">3. Unggah berkas</p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                baca(e.dataTransfer.files[0]);
              }}
              className="mt-1.5 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-garis bg-krem/60 px-4 py-8 text-sm text-redup hover:border-emas hover:text-hijau"
            >
              <FileSpreadsheet className="size-8" aria-hidden />
              {berkas ? <b className="text-tinta">{berkas.name}</b> : 'Pilih atau tarik berkas .xlsx'}
            </button>
            <input ref={input} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => baca(e.target.files[0])} />
          </div>
        </section>

        <section className="min-w-0">
          {proses ? (
            <div className="kartu flex items-center gap-3 p-6 text-sm text-redup" role="status">
              <RefreshCw className="size-5 animate-spin text-hijau" aria-hidden /> {proses}
            </div>
          ) : selesai ? (
            <div className="kartu p-6">
              <p className="flex items-center gap-2 font-judul text-2xl text-hijau">
                <CircleCheck className="size-6" aria-hidden /> {selesai.disimpan} baris tersimpan
              </p>
              <p className="mt-1 text-sm text-redup">
                {selesai.ringkas.baru} baru · {selesai.ringkas.ubah} diperbarui · {selesai.ringkas.salah} dilewati
              </p>
              <Button varian="sekunder" className="mt-4" onClick={reset}>
                Impor berkas lain
              </Button>
            </div>
          ) : hasil?.galat ? (
            <KotakPesan jenis="galat" teks={hasil.galat} />
          ) : hasil ? (
            <div className="space-y-4">
              <div className="kartu flex flex-wrap items-center gap-3 p-5">
                <Lencana warna="hijau">{hasil.ringkas.baru} baru</Lencana>
                <Lencana warna="emas">{hasil.ringkas.ubah} diperbarui</Lencana>
                <Lencana warna={hasil.ringkas.salah ? 'bata' : 'netral'}>{hasil.ringkas.salah} bermasalah</Lencana>
                <Button ikon={Upload} className="ml-auto" disabled={!hasil.ringkas.baru && !hasil.ringkas.ubah} onClick={simpan}>
                  Simpan {hasil.ringkas.baru + hasil.ringkas.ubah} baris valid
                </Button>
              </div>
              <div className="kartu overflow-x-auto">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-krem text-left text-xs uppercase tracking-[0.06em] text-redup">
                    <tr>
                      <th className="px-3 py-2">Baris</th>
                      <th className="px-3 py-2">Status</th>
                      {Object.keys(rows[0] || {})
                        .slice(0, 4)
                        .map((k) => (
                          <th key={k} className="px-3 py-2">
                            {k}
                          </th>
                        ))}
                      <th className="px-3 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-garis">
                    {hasil.baris.slice(0, 300).map((b) => {
                      const r = rows[b.baris - 2] || {};
                      const salah = b.pesan.length > 0;
                      return (
                        <tr key={b.baris} className={cn(salah && 'bg-bata/[0.06]')}>
                          <td className="px-3 py-2 tabular-nums text-redup">{b.baris}</td>
                          <td className="px-3 py-2">
                            {salah ? <Lencana warna="bata" ikon={CircleAlert}>Salah</Lencana> : <Lencana warna={b.status === 'baru' ? 'hijau' : 'emas'}>{b.status === 'baru' ? 'Baru' : 'Perbarui'}</Lencana>}
                          </td>
                          {Object.keys(rows[0] || {})
                            .slice(0, 4)
                            .map((k) => (
                              <td key={k} className="max-w-[10rem] truncate px-3 py-2">
                                {String(r[k] ?? '')}
                              </td>
                            ))}
                          <td className="px-3 py-2 text-xs text-bata">{b.pesan.join('; ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {bermasalah.length > 0 && <p className="text-xs text-redup">Perbaiki baris merah di Excel lalu unggah ulang, atau simpan sekarang (baris merah dilewati).</p>}
            </div>
          ) : (
            <KotakPesan teks="Pilih tabel, unduh template, lalu unggah berkas untuk melihat pratinjau." />
          )}
        </section>
      </div>
    </HalamanAdmin>
  );
}
