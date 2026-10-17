import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, History, RotateCcw, Send } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useData, KUNCI_PRATINJAU } from '../../lib/data.jsx';
import { TEMA_BAWAAN } from '../../lib/tema.js';
import { tanggal, jam } from '../../lib/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Select, Switch, Input } from '../../components/ui/Isian.jsx';
import { DaftarUrut } from '../../components/ui/DaftarUrut.jsx';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';
import { PratinjauSitus } from './PratinjauSitus.jsx';

const NAMA_BAGIAN = { hero: 'Hero (foto drone)', jadwal: 'Jadwal hari ini + Program', sektor: 'Pilihan 4 sektor', kalender: 'Kalender kegiatan', staf: 'Staf' };
const VARIAN_UNTUK = { jadwal: 'program', sektor: 'sektor', staf: 'staf' };
const NAMA_VARIAN = { carousel: 'Carousel', grid: 'Grid', bento: 'Bento', daftar: 'Daftar' };

// Pilihan tema yang sudah disiapkan (F-52)
const PRESET = [
  { nama: 'Elegan Alami', warna: TEMA_BAWAAN.warna },
  { nama: 'Hutan Senja', warna: { hijau_tua: '#18332A', hijau_daun: '#4A7A55', krem: '#F3ECDD', emas: '#B98F3E', teks: '#1B1B19', merah_bata: '#9C3D2A' } },
  { nama: 'Pasir Emas', warna: { hijau_tua: '#2A3B2C', hijau_daun: '#5A7A4E', krem: '#F7F1E4', emas: '#C9A04A', teks: '#211F1A', merah_bata: '#A8432F' } },
  { nama: 'Batu Sungai', warna: { hijau_tua: '#22393A', hijau_daun: '#3F6E62', krem: '#F2EFE8', emas: '#BF9B4F', teks: '#1A1C1C', merah_bata: '#A14632' } }
];
const NAMA_WARNA = { hijau_tua: 'Hijau tua', hijau_daun: 'Hijau daun', krem: 'Krem (latar)', emas: 'Emas', teks: 'Teks', merah_bata: 'Merah bata' };

