import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { AdminProvider, useAdmin } from '../../../lib/admin.jsx';
import { useData } from '../../../lib/data.jsx';
import { SEKTOR, SEKTOR_RUMAH, sektorDariId } from '../../../lib/sektor.js';
import { Laci } from '../../../components/ui/Dialog.jsx';
import { Button, IkonTombol } from '../../../components/ui/Button.jsx';
import { Field, Input, Select, Textarea } from '../../../components/ui/Isian.jsx';
import { Kerangka, KotakPesan } from '../../../components/ui/Kerangka.jsx';
import { UnggahFoto } from '../../../components/data/UnggahFoto.jsx';
import { TabelData } from '../../../components/data/TabelData.jsx';

const FOLDER_SEKTOR = { PERTANIAN: 'Pertanian', PERTANAHAN: 'Pertanahan', KENDARAAN: 'Kendaraan', PEMBANGUNAN: 'Pembangunan' };
// Titik fokus hero (object-position). Bawaan: masjid pada foto drone pondok.
const FOKUS_PILIHAN = [
  { nilai: '56% 40%', label: 'Masjid — disarankan' },
  { nilai: '50% 50%', label: 'Tengah foto' },
  { nilai: '45% 80%', label: 'Gerbang & jalan masuk' },
  { nilai: '25% 50%', label: 'Sisi kiri' },
  { nilai: '75% 50%', label: 'Sisi kanan' }
];
const BAGIAN_TEKS = { jadwal: 'Jadwal hari ini', program: 'Program unggulan', sektor: 'Pilihan sektor', kalender: 'Kalender', staf: 'Staf' };

/** Formulir pengaturan berbentuk objek (hero, footer, teks bagian). */
function FormObjek({ awal, isian, onSimpan, memuat }) {
  const [nilai, setNilai] = useState(awal || {});
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSimpan(nilai);
      }}
      className="space-y-4"
    >
      {isian.map((f) => (
        <Field key={f.kunci} label={f.label} petunjuk={f.petunjuk}>
          {(p) =>
            f.jenis === 'foto' ? (
              <UnggahFoto nilai={nilai[f.kunci]} ubah={(v) => setNilai({ ...nilai, [f.kunci]: v })} folder={f.folder} jenis={f.ukuran || 'besar'} label={f.label} />
            ) : f.jenis === 'pilihan' ? (
              <Select {...p} value={nilai[f.kunci] || f.pilihan[0].nilai} onChange={(e) => setNilai({ ...nilai, [f.kunci]: e.target.value })}>
                {f.pilihan.map((o) => (
                  <option key={o.nilai} value={o.nilai}>
                    {o.label}
                  </option>
                ))}
              </Select>
            ) : f.jenis === 'panjang' ? (
              <Textarea {...p} value={nilai[f.kunci] || ''} onChange={(e) => setNilai({ ...nilai, [f.kunci]: e.target.value })} />
            ) : (
              <Input {...p} value={nilai[f.kunci] || ''} onChange={(e) => setNilai({ ...nilai, [f.kunci]: e.target.value })} maxLength={f.maks} />
            )
          }
        </Field>
      ))}
      <Button type="submit" ikon={Save} memuat={memuat} className="w-full">
        Simpan & terbitkan
      </Button>
    </form>
  );
}

