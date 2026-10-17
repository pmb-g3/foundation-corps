import { Construction, Hammer, LandPlot, PlugZap, Wallet, Zap } from 'lucide-react';
import { Bagian } from '../../../components/layout/Bagian.jsx';
import { SektorLayout } from '../SektorLayout.jsx';
import { Showroom } from '../Showroom.jsx';
import { RekapKeuangan } from '../RekapKeuangan.jsx';
import { TambalSulam } from './TambalSulam.jsx';
import { Proyek } from './Proyek.jsx';
import { GrafikListrik } from './GrafikListrik.jsx';
import { DenahBangunan } from './DenahBangunan.jsx';

const BAGIAN = [
  { id: 'tambal', label: 'Tambal Sulam', ikon: Hammer },
  { id: 'proyek', label: 'Proyek', ikon: Construction },
  { id: 'genset', label: 'Genset', ikon: PlugZap },
  { id: 'listrik', label: 'Listrik', ikon: Zap },
  { id: 'denah', label: 'Denah', ikon: LandPlot },
  { id: 'keuangan', label: 'Keuangan', ikon: Wallet }
];

export default function Pembangunan({ sektor, data, edit }) {
  const t = data.tabel;
  const genset = (t.Genset || []).map((g) => ({ id: g.id, nama: g.nama, sub: g.kapasitas, foto_ids: g.foto_ids, spesifikasi: g.spesifikasi, status: g.status }));
  const luasBangunan = (t.Bangunan || []).reduce((s, b) => s + (Number(b.luas_m2) || 0), 0);

  return (
    <SektorLayout
      sektor={sektor}
      kartu={data.kartu}
      bagian={BAGIAN}
      stat={[
        { label: 'Proyek berjalan', nilai: (t.Proyek || []).filter((p) => p.status === 'Berjalan').length },
        { label: 'Program tambal sulam', nilai: (t.Program_TambalSulam || []).length },
        { label: 'Genset', nilai: `${genset.length} unit` }
      ]}
    >
      <Bagian id="tambal" label="Perawatan" judul="Program Tambal Sulam" onEdit={edit.tabel('Program_TambalSulam', 'Program tambal sulam')}>
        <TambalSulam rows={t.Program_TambalSulam} />
      </Bagian>
      <Bagian id="proyek" label="Konstruksi" judul="Proyek" onEdit={edit.tabel('Proyek', 'Proyek')} className="bg-gading/60">
        <Proyek rows={t.Proyek} />
      </Bagian>
      <Bagian id="genset" label="Showroom" judul="Genset" onEdit={edit.tabel('Genset', 'Genset')}>
        <Showroom items={genset} kosong="Belum ada data genset." />
      </Bagian>
      <Bagian id="listrik" label="Energi" judul="Tagihan Listrik" onEdit={edit.tabel('Tagihan_Listrik', 'Tagihan listrik')} className="bg-gading/60">
        <GrafikListrik rows={t.Tagihan_Listrik} />
      </Bagian>
      <Bagian
        id="denah"
        label={`${(t.Bangunan || []).length} bangunan · ${luasBangunan.toLocaleString('id-ID')} m²`}
        judul="Denah Bangunan"
        onEdit={edit.tautan('/admin/zona?tab=bangunan')}
      >
        <DenahBangunan rows={t.Bangunan} fotoDenah={data.pengaturan?.denah_bangunan?.foto_id || 'lokal:denah-bangunan'} />
      </Bagian>
      <Bagian id="keuangan" label="Rekap" judul="Keuangan" onEdit={edit.tabel('Keuangan', 'Keuangan', { sektor: sektor.id })} className="pb-24">
        <RekapKeuangan rows={t.Keuangan} sektorLabel={sektor.label} pisahKategori />
      </Bagian>
    </SektorLayout>
  );
}
