import { useEffect, useState } from 'react';
import { Clock, Download, KeyRound, RefreshCw, Send, TriangleAlert, User, Users, UsersRound, Wrench } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAdmin } from '../../lib/admin.jsx';
import { tanggal, jam } from '../../lib/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Select, Switch, Textarea } from '../../components/ui/Isian.jsx';
import { Segmen } from '../../components/ui/Segmen.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { HalamanAdmin } from './AdminLayout.jsx';

const MODE = [
  { nilai: 'grup', label: 'Grup WhatsApp', ikon: UsersRound },
  { nilai: 'personal', label: 'Personal satu-satu', ikon: User },
  { nilai: 'keduanya', label: 'Keduanya', ikon: Users }
];
const TEMPLAT_GRUP = [
  { kunci: 'template_grup_pengingat', label: 'Grup · pengingat malam (firqoh & imam besok)', isi: '{tanggal} {firqoh} {jenis} {anggota} {imam}' },
  { kunci: 'template_grup_konsekuensi_firqoh', label: 'Grup · konsekuensi firqoh', isi: '{firqoh} {anggota} {tanggal} {tanggal_konsekuensi}' },
  { kunci: 'template_grup_konsekuensi_imam', label: 'Grup · konsekuensi imam', isi: '{nama} {tanggal}' }
];
const TEMPLAT = [
  { kunci: 'template_firqoh', label: 'Personal · pengingat firqoh (malam sebelum)', isi: '{nama} {tanggal} {firqoh} {jenis}' },
  { kunci: 'template_imam', label: 'Personal · pengingat imam (malam sebelum)', isi: '{nama} {tanggal}' },
  { kunci: 'template_konsekuensi_firqoh', label: 'Personal · konsekuensi firqoh', isi: '{nama} {firqoh} {tanggal} {tanggal_konsekuensi}' },
  { kunci: 'template_konsekuensi_imam', label: 'Personal · konsekuensi imam', isi: '{nama} {tanggal}' }
];
const CONTOH = {
  nama: 'Ust. Ahmad',
  tanggal: 'Ahad, 18 Oktober 2026',
  firqoh: 'Abu Bakar As-Siddiq',
  jenis: '',
  anggota: 'Ust. Ahmad, Ust. Bilal',
  imam: 'Ust. Hasan',
  tanggal_konsekuensi: 'Ahad, 18 Oktober 2026 & Senin, 19 Oktober 2026'
};
const isi = (t) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => CONTOH[k] ?? m);
const idGrupValid = (v) => /^[0-9-]+@g\.us$/.test(String(v || '').trim());

function KartuTemplat({ t, wa, setWa }) {
  return (
    <Field label={t.label} petunjuk={`Isian: ${t.isi}${wa[t.kunci] ? '' : ' · kosong = templat bawaan'}`}>
      {(p) => (
        <>
          <Textarea {...p} rows={4} value={wa[t.kunci] || ''} onChange={(e) => setWa({ ...wa, [t.kunci]: e.target.value })} />
          {wa[t.kunci] && <p className="mt-1 whitespace-pre-line rounded-xl bg-[#DCF8C6]/60 px-3 py-2 text-xs text-tinta">{isi(wa[t.kunci])}</p>}
        </>
      )}
    </Field>
  );
}