/** Daftar program unggulan: ubah, tambah, hapus, urutkan. */
function EditorProgram({ selesai }) {
  const admin = useAdmin();
  const [baris, setBaris] = useState(null);
  const [proses, setProses] = useState(false);
  const muat = async () => {
    const d = await admin.ambilSheet('Program_Unggulan', true);
    setBaris([...d.baris].sort((a, b) => (Number(a.urutan) || 99) - (Number(b.urutan) || 99)));
  };
  useEffect(() => {
    muat().catch(() => setBaris([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ubah = (i, k, v) => setBaris((b) => b.map((x, j) => (j === i ? { ...x, [k]: v, _ubah: true } : x)));
  const geser = (i, arah) =>
    setBaris((b) => {
      const c = [...b];
      const j = i + arah;
      if (j < 0 || j >= c.length) return b;
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const simpanSemua = async () => {
    setProses(true);
    try {
      for (const x of baris.filter((r) => r._ubah || !r.id)) {
        const { _ubah, ...isi } = x;
        await admin.simpan('Program_Unggulan', isi, null);
      }
      const segar = await admin.ambilSheet('Program_Unggulan', true);
      const urut = baris.map((x) => x.id || segar.baris.find((s) => s.judul === x.judul)?.id).filter(Boolean);
      await admin.jalankan('simpanUrutan', { sheet: 'Program_Unggulan', kolom: 'urutan', ids: urut }, 'Program unggulan tersimpan.');
      selesai();
    } catch {
      /* pesan sudah tampil */
    } finally {
      setProses(false);
    }
  };

  const hapus = async (i) => {
    const x = baris[i];
    if (x.id) {
      try {
        await admin.hapus('Program_Unggulan', x.id);
      } catch {
        return;
      }
    }
    setBaris((b) => b.filter((_, j) => j !== i));
  };

  if (!baris) return <Kerangka className="h-64" />;
  return (
    <div className="space-y-4">
      {baris.map((p, i) => (
        <div key={p.id || i} className="kartu space-y-3 p-4">
          <div className="flex items-center gap-1">
            <span className="flex-1 text-xs font-semibold uppercase tracking-[0.08em] text-redup">Program {i + 1}</span>
            <IkonTombol ikon={ArrowUp} label="Naikkan" kecil onClick={() => geser(i, -1)} />
            <IkonTombol ikon={ArrowDown} label="Turunkan" kecil onClick={() => geser(i, 1)} />
            <IkonTombol ikon={Trash2} label="Hapus program" kecil onClick={() => hapus(i)} />
          </div>
          <Select value={p.sektor} onChange={(e) => ubah(i, 'sektor', e.target.value)} aria-label="Sektor">
            {[SEKTOR_RUMAH, ...SEKTOR].map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
          <Input value={p.judul || ''} onChange={(e) => ubah(i, 'judul', e.target.value)} placeholder="Judul" aria-label="Judul" />
          <Textarea value={p.ringkas || ''} onChange={(e) => ubah(i, 'ringkas', e.target.value)} placeholder="Ringkas (singkat)" aria-label="Ringkas" rows={2} />
          <UnggahFoto nilai={p.foto_id} ubah={(v) => ubah(i, 'foto_id', v)} folder="Program" label="Foto program" />
        </div>
      ))}
      <Button varian="sekunder" ikon={Plus} onClick={() => setBaris([...baris, { sektor: 'RUMAH', judul: '', ringkas: '', foto_id: '', _ubah: true }])} className="w-full">
        Tambah program
      </Button>
      <Button ikon={Save} memuat={proses} onClick={simpanSemua} className="w-full">
        Simpan & terbitkan
      </Button>
    </div>
  );
}

function EditorKartuSektor({ hanya, selesai }) {
  const admin = useAdmin();
  const { boot } = useData();
  const awal = admin.info?.pengaturan?.sektor_kartu || boot?.pengaturan?.sektor_kartu || {};
  const [kartu, setKartu] = useState(awal);
  const [proses, setProses] = useState(false);
  const daftar = hanya ? SEKTOR.filter((s) => s.id === hanya) : SEKTOR;
  const ubah = (id, k, v) => setKartu((x) => ({ ...x, [id]: { ...(x[id] || {}), [k]: v } }));
  const simpan = async () => {
    setProses(true);
    try {
      await admin.simpanPengaturan('sektor_kartu', kartu, 'Kartu sektor tersimpan.');
      selesai();
    } catch {
      /* pesan sudah tampil */
    } finally {
      setProses(false);
    }
  };
  return (
    <div className="space-y-4">
      {daftar.map((s) => (
        <div key={s.id} className="kartu space-y-3 p-4">
          <p className="flex items-center gap-2 font-semibold text-hijau">
            <s.ikon className="size-4" aria-hidden /> {s.label}
          </p>
          <Input value={kartu[s.id]?.judul || ''} onChange={(e) => ubah(s.id, 'judul', e.target.value)} placeholder="Judul" aria-label={`Judul ${s.label}`} />
          <Input value={kartu[s.id]?.ringkas || ''} onChange={(e) => ubah(s.id, 'ringkas', e.target.value)} placeholder="Ringkas" aria-label={`Ringkas ${s.label}`} maxLength={60} />
          <UnggahFoto nilai={kartu[s.id]?.foto_id} ubah={(v) => ubah(s.id, 'foto_id', v)} folder={FOLDER_SEKTOR[s.id]} jenis="besar" label={`Foto ${s.label}`} />
        </div>
      ))}
      <Button ikon={Save} memuat={proses} onClick={simpan} className="w-full">
        Simpan & terbitkan
      </Button>
    </div>
  );
}

function IsiEditor({ target, tutup }) {
  const admin = useAdmin();
  const { boot, muatUlang } = useData();
  const [proses, setProses] = useState(false);
  const pengaturan = useMemo(() => ({ ...(boot?.pengaturan || {}), ...(admin.info?.pengaturan || {}) }), [boot, admin.info]);

  const selesai = () => {
    muatUlang();
    target.setelahSimpan?.();
    tutup();
  };
  const simpanObjek = (kunci) => async (nilai) => {
    setProses(true);
    try {
      await admin.simpanPengaturan(kunci, nilai, 'Tersimpan dan diterbitkan.');
      selesai();
    } catch {
      /* pesan sudah tampil */
    } finally {
      setProses(false);
    }
  };

  if (admin.memuat && !admin.info) return <Kerangka className="h-64" />;
  if (admin.galat && !admin.info) return <KotakPesan jenis="galat" teks={admin.galat.message} onUlang={admin.muatUlang} />;

  switch (target.jenis) {
    case 'hero':
      return (
        <FormObjek
          awal={pengaturan.hero}
          memuat={proses}
          onSimpan={simpanObjek('hero')}
          isian={[
            { kunci: 'foto_id', label: 'Foto drone (layar penuh)', jenis: 'foto', folder: 'Hero', ukuran: 'besar', petunjuk: 'Kosongkan untuk memakai foto drone bawaan.' },
            { kunci: 'fokus', label: 'Titik fokus foto', jenis: 'pilihan', pilihan: FOKUS_PILIHAN, petunjuk: 'Bagian foto yang dijaga tetap terlihat di layar HP (tegak).' },
            { kunci: 'judul', label: 'Judul', maks: 40 },
            { kunci: 'subjudul', label: 'Subjudul kecil', maks: 40 },
            { kunci: 'tagline', label: 'Kalimat singkat (opsional)', maks: 120 }
          ]}
        />
      );
    case 'teks': {
      const tb = pengaturan.teks_bagian || {};
      return (
        <FormObjek
          awal={tb[target.bagian]}
          memuat={proses}
          onSimpan={(v) => simpanObjek('teks_bagian')({ ...tb, [target.bagian]: v })}
          isian={[
            { kunci: 'label', label: 'Label kecil', maks: 30 },
            { kunci: 'judul', label: 'Judul bagian', maks: 50 }
          ]}
        />
      );
    }
    case 'footer':
      return (
        <FormObjek
          awal={pengaturan.footer}
          memuat={proses}
          onSimpan={simpanObjek('footer')}
          isian={[
            { kunci: 'kutipan', label: 'Kutipan', jenis: 'panjang' },
            { kunci: 'alamat', label: 'Alamat', jenis: 'panjang' },
            { kunci: 'telepon', label: 'Telepon' },
            { kunci: 'email', label: 'Email' }
          ]}
        />
      );
    case 'program':
      return <EditorProgram selesai={selesai} />;
    case 'sektor_kartu':
      return <EditorKartuSektor hanya={target.sektor} selesai={selesai} />;
    case 'tabel':
      return <TabelData sheet={target.sheet} saring={target.saring} onBerubah={() => target.setelahSimpan?.()} ringkas />;
    default:
      return <KotakPesan teks="Editor tidak dikenal." />;
  }
}

const JUDUL = {
  hero: 'Edit hero',
  teks: (t) => `Teks bagian: ${BAGIAN_TEKS[t.bagian] || t.bagian}`,
  footer: 'Edit footer',
  program: 'Program unggulan',
  sektor_kartu: (t) => (t.sektor ? `Kartu ${sektorDariId(t.sektor)?.label}` : 'Kartu sektor'),
  tabel: (t) => t.judul || t.sheet
};

/** Panel editor (F-51): dibuka dari pensil di website atau dari menu Edit Website. */
export default function PanelEditor({ target, tutup }) {
  const j = JUDUL[target.jenis];
  return (
    <AdminProvider>
      <Laci buka tutup={tutup} judul={typeof j === 'function' ? j(target) : j} sisi="kanan" lebar={target.jenis === 'tabel' ? 'max-w-3xl' : 'max-w-md'}>
        <IsiEditor target={target} tutup={tutup} />
      </Laci>
    </AdminProvider>
  );
}
