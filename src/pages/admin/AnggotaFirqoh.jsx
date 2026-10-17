import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Info, RotateCcw, Save, UserPlus, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { navigasi } from '../../lib/router.jsx';
import { tanggal } from '../../lib/format.js';
import { anggotaSaatIni } from '../../lib/firqoh.js';
import { Button, IkonTombol } from '../../components/ui/Button.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { FotoStaf } from '../../components/ui/Gambar.jsx';

const kunciIsi = (isi) => isi.map((x) => `${x.staf_id}>${x.firqoh_id}`).join('|');

/** Pilihan "+ Tambah staf": staf yang belum masuk firqoh dulu, lalu staf dari firqoh lain (dipindahkan). */
function TambahStaf({ firqoh, belum, lain, onPilih }) {
  if (!belum.length && !lain.length) return null;
  return (
    <label className="relative mt-3 flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-garis px-3 text-sm text-hijau transition-colors focus-within:border-emas hover:border-emas">
      <UserPlus className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">Tambah staf</span>
      {!!belum.length && <span className="text-xs text-redup">{belum.length} belum masuk</span>}
      <select
        aria-label={`Tambah staf ke ${firqoh.nama_firqoh}`}
        value=""
        onChange={(e) => e.target.value && onPilih(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="">Pilih staf…</option>
        {!!belum.length && (
          <optgroup label="Belum masuk firqoh">
            {belum.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </optgroup>
        )}
        {!!lain.length && (
          <optgroup label="Pindahkan dari firqoh lain">
            {lain.map(({ s, dari }) => (
              <option key={s.id} value={s.id}>
                {s.nama} · dari {dari}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </label>
  );
}

/**
 * Input manual anggota tiap firqoh (tab Firqoh, A-11).
 * Sebelum ada undian: menjadi "anggota tetap" yang dipakai jadwal.
 * Setelah undian diterapkan: daftar ini otomatis berisi hasil undian dan tetap bisa diedit kapan saja.
 */
export function AnggotaFirqoh() {
  const admin = useAdmin();
  const info = admin.info;
  const { siklus, baris } = useMemo(() => anggotaSaatIni(info), [info]);
  const petaStaf = useMemo(() => Object.fromEntries((info?.staf || []).map((s) => [s.id, s])), [info]);
  const semuaFirqoh = useMemo(() => [...(info?.firqoh || [])].sort((a, b) => (Number(a.urutan) || 99) - (Number(b.urutan) || 99)), [info]);
  const petaFirqoh = useMemo(() => Object.fromEntries(semuaFirqoh.map((f) => [f.id, f])), [semuaFirqoh]);
  const stafAktif = useMemo(() => (info?.staf || []).filter((s) => s.aktif).sort((a, b) => a.nama.localeCompare(b.nama)), [info]);

  const awal = useMemo(
    () => baris.filter((a) => petaStaf[a.staf_id] && petaFirqoh[a.firqoh_id]).map((a) => ({ staf_id: a.staf_id, firqoh_id: a.firqoh_id })),
    [baris, petaStaf, petaFirqoh]
  );
  const [isi, setIsi] = useState(awal);
  const [proses, setProses] = useState(false);
  useEffect(() => setIsi(awal), [awal]);

  const berubah = kunciIsi(isi) !== kunciIsi(awal);
  const diFirqoh = Object.fromEntries(isi.map((x) => [x.staf_id, x.firqoh_id]));
  const belum = stafAktif.filter((s) => !diFirqoh[s.id]);
  const firqoh = semuaFirqoh.filter((f) => f.aktif || isi.some((x) => x.firqoh_id === f.id));
  const masuk = stafAktif.length - belum.length;

  const tambah = (stafId, firqohId) => setIsi((p) => [...p.filter((x) => x.staf_id !== stafId), { staf_id: stafId, firqoh_id: firqohId }]);
  const keluarkan = (stafId) => setIsi((p) => p.filter((x) => x.staf_id !== stafId));

  const simpan = async () => {
    setProses(true);
    try {
      await admin.jalankan('simpanAnggotaFirqoh', { anggota: isi }, 'Anggota firqoh tersimpan.');
      admin.lupakanSheet('Anggota_Firqoh');
      await admin.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-xl">Anggota firqoh</h3>
        {siklus ? (
          <Lencana warna="hijau" titik>
            Hasil undian · {tanggal(siklus.tanggal_mulai, 'hariBulan')} – {tanggal(siklus.tanggal_selesai, 'hariBulan')}
          </Lencana>
        ) : (
          <Lencana warna="emas" titik>
            Belum ada undian
          </Lencana>
        )}
        <span className="ml-auto text-sm text-redup">
          <b className="tabular-nums text-tinta">{masuk}</b> dari <span className="tabular-nums">{stafAktif.length}</span> staf aktif sudah masuk firqoh
        </span>
      </div>

      <p className="mb-4 flex gap-2 rounded-xl bg-krem px-4 py-3 text-sm text-redup">
        <Info className="mt-0.5 size-4 shrink-0 text-emas-tua" aria-hidden />
        <span>
          {siklus
            ? 'Susunan ini mengikuti hasil undian terakhir. Perubahan langsung berlaku untuk jadwal siklus tersebut; siklus sebelumnya tetap tersimpan sebagai riwayat.'
            : 'Isi anggota tiap firqoh sesuai data yang sudah ada. Jadwal Subuh Berkah memakai susunan ini sampai undian diterapkan — setelah itu daftar ini otomatis mengikuti hasil undian dan tetap bisa diedit kapan saja.'}
        </span>
      </p>

      {!!belum.length && (
        <div className="mb-4 rounded-xl border border-emas/40 bg-emas/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-emas-tua">Belum masuk firqoh · {belum.length}</p>
          <div className="flex flex-wrap gap-1.5">
            {belum.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-gading py-1 pl-1 pr-2.5 text-xs ring-1 ring-garis">
                <FotoStaf nama={s.nama} fotoId={s.foto_id} ukuran="sm" />
                {s.nama}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {firqoh.map((f) => {
          const anggota = isi.filter((x) => x.firqoh_id === f.id).map((x) => petaStaf[x.staf_id]);
          const lain = stafAktif.filter((s) => diFirqoh[s.id] && diFirqoh[s.id] !== f.id).map((s) => ({ s, dari: petaFirqoh[diFirqoh[s.id]]?.nama_firqoh || '' }));
          return (
            <div key={f.id} className={cn('kartu flex flex-col p-4', !f.aktif && 'opacity-70')}>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-full" style={{ background: f.warna || 'var(--color-hijau)' }} aria-hidden />
                <p className="flex-1 truncate font-semibold">{f.nama_firqoh}</p>
                {!f.aktif && <Lencana warna="netral">Nonaktif</Lencana>}
                <span className="rounded-full bg-hijau/8 px-2 py-0.5 text-xs tabular-nums text-hijau">{anggota.length} orang</span>
              </div>
              <ul className="flex-1 divide-y divide-garis/70">
                {anggota.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <FotoStaf nama={s.nama} fotoId={s.foto_id} ukuran="sm" />
                    <span className="min-w-0 flex-1 truncate">{s.nama}</span>
                    {!s.aktif && <Lencana warna="netral">Nonaktif</Lencana>}
                    <IkonTombol ikon={X} kecil label={`Keluarkan ${s.nama} dari ${f.nama_firqoh}`} onClick={() => keluarkan(s.id)} className="text-redup hover:text-bata" />
                  </li>
                ))}
                {!anggota.length && <li className="py-2 text-sm text-redup">Belum ada anggota.</li>}
              </ul>
              <TambahStaf firqoh={f} belum={belum} lain={lain} onPilih={(id) => tambah(id, f.id)} />
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'mt-4 flex flex-wrap items-center gap-2 rounded-2xl border p-3',
          berubah ? 'sticky bottom-4 z-10 border-emas/50 bg-gading/95 shadow-angkat backdrop-blur' : 'border-garis',
          !berubah && !isi.length && 'hidden'
        )}
      >
        {berubah ? (
          <>
            <p className="flex-1 text-sm font-medium text-emas-tua">Ada perubahan yang belum disimpan.</p>
            <Button varian="hantu" ukuran="sm" ikon={RotateCcw} onClick={() => setIsi(awal)} disabled={proses}>
              Batalkan
            </Button>
            <Button ukuran="sm" ikon={Save} memuat={proses} onClick={simpan}>
              Simpan anggota
            </Button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-redup">Tersimpan. Jadwal Subuh Berkah memakai susunan ini.</p>
            {!siklus && (
              <Button varian="sekunder" ukuran="sm" ikon={CalendarRange} onClick={() => navigasi('/admin/undian?isi=anggota')}>
                Buat jadwal 14 hari tanpa undian
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
