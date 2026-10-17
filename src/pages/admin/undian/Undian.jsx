import { useEffect, useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { CalendarRange, Check, Dices, ListRestart, RotateCcw, Save, Sparkles, Undo2, Users, X } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { useAdmin } from '../../../lib/admin.jsx';
import { useData } from '../../../lib/data.jsx';
import { tanggal, namaHari } from '../../../lib/format.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Dialog } from '../../../components/ui/Dialog.jsx';
import { Input } from '../../../components/ui/Isian.jsx';
import { FotoStaf } from '../../../components/ui/Gambar.jsx';
import { Kerangka, KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { KotakStat } from '../../../components/chart/Angka.jsx';
import { HalamanAdmin } from '../AdminLayout.jsx';
import { RodaUndian, acakIndeks } from './RodaUndian.jsx';

const KUNCI_DRAF = 'fc_undian_draf';

/** Kartu nama staf; layoutId yang sama membuat kartu "terbang" dari hasil undian ke kartu firqoh. */
function ChipStaf({ s, besar = false, children }) {
  return (
    <m.div
      layoutId={`staf-${s.id}`}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className={cn('flex items-center gap-2 rounded-full bg-gading ring-1 ring-garis', besar ? 'px-3 py-2' : 'py-1 pl-1 pr-2.5 text-xs')}
    >
      <FotoStaf nama={s.nama} fotoId={s.foto_id} ukuran={besar ? 'md' : 'sm'} />
      <span className={cn('truncate', besar ? 'font-judul text-xl' : 'font-medium')}>{s.nama}</span>
      {children}
    </m.div>
  );
}

/** A-02 Undian firqoh dua mingguan (F-55): yang diundi nama staf satu per satu. */
export default function Undian() {
  const admin = useAdmin();
  const data = useData();
  const info = admin.info;
  const staf = useMemo(() => (info?.staf || []).filter((s) => s.aktif).sort((a, b) => a.nama.localeCompare(b.nama)), [info]);
  const firqoh = useMemo(() => (info?.firqoh || []).filter((f) => f.aktif).sort((a, b) => (Number(a.urutan) || 99) - (Number(b.urutan) || 99)), [info]);
  const petaStaf = useMemo(() => Object.fromEntries(staf.map((s) => [s.id, s])), [staf]);

  const [penempatan, setPenempatan] = useState(null);
  const [terpilih, setTerpilih] = useState(null);
  const [target, setTarget] = useState(null);
  const [putaranKe, setPutaranKe] = useState(0);
  const [pilihLain, setPilihLain] = useState(false);
  const [pratinjau, setPratinjau] = useState(null);
  const [tglMulai, setTglMulai] = useState('');
  const [proses, setProses] = useState('');
  const [konfirmReset, setKonfirmReset] = useState(false);

  // pulihkan draf: simpanan lokal → draf server → kosong
  useEffect(() => {
    if (!info || penempatan) return;
    const sah = (x) => petaStaf[x.staf_id] && firqoh.some((f) => f.id === x.firqoh_id);
    try {
      const lokal = JSON.parse(localStorage.getItem(KUNCI_DRAF) || 'null');
      if (Array.isArray(lokal) && lokal.every(sah)) return setPenempatan(lokal);
    } catch {
      /* abaikan */
    }
    const draf = (info.siklus || []).find((s) => s.status === 'Draf');
    if (draf) {
      return setPenempatan(
        (info.anggota || [])
          .filter((a) => a.siklus_id === draf.id)
          .sort((a, b) => (a.putaran_ke || 0) - (b.putaran_ke || 0))
          .map((a) => ({ staf_id: a.staf_id, firqoh_id: a.firqoh_id, putaran_ke: a.putaran_ke }))
          .filter(sah)
      );
    }
    setPenempatan([]);
  }, [info, penempatan, petaStaf, firqoh]);

  useEffect(() => {
    if (!penempatan) return;
    try {
      localStorage.setItem(KUNCI_DRAF, JSON.stringify(penempatan));
    } catch {
      /* abaikan */
    }
  }, [penempatan]);

  if (!info || !penempatan) return <Kerangka className="h-[70vh] w-full rounded-kartu" />;
  if (!firqoh.length) return <KotakPesan teks="Belum ada firqoh aktif. Tambahkan di menu Pengguna & Staf." />;

  const ditempatkan = new Set(penempatan.map((p) => p.staf_id));
  const pool = staf.filter((s) => !ditempatkan.has(s.id) && s.id !== terpilih);
  const target_ = Math.ceil(staf.length / firqoh.length);
  const anggotaDari = (fid) => penempatan.filter((p) => p.firqoh_id === fid).map((p) => petaStaf[p.staf_id]).filter(Boolean);
  const saran = [...firqoh].sort((a, b) => anggotaDari(a.id).length - anggotaDari(b.id).length || (Number(a.urutan) || 99) - (Number(b.urutan) || 99))[0];
  const selesai = pool.length === 0 && !terpilih;

  const putar = () => {
    if (!pool.length || terpilih || target !== null) return;
    setPilihLain(false);
    setTarget(acakIndeks(pool.length));
    setPutaranKe((n) => n + 1);
  };
  const hasilPutar = (idx) => {
    const s = pool[idx];
    setTarget(null);
    if (s) setTerpilih(s.id);
  };
  const tempatkan = (firqohId) => {
    setPenempatan((p) => [...p, { staf_id: terpilih, firqoh_id: firqohId, putaran_ke: p.length + 1 }]);
    setTerpilih(null);
    setPilihLain(false);
  };
  const pindah = (stafId, firqohId) => setPenempatan((p) => p.map((x) => (x.staf_id === stafId ? { ...x, firqoh_id: firqohId } : x)));
  const keluarkan = (stafId) => setPenempatan((p) => p.filter((x) => x.staf_id !== stafId).map((x, i) => ({ ...x, putaran_ke: i + 1 })));
  const batalTerakhir = () => setPenempatan((p) => p.slice(0, -1));

  const simpanDraf = async () => {
    setProses('draf');
    try {
      await admin.jalankan('jalankanUndian', { mode: 'draf', penempatan }, 'Draf undian tersimpan.');
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  const bukaPratinjau = async (tgl) => {
    setProses('pratinjau');
    try {
      const r = await admin.jalankan('pratinjauUndian', { tanggal_mulai: tgl || undefined });
      setPratinjau(r);
      setTglMulai(r.tanggal_mulai);
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  const terapkan = async () => {
    setProses('terapkan');
    try {
      await admin.jalankan('jalankanUndian', { mode: 'terapkan', penempatan, tanggal_mulai: tglMulai }, 'Jadwal 14 hari diterapkan dan diterbitkan.');
      localStorage.removeItem(KUNCI_DRAF);
      setPratinjau(null);
      setPenempatan(null);
      await admin.muatUlang();
      data.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  const sTerpilih = terpilih ? petaStaf[terpilih] : null;

  return (
    <HalamanAdmin
      label="Siklus 14 hari"
      judul="Undian Staf ke Firqoh"
      keterangan="Putar roda untuk mengundi nama staf satu per satu. Imam subuh tidak diundi; mengikuti urutan staf tetap."
      aksi={
        <>
          <Button varian="sekunder" ukuran="sm" ikon={Save} memuat={proses === 'draf'} onClick={simpanDraf} disabled={!penempatan.length}>
            Simpan draf
          </Button>
          <Button ukuran="sm" ikon={CalendarRange} memuat={proses === 'pratinjau'} onClick={() => bukaPratinjau()} disabled={!selesai}>
            Pratinjau & terapkan
          </Button>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KotakStat label="Total staf" nilai={staf.length} ikon={Users} sub="Staf aktif" />
        <KotakStat label="Sudah ditempatkan" nilai={penempatan.length} ikon={Check}>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-garis">
            <m.div className="h-full bg-daun" animate={{ width: `${staf.length ? (penempatan.length / staf.length) * 100 : 0}%` }} />
          </div>
        </KotakStat>
        <KotakStat label="Sisa antrean" nilai={pool.length} ikon={Dices} sub="Menunggu diputar" />
        <KotakStat label="Firqoh" nilai={firqoh.length} ikon={Sparkles} sub={`Target ±${target_} orang/firqoh`} />
      </div>

      <LayoutGroup>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="kartu p-5 md:p-6">
            <RodaUndian nama={pool} target={target} putaranKe={putaranKe} onSelesai={hasilPutar} onPutar={putar} bisaPutar={!terpilih && pool.length > 0} />

            <AnimatePresence mode="wait">
              {sTerpilih ? (
                <m.div
                  key="hasil"
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative mt-6 overflow-hidden rounded-kartu border border-emas/50 bg-gading p-5 shadow-angkat"
                >
                  {/* kilau emas singkat */}
                  <m.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-emas/35 to-transparent"
                    initial={{ x: '0%' }}
                    animate={{ x: '400%' }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                  <p className="label-bagian">Hasil undian · putaran {penempatan.length + 1}</p>
                  <div className="mt-3 flex">
                    <ChipStaf s={sTerpilih} besar />
                  </div>
                  <p className="mt-4 text-sm text-redup">
                    Saran: <b className="text-tinta">{saran.nama_firqoh}</b> ({anggotaDari(saran.id).length} anggota, paling sedikit)
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button ikon={Check} onClick={() => tempatkan(saran.id)}>
                      Masukkan ke {saran.nama_firqoh}
                    </Button>
                    <Button varian="sekunder" onClick={() => setPilihLain(!pilihLain)}>
                      Pilih firqoh lain
                    </Button>
                    <Button varian="hantu" ikon={RotateCcw} onClick={() => setTerpilih(null)}>
                      Kocok ulang
                    </Button>
                  </div>
                  {pilihLain && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {firqoh.map((f) => (
                        <button key={f.id} type="button" onClick={() => tempatkan(f.id)} className="min-h-10 rounded-full border border-garis bg-krem px-3.5 text-sm hover:border-emas">
                          {f.nama_firqoh} · {anggotaDari(f.id).length}
                        </button>
                      ))}
                    </div>
                  )}
                </m.div>
              ) : selesai ? (
                <m.div key="selesai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-kartu bg-hijau p-5 text-gading">
                  <p className="font-judul text-2xl">Semua staf sudah ditempatkan.</p>
                  <p className="mt-1 text-sm text-gading/75">Lihat pratinjau jadwal 14 hari, lalu terapkan.</p>
                  <Button varian="terang" ikon={CalendarRange} className="mt-4" memuat={proses === 'pratinjau'} onClick={() => bukaPratinjau()}>
                    Pratinjau jadwal
                  </Button>
                </m.div>
              ) : (
                <m.p key="petunjuk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center text-sm text-redup">
                  Tekan <b>Putar</b> untuk mengundi nama berikutnya.
                </m.p>
              )}
            </AnimatePresence>

            <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-garis pt-4">
              <Button varian="hantu" ukuran="sm" ikon={Undo2} onClick={batalTerakhir} disabled={!penempatan.length || !!terpilih}>
                Batalkan putaran terakhir
              </Button>
              <Button varian="hantu" ukuran="sm" ikon={ListRestart} onClick={() => setKonfirmReset(true)} disabled={!penempatan.length}>
                Reset semua
              </Button>
            </div>
          </section>

          {/* kartu firqoh tujuan (laptop: samping; HP: baris geser) */}
          <aside className="tanpa-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
            {firqoh.map((f) => {
              const ang = anggotaDari(f.id);
              const penuh = ang.length >= target_;
              return (
                <m.div layout key={f.id} className={cn('kartu w-72 shrink-0 snap-start p-4 xl:w-auto', saran.id === f.id && sTerpilih && 'ring-2 ring-emas')}>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ background: f.warna || 'var(--color-hijau)' }} />
                    <p className="flex-1 truncate font-semibold">{f.nama_firqoh}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs tabular-nums', penuh ? 'bg-daun/15 text-hijau' : 'bg-emas/15 text-emas-tua')}>
                      {ang.length}/{target_}
                    </span>
                  </div>
                  <div className="mt-3 flex min-h-10 flex-wrap gap-1.5">
                    {ang.map((s) => (
                      <ChipStaf key={s.id} s={s}>
                        <select
                          aria-label={`Pindahkan ${s.nama}`}
                          value={f.id}
                          onChange={(e) => (e.target.value === '__keluar' ? keluarkan(s.id) : pindah(s.id, e.target.value))}
                          className="ml-0.5 w-5 cursor-pointer appearance-none bg-transparent text-[0] focus:outline-none"
                          title="Pindah / keluarkan"
                        >
                          {firqoh.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nama_firqoh}
                            </option>
                          ))}
                          <option value="__keluar">Kembalikan ke antrean</option>
                        </select>
                        <span className="-ml-4 text-redup" aria-hidden>
                          ▾
                        </span>
                      </ChipStaf>
                    ))}
                    {!ang.length && <span className="text-xs text-redup">Belum ada anggota</span>}
                  </div>
                </m.div>
              );
            })}
          </aside>
        </div>
      </LayoutGroup>

      <Dialog
        buka={!!pratinjau}
        tutup={() => setPratinjau(null)}
        judul="Pratinjau jadwal 14 hari"
        deskripsi="Firqoh bergiliran sesuai urutan; imam mengikuti urutan staf tetap."
        lebar="xl"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setPratinjau(null)} ikon={X}>
              Tutup
            </Button>
            <Button ikon={Check} memuat={proses === 'terapkan'} onClick={terapkan}>
              Terapkan & terbitkan
            </Button>
          </>
        }
      >
        {pratinjau && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Tanggal mulai</span>
                <Input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} className="w-48" />
              </label>
              <Button varian="sekunder" ukuran="sm" memuat={proses === 'pratinjau'} onClick={() => bukaPratinjau(tglMulai)}>
                Hitung ulang
              </Button>
              <p className="text-sm text-redup">
                {tanggal(pratinjau.tanggal_mulai, 'pendek')} – {tanggal(pratinjau.tanggal_selesai, 'pendek')}
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-garis">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="bg-krem text-left text-xs uppercase tracking-[0.06em] text-redup">
                  <tr>
                    <th className="px-3 py-2">Tanggal</th>
                    <th className="px-3 py-2">Firqoh</th>
                    <th className="px-3 py-2">Anggota</th>
                    <th className="px-3 py-2">Imam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis">
                  {pratinjau.hari.map((h) => (
                    <tr key={h.tanggal}>
                      <td className="whitespace-nowrap px-3 py-2">
                        {namaHari(h.tanggal)}, {tanggal(h.tanggal, 'hariBulan')}
                      </td>
                      <td className="px-3 py-2">
                        <span className="mr-1.5 inline-block size-2.5 rounded-full" style={{ background: h.warna || 'var(--color-hijau)' }} />
                        {h.firqoh}
                      </td>
                      <td className="px-3 py-2 text-xs text-redup">{anggotaDari(h.firqoh_id).map((s) => s.nama).join(', ')}</td>
                      <td className="px-3 py-2">{h.imam || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        buka={konfirmReset}
        tutup={() => setKonfirmReset(false)}
        judul="Reset semua penempatan?"
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setKonfirmReset(false)}>
              Batal
            </Button>
            <Button
              varian="bahaya"
              onClick={() => {
                setPenempatan([]);
                setTerpilih(null);
                setKonfirmReset(false);
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-redup">Semua staf kembali ke antrean roda.</p>
      </Dialog>
    </HalamanAdmin>
  );
}
