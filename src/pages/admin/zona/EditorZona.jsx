import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Eraser, MapPin, MousePointerClick, Pencil, Plus, Save, Trash2, TriangleAlert, Undo2, X } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { useAdmin } from '../../../lib/admin.jsx';
import { useAuth } from '../../../lib/auth.jsx';
import { navigasi, useRute } from '../../../lib/router.jsx';
import { angka, luasHa } from '../../../lib/format.js';
import { WARNA_ZONA, daftarLokasi, labelZona, lokasiDari, urutZona } from '../../../lib/lokasiTanah.js';
import { kategoriDari } from '../../../lib/bangunan.js';
import { useSektor } from '../../../hooks/useSektor.js';
import { PetaFoto } from '../../../components/peta/PetaFoto.jsx';
import { bacaPoligon } from '../../../components/peta/petaLib.js';
import { Button, IkonTombol } from '../../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../../components/ui/Isian.jsx';
import { Segmen } from '../../../components/ui/Segmen.jsx';
import { Dialog } from '../../../components/ui/Dialog.jsx';
import { Lencana } from '../../../components/ui/Lencana.jsx';
import { Kerangka } from '../../../components/ui/Kerangka.jsx';
import { UnggahFoto } from '../../../components/data/UnggahFoto.jsx';
import { HalamanAdmin } from '../AdminLayout.jsx';
import { TAB_ZONA_SEKTOR } from '../navigasi.js';

/**
 * jenis: 'zona'  → poligon bernama + luas (tanah per lokasi, tanaman + pin)
 *        'kolam' → poligon bilik di atas foto udara kolam
 *        'pin'   → posisi nomor bangunan di denah
 * fotoBawaan: foto yang ikut di-deploy (folder media) bila admin belum mengunggah.
 */
const KONFIG = {
  tanah: { label: 'Zona Tanah', sektor: 'PERTANAHAN', sheet: 'Zona_Tanah', kunciFoto: 'peta_tanah', jenis: 'zona', folder: 'Pertanahan' },
  tanaman: { label: 'Zona Tanaman & Pin', sektor: 'PERTANIAN', sheet: 'Zona_Pertanian', kunciFoto: 'peta_pertanian', jenis: 'zona', foto: [['foto_id', 'Foto dasar lahan']], folder: 'Pertanian', fotoBawaan: 'lokal:tanah-latansa' },
  kolam: { label: 'Bilik Kolam', sektor: 'PERTANIAN', sheet: 'Kolam', kunciFoto: 'peta_kolam', jenis: 'kolam', foto: [['foto_id', 'Foto udara kolam']], folder: 'Perikanan', fotoBawaan: 'lokal:kolam' },
  bangunan: { label: 'Nomor Bangunan', sektor: 'PEMBANGUNAN', sheet: 'Bangunan', kunciFoto: 'denah_bangunan', jenis: 'pin', foto: [['foto_id', 'Foto denah']], folder: 'Denah', fotoBawaan: 'lokal:denah-bangunan' }
};
const BLOK_KOLAM = 'Kolam Yayasan Perikanan';
const adaTitik = (v) => v !== null && v !== '' && v !== undefined && isFinite(Number(v));

/** Titik di dalam poligon? (untuk memilih zona pin secara otomatis) */
function diDalam([x, y], poli) {
  let hasil = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i];
    const [xj, yj] = poli[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hasil = !hasil;
  }
  return hasil;
}

/** Foto referensi untuk peta satu foto (tanaman, kolam, bangunan). */
function PanelFoto({ k, peta, simpanFoto }) {
  return (
    <section className="kartu space-y-3 p-4">
      <h3 className="font-isi text-sm font-semibold">Foto referensi</h3>
      {k.foto.map(([kunci, label]) => (
        <div key={kunci}>
          <p className="mb-1 text-xs text-redup">{label}</p>
          <UnggahFoto nilai={peta?.[kunci]} ubah={(v) => simpanFoto(kunci, v)} folder={k.folder} jenis="besar" label={label} />
        </div>
      ))}
      {k.fotoBawaan && !peta?.foto_id && <p className="text-xs text-redup">Sedang memakai foto bawaan website. Unggah foto baru untuk menggantinya (poligon lama perlu disesuaikan).</p>}
    </section>
  );
}

