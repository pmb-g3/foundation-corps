import { useMemo } from 'react';
import * as m from 'motion/react-m';
import { CalendarClock, Car, TriangleAlert, Wallet } from 'lucide-react';
import { Bagian } from '../../../components/layout/Bagian.jsx';
import { SektorLayout } from '../SektorLayout.jsx';
import { Showroom } from '../Showroom.jsx';
import { RekapKeuangan } from '../RekapKeuangan.jsx';
import { JadwalDriver } from './JadwalDriver.jsx';

const BAGIAN = [
  { id: 'armada', label: 'Armada', ikon: Car },
  { id: 'driver', label: 'Jadwal Driver', ikon: CalendarClock },
  { id: 'keuangan', label: 'Keuangan', ikon: Wallet }
];

export default function Kendaraan({ sektor, data, edit }) {
  const t = data.tabel;
  const tarif = useMemo(() => Object.fromEntries((t.Tarif_Sewa || []).map((x) => [x.kendaraan_id, x])), [t.Tarif_Sewa]);
  const armada = (t.Kendaraan || []).map((k) => ({
    id: k.id,
    nama: k.nama,
    foto_ids: k.foto_ids,
    spesifikasi: k.spesifikasi,
    surat: k.kelengkapan_surat,
    status: k.status,
    catatan: k.catatan_perbaikan,
    tarif: tarif[k.id] || null
  }));
  const bermasalah = armada.filter((k) => k.status && k.status !== 'Siap');

  return (
    <SektorLayout
      sektor={sektor}
      kartu={data.kartu}
      bagian={BAGIAN}
      stat={[
        { label: 'Armada', nilai: `${armada.length} unit` },
        { label: 'Siap jalan', nilai: armada.length - bermasalah.length },
        { label: 'Rute rutin', nilai: (t.Jadwal_Driver || []).length }
      ]}
    >
      {/* F-31: kendaraan Perbaikan/Rusak muncul di bilah pemberitahuan atas halaman */}
      {bermasalah.length > 0 && (
        <m.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="wadah pt-6">
          <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-bata/30 bg-bata/10 px-4 py-3 text-sm text-bata">
            <TriangleAlert className="size-5 shrink-0" aria-hidden />
            <b className="font-semibold">{bermasalah.length} kendaraan tidak siap:</b>
            {bermasalah.map((k) => (
              <span key={k.id}>
                {k.nama} <span className="opacity-75">({k.status})</span>
              </span>
            ))}
          </div>
        </m.div>
      )}
      <Bagian id="armada" label="Showroom" judul="Armada" onEdit={edit.tabel('Kendaraan', 'Kendaraan')}>
        <Showroom items={armada} kosong="Belum ada data kendaraan." />
      </Bagian>
      <Bagian id="driver" label="Rutin" judul="Jadwal Driver" onEdit={edit.tabel('Jadwal_Driver', 'Jadwal driver')} className="bg-gading/60">
        <JadwalDriver rows={t.Jadwal_Driver} staf={data.staf} kendaraan={t.Kendaraan} hariIni={data.hari_ini} />
      </Bagian>
      <Bagian id="keuangan" label="Rekap" judul="Keuangan" onEdit={edit.tabel('Keuangan', 'Keuangan', { sektor: sektor.id })} className="pb-24">
        <RekapKeuangan rows={t.Keuangan} sektorLabel={sektor.label} />
      </Bagian>
    </SektorLayout>
  );
}
