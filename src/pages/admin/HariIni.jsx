import { useEffect, useMemo, useState } from 'react';
import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { CircleCheck, CircleAlert, Clock, History, MapPin, Moon, Radio, RotateCcw, Users, CupSoda, CalendarRange, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useData } from '../../lib/data.jsx';
import { tanggal, namaHari, jam, tambahHari } from '../../lib/format.js';
import { bergiliran, muncul } from '../../lib/motion.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { Select } from '../../components/ui/Isian.jsx';
import { FotoStaf } from '../../components/ui/Gambar.jsx';
import { Kerangka, KotakPesan } from '../../components/ui/Kerangka.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';
import { BannerContoh } from './BannerContoh.jsx';

function ChipStatus({ status }) {
  if (status === 'Sudah') return <Lencana warna="hijau" ikon={CircleCheck}>Sudah</Lencana>;
  if (status === 'Belum') return <Lencana warna="bata" ikon={CircleAlert}>Belum</Lencana>;
  return <Lencana warna="netral" ikon={Clock}>Belum ditandai</Lencana>;
}

const PENJELASAN = {
  firqoh: 'Firqoh ini dijadwalkan sendiri 2 hari berikutnya (Konsekuensi). Semua jadwal setelahnya mundur 2 hari, dan WA dikirim ke anggotanya.',
  imam: 'Imam tercatat sebagai PJ Minuman Siang hari ini, dan WA dikirim kepadanya.'
};

