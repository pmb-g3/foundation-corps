import { useMemo } from 'react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { navigasi, useRute } from '../../lib/router.jsx';
import { Select } from '../../components/ui/Isian.jsx';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { TabelData } from '../../components/data/TabelData.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';
import { BannerContoh } from './BannerContoh.jsx';

export const NAMA_GRUP = {
  umum: 'Umum',
  jadwal: 'Jadwal & Firqoh',
  PERTANIAN: 'Pertanian & Perikanan',
  PERTANAHAN: 'Pertanahan',
  KENDARAAN: 'Kendaraan',
  PEMBANGUNAN: 'Pembangunan',
  log: 'Catatan sistem'
};
const URUT_GRUP = ['PERTANIAN', 'PERTANAHAN', 'KENDARAAN', 'PEMBANGUNAN', 'umum', 'jadwal', 'log'];

/** Saringan baris untuk Kabag pada sheet PER_BARIS (Keuangan per sektor, Kalender per kategori). */
export function saringKabag(auth, info, sheet, skema) {
  if (!auth.isKabag || skema?.akses !== 'PER_BARIS') return undefined;
  const nilai = sheet === 'Kalender' ? info?.sektor?.[auth.sektorKabag]?.kategoriKalender : auth.sektorKabag;
  return nilai ? { [skema.kolomSektor]: nilai } : undefined;
}

/** A-05 Kelola Data: tabel setiap sheet + formulir tambah/ubah (menggantikan "Form Data"). */
export default function KelolaData() {
  const admin = useAdmin();
  const auth = useAuth();
  const { query } = useRute();
  const skema = admin.skema;

  const grup = useMemo(() => {
    const g = {};
    Object.entries(skema).forEach(([nama, s]) => {
      if (nama === 'Pengaturan') return;
      (g[s.grup] = g[s.grup] || []).push({ nama, judul: s.judul });
    });
    return URUT_GRUP.filter((k) => g[k]).map((k) => ({ grup: k, sheet: g[k] }));
  }, [skema]);

  if (!admin.info) return <Kerangka className="h-[70vh] w-full rounded-kartu" />;
  const semua = grup.flatMap((g) => g.sheet);
  const aktif = semua.find((s) => s.nama === query.get('sheet'))?.nama || semua[0]?.nama;
  const pilih = (nama) => navigasi(`/admin/data?sheet=${nama}`, { ganti: true });

  return (
    <HalamanAdmin label="Data" judul="Kelola Data" keterangan="Pilih tabel, ketuk baris untuk mengubah, atau tambah baris baru.">
      <BannerContoh />
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="lg:hidden">
          <Select value={aktif} onChange={(e) => pilih(e.target.value)} aria-label="Pilih tabel">
            {grup.map((g) => (
              <optgroup key={g.grup} label={NAMA_GRUP[g.grup] || g.grup}>
                {g.sheet.map((s) => (
                  <option key={s.nama} value={s.nama}>
                    {s.judul}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
        <nav aria-label="Daftar tabel" className="hidden space-y-5 lg:block">
          {grup.map((g) => (
            <div key={g.grup}>
              <p className="label-bagian mb-1.5 px-3">{NAMA_GRUP[g.grup] || g.grup}</p>
              <ul>
                {g.sheet.map((s) => (
                  <li key={s.nama}>
                    <button
                      type="button"
                      onClick={() => pilih(s.nama)}
                      className={cn('flex min-h-10 w-full items-center rounded-xl px-3 text-left text-sm transition-colors', aktif === s.nama ? 'bg-hijau font-semibold text-gading' : 'text-tinta hover:bg-hijau/5')}
                    >
                      {s.judul}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="min-w-0">
          {aktif && (
            <>
              <h2 className="mb-3 text-2xl">{skema[aktif]?.judul}</h2>
              <TabelData key={aktif} sheet={aktif} saring={saringKabag(auth, admin.info, aktif, skema[aktif])} />
            </>
          )}
        </div>
      </div>
    </HalamanAdmin>
  );
}
