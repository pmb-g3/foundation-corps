import { useEffect, useMemo, useState } from 'react';
import { CalendarArrowDown, CalendarX2, RotateCcw, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useData } from '../../lib/data.jsx';
import { useRute } from '../../lib/router.jsx';
import { tanggal, tambahHari } from '../../lib/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field, Input, Select } from '../../components/ui/Isian.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';

/**
 * Undurkan jadwal Subuh Berkah (tab Firqoh, A-11) — khusus Admin Utama.
 * Bila Subuh Berkah ditiadakan pada suatu hari, firqoh hari itu diundur ke esoknya TANPA konsekuensi;
 * jadwal firqoh sesudahnya ikut mundur 1 hari, imam subuh tetap. Bisa dibatalkan selama tanggalnya belum lewat.
 */
export function UndurJadwal() {
  const admin = useAdmin();
  const data = useData();
  const info = admin.info;
  const { query } = useRute();
  const hari = info?.hari_ini || '';
  const pilihan = useMemo(
    () => (info?.jadwal || []).filter((x) => x.tanggal >= hari && x.firqoh && (!x.status || x.status === 'Terjadwal')).slice(0, 14),
    [info, hari]
  );
  const [tgl, setTgl] = useState(() => query.get('undur') || '');
  const [alasan, setAlasan] = useState('');
  const [konfirm, setKonfirm] = useState(false);
  const [proses, setProses] = useState('');
  const dipilih = pilihan.find((x) => x.tanggal === tgl) || pilihan[0];

  // dari menu Hari Ini (?undur=tanggal) → langsung ke bagian ini
  useEffect(() => {
    if (query.get('undur')) document.getElementById('undur-jadwal')?.scrollIntoView({ block: 'start' });
  }, [query]);

  const log = info?.log_konsekuensi || [];
  const terbaruAktif = log.find((l) => !l.dibatalkan && (l.jenis === 'Firqoh' || l.jenis === 'Undur'));
  const riwayat = log.filter((l) => l.jenis === 'Undur').slice(0, 6);

  const selesai = async () => {
    await admin.muatUlang();
    data.muatUlang(); // beranda publik ikut berubah
  };

  const undur = async () => {
    setProses('undur');
    try {
      await admin.jalankan('undurJadwal', { tanggal: dipilih.tanggal, alasan }, 'Jadwal diundur 1 hari tanpa konsekuensi.');
      setKonfirm(false);
      setAlasan('');
      setTgl('');
      await selesai();
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  const batal = async (l) => {
    setProses(l.id);
    try {
      await admin.jalankan('batalUndur', { log_id: l.id }, 'Pengunduran dibatalkan, jadwal kembali seperti semula.');
      await selesai();
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  return (
    <section id="undur-jadwal" className="kartu scroll-mt-24 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emas/15 text-emas-tua">
          <CalendarX2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl">Undurkan jadwal Subuh Berkah</h3>
          <p className="mt-1 text-sm text-redup">
            Bila Subuh Berkah ditiadakan pada suatu hari (libur, acara pondok, dll.), firqoh yang bertugas hari itu diundur ke hari berikutnya{' '}
            <b className="text-tinta">tanpa konsekuensi</b> dan tanpa WA konsekuensi. Jadwal firqoh sesudahnya ikut mundur 1 hari; imam subuh tetap.
          </p>
        </div>
      </div>

      {pilihan.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-end">
          <Field label="Tanggal yang ditiadakan">
            {(p) => (
              <Select {...p} value={dipilih?.tanggal || ''} onChange={(e) => setTgl(e.target.value)}>
                {pilihan.map((x) => (
                  <option key={x.tanggal} value={x.tanggal}>
                    {x.tanggal === hari ? 'Hari ini · ' : x.tanggal === tambahHari(hari, 1) ? 'Besok · ' : ''}
                    {tanggal(x.tanggal)} · {x.firqoh.nama}
                    {x.jenis === 'Konsekuensi' ? ' (konsekuensi)' : ''}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Alasan (opsional)">
            {(p) => <Input {...p} value={alasan} maxLength={120} placeholder="mis. Libur Maulid" onChange={(e) => setAlasan(e.target.value)} />}
          </Field>
          <Button ikon={CalendarArrowDown} onClick={() => setKonfirm(true)} disabled={!dipilih} className="md:mb-0.5">
            Undurkan 1 hari
          </Button>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-krem px-4 py-3 text-sm text-redup">Tidak ada jadwal firqoh mendatang yang bisa diundur.</p>
      )}

      {!!riwayat.length && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-redup">Riwayat pengunduran</p>
          <ul className="divide-y divide-garis rounded-xl border border-garis">
            {riwayat.map((l) => {
              const bisa = !l.dibatalkan && l.tanggal >= hari;
              const urutan = terbaruAktif?.id === l.id;
              return (
                <li key={l.id} className={cn('flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 text-sm', l.dibatalkan && 'opacity-60')}>
                  <span className="w-20 shrink-0 font-semibold tabular-nums text-tinta">{tanggal(l.tanggal, 'hariBulan')}</span>
                  {/* HP: keterangan turun ke baris sendiri di bawah tanggal & tombol */}
                  <span className="order-last min-w-0 basis-full text-redup md:order-none md:flex-1 md:basis-0">{l.keterangan}</span>
                  {l.dibatalkan ? (
                    <Lencana warna="netral">Dibatalkan</Lencana>
                  ) : bisa && urutan ? (
                    <Button varian="hantu" ukuran="sm" ikon={RotateCcw} memuat={proses === l.id} title="Kembalikan jadwal seperti sebelum diundur" onClick={() => batal(l)}>
                      Batalkan
                    </Button>
                  ) : bisa ? (
                    <span className="text-xs text-redup">Batalkan perubahan terbaru dulu</span>
                  ) : (
                    <Lencana warna="emas">Diundur</Lencana>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog
        buka={konfirm && !!dipilih}
        tutup={() => setKonfirm(false)}
        judul="Undurkan jadwal tanpa konsekuensi?"
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" ikon={X} onClick={() => setKonfirm(false)}>
              Batal
            </Button>
            <Button ikon={CalendarArrowDown} memuat={proses === 'undur'} onClick={undur}>
              Ya, undurkan
            </Button>
          </>
        }
      >
        {dipilih && (
          <div className="space-y-3 text-sm text-redup">
            <p>
              Subuh Berkah <b className="text-tinta">{tanggal(dipilih.tanggal)}</b> ditiadakan{alasan.trim() ? ` (${alasan.trim()})` : ''}.
            </p>
            <p className="rounded-xl bg-krem px-3 py-2">
              Firqoh <b className="text-tinta">{dipilih.firqoh.nama}</b> bertugas{' '}
              <b className="text-tinta">{tanggal(tambahHari(dipilih.tanggal, 1))}</b>. Semua jadwal firqoh sesudahnya mundur 1 hari.
            </p>
            <p>Imam subuh tetap sesuai jadwal. Tidak ada konsekuensi dan tidak ada WA konsekuensi. Bisa dibatalkan selama tanggalnya belum lewat.</p>
          </div>
        )}
      </Dialog>
    </section>
  );
}