/** A-01 Hari Ini — centang harian firqoh & imam (F-53) dengan konsekuensi otomatis + undo (F-54). */
export default function HariIni() {
  const admin = useAdmin();
  const data = useData();
  const info = admin.info;
  const [jadwal, setJadwal] = useState(null);
  const [tgl, setTgl] = useState(null);
  const [konfirm, setKonfirm] = useState(null); // { jenis }
  const [proses, setProses] = useState('');

  useEffect(() => {
    if (info?.jadwal) setJadwal(info.jadwal);
    if (info?.hari_ini && !tgl) setTgl(info.hari_ini);
  }, [info, tgl]);

  const hari = info?.hari_ini;
  const pilihanTanggal = useMemo(() => (hari ? Array.from({ length: 7 }, (_, i) => tambahHari(hari, -i)) : []), [hari]);
  const j = jadwal?.find((x) => x.tanggal === tgl);
  const mendatang = (jadwal || []).filter((x) => hari && x.tanggal > hari).slice(0, 7);

  const tandai = async (jenis, status) => {
    setProses(`${jenis}-${status}`);
    try {
      const r = await admin.jalankan('tandaiHarian', { jenis, status, tanggal: tgl });
      // perbarui jadwal yang tampil dengan rentang terbaru dari server
      setJadwal((lama) => {
        const peta = Object.fromEntries((lama || []).map((x) => [x.tanggal, x]));
        r.jadwal.forEach((x) => {
          peta[x.tanggal] = x;
        });
        return Object.values(peta).sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
      });
      const waTeks = r.wa.total ? ` WA: ${r.wa.terkirim}/${r.wa.total} terkirim.` : '';
      data.muatUlang(); // beranda publik ikut berubah
      setKonfirm(null);
      admin.muatUlang();
      return { pesan: r.pesan + waTeks };
    } catch {
      return null;
    } finally {
      setProses('');
    }
  };

  const klik = async (jenis, status) => {
    if (status === 'Belum') return setKonfirm({ jenis });
    const r = await tandai(jenis, status);
    if (r) toastSingkat(r.pesan);
  };
  const [pesan, setPesan] = useState('');
  const toastSingkat = (p) => {
    setPesan(p);
    setTimeout(() => setPesan(''), 5000);
  };

  if (!info) return <Kerangka className="h-[70vh] w-full rounded-kartu" />;
  const logWa = info.log_wa || [];

  return (
    <HalamanAdmin
      label="Siklus berjalan"
      judul="Verifikasi Tugas Hari Ini"
      keterangan="Tandai firqoh Subuh Berkah dan imam subuh. Tanda Belum bisa dibatalkan di hari yang sama."
      aksi={
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gading px-3.5 text-xs ring-1 ring-garis">
            <Radio className={cn('size-3.5', info.wa?.token_terisi ? 'text-daun' : 'text-bata')} aria-hidden />
            WA {info.wa?.token_terisi ? 'tersambung' : 'belum diatur'}
          </span>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gading px-3.5 text-xs ring-1 ring-garis">
            <History className="size-3.5 text-emas-tua" aria-hidden /> Batas undo 23.59 WIB
          </span>
        </div>
      }
    >
      <BannerContoh />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={tgl || ''} onChange={(e) => setTgl(e.target.value)} aria-label="Tanggal yang ditandai" className="w-64">
          {pilihanTanggal.map((t, i) => (
            <option key={t} value={t}>
              {i === 0 ? 'Hari ini · ' : i === 1 ? 'Kemarin · ' : ''}
              {tanggal(t)}
            </option>
          ))}
        </Select>
        <AnimatePresence>
          {pesan && (
            <m.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm text-hijau" role="status">
              {pesan}
            </m.p>
          )}
        </AnimatePresence>
      </div>

      {!j || (!j.firqoh && !j.imam) ? (
        <KotakPesan teks="Tidak ada jadwal pada tanggal ini. Jalankan undian untuk membentuk jadwal." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Firqoh */}
          <m.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="kartu flex flex-col p-5 md:p-6">
            <div className="flex flex-wrap items-start gap-2">
              <div className="flex-1">
                <p className="label-bagian">Tugas lapangan · Firqoh</p>
                <h2 className="mt-1 text-3xl leading-tight">{j.firqoh?.nama || '–'}</h2>
              </div>
              {j.jenis === 'Konsekuensi' && <Lencana warna="bata">Konsekuensi</Lencana>}
              <ChipStatus status={j.status} />
            </div>
            {j.konsekuensi && <p className="mt-2 text-sm text-bata">{j.konsekuensi.alasan}</p>}
            <p className="mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-redup">
              <Users className="size-3.5" aria-hidden /> {j.firqoh?.anggota.length || 0} anggota bertugas
            </p>
            <m.ul variants={bergiliran(0.05)} initial="tersembunyi" animate="tampil" className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(j.firqoh?.anggota || []).map((a) => (
                <m.li key={a.id} variants={muncul} className="flex items-center gap-2 rounded-xl bg-krem px-2.5 py-2 text-sm">
                  <FotoStaf nama={a.nama} fotoId={a.foto_id} ukuran="sm" />
                  <span className="truncate">{a.nama}</span>
                </m.li>
              ))}
            </m.ul>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-krem/80 px-3 py-2 text-xs text-redup">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Tandai setelah koordinasi ba'da subuh di pos komando.
            </p>
            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <Button ikon={CircleCheck} ukuran="lg" memuat={proses === 'firqoh-Sudah'} disabled={j.status === 'Sudah' || !j.firqoh} onClick={() => klik('firqoh', 'Sudah')}>
                Sudah
              </Button>
              <Button varian="bahayaLembut" ikon={CircleAlert} ukuran="lg" disabled={j.status === 'Belum' || !j.firqoh} onClick={() => klik('firqoh', 'Belum')}>
                Belum
              </Button>
            </div>
            {j.status && j.status !== 'Terjadwal' && (
              <button type="button" onClick={() => klik('firqoh', 'Batal')} className="mt-3 inline-flex items-center gap-1.5 self-center text-xs font-semibold text-redup underline underline-offset-2 hover:text-hijau">
                <RotateCcw className="size-3.5" aria-hidden /> Batalkan tanda (undo)
              </button>
            )}
          </m.section>

          {/* Imam */}
          <m.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="kartu flex flex-col p-5 md:p-6">
            <div className="flex flex-wrap items-start gap-2">
              <div className="flex-1">
                <p className="label-bagian">Imam Subuh · Masjid Jami'</p>
                <h2 className="mt-1 text-3xl leading-tight">{j.imam?.nama || '–'}</h2>
              </div>
              {j.imam && <ChipStatus status={j.imam.status} />}
            </div>
            {j.imam && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-krem/80 p-3">
                <FotoStaf nama={j.imam.nama} fotoId={j.imam.foto_id} ukuran="lg" />
                <p className="text-sm text-redup">
                  <Moon className="mr-1 inline size-3.5" aria-hidden />
                  Giliran dari urutan imam tetap
                </p>
              </div>
            )}
            {j.pj_minuman_siang?.length > 0 && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-emas/15 px-3 py-2.5 text-sm">
                <CupSoda className="mt-0.5 size-4 shrink-0 text-emas-tua" aria-hidden />
                PJ Minuman Siang: <b className="font-semibold">{j.pj_minuman_siang.map((p) => p.nama).join(', ')}</b>
              </p>
            )}
            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <Button ikon={CircleCheck} ukuran="lg" memuat={proses === 'imam-Sudah'} disabled={!j.imam || j.imam.status === 'Sudah'} onClick={() => klik('imam', 'Sudah')}>
                Sudah
              </Button>
              <Button varian="bahayaLembut" ikon={CircleAlert} ukuran="lg" disabled={!j.imam || j.imam.status === 'Belum'} onClick={() => klik('imam', 'Belum')}>
                Belum
              </Button>
            </div>
            {j.imam && j.imam.status !== 'Terjadwal' && (
              <button type="button" onClick={() => klik('imam', 'Batal')} className="mt-3 inline-flex items-center gap-1.5 self-center text-xs font-semibold text-redup underline underline-offset-2 hover:text-hijau">
                <RotateCcw className="size-3.5" aria-hidden /> Batalkan tanda (undo)
              </button>
            )}
          </m.section>
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="kartu p-5 md:p-6">
          <h2 className="flex items-center gap-2 font-isi text-base font-semibold text-tinta">
            <CalendarRange className="size-5 text-emas-tua" aria-hidden /> Proyeksi 7 hari ke depan
          </h2>
          <ul className="mt-4 space-y-2">
            {mendatang.map((x) => (
              <li key={x.tanggal} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', x.jenis === 'Konsekuensi' ? 'bg-bata/8' : 'bg-krem/80')}>
                <div className="w-12 text-center">
                  <p className="text-[0.65rem] font-semibold uppercase text-redup">{namaHari(x.tanggal).slice(0, 3)}</p>
                  <p className="font-judul text-xl leading-none">{Number(x.tanggal.slice(8, 10))}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{x.firqoh?.nama || 'Belum ada jadwal'}</p>
                  <p className="truncate text-xs text-redup">Imam: {x.imam?.nama || '–'}</p>
                </div>
                {x.jenis === 'Konsekuensi' ? <Lencana warna="bata">Konsekuensi</Lencana> : x.firqoh ? <Lencana warna="netral">Terjadwal</Lencana> : null}
              </li>
            ))}
            {!mendatang.length && <li className="text-sm text-redup">Belum ada jadwal mendatang.</li>}
          </ul>
        </section>
        <section className="kartu p-5 md:p-6">
          <h2 className="flex items-center gap-2 font-isi text-base font-semibold text-tinta">
            <MessageCircle className="size-5 text-emas-tua" aria-hidden /> Aktivitas WhatsApp
          </h2>
          <ul className="mt-4 space-y-3">
            {logWa.slice(0, 6).map((l) => (
              <li key={l.id} className="rounded-xl border border-garis p-3">
                <div className="flex items-center gap-2 text-xs text-redup">
                  <span className="font-semibold text-tinta">{l.tujuan}</span>
                  <span className="ml-auto">{tanggal(l.waktu, 'hariBulan')} {jam(l.waktu)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-redup">{l.isi}</p>
                <Lencana warna={l.status_fonnte === 'TERKIRIM' ? 'hijau' : 'bata'} className="mt-2">
                  {l.status_fonnte === 'TERKIRIM' ? 'Terkirim' : l.status_fonnte}
                </Lencana>
              </li>
            ))}
            {!logWa.length && <li className="text-sm text-redup">Belum ada pesan.</li>}
          </ul>
          <a href="#/admin/wa" className="mt-4 inline-block text-sm font-semibold text-hijau underline underline-offset-2">
            Riwayat lengkap di menu WhatsApp
          </a>
        </section>
      </div>

      <Dialog
        buka={!!konfirm}
        tutup={() => setKonfirm(null)}
        judul={konfirm?.jenis === 'imam' ? `Tandai imam "Belum"?` : `Tandai firqoh "Belum"?`}
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setKonfirm(null)}>
              Batal
            </Button>
            <Button
              varian="bahaya"
              memuat={proses === `${konfirm?.jenis}-Belum`}
              onClick={async () => {
                const r = await tandai(konfirm.jenis, 'Belum');
                if (r) toastSingkat(r.pesan);
              }}
            >
              Ya, tandai Belum
            </Button>
          </>
        }
      >
        <p className="text-sm text-redup">{konfirm && PENJELASAN[konfirm.jenis]}</p>
      </Dialog>
    </HalamanAdmin>
  );
}