/** Kelola lokasi peta tanah: pilih, ubah nama/foto/keterangan, tambah, hapus. */
function PanelLokasi({ lokasi, aktif, setAktif, zona, simpanLokasi, proses }) {
  const l = lokasi.find((x) => x.id === aktif) || lokasi[0];
  const [form, setForm] = useState(l);
  useEffect(() => setForm(l), [l]);
  const jumlahZona = (id) => zona.filter((z) => lokasiDari(z, lokasi) === id).length;
  const zonaLain = zona.filter((z) => lokasiDari(z, lokasi) !== l?.id).sort(urutZona);
  if (!l || !form) return null;

  const simpan = () => simpanLokasi(lokasi.map((x) => (x.id === l.id ? { ...form } : x)), 'Lokasi tersimpan.');
  const tambah = () => {
    const id = 'lokasi-' + Date.now().toString(36);
    simpanLokasi([...lokasi, { id, nama: 'Lokasi baru', foto_id: '', foto_drone_id: '', jarak: '', induk: '', keterangan: '' }], 'Lokasi baru ditambahkan.').then(() => setAktif(id));
  };
  const hapus = () => {
    if (jumlahZona(l.id)) return;
    simpanLokasi(lokasi.filter((x) => x.id !== l.id), 'Lokasi dihapus.').then(() => setAktif(lokasi.find((x) => x.id !== l.id)?.id));
  };

  return (
    <section className="kartu space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-isi text-sm font-semibold">Lokasi peta</h3>
        <Button varian="hantu" ukuran="sm" ikon={Plus} onClick={tambah} disabled={proses}>
          Tambah
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {lokasi.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setAktif(x.id)}
            aria-pressed={x.id === l.id}
            className={cn('min-h-9 rounded-full px-3 text-xs font-semibold transition-colors', x.id === l.id ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-hijau hover:border-emas')}
          >
            {x.nama} <span className="opacity-70">({jumlahZona(x.id)})</span>
          </button>
        ))}
      </div>
      <div className="space-y-3 border-t border-garis pt-3">
        <Field label="Nama lokasi" wajib>
          {(p) => <Input {...p} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />}
        </Field>
        <Field label="Jarak / arah" petunjuk="mis. ± 6 km dari pondok">
          {(p) => <Input {...p} value={form.jarak || ''} onChange={(e) => setForm({ ...form, jarak: e.target.value })} />}
        </Field>
        <Field label="Keterangan">{(p) => <Textarea {...p} rows={2} value={form.keterangan || ''} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />}</Field>
        <Field label="Merinci zona (opsional)" petunjuk="Isi bila lokasi ini memperbesar satu zona di lokasi lain; luasnya tidak dijumlahkan dua kali.">
          {(p) => (
            <Select {...p} value={form.induk || ''} onChange={(e) => setForm({ ...form, induk: e.target.value })}>
              <option value="">— Lokasi mandiri —</option>
              {zonaLain.map((z) => (
                <option key={z.id} value={z.id}>
                  {labelZona(z)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div>
          <p className="mb-1 text-xs text-redup">Gambar dasar (peta ukur / foto udara tegak)</p>
          <UnggahFoto nilai={form.foto_id} ubah={(v) => setForm({ ...form, foto_id: v })} folder="Pertanahan" jenis="besar" label="Gambar dasar" />
        </div>
        <div>
          <p className="mb-1 text-xs text-redup">Foto drone sejajar (opsional) — peta publik beralih drone → peta saat digulir</p>
          <UnggahFoto nilai={form.foto_drone_id} ubah={(v) => setForm({ ...form, foto_drone_id: v })} folder="Pertanahan" jenis="besar" label="Foto drone" />
        </div>
        <div className="flex gap-2">
          <Button ikon={Save} className="flex-1" memuat={proses} disabled={!form.nama} onClick={simpan}>
            Simpan lokasi
          </Button>
          <IkonTombol
            ikon={Trash2}
            label={jumlahZona(l.id) ? 'Pindahkan/hapus zonanya dulu' : `Hapus lokasi ${l.nama}`}
            className="text-bata"
            disabled={!!jumlahZona(l.id) || lokasi.length < 2}
            onClick={hapus}
          />
        </div>
      </div>
    </section>
  );
}

/** A-08 Editor Zona: poligon zona (tanah per lokasi, tanaman), pin tanaman, bilik kolam, dan nomor bangunan di atas foto. */
export default function EditorZona() {
  const admin = useAdmin();
  const auth = useAuth();
  const { query } = useRute();
  const tabBoleh = auth.isAdmin ? Object.keys(KONFIG) : TAB_ZONA_SEKTOR[auth.sektorKabag] || [];
  const tab = tabBoleh.includes(query.get('tab')) ? query.get('tab') : tabBoleh[0];
  const k = KONFIG[tab] || KONFIG.tanah; // Kabag sektor tanpa peta tidak punya tab
  const sektorData = useSektor(k.sektor);
  const [peta, setPeta] = useState(null);
  const [rows, setRows] = useState(null);
  const [pins, setPins] = useState([]);
  const [titik, setTitik] = useState([]);
  const [menggambar, setMenggambar] = useState(false);
  const [mode, setMode] = useState('zona'); // zona | pin
  const [form, setForm] = useState(null);
  const [formPin, setFormPin] = useState(null);
  const [pilihBangunan, setPilihBangunan] = useState(null);
  const [lokasiAktif, setLokasiAktif] = useState(null);
  const [hapus, setHapus] = useState(null);
  const [proses, setProses] = useState(false);
  const [terakhir, setTerakhir] = useState(null);
  const konversi = sektorData.data?.pengaturan?.konversi_ru || 14;

  useEffect(() => {
    setTitik([]);
    setMenggambar(false);
    setForm(null);
    setMode('zona');
    setPilihBangunan(null);
  }, [tab]);

  useEffect(() => {
    if (sektorData.data?.pengaturan) setPeta(sektorData.data.pengaturan[k.kunciFoto] || {});
  }, [sektorData.data, k.kunciFoto]);

  const muat = useCallback(async () => {
    const r = await admin.ambilSheet(k.sheet, true);
    setRows(r.baris);
    if (tab === 'tanaman') setPins((await admin.ambilSheet('Titik_Tanaman', true)).baris);
  }, [admin, k.sheet, tab]);

  useEffect(() => {
    setRows(null);
    muat().catch(() => setRows([]));
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- lokasi (khusus tanah) ----------
  const lokasi = useMemo(() => (tab === 'tanah' ? daftarLokasi(peta) : []), [tab, peta]);
  const lokasiId = lokasi.some((l) => l.id === lokasiAktif) ? lokasiAktif : lokasi[0]?.id;
  const lokasiObj = lokasi.find((l) => l.id === lokasiId);
  const barisTampil = useMemo(() => {
    if (!rows) return [];
    if (tab === 'tanah') return rows.filter((z) => lokasiDari(z, lokasi) === lokasiId).sort(urutZona);
    if (tab === 'kolam' || tab === 'bangunan') return [...rows].sort((a, b) => String(a.kode_bilik ?? a.nomor).localeCompare(String(b.kode_bilik ?? b.nomor), 'id', { numeric: true }));
    return rows;
  }, [rows, tab, lokasi, lokasiId]);

  // Esc = batalkan, Backspace = hapus titik terakhir (saat tidak mengetik)
  useEffect(() => {
    const f = (e) => {
      if (/input|textarea|select/i.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'Escape' && menggambar) {
        setTitik([]);
        setMenggambar(false);
      }
      if (e.key === 'Backspace' && menggambar && titik.length) {
        e.preventDefault();
        setTitik((t) => t.slice(0, -1));
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [menggambar, titik.length]);

  const wilayah = useMemo(() => {
    if (tab === 'bangunan') return [];
    return barisTampil
      .filter((z) => !form || z.id !== form.id)
      .map((z, i) =>
        tab === 'kolam'
          ? { id: z.id, nama: z.kode_bilik, titik: bacaPoligon(z.polygon_json), warna: z.status === 'Isi' ? '#8CC084' : '#F5EFE3' }
          : { id: z.id, nama: tab === 'tanah' ? labelZona(z) : z.nama_zona, sub: luasHa(z.luas_m2), titik: bacaPoligon(z.polygon_json), warna: WARNA_ZONA[i % WARNA_ZONA.length] }
      );
  }, [barisTampil, tab, form]);
  const pinPeta = useMemo(() => {
    if (tab === 'bangunan') return barisTampil.filter((b) => adaTitik(b.x_persen)).map((b) => ({ id: b.id, x: b.x_persen, y: b.y_persen, nomor: b.nomor, label: b.nama, warna: kategoriDari(b).warna }));
    if (tab === 'tanaman') return pins.map((p) => ({ id: p.id, x: p.x_persen, y: p.y_persen, label: p.komoditas }));
    return [];
  }, [tab, barisTampil, pins]);

  const simpanFoto = async (kunci, nilai) => {
    const baru = { ...(peta || {}), [kunci]: nilai };
    setPeta(baru);
    try {
      await admin.simpanPengaturan(k.kunciFoto, baru, 'Foto referensi tersimpan.');
      sektorData.muatUlang();
    } catch {
      /* pesan tampil */
    }
  };

  const simpanLokasi = async (daftarBaru, pesan) => {
    setProses(true);
    try {
      const baru = { ...(peta || {}), lokasi: daftarBaru };
      await admin.simpanPengaturan('peta_tanah', baru, pesan);
      setPeta(baru);
      sektorData.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  const klikPeta = (p) => {
    setTerakhir(p);
    if (tab === 'bangunan') {
      if (!pilihBangunan) return;
      setProses(true);
      admin
        .simpan('Bangunan', { id: pilihBangunan, x_persen: p[0], y_persen: p[1] }, 'Posisi nomor tersimpan.')
        .then(muat)
        .catch(() => {})
        .finally(() => setProses(false));
      return;
    }
    if (mode === 'pin') {
      const zona = (rows || []).find((z) => diDalam(p, bacaPoligon(z.polygon_json)));
      setFormPin({ x_persen: p[0], y_persen: p[1], zona_id: zona?.id || rows?.[0]?.id || '', komoditas: '', jumlah: '', keterangan: '' });
      return;
    }
    if (menggambar) setTitik((t) => [...t, p]);
  };

  const simpanZona = async () => {
    if (titik.length < 3) return;
    setProses(true);
    try {
      const id = form.id ? { id: form.id } : {};
      if (tab === 'kolam') {
        await admin.simpan('Kolam', { ...id, kode_bilik: form.nama, blok_induk: form.blok || BLOK_KOLAM, ...(form.id ? {} : { shape_id: form.nama, status: 'Kosong' }), polygon_json: titik }, 'Bentuk bilik tersimpan.');
      } else {
        const tambahan = tab === 'tanah' ? { kode: form.kode, lokasi: lokasiId, keterangan: form.keterangan } : {};
        await admin.simpan(k.sheet, { ...id, nama_zona: form.nama, luas_m2: form.luas, polygon_json: titik, ...tambahan }, 'Zona tersimpan.');
      }
      setTitik([]);
      setMenggambar(false);
      setForm(null);
      await muat();
      sektorData.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  const simpanPin = async () => {
    setProses(true);
    try {
      await admin.simpan('Titik_Tanaman', formPin, 'Pin tanaman tersimpan.');
      setFormPin(null);
      await muat();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  const konfirmHapus = async () => {
    setProses(true);
    try {
      if (hapus.bentukSaja) await admin.simpan(hapus.sheet, { id: hapus.id, polygon_json: '' }, 'Bentuk bilik dihapus dari peta.');
      else await admin.hapus(hapus.sheet, hapus.id);
      setHapus(null);
      await muat();
      sektorData.muatUlang();
    } catch {
      /* pesan tampil */
    } finally {
      setProses(false);
    }
  };

  const mulaiGambar = (z) => {
    setMode('zona');
    setMenggambar(true);
    setTitik(z ? bacaPoligon(z.polygon_json) : []);
    if (tab === 'kolam') setForm(z ? { id: z.id, nama: z.kode_bilik, blok: z.blok_induk || BLOK_KOLAM } : { nama: '', blok: BLOK_KOLAM });
    else setForm(z ? { id: z.id, nama: z.nama_zona, luas: z.luas_m2 ?? '', kode: z.kode ?? '', keterangan: z.keterangan ?? '' } : { nama: '', luas: '', kode: '', keterangan: '' });
  };

  if (!tab) return <HalamanAdmin judul="Editor Zona" keterangan="Sektor Anda tidak memiliki peta." />;
  const fotoPeta = tab === 'tanah' ? lokasiObj?.foto_id : peta?.foto_id || k.fotoBawaan;
  const modeKlik = tab === 'bangunan' ? !!pilihBangunan : mode === 'pin' || menggambar;
  const luasNum = Number(String(form?.luas || '').replace(/\./g, '').replace(',', '.')) || 0;
  const kodeKolamDipakai = tab === 'kolam' && form && !form.id && (rows || []).some((r) => String(r.kode_bilik).toLowerCase() === String(form.nama).trim().toLowerCase());

  return (
    <HalamanAdmin label="Modul geospasial" judul="Editor Zona" keterangan="Ketuk titik-titik sudut batas di atas foto. Titik disimpan dalam persen, jadi pas di semua ukuran layar.">
      {tabBoleh.length > 1 && (
        <Segmen
          pilihan={tabBoleh.map((t) => ({ nilai: t, label: KONFIG[t].label }))}
          nilai={tab}
          ubah={(t) => navigasi(`/admin/zona?tab=${t}`, { ganti: true })}
          idTata="tab-zona"
          label="Jenis peta"
          className="mb-6 w-fit"
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="min-w-0 space-y-3">
          {/* bilah alat */}
          {tab !== 'bangunan' && (
            <div className="flex flex-wrap items-center gap-2">
              {tab === 'tanah' && lokasiObj && <Lencana warna="hijau" ikon={MapPin}>{lokasiObj.nama}</Lencana>}
              {!menggambar && mode === 'zona' && (
                <Button ikon={Plus} ukuran="sm" onClick={() => mulaiGambar(null)}>
                  {tab === 'kolam' ? 'Gambar bilik baru' : 'Gambar zona baru'}
                </Button>
              )}
              {tab === 'tanaman' && !menggambar && (
                <Button varian={mode === 'pin' ? 'primer' : 'sekunder'} ikon={MapPin} ukuran="sm" onClick={() => setMode(mode === 'pin' ? 'zona' : 'pin')}>
                  {mode === 'pin' ? 'Selesai menambah pin' : 'Tambah pin tanaman'}
                </Button>
              )}
              {menggambar && (
                <>
                  <Lencana warna="emas" ikon={MousePointerClick}>
                    Ketuk sudut batas · {titik.length} titik
                  </Lencana>
                  <Button varian="hantu" ukuran="sm" ikon={Eraser} disabled={!titik.length} onClick={() => setTitik((t) => t.slice(0, -1))}>
                    Hapus titik
                  </Button>
                  <Button varian="hantu" ukuran="sm" ikon={Undo2} onClick={() => mulaiGambar(form?.id ? rows.find((r) => r.id === form.id) : null)}>
                    Ulang
                  </Button>
                  <Button
                    varian="hantu"
                    ukuran="sm"
                    ikon={X}
                    onClick={() => {
                      setMenggambar(false);
                      setTitik([]);
                      setForm(null);
                    }}
                  >
                    Batal
                  </Button>
                </>
              )}
            </div>
          )}
          {tab === 'bangunan' && (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={pilihBangunan || ''} onChange={(e) => setPilihBangunan(e.target.value || null)} aria-label="Bangunan yang diposisikan" className="w-72">
                <option value="">Pilih bangunan, lalu ketuk denah…</option>
                {barisTampil.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nomor}. {b.nama}
                  </option>
                ))}
              </Select>
              {pilihBangunan && <Lencana warna="emas" ikon={MousePointerClick}>Ketuk posisi nomor di denah</Lencana>}
            </div>
          )}

          {!rows ? (
            <Kerangka className="aspect-[16/10] w-full rounded-kartu" />
          ) : (
            <PetaFoto
              key={tab + (lokasiId || '')}
              foto={fotoPeta}
              wilayah={wilayah}
              pin={pinPeta}
              pinTerpilih={tab === 'bangunan' ? pilihBangunan : null}
              modeGambar={modeKlik}
              onKlikPeta={klikPeta}
              poligonSementara={menggambar ? titik : undefined}
              petaMini={false}
              zoomBebas
              tampilLabel
              isiOpasitas={0.28}
              tinggiMaks="78svh"
              ariaLabel="Peta editor zona"
            />
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-2xl bg-gading px-4 py-2.5 text-xs text-redup ring-1 ring-garis">
            <span>
              <kbd className="rounded bg-krem px-1.5 py-0.5 font-mono">Ketuk</kbd> buat titik
            </span>
            <span>
              <kbd className="rounded bg-krem px-1.5 py-0.5 font-mono">Backspace</kbd> hapus titik
            </span>
            <span>
              <kbd className="rounded bg-krem px-1.5 py-0.5 font-mono">Esc</kbd> batalkan
            </span>
            <span>Perbesar dulu (cubit / tombol +) agar sudut kecil lebih tepat</span>
            {terakhir && (
              <span className="ml-auto font-mono tabular-nums">
                x {terakhir[0]}% · y {terakhir[1]}%
              </span>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          {tab === 'tanah' ? (
            <PanelLokasi lokasi={lokasi} aktif={lokasiId} setAktif={setLokasiAktif} zona={rows || []} simpanLokasi={simpanLokasi} proses={proses} />
          ) : (
            <PanelFoto k={k} peta={peta} simpanFoto={simpanFoto} />
          )}

          {menggambar && form && (
            <section className="kartu space-y-3 p-4">
              <p className="label-bagian">{tab === 'kolam' ? 'Properti bilik' : 'Properti zona'}</p>
              {tab === 'kolam' ? (
                <>
                  <Field label="Kode / nama bilik" wajib petunjuk={kodeKolamDipakai ? 'Kode sudah dipakai — pilih bilik itu di daftar untuk menggambar ulang.' : 'mis. B6 atau Kolam Besar'}>
                    {(p) => <Input {...p} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} disabled={!!form.id} />}
                  </Field>
                  <Field label="Blok / kolam induk">{(p) => <Input {...p} value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} />}</Field>
                </>
              ) : (
                <>
                  {tab === 'tanah' && (
                    <Field label="No. bidang" petunjuk="Nomor di peta ukur, mis. 6 atau 6A">
                      {(p) => <Input {...p} value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} className="w-32" />}
                    </Field>
                  )}
                  <Field label="Nama zona" wajib>
                    {(p) => <Input {...p} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="mis. Pemukiman Pondok" />}
                  </Field>
                  <Field label="Luas (m²)" petunjuk={luasNum ? `= ${luasHa(luasNum)} · ${angka(luasNum / konversi, 1)} ru` : 'Dari sertifikat/pengukuran.'}>
                    {(p) => <Input {...p} value={form.luas} onChange={(e) => setForm({ ...form, luas: e.target.value })} inputMode="decimal" />}
                  </Field>
                  {tab === 'tanah' && (
                    <Field label="Keterangan">{(p) => <Textarea {...p} rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />}</Field>
                  )}
                </>
              )}
              {titik.length < 3 && (
                <p className="flex gap-2 rounded-xl bg-bata/10 px-3 py-2 text-xs text-bata">
                  <TriangleAlert className="size-4 shrink-0" aria-hidden /> Minimal 3 titik untuk menyimpan bentuk.
                </p>
              )}
              <Button ikon={Save} className="w-full" memuat={proses} disabled={titik.length < 3 || !String(form.nama).trim() || kodeKolamDipakai} onClick={simpanZona}>
                {form.id ? 'Simpan perubahan' : 'Tutup bentuk & simpan'}
              </Button>
            </section>
          )}

          <section className="kartu p-4">
            <p className="mb-2 flex items-center justify-between text-sm font-semibold">
              {tab === 'bangunan' ? 'Daftar bangunan' : tab === 'kolam' ? 'Daftar bilik' : `Zona${lokasiObj ? ` · ${lokasiObj.nama}` : ''}`}
              <span className="text-xs font-normal text-redup">{barisTampil.length}</span>
            </p>
            <ul className="max-h-[28rem] divide-y divide-garis overflow-y-auto">
              {barisTampil.map((r) => {
                const sudut = bacaPoligon(r.polygon_json).length;
                return (
                  <li key={r.id} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tab === 'bangunan' ? `${r.nomor}. ${r.nama}` : tab === 'kolam' ? r.kode_bilik : tab === 'tanah' ? labelZona(r) : r.nama_zona}</p>
                      <p className="text-xs text-redup">
                        {tab === 'bangunan'
                          ? adaTitik(r.x_persen)
                            ? `x ${r.x_persen}% · y ${r.y_persen}%`
                            : 'Belum diposisikan'
                          : tab === 'kolam'
                            ? `${r.status || 'Kosong'} · ${sudut ? `${sudut} sudut` : 'belum digambar'}`
                            : `${luasHa(r.luas_m2)} · ${sudut} sudut`}
                      </p>
                    </div>
                    {tab === 'bangunan' ? (
                      <IkonTombol ikon={MousePointerClick} label={`Posisikan ${r.nama}`} kecil onClick={() => setPilihBangunan(r.id)} className={pilihBangunan === r.id ? 'bg-emas/20' : ''} />
                    ) : (
                      <>
                        <IkonTombol ikon={Pencil} label={`Gambar ulang ${r.nama_zona || r.kode_bilik}`} kecil onClick={() => mulaiGambar(r)} />
                        {(tab !== 'kolam' || sudut > 0) && (
                          <IkonTombol
                            ikon={Trash2}
                            label={tab === 'kolam' ? `Hapus bentuk ${r.kode_bilik}` : `Hapus ${r.nama_zona}`}
                            kecil
                            className="text-bata"
                            onClick={() => setHapus({ sheet: k.sheet, id: r.id, nama: tab === 'kolam' ? `bentuk ${r.kode_bilik}` : r.nama_zona, bentukSaja: tab === 'kolam' })}
                          />
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            {tab === 'bangunan' && <p className="mt-2 text-xs text-redup">Tambah atau ubah nama, luas, dan kategori bangunan di Kelola Data → Bangunan.</p>}
            {tab === 'kolam' && <p className="mt-2 text-xs text-redup">Isi ikan, tanggal tebar, dan status diubah di Kelola Data → Kolam.</p>}
          </section>

          {tab === 'tanaman' && (
            <section className="kartu p-4">
              <p className="mb-2 text-sm font-semibold">Pin tanaman ({pins.length})</p>
              <ul className="max-h-64 divide-y divide-garis overflow-y-auto">
                {pins.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-2">
                    <span className="flex-1 truncate text-sm">
                      {p.komoditas} <span className="text-xs text-redup">· {p.jumlah}</span>
                    </span>
                    <IkonTombol ikon={Pencil} label={`Ubah pin ${p.komoditas}`} kecil onClick={() => setFormPin({ ...p })} />
                    <IkonTombol ikon={Trash2} label={`Hapus pin ${p.komoditas}`} kecil className="text-bata" onClick={() => setHapus({ sheet: 'Titik_Tanaman', id: p.id, nama: p.komoditas })} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <Dialog buka={!!formPin} tutup={() => setFormPin(null)} judul={formPin?.id ? 'Ubah pin tanaman' : 'Pin tanaman baru'} lebar="sm">
        {formPin && (
          <div className="space-y-4">
            <Field label="Zona">
              {(p) => (
                <Select {...p} value={formPin.zona_id} onChange={(e) => setFormPin({ ...formPin, zona_id: e.target.value })}>
                  {(rows || []).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nama_zona}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Komoditas" wajib>
              {(p) => <Input {...p} value={formPin.komoditas} onChange={(e) => setFormPin({ ...formPin, komoditas: e.target.value })} placeholder="mis. Jagung" data-autofocus />}
            </Field>
            <Field label="Jumlah">{(p) => <Input {...p} value={formPin.jumlah} onChange={(e) => setFormPin({ ...formPin, jumlah: e.target.value })} placeholder="mis. 500 batang" />}</Field>
            <Field label="Keterangan">{(p) => <Textarea {...p} value={formPin.keterangan} onChange={(e) => setFormPin({ ...formPin, keterangan: e.target.value })} rows={2} />}</Field>
            <Button ikon={Check} className="w-full" memuat={proses} disabled={!formPin.komoditas || !formPin.zona_id} onClick={simpanPin}>
              Simpan pin
            </Button>
          </div>
        )}
      </Dialog>
      <Dialog
        buka={!!hapus}
        tutup={() => setHapus(null)}
        judul={`Hapus ${hapus?.nama || ''}?`}
        lebar="sm"
        kaki={
          <>
            <Button varian="hantu" onClick={() => setHapus(null)}>
              Batal
            </Button>
            <Button varian="bahaya" memuat={proses} onClick={konfirmHapus}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-redup">
          {hapus?.bentukSaja
            ? 'Hanya bentuk di peta yang dihapus; data bilik (isi ikan, tebar) tetap ada.'
            : hapus?.sheet === 'Zona_Pertanian'
              ? 'Pin tanaman di zona ini ikut terhapus.'
              : 'Data tidak bisa dikembalikan dari website.'}
        </p>
      </Dialog>
    </HalamanAdmin>
  );
}