/** A-10 Pengaturan WhatsApp (F-56): token Fonnte, tujuan kirim (grup / personal), jam pengingat, templat, uji kirim, log. */
export default function WhatsApp() {
  const admin = useAdmin();
  const info = admin.info;
  const [wa, setWa] = useState(null);
  const [token, setToken] = useState('');
  const [nomor, setNomor] = useState('');
  const [hasilUji, setHasilUji] = useState(null);
  const [hasilUjiGrup, setHasilUjiGrup] = useState(null);
  const [daftarGrup, setDaftarGrup] = useState(null); // { grup: [], pesan }
  const [proses, setProses] = useState('');

  useEffect(() => {
    if (info?.pengaturan?.wa && !wa) setWa(info.pengaturan.wa);
  }, [info, wa]);
  if (!info || !wa) return <Kerangka className="h-[70vh] w-full rounded-kartu" />;

  const mode = ['grup', 'personal', 'keduanya'].includes(wa.mode_kirim) ? wa.mode_kirim : 'personal';
  const pakaiGrup = mode !== 'personal';
  const pakaiPersonal = mode !== 'grup';
  const tokenAda = !!info.wa?.token_terisi;

  const jalan = async (kode, fn) => {
    setProses(kode);
    try {
      await fn();
    } catch {
      /* pesan tampil */
    } finally {
      setProses('');
    }
  };
  const ambilGrup = (perbarui) =>
    jalan(perbarui ? 'perbarui' : 'grup', async () => {
      setDaftarGrup(await admin.jalankan('grupWA', { perbarui }));
    });
  const simpan = () =>
    jalan('simpan', async () => {
      await admin.simpanPengaturan('wa', wa, 'Pengaturan WA tersimpan; trigger diperbarui.');
      admin.muatUlang();
    });

  return (
    <HalamanAdmin label="Sistem" judul="WhatsApp" keterangan="Pengingat malam untuk firqoh & imam besok, dan pesan konsekuensi otomatis lewat Fonnte — ke grup WhatsApp atau ke nomor staf satu per satu.">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- tujuan kirim ---------- */}
        <section className="kartu space-y-4 p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-isi text-base font-semibold">
            <UsersRound className="size-5 text-emas-tua" aria-hidden /> Tujuan pengiriman
          </h2>
          <Segmen pilihan={MODE} nilai={mode} ubah={(v) => setWa({ ...wa, mode_kirim: v })} idTata="mode-wa" label="Tujuan pengiriman WA" className="w-fit" />
          <p className="text-sm text-redup">
            {mode === 'grup' && 'Satu pesan ringkas ke grup (berisi nama firqoh, anggota, dan imam). Hemat kuota Fonnte dan tidak perlu nomor WA tiap staf.'}
            {mode === 'personal' && 'Pesan dikirim satu per satu ke nomor WA staf (kolom no_wa di data staf).'}
            {mode === 'keduanya' && 'Pesan ringkas ke grup, ditambah pesan pribadi ke tiap staf yang bertugas.'}
          </p>

          {pakaiGrup && (
            <div className="space-y-4 rounded-2xl bg-krem/70 p-4 ring-1 ring-garis">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Grup tujuan:</span>
                {idGrupValid(wa.grup_id) ? (
                  <Lencana warna="hijau" ikon={UsersRound}>
                    {wa.grup_nama || wa.grup_id}
                  </Lencana>
                ) : (
                  <Lencana warna="bata" ikon={TriangleAlert}>
                    Belum dipilih — pesan grup tidak akan terkirim
                  </Lencana>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button ukuran="sm" ikon={Download} memuat={proses === 'grup'} disabled={!tokenAda} onClick={() => ambilGrup(false)}>
                  Ambil daftar grup
                </Button>
                <Button varian="hantu" ukuran="sm" ikon={RefreshCw} memuat={proses === 'perbarui'} disabled={!tokenAda} onClick={() => ambilGrup(true)}>
                  Perbarui dari WhatsApp
                </Button>
              </div>
              <p className="text-xs text-redup">
                Nomor WhatsApp yang tersambung di Fonnte harus sudah menjadi anggota grup. Tekan <b>Perbarui dari WhatsApp</b> hanya sekali setelah nomor itu bergabung ke grup baru —
                menurut Fonnte, terlalu sering memanggilnya bisa membuat nomor diblokir.
                {!tokenAda && ' Isi token Fonnte dulu.'}
              </p>

              {daftarGrup && (
                <div>
                  {daftarGrup.grup?.length ? (
                    <ul className="divide-y divide-garis overflow-hidden rounded-xl bg-gading ring-1 ring-garis" role="radiogroup" aria-label="Pilih grup WhatsApp">
                      {daftarGrup.grup.map((g) => {
                        const pilih = wa.grup_id === g.id;
                        return (
                          <li key={g.id}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={pilih}
                              onClick={() => setWa({ ...wa, grup_id: g.id, grup_nama: g.nama })}
                              className={cn('flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left transition-colors', pilih ? 'bg-emas/15' : 'hover:bg-hijau/5')}
                            >
                              <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full ring-2', pilih ? 'ring-hijau' : 'ring-garis')}>
                                {pilih && <span className="size-2.5 rounded-full bg-hijau" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{g.nama}</span>
                                <span className="block truncate font-mono text-[0.7rem] text-redup">{g.id}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="rounded-xl bg-bata/10 px-3 py-2 text-sm text-bata">{daftarGrup.pesan || 'Belum ada grup.'}</p>
                  )}
                </div>
              )}

              <details className="text-sm">
                <summary className="cursor-pointer text-redup">Isi ID grup secara manual</summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <Field label="ID grup" petunjuk="Format: 1203630xxxxxxxx@g.us (lihat di dashboard Fonnte)" galat={wa.grup_id && !idGrupValid(wa.grup_id) ? 'ID grup harus berakhiran @g.us' : undefined}>
                    {(p) => <Input {...p} value={wa.grup_id || ''} onChange={(e) => setWa({ ...wa, grup_id: e.target.value.trim() })} placeholder="120363…@g.us" />}
                  </Field>
                  <Field label="Nama grup (untuk catatan)">{(p) => <Input {...p} value={wa.grup_nama || ''} onChange={(e) => setWa({ ...wa, grup_nama: e.target.value })} />}</Field>
                </div>
              </details>

              <div className="flex flex-wrap items-center gap-2 border-t border-garis pt-3">
                <Button
                  varian="sekunder"
                  ukuran="sm"
                  ikon={Send}
                  memuat={proses === 'ujiGrup'}
                  disabled={!idGrupValid(wa.grup_id)}
                  onClick={() =>
                    jalan('ujiGrup', async () => {
                      const r = await admin.jalankan('testWA', { grup: true, grup_id: wa.grup_id, grup_nama: wa.grup_nama });
                      setHasilUjiGrup(r);
                      admin.muatUlang();
                    })
                  }
                >
                  Uji kirim ke grup
                </Button>
                {hasilUjiGrup && <Lencana warna={hasilUjiGrup.terkirim ? 'hijau' : 'bata'}>{hasilUjiGrup.terkirim ? 'Terkirim ke grup' : hasilUjiGrup.status}</Lencana>}
                <span className="text-xs text-redup">Simpan pengaturan agar grup dipakai untuk pengingat otomatis.</span>
              </div>
            </div>
          )}
          <Button memuat={proses === 'simpan'} onClick={simpan}>
            Simpan pengaturan WA
          </Button>
        </section>

        <section className="kartu space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-isi text-base font-semibold">
            <KeyRound className="size-5 text-emas-tua" aria-hidden /> Token Fonnte
          </h2>
          <p className="text-sm text-redup">
            Status: {tokenAda ? <Lencana warna="hijau">Sudah diisi</Lencana> : <Lencana warna="bata">Belum diisi</Lencana>} — token disimpan aman di server (Script Properties), tidak pernah tampil lagi.
          </p>
          <div className="flex gap-2">
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Tempel token dari dashboard Fonnte" aria-label="Token Fonnte" autoComplete="off" />
            <Button
              memuat={proses === 'token'}
              disabled={!token}
              onClick={() =>
                jalan('token', async () => {
                  await admin.jalankan('simpanTokenWA', { fonnte_token: token }, 'Token disimpan.');
                  setToken('');
                  admin.muatUlang();
                })
              }
            >
              Simpan
            </Button>
          </div>
        </section>

        <section className="kartu space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-isi text-base font-semibold">
            <Clock className="size-5 text-emas-tua" aria-hidden /> Jadwal pengingat
          </h2>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">Kirim WA otomatis</span>
            <Switch nyala={wa.aktif !== false} ubah={(v) => setWa({ ...wa, aktif: v })} label="Kirim WA otomatis" />
          </div>
          <label className="block text-sm">
            Jam pengingat malam (WIB)
            <Select value={wa.jam_pengingat ?? 20} onChange={(e) => setWa({ ...wa, jam_pengingat: Number(e.target.value) })} className="mt-1.5">
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}.00
                </option>
              ))}
            </Select>
          </label>
          <p className="text-xs text-redup">Trigger aktif: {(info.wa?.trigger || []).join(', ') || 'belum ada'}</p>
          <Button
            varian="hantu"
            ukuran="sm"
            ikon={Wrench}
            memuat={proses === 'trigger'}
            onClick={() =>
              jalan('trigger', async () => {
                await admin.jalankan('aturTrigger', {}, 'Trigger dipasang ulang.');
                admin.muatUlang();
              })
            }
          >
            Pasang ulang trigger
          </Button>
        </section>

        <section className="kartu space-y-4 p-5 lg:col-span-2">
          <h2 className="font-isi text-base font-semibold">Templat pesan</h2>
          {pakaiGrup && (
            <div className="grid gap-5 md:grid-cols-3">
              {TEMPLAT_GRUP.map((t) => (
                <KartuTemplat key={t.kunci} t={t} wa={wa} setWa={setWa} />
              ))}
            </div>
          )}
          {pakaiPersonal && (
            <div className={cn('grid gap-5 md:grid-cols-2', pakaiGrup && 'border-t border-garis pt-5')}>
              {TEMPLAT.map((t) => (
                <KartuTemplat key={t.kunci} t={t} wa={wa} setWa={setWa} />
              ))}
            </div>
          )}
          <Button memuat={proses === 'simpan'} onClick={simpan}>
            Simpan pengaturan WA
          </Button>
        </section>

        <section className="kartu space-y-4 p-5">
          <h2 className="flex items-center gap-2 font-isi text-base font-semibold">
            <Send className="size-5 text-emas-tua" aria-hidden /> Uji kirim ke nomor
          </h2>
          <div className="flex gap-2">
            <Input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="08xx atau 628xx" inputMode="tel" aria-label="Nomor WA uji" />
            <Button
              memuat={proses === 'uji'}
              disabled={!nomor}
              onClick={() =>
                jalan('uji', async () => {
                  const r = await admin.jalankan('testWA', { nomor });
                  setHasilUji(r);
                  admin.muatUlang();
                })
              }
            >
              Kirim
            </Button>
          </div>
          {hasilUji && <Lencana warna={hasilUji.terkirim ? 'hijau' : 'bata'}>{hasilUji.terkirim ? 'Terkirim' : hasilUji.status}</Lencana>}
        </section>

        <section className="kartu p-5">
          <div className="mb-3 flex items-center">
            <h2 className="flex-1 font-isi text-base font-semibold">Log kirim</h2>
            <Button varian="hantu" ukuran="sm" ikon={RefreshCw} onClick={admin.muatUlang}>
              Muat ulang
            </Button>
          </div>
          <ul className="max-h-96 divide-y divide-garis overflow-y-auto">
            {(info.log_wa || []).map((l) => (
              <li key={l.id} className="py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{l.tujuan}</span>
                  <Lencana warna={l.status_fonnte === 'TERKIRIM' ? 'hijau' : 'bata'} className="ml-auto">
                    {l.status_fonnte === 'TERKIRIM' ? 'Terkirim' : l.status_fonnte === 'GRUP_KOSONG' ? 'Grup belum dipilih' : l.status_fonnte}
                  </Lencana>
                </div>
                <p className="mt-0.5 whitespace-pre-line text-xs text-redup">
                  {tanggal(l.waktu, 'pendek')} {jam(l.waktu)} · {l.isi}
                </p>
              </li>
            ))}
            {!info.log_wa?.length && <li className="py-6 text-center text-sm text-redup">Belum ada pesan.</li>}
          </ul>
        </section>
      </div>
    </HalamanAdmin>
  );
}
