import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Clock } from 'lucide-react';
import { namaHari } from '../../../lib/format.js';
import { bergiliran, muncul } from '../../../lib/motion.jsx';
import { Segmen } from '../../../components/ui/Segmen.jsx';
import { FotoStaf } from '../../../components/ui/Gambar.jsx';
import { Lencana } from '../../../components/ui/Lencana.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';

const HARI = ['Sabtu', 'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const warnaTujuan = (t) => (/pasca/i.test(t) ? 'hijau' : /icg|nganjuk/i.test(t) ? 'batu' : /dosen/i.test(t) ? 'emas' : 'netral');

/** F-32 Jadwal driver rutin per hari: jam, driver, kendaraan, tujuan. */
export function JadwalDriver({ rows = [], staf = [], kendaraan = [], hariIni }) {
  const [hari, setHari] = useState(() => namaHari(hariIni) || 'Sabtu');
  const petaStaf = useMemo(() => Object.fromEntries(staf.map((s) => [s.id, s])), [staf]);
  const petaKnd = useMemo(() => Object.fromEntries(kendaraan.map((k) => [k.id, k])), [kendaraan]);
  const pilihan = HARI.map((h) => ({ nilai: h, label: h, jumlah: rows.filter((r) => r.hari === h).length }));
  const daftar = rows.filter((r) => r.hari === hari).sort((a, b) => String(a.jam).localeCompare(String(b.jam)));

  const siapkanPdf = () => ({
    judul: 'Jadwal Driver Rutin',
    subjudul: 'Sektor Kendaraan',
    tabel: [
      {
        kepala: [['Hari', 'Jam', 'Driver', 'Kendaraan', 'Tujuan']],
        badan: HARI.flatMap((h) =>
          rows
            .filter((r) => r.hari === h)
            .sort((a, b) => String(a.jam).localeCompare(String(b.jam)))
            .map((r) => [h, r.jam || '–', petaStaf[r.driver_staf_id]?.nama || '–', petaKnd[r.kendaraan_id]?.nama || '–', r.tujuan || '–'])
        )
      }
    ],
    namaBerkas: 'jadwal-driver'
  });

  return (
    <div className="kartu overflow-hidden">
      <div className="flex items-center gap-3 border-b border-garis px-4 py-3 md:px-5">
        <Segmen pilihan={pilihan} nilai={hari} ubah={setHari} idTata="hari-driver" label="Pilih hari" className="min-w-0 flex-1" />
        <TombolPdf label="Unduh PDF jadwal driver" siapkan={siapkanPdf} />
      </div>
      <AnimatePresence mode="wait">
        <m.ul key={hari} variants={bergiliran(0.06)} initial="tersembunyi" animate="tampil" exit={{ opacity: 0, transition: { duration: 0.12 } }} className="divide-y divide-garis">
          {daftar.map((r) => {
            const d = petaStaf[r.driver_staf_id];
            return (
              <m.li key={r.id} variants={muncul} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 px-4 py-3.5 md:grid-cols-[6rem_1.2fr_1fr_auto] md:px-5">
                <p className="flex items-center gap-1.5 font-judul text-xl tabular-nums text-hijau">
                  <Clock className="hidden size-4 text-emas-tua md:block" aria-hidden />
                  {String(r.jam || '').replace(':', '.')}
                </p>
                <div className="flex min-w-0 items-center gap-2.5">
                  <FotoStaf nama={d?.nama || '?'} fotoId={d?.foto_id} ukuran="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d?.nama || 'Driver belum diisi'}</p>
                    <p className="truncate text-xs text-redup md:hidden">{petaKnd[r.kendaraan_id]?.nama || '–'}</p>
                  </div>
                </div>
                <p className="hidden truncate text-sm text-redup md:block">{petaKnd[r.kendaraan_id]?.nama || '–'}</p>
                <div className="col-start-2 md:col-start-auto">
                  <Lencana warna={warnaTujuan(r.tujuan)}>{r.tujuan}</Lencana>
                </div>
              </m.li>
            );
          })}
        </m.ul>
      </AnimatePresence>
      {!daftar.length && <KotakPesan teks={`Tidak ada jadwal rutin hari ${hari}.`} className="m-4" />}
    </div>
  );
}
