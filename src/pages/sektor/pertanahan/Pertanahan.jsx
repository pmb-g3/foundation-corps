import { useMemo, useState } from 'react';
import { BarChart3, Map, Table2 } from 'lucide-react';
import { luasHa } from '../../../lib/format.js';
import { useRute } from '../../../lib/router.jsx';
import { olahTanah, ringkasTanah } from '../../../lib/tanah.js';
import { daftarLokasi, totalLuasTanah } from '../../../lib/lokasiTanah.js';
import { Bagian } from '../../../components/layout/Bagian.jsx';
import { SektorLayout } from '../SektorLayout.jsx';
import { PetaTanah } from './PetaTanah.jsx';
import { TabelTanah } from './TabelTanah.jsx';
import { RekapLuas } from './RekapLuas.jsx';

const BAGIAN = [
  { id: 'peta', label: 'Peta', ikon: Map },
  { id: 'data', label: 'Data Tanah', ikon: Table2 },
  { id: 'luas', label: 'Rekap Luas', ikon: BarChart3 }
];

export default function Pertanahan({ sektor, data, edit }) {
  const t = data.tabel;
  const konversi = data.pengaturan?.konversi_ru || 14;
  const lokasi = useMemo(() => daftarLokasi(data.pengaturan?.peta_tanah), [data.pengaturan?.peta_tanah]);
  // ?zona=<id> (mis. dari Zona Tanaman) → langsung buka lokasi & zona itu
  const { query } = useRute();
  const [zonaFilter, setZonaFilter] = useState(() => query.get('zona') || null);
  const ring = ringkasTanah(olahTanah(t.Data_Tanah, konversi));
  const luasPeta = totalLuasTanah(t.Zona_Tanah, lokasi);

  return (
    <SektorLayout
      sektor={sektor}
      kartu={data.kartu}
      bagian={BAGIAN}
      stat={[
        { label: 'Luas tanah', nilai: luasHa(luasPeta) },
        { label: 'Lokasi', nilai: lokasi.filter((l) => !l.induk).length },
        { label: 'Bersertifikat SHM', nilai: `${ring.bidang ? Math.round((ring.shm / ring.bidang) * 100) : 0}%` }
      ]}
    >
      <Bagian id="peta" label="Peta" judul="Peta Tanah Pondok" onEdit={edit.tautan('/admin/zona?tab=tanah')}>
        <PetaTanah zona={t.Zona_Tanah} bidang={t.Data_Tanah} lokasi={lokasi} konversiRu={konversi} zonaTerpilih={zonaFilter} onPilihZona={setZonaFilter} />
      </Bagian>
      <Bagian id="data" label="Legalitas" judul="Data Tanah" onEdit={edit.tabel('Data_Tanah', 'Data tanah')} className="bg-gading/60">
        <TabelTanah rows={t.Data_Tanah} zona={t.Zona_Tanah} lokasi={lokasi} konversiRu={konversi} zonaFilter={zonaFilter} setZonaFilter={setZonaFilter} />
      </Bagian>
      <Bagian id="luas" label="Rekap" judul="Luas per Lokasi & Zona" onEdit={edit.tabel('Zona_Tanah', 'Zona tanah')} className="pb-24">
        <RekapLuas zona={t.Zona_Tanah} lokasi={lokasi} />
      </Bagian>
    </SektorLayout>
  );
}