/** A-04 Editor Layout (F-52): urutan & tampil bagian, varian, tema, teks; pratinjau sebelum terbit; riwayat 10 versi. */
export default function EditorLayout() {
  const admin = useAdmin();
  const data = useData();
  const p = admin.info?.pengaturan;
  const [draf, setDraf] = useState(null);
  const [proses, setProses] = useState('');
  const [riwayat, setRiwayat] = useState(false);

  const asli = useMemo(
    () => (p ? { layout: p.layout, tema: p.tema || TEMA_BAWAAN, teks_bagian: p.teks_bagian || {} } : null),
    [p]
  );
  useEffect(() => {
    if (asli && !draf) setDraf(structuredClone(asli));
  }, [asli, draf]);

  // tulis draf untuk iframe pratinjau (?pratinjau=1) — berubah seketika
  useEffect(() => {
    if (!draf) return;
    try {
      localStorage.setItem(KUNCI_PRATINJAU, JSON.stringify(draf));
    } catch {
      /* abaikan */
    }
  }, [draf]);
  useEffect(() => () => localStorage.removeItem(KUNCI_PRATINJAU), []);

  if (!draf || !admin.info) return <Kerangka className="h-[70vh] w-full rounded-kartu" />;

  const ubah = (fn) => setDraf((d) => fn(structuredClone(d)));
  const urutan = ['hero', ...draf.layout.urutan.filter((b) => b !== 'hero')];
  const berubah = JSON.stringify(draf) !== JSON.stringify(asli);
  const varianTersedia = admin.info.varian_bagian || {};
  const huruf = admin.info.pilihan_huruf || { judul: ['Fraunces'], isi: ['Plus Jakarta Sans'] };

  const terbitkan = async (pulihkan) => {
    setProses(pulihkan !== undefined ? `pulih-${pulihkan}` : 'terbit');
    try {
      const body = pulihkan !== undefined ? { pulihkan } : { layout: draf.layout, tema: draf.tema, teks_bagian: draf.teks_bagian };
      const r = await admin.jalankan('saveLayout', body, pulihkan !== undefined ? 'Versi dipulihkan dan diterbitkan.' : 'Layout diterbitkan.');
      setDraf({ layout: r.layout, tema: r.tema, teks_bagian: r.teks_bagian });
      setRiwayat(false);
      await admin.muatUlang();
      data.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  return (
    <HalamanAdmin
      label="Tampilan"
      judul="Editor Layout"
      keterangan="Atur urutan bagian beranda, varian tata letak, warna, dan huruf. Lihat pratinjau sebelum terbit."
      aksi={
        <>
          <Button varian="hantu" ukuran="sm" ikon={History} onClick={() => setRiwayat(true)}>
            Riwayat ({admin.info.riwayat_layout?.length || 0})
          </Button>
          <Button varian="sekunder" ukuran="sm" ikon={RotateCcw} disabled={!berubah} onClick={() => setDraf(structuredClone(asli))}>
            Batalkan
          </Button>
          <Button ukuran="sm" ikon={Send} disabled={!berubah} memuat={proses === 'terbit'} onClick={() => terbitkan()}>
            Terbitkan
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[26rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="kartu p-5">
            <h2 className="mb-1 font-isi text-base font-semibold">Urutan bagian beranda</h2>
            <p className="mb-4 text-xs text-redup">Seret pegangan untuk mengurutkan. Hero selalu paling atas.</p>
            <DaftarUrut
              items={urutan}
              getId={(b) => b}
              terkunci={(b) => b === 'hero'}
              onUbah={(baru) => ubah((d) => ({ ...d, layout: { ...d.layout, urutan: baru } }))}
              render={(b, { pegangan }) => {
                const kv = VARIAN_UNTUK[b];
                const tampil = draf.layout.tampil?.[b] !== false;
                return (
                  <div className={cn('flex items-center gap-2 rounded-2xl border border-garis bg-gading p-2.5 pl-1', !tampil && 'opacity-60')}>
                    {pegangan}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{NAMA_BAGIAN[b]}</p>
                      {kv && (
                        <Select
                          value={draf.layout.varian?.[kv] || ''}
                          onChange={(e) => ubah((d) => ({ ...d, layout: { ...d.layout, varian: { ...d.layout.varian, [kv]: e.target.value } } }))}
                          aria-label={`Varian ${NAMA_BAGIAN[b]}`}
                          className="mt-1.5 [&_select]:min-h-9 [&_select]:text-xs"
                        >
                          {(varianTersedia[kv] || []).map((v) => (
                            <option key={v} value={v}>
                              {kv === 'program' ? 'Program: ' : ''}
                              {NAMA_VARIAN[v] || v}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                    {b !== 'hero' && (
                      <span className="flex items-center gap-1.5 pr-1">
                        {tampil ? <Eye className="size-4 text-redup" aria-hidden /> : <EyeOff className="size-4 text-redup" aria-hidden />}
                        <Switch
                          nyala={tampil}
                          ubah={(v) => ubah((d) => ({ ...d, layout: { ...d.layout, tampil: { ...d.layout.tampil, [b]: v } } }))}
                          label={`Tampilkan ${NAMA_BAGIAN[b]}`}
                        />
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </section>

          <section className="kartu p-5">
            <h2 className="mb-4 font-isi text-base font-semibold">Warna tema</h2>
            <div className="grid grid-cols-2 gap-2">
              {PRESET.map((t) => {
                const dipakai = JSON.stringify(t.warna) === JSON.stringify(draf.tema.warna);
                return (
                  <button
                    key={t.nama}
                    type="button"
                    onClick={() => ubah((d) => ({ ...d, tema: { ...d.tema, warna: { ...t.warna } } }))}
                    className={cn('rounded-2xl border p-3 text-left transition-colors', dipakai ? 'border-emas bg-emas/10' : 'border-garis hover:border-emas')}
                  >
                    <span className="flex gap-1">
                      {['hijau_tua', 'hijau_daun', 'emas', 'krem'].map((k) => (
                        <span key={k} className="size-5 rounded-full ring-1 ring-black/10" style={{ background: t.warna[k] }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-xs font-semibold">{t.nama}</span>
                  </button>
                );
              })}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-hijau">Atur warna satu per satu</summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {Object.keys(NAMA_WARNA).map((k) => (
                  <label key={k} className="flex items-center gap-2 text-xs">
                    <input
                      type="color"
                      value={draf.tema.warna[k] || '#000000'}
                      onChange={(e) => ubah((d) => ({ ...d, tema: { ...d.tema, warna: { ...d.tema.warna, [k]: e.target.value.toUpperCase() } } }))}
                      className="size-9 cursor-pointer rounded-lg border border-garis bg-transparent"
                    />
                    <span>
                      {NAMA_WARNA[k]}
                      <span className="block font-mono text-[0.65rem] text-redup">{draf.tema.warna[k]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </details>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold">
                Huruf judul
                <Select value={draf.tema.huruf?.judul} onChange={(e) => ubah((d) => ({ ...d, tema: { ...d.tema, huruf: { ...d.tema.huruf, judul: e.target.value } } }))} className="mt-1">
                  {huruf.judul.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-semibold">
                Huruf isi
                <Select value={draf.tema.huruf?.isi} onChange={(e) => ubah((d) => ({ ...d, tema: { ...d.tema, huruf: { ...d.tema.huruf, isi: e.target.value } } }))} className="mt-1">
                  {huruf.isi.map((h) => (
                    <option key={h}>{h}</option>
                  ))}
                </Select>
              </label>
            </div>
          </section>

          <section className="kartu p-5">
            <h2 className="mb-4 font-isi text-base font-semibold">Teks judul bagian</h2>
            <div className="space-y-3">
              {['jadwal', 'sektor', 'kalender', 'staf'].map((b) => (
                <div key={b} className="grid grid-cols-[6rem_1fr] items-center gap-2">
                  <Input
                    value={draf.teks_bagian?.[b]?.label || ''}
                    onChange={(e) => ubah((d) => ({ ...d, teks_bagian: { ...d.teks_bagian, [b]: { ...d.teks_bagian?.[b], label: e.target.value } } }))}
                    aria-label={`Label ${b}`}
                    className="min-h-10 text-xs"
                  />
                  <Input
                    value={draf.teks_bagian?.[b]?.judul || ''}
                    onChange={(e) => ubah((d) => ({ ...d, teks_bagian: { ...d.teks_bagian, [b]: { ...d.teks_bagian?.[b], judul: e.target.value } } }))}
                    aria-label={`Judul ${b}`}
                    className="min-h-10"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-2 flex items-center gap-2 text-sm text-redup">
            <span className={cn('size-2 rounded-full', berubah ? 'bg-emas' : 'bg-daun')} />
            {berubah ? 'Pratinjau draf — belum diterbitkan' : 'Sama dengan yang tayang'}
          </p>
          <PratinjauSitus query="pratinjau=1" tinggi="h-[78vh]" />
        </div>
      </div>

      <Dialog buka={riwayat} tutup={() => setRiwayat(false)} judul="Riwayat layout" deskripsi="10 versi terakhir sebelum perubahan." lebar="md">
        <ul className="divide-y divide-garis">
          {(admin.info.riwayat_layout || []).map((r) => (
            <li key={r.indeks} className="flex items-center gap-3 py-3">
              <div className="flex-1 text-sm">
                <p className="font-medium">{tanggal(r.waktu, 'pendek')} · {jam(r.waktu)}</p>
                <p className="text-xs text-redup">oleh {r.oleh}</p>
              </div>
              <Button varian="sekunder" ukuran="sm" memuat={proses === `pulih-${r.indeks}`} onClick={() => terbitkan(r.indeks)}>
                Pulihkan
              </Button>
            </li>
          ))}
          {!admin.info.riwayat_layout?.length && <li className="py-6 text-center text-sm text-redup">Belum ada riwayat.</li>}
        </ul>
      </Dialog>
    </HalamanAdmin>
  );
}
