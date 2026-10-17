import { useMemo, useState } from 'react';
import { Check, Moon } from 'lucide-react';
import { useAdmin } from '../../lib/admin.jsx';
import { useData } from '../../lib/data.jsx';
import { tanggal, tambahHari } from '../../lib/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Select } from '../../components/ui/Isian.jsx';
import { Segmen } from '../../components/ui/Segmen.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

/**
 * Atur imam subuh manual (tab Urutan Imam, A-11).
 * "Imam pada tanggal": staf terpilih menjadi imam di tanggal itu.
 * "Imam terakhir": staf terpilih dianggap sudah jadi imam sebelumnya, giliran dilanjutkan orang sesudahnya.
 * Giliran sesudah tanggal itu disusun ulang mengikuti urutan imam.
 */
export function AturImam({ urut }) {
  const admin = useAdmin();
  const data = useData();
  const toast = useToast();
  const info = admin.info;
  const hari = info?.hari_ini || '';
  const besok = hari ? tambahHari(hari, 1) : '';
  const [mode, setMode] = useState('imam');
  const [tgl, setTgl] = useState('');
  const [stafId, setStafId] = useState('');
  const [proses, setProses] = useState(false);
  const tanggalPilih = tgl || besok;
  const pilihanTanggal = useMemo(() => (hari ? Array.from({ length: 8 }, (_, i) => tambahHari(hari, i)) : []), [hari]);
  const sekarang = (info?.jadwal || []).find((x) => x.tanggal === tanggalPilih)?.imam;

  // pratinjau 3 giliran mulai tanggal terpilih
  const idx = urut.findIndex((s) => s.id === stafId);
  const mulai = idx < 0 ? -1 : mode === 'imam' ? idx : (idx + 1) % urut.length;
  const pratinjau = mulai < 0 ? [] : [0, 1, 2].map((k) => ({ tanggal: tambahHari(tanggalPilih, k), s: urut[(mulai + k) % urut.length] }));

  const terapkan = async () => {
    setProses(true);
    try {
      const r = await admin.jalankan('aturImam', { staf_id: stafId, mode, tanggal: tanggalPilih });
      toast.sukses(r.pesan);
      setStafId('');
      await admin.muatUlang();
      data.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  return (
    <div className="kartu space-y-4 p-5">
      <div>
        <p className="flex items-center gap-2 font-semibold text-tinta">
          <Moon className="size-4 text-emas-tua" aria-hidden /> Atur imam subuh
        </p>
        <p className="mt-1 text-sm text-redup">
          {tanggal(tanggalPilih, 'hariBulan')}: <b className="text-tinta">{sekarang?.nama || 'belum terjadwal'}</b>
        </p>
      </div>
      <Segmen
        pilihan={[
          { nilai: 'imam', label: 'Pilih imam' },
          { nilai: 'terakhir', label: 'Imam terakhir' }
        ]}
        nilai={mode}
        ubah={setMode}
        label="Cara mengatur"
        className="w-full"
      />
      <Field label={mode === 'imam' ? 'Tanggal' : 'Giliran dilanjutkan mulai'}>
        {(p) => (
          <Select {...p} value={tanggalPilih} onChange={(e) => setTgl(e.target.value)}>
            {pilihanTanggal.map((t) => (
              <option key={t} value={t}>
                {t === hari ? 'Hari ini · ' : t === besok ? 'Besok · ' : ''}
                {tanggal(t)}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label={mode === 'imam' ? 'Imam subuh' : 'Yang terakhir sudah jadi imam'}>
        {(p) => (
          <Select {...p} value={stafId} onChange={(e) => setStafId(e.target.value)}>
            <option value="">Pilih staf…</option>
            {urut.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {s.nama}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {!!pratinjau.length && (
        <ul className="space-y-1 rounded-xl bg-krem px-3 py-2 text-sm">
          {pratinjau.map((x, k) => (
            <li key={x.tanggal} className="flex gap-2">
              <span className="w-16 shrink-0 text-redup">{tanggal(x.tanggal, 'hariBulan')}</span>
              <span className={k === 0 ? 'font-semibold text-tinta' : 'text-redup'}>{x.s.nama}</span>
            </li>
          ))}
          <li className="text-xs text-redup">…lalu terus mengikuti urutan.</li>
        </ul>
      )}
      <Button ikon={Check} className="w-full" memuat={proses} disabled={!stafId} onClick={terapkan}>
        Terapkan
      </Button>
    </div>
  );
}
