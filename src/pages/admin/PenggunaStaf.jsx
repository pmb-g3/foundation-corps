import { useEffect, useMemo, useState } from 'react';
import { Copy, KeyRound, Pencil, Plus, Save, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { navigasi, useRute } from '../../lib/router.jsx';
import { inisial } from '../../lib/format.js';
import { SEKTOR } from '../../lib/sektor.js';
import { Button, IkonTombol } from '../../components/ui/Button.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { Field, Input, Select, Switch } from '../../components/ui/Isian.jsx';
import { Segmen } from '../../components/ui/Segmen.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { DaftarUrut } from '../../components/ui/DaftarUrut.jsx';
import { FotoStaf } from '../../components/ui/Gambar.jsx';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { TabelData } from '../../components/data/TabelData.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';

function FormPengguna({ awal, tutup, selesai }) {
  const admin = useAdmin();
  const [d, setD] = useState(awal || { nama: '', username: '', peran: 'KABAG', sektor_id: 'PERTANIAN', aktif: true, sandi: '' });
  const [proses, setProses] = useState(false);
  const kirim = async (e) => {
    e.preventDefault();
    setProses(true);
    try {
      const r = await admin.jalankan('simpanPengguna', { data: d }, 'Akun tersimpan.');
      selesai(r.sandi_sementara ? { username: d.username, sandi: r.sandi_sementara } : null);
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };
  return (
    <form onSubmit={kirim} className="space-y-4">
      <Field label="Nama" wajib>
        {(p) => <Input {...p} value={d.nama} onChange={(e) => setD({ ...d, nama: e.target.value })} required />}
      </Field>
      <Field label="Username" wajib petunjuk="Huruf kecil, angka, titik, garis bawah.">
        {(p) => <Input {...p} value={d.username} onChange={(e) => setD({ ...d, username: e.target.value.toLowerCase() })} autoCapitalize="none" required />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peran">
          {(p) => (
            <Select {...p} value={d.peran} onChange={(e) => setD({ ...d, peran: e.target.value })}>
              <option value="ADMIN">Admin Utama</option>
              <option value="KABAG">Kepala Bagian</option>
            </Select>
          )}
        </Field>
        {d.peran === 'KABAG' && (
          <Field label="Sektor">
            {(p) => (
              <Select {...p} value={d.sektor_id || ''} onChange={(e) => setD({ ...d, sektor_id: e.target.value })}>
                {SEKTOR.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Aktif</span>
        <Switch nyala={d.aktif !== false} ubah={(v) => setD({ ...d, aktif: v })} label="Akun aktif" />
      </div>
      {!awal && (
        <Field label="Sandi (opsional)" petunjuk="Kosongkan agar dibuat sandi sementara acak.">
          {(p) => <Input {...p} type="password" value={d.sandi} onChange={(e) => setD({ ...d, sandi: e.target.value })} autoComplete="new-password" />}
        </Field>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" ikon={Save} memuat={proses}>
          Simpan
        </Button>
        <Button varian="hantu" onClick={tutup}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function TabPengguna() {
  const admin = useAdmin();
  const auth = useAuth();
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [sandi, setSandi] = useState(null);
  const [reset, setReset] = useState(null);
  const [proses, setProses] = useState(false);
  const daftar = admin.info?.pengguna_daftar || [];

  const resetSandi = async () => {
    setProses(true);
    try {
      const r = await admin.jalankan('resetSandi', { id: reset.id });
      setSandi({ username: r.username, sandi: r.sandi_sementara });
      setReset(null);
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button ukuran="sm" ikon={Plus} onClick={() => setEdit('baru')}>
          Tambah pengguna
        </Button>
      </div>
      <div className="kartu overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-krem/80 text-left text-xs uppercase tracking-[0.06em] text-redup">
            <tr>
              <th className="px-4 py-3">Nama & username</th>
              <th className="px-3 py-3">Peran</th>
              <th className="px-3 py-3">Sektor</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {daftar.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-hijau text-xs font-bold text-gading">{inisial(u.nama)}</span>
                    <div>
                      <p className="font-medium">{u.nama}</p>
                      <p className="font-mono text-xs text-redup">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{u.peran === 'ADMIN' ? <Lencana warna="gelap" ikon={ShieldCheck}>Admin Utama</Lencana> : <Lencana warna="emas">Kepala Bagian</Lencana>}</td>
                <td className="px-3 py-3 text-redup">{u.peran === 'ADMIN' ? 'Semua sektor' : u.sektor_label}</td>
                <td className="px-3 py-3">{u.aktif ? <Lencana warna="hijau">Aktif</Lencana> : <Lencana warna="netral">Nonaktif</Lencana>}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IkonTombol ikon={Pencil} label={`Ubah ${u.nama}`} kecil onClick={() => setEdit(u)} />
                    <IkonTombol ikon={KeyRound} label={`Reset sandi ${u.nama}`} kecil onClick={() => setReset(u)} disabled={u.id === auth.pengguna?.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-redup">
        <Lock className="size-3.5" aria-hidden /> Sandi disimpan sebagai hash SHA-256 + salt. Admin Utama maksimal 3 orang aktif.
      </p>

      <Dialog buka={!!edit} tutup={() => setEdit(null)} judul={edit === 'baru' ? 'Tambah pengguna' : 'Ubah pengguna'} lebar="sm">
        {edit && (
          <FormPengguna
            awal={edit === 'baru' ? null : edit}
            tutup={() => setEdit(null)}
            selesai={(s) => {
              setEdit(null);
              admin.muatUlang();
              if (s) setSandi(s);
            }}
          />
        )}
      </Dialog>
      <Dialog
        buka={!!reset}
        tutup={() => setReset(null)}
        judul={`Reset sandi ${reset?.nama || ''}?`}
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setReset(null)}>
              Batal
            </Button>
            <Button varian="bahaya" memuat={proses} onClick={resetSandi}>
              Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-redup">Sandi baru dibuat acak dan sesi login akun ini diakhiri.</p>
      </Dialog>
      <Dialog buka={!!sandi} tutup={() => setSandi(null)} judul="Sandi sementara" lebar="sm">
        {sandi && (
          <div className="space-y-3">
            <p className="text-sm text-redup">Berikan kepada pemilik akun. Sandi ini hanya tampil sekali.</p>
            <div className="flex items-center gap-2 rounded-xl bg-krem p-3 font-mono">
              <span className="flex-1">
                @{sandi.username} · <b>{sandi.sandi}</b>
              </span>
              <IkonTombol ikon={Copy} label="Salin sandi" kecil onClick={() => navigator.clipboard?.writeText(sandi.sandi).then(() => toast.sukses('Disalin.'))} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function TabUrutanImam() {
  const admin = useAdmin();
  const staf = useMemo(
    () => (admin.info?.staf || []).filter((s) => s.aktif).sort((a, b) => (Number(a.urutan_imam) || 999) - (Number(b.urutan_imam) || 999)),
    [admin.info]
  );
  const [urut, setUrut] = useState(staf);
  const [proses, setProses] = useState(false);
  useEffect(() => setUrut(staf), [staf]);
  const posisi = admin.info?.pengaturan?.imam_posisi_terakhir?.staf_id;
  const berikut = urut.length ? urut[(urut.findIndex((s) => s.id === posisi) + 1) % urut.length] : null;
  const simpan = async () => {
    setProses(true);
    try {
      await admin.jalankan('simpanUrutan', { sheet: 'Staf', kolom: 'urutan_imam', ids: urut.map((s) => s.id) }, 'Urutan imam tersimpan.');
      admin.lupakanSheet('Staf');
      admin.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <DaftarUrut
        items={urut}
        onUbah={setUrut}
        render={(s, { pegangan, indeks }) => (
          <div className={cn('flex items-center gap-3 rounded-2xl border border-garis bg-gading p-2 pr-4', s.id === posisi && 'border-emas')}>
            {pegangan}
            <span className="w-7 text-center font-judul text-lg tabular-nums text-emas-tua">{indeks + 1}</span>
            <FotoStaf nama={s.nama} fotoId={s.foto_id} ukuran="sm" />
            <span className="flex-1 truncate text-sm font-medium">{s.nama}</span>
            {s.id === posisi && <Lencana warna="emas">Terakhir</Lencana>}
          </div>
        )}
      />
      <aside className="kartu space-y-3 self-start p-5">
        <p className="text-sm text-redup">Imam bergiliran mengikuti urutan ini dan melanjutkan posisi terakhir di siklus berikutnya. Semua staf aktif bisa menjadi imam.</p>
        {berikut && (
          <p className="text-sm">
            Giliran berikutnya: <b>{berikut.nama}</b>
          </p>
        )}
        <Button ikon={Save} memuat={proses} onClick={simpan} className="w-full">
          Simpan urutan
        </Button>
      </aside>
    </div>
  );
}

function TabFirqoh() {
  const admin = useAdmin();
  const info = admin.info;
  const firqoh = useMemo(() => [...(info?.firqoh || [])].sort((a, b) => (Number(a.urutan) || 99) - (Number(b.urutan) || 99)), [info]);
  const [urut, setUrut] = useState(firqoh);
  const [proses, setProses] = useState('');
  useEffect(() => setUrut(firqoh), [firqoh]);
  const siklus = (info?.siklus || []).find((s) => s.status === 'Diterapkan');
  const anggota = (info?.anggota || []).filter((a) => siklus && a.siklus_id === siklus.id);
  const stafPeta = Object.fromEntries((info?.staf || []).map((s) => [s.id, s]));

  const pindah = async (a, firqohId) => {
    setProses(a.id);
    try {
      await admin.simpan('Anggota_Firqoh', { id: a.id, firqoh_id: firqohId }, 'Anggota dipindahkan.');
      admin.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <DaftarUrut
          items={urut}
          onUbah={setUrut}
          render={(f, { pegangan, indeks }) => (
            <div className="flex items-center gap-3 rounded-2xl border border-garis bg-gading p-2 pr-4">
              {pegangan}
              <span className="w-7 text-center font-judul text-lg text-emas-tua">{indeks + 1}</span>
              <span className="size-3 rounded-full" style={{ background: f.warna || 'var(--color-hijau)' }} />
              <span className="flex-1 font-medium">{f.nama_firqoh}</span>
              {!f.aktif && <Lencana warna="netral">Nonaktif</Lencana>}
              <span className="text-xs text-redup">{anggota.filter((a) => a.firqoh_id === f.id).length} anggota</span>
            </div>
          )}
        />
        <aside className="kartu space-y-3 self-start p-5">
          <p className="text-sm text-redup">Urutan ini menentukan giliran firqoh Subuh Berkah setiap hari.</p>
          <Button
            ikon={Save}
            className="w-full"
            memuat={proses === 'urut'}
            onClick={async () => {
              setProses('urut');
              try {
                await admin.jalankan('simpanUrutan', { sheet: 'Firqoh', kolom: 'urutan', ids: urut.map((f) => f.id) }, 'Urutan firqoh tersimpan.');
                admin.muatUlang();
              } catch {
                /* pesan tampil */
              } finally {
                setProses('');
              }
            }}
          >
            Simpan urutan
          </Button>
        </aside>
      </div>

      {siklus && (
        <section>
          <h3 className="mb-3 text-xl">Anggota siklus berjalan</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {firqoh
              .filter((f) => f.aktif)
              .map((f) => (
                <div key={f.id} className="kartu p-4">
                  <p className="mb-2 font-semibold">{f.nama_firqoh}</p>
                  <ul className="space-y-1.5">
                    {anggota
                      .filter((a) => a.firqoh_id === f.id)
                      .map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm">
                          <FotoStaf nama={stafPeta[a.staf_id]?.nama} fotoId={stafPeta[a.staf_id]?.foto_id} ukuran="sm" />
                          <span className="flex-1 truncate">{stafPeta[a.staf_id]?.nama || '(staf terhapus)'}</span>
                          <select
                            aria-label="Pindah firqoh"
                            value={f.id}
                            disabled={proses === a.id}
                            onChange={(e) => pindah(a, e.target.value)}
                            className="min-h-9 rounded-lg border border-garis bg-krem px-2 text-xs"
                          >
                            {firqoh.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.nama_firqoh}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>
      )}
      <section>
        <h3 className="mb-3 text-xl">Data firqoh</h3>
        <TabelData sheet="Firqoh" onBerubah={admin.muatUlang} />
      </section>
    </div>
  );
}

/** A-11 Pengguna & Staf (F-57): akun login, data staf, urutan imam (seret-lepas), firqoh. */
export default function PenggunaStaf() {
  const admin = useAdmin();
  const { query } = useRute();
  const tab = query.get('tab') || 'pengguna';
  if (!admin.info) return <Kerangka className="h-[70vh] w-full rounded-kartu" />;
  const jumlahStaf = (admin.info.staf || []).length;
  return (
    <HalamanAdmin label="Sistem" judul="Pengguna & Staf" keterangan="Kelola akun login, staf yayasan, giliran imam, dan firqoh.">
      <Segmen
        pilihan={[
          { nilai: 'pengguna', label: 'Pengguna', jumlah: (admin.info.pengguna_daftar || []).length },
          { nilai: 'staf', label: 'Staf', jumlah: jumlahStaf },
          { nilai: 'imam', label: 'Urutan Imam' },
          { nilai: 'firqoh', label: 'Firqoh' }
        ]}
        nilai={tab}
        ubah={(t) => navigasi(`/admin/pengguna?tab=${t}`, { ganti: true })}
        idTata="tab-pengguna"
        label="Bagian"
        className="mb-6 w-fit"
      />
      {tab === 'pengguna' && <TabPengguna />}
      {tab === 'staf' && <TabelData sheet="Staf" onBerubah={admin.muatUlang} />}
      {tab === 'imam' && <TabUrutanImam />}
      {tab === 'firqoh' && <TabFirqoh />}
    </HalamanAdmin>
  );
}
