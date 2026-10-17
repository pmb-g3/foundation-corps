import { useMemo } from 'react';
import { Fish, Map, Tag, Wallet } from 'lucide-react';
import { luasHa } from '../../../lib/format.js';
import { hitungKolam, petaParameter } from '../../../lib/budidaya.js';
import { Bagian } from '../../../components/layout/Bagian.jsx';
import { PetaKolam } from '../../../components/peta/PetaKolam.jsx';
import { SektorLayout } from '../SektorLayout.jsx';
import { RekapKeuangan } from '../RekapKeuangan.jsx';
import { ZonaTanaman } from './ZonaTanaman.jsx';
import { HargaKomoditas } from './HargaKomoditas.jsx';

const BAGIAN = [
  { id: 'zona', label: 'Zona', ikon: Map },
  { id: 'kolam', label: 'Kolam', ikon: Fish },
  { id: 'harga', label: 'Harga', ikon: Tag },
  { id: 'keuangan', label: 'Keuangan', ikon: Wallet }
];

export default function Pertanian({ sektor, data, edit }) {
  const t = data.tabel;
  const param = useMemo(() => petaParameter(t.Parameter_Budidaya), [t.Parameter_Budidaya]);
  const panen = useMemo(() => (t.Kolam || []).filter((k) => hitungKolam(k, param, data.hari_ini)?.segeraPanen).length, [t.Kolam, param, data.hari_ini]);
  const luas = (t.Zona_Pertanian || []).reduce((s, z) => s + (Number(z.luas_m2) || 0), 0);

  return (
    <SektorLayout
      sektor={sektor}
      kartu={data.kartu}
      bagian={BAGIAN}
      stat={[
        { label: 'Luas zona', nilai: luasHa(luas) },
        { label: 'Kolam terisi', nilai: `${(t.Kolam || []).filter((k) => k.status === 'Isi').length}/${(t.Kolam || []).length}` },
        { label: 'Panen ≤ 14 hari', nilai: panen }
      ]}
    >
      <Bagian id="zona" label="Peta" judul="Zona Tanaman" onEdit={edit.tautan('/admin/zona?tab=tanaman')}>
        <ZonaTanaman
          zona={t.Zona_Pertanian}
          titik={t.Titik_Tanaman}
          fotoDasar={data.pengaturan?.peta_pertanian?.foto_id || 'lokal:tanah-latansa'}
          tautanLetak="#/sektor/pertanahan?zona=zt-b06"
        />
      </Bagian>
      <Bagian id="kolam" label="Perikanan" judul="Kolam Budidaya" onEdit={edit.tabel('Kolam', 'Kolam')} className="bg-gading/60">
        <PetaKolam kolam={t.Kolam} parameter={t.Parameter_Budidaya} hariIni={data.hari_ini} fotoKolam={data.pengaturan?.peta_kolam?.foto_id || 'lokal:kolam'} />
      </Bagian>
      <Bagian id="harga" label="Penjualan" judul="Harga Komoditas" onEdit={edit.tabel('Harga_Komoditas', 'Harga komoditas')}>
        <HargaKomoditas rows={t.Harga_Komoditas} />
      </Bagian>
      <Bagian id="keuangan" label="Rekap" judul="Keuangan" onEdit={edit.tabel('Keuangan', 'Keuangan', { sektor: sektor.id })} className="pb-24">
        <RekapKeuangan rows={t.Keuangan} sektorLabel={sektor.label} />
      </Bagian>
    </SektorLayout>
  );
}
