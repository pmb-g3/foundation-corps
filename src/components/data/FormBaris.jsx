import { useEffect, useMemo, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { useAdmin, labelBaris } from '../../lib/admin.jsx';
import { Field, Input, Select, Switch, Textarea } from '../ui/Isian.jsx';
import { Button } from '../ui/Button.jsx';
import { UnggahFoto } from './UnggahFoto.jsx';

// Folder Drive untuk unggah foto per kolom (sesuai skema backend)
const FOLDER_BAWAAN = 'Program';

function nilaiAwal(def) {
  if (def.tipe === 'bool') return def.nama === 'aktif';
  return '';
}

/** Ubah nilai server ke format input HTML. */
function keInput(def, v) {
  if (v === null || v === undefined) return def.tipe === 'bool' ? false : '';
  if (def.tipe === 'json') return typeof v === 'string' ? v : JSON.stringify(v);
  return v;
}

/**
 * Formulir satu baris dari definisi skema backend (tipe kolom → isian yang sesuai).
 * kunci: kolom yang dikunci nilainya (mis. sektor milik Kabag).
 */
export function FormBaris({ sheet, skema, awal, kunci = {}, onSimpan, onHapus, onBatal, memuat }) {
  const admin = useAdmin();
  const kolom = useMemo(() => (skema?.kolom || []).filter((d) => !d.otomatis), [skema]);
  const [nilai, setNilai] = useState(() => {
    const o = {};
    kolom.forEach((d) => {
      o[d.nama] = awal ? keInput(d, awal[d.nama]) : nilaiAwal(d);
    });
    return { ...o, ...kunci };
  });
  const [opsiRef, setOpsiRef] = useState({});
  const [galat, setGalat] = useState({});

  // pilihan untuk kolom referensi (mis. zona_id, staf_id)
  useEffect(() => {
    let hidup = true;
    kolom
      .filter((d) => d.tipe === 'ref' && d.ref)
      .forEach((d) => {
        admin
          .ambilSheet(d.ref)
          .then((r) => hidup && setOpsiRef((o) => ({ ...o, [d.nama]: r.baris })))
          .catch(() => {});
      });
    return () => {
      hidup = false;
    };
  }, [kolom, admin]);

  const set = (k, v) => setNilai((o) => ({ ...o, [k]: v }));

  const kirim = (e) => {
    e.preventDefault();
    const g = {};
    kolom.forEach((d) => {
      const v = nilai[d.nama];
      if (d.wajib && (v === '' || v === null || v === undefined)) g[d.nama] = `${d.label} wajib diisi`;
    });
    setGalat(g);
    if (Object.keys(g).length) return;
    onSimpan({ ...(awal?.id ? { id: awal.id } : {}), ...nilai });
  };

  const isian = (d) => {
    const v = nilai[d.nama];
    const terkunci = d.nama in kunci;
    const p = { value: v ?? '', onChange: (e) => set(d.nama, e.target.value), disabled: terkunci || memuat };
    switch (d.tipe) {
      case 'teks_panjang':
        return (id) => <Textarea id={id} {...p} rows={d.nama.includes('proses') || d.nama.includes('program') ? 5 : 3} />;
      case 'json':
        return (id) => <Textarea id={id} {...p} rows={3} className="font-mono text-xs" />;
      case 'angka':
      case 'uang':
      case 'persen':
        return (id) => <Input id={id} {...p} inputMode="decimal" placeholder={d.tipe === 'uang' ? 'mis. 1.250.000' : ''} />;
      case 'tanggal':
        return (id) => <Input id={id} type="date" {...p} value={String(v || '').slice(0, 10)} />;
      case 'waktu':
        return (id) => <Input id={id} type="datetime-local" {...p} value={String(v || '').slice(0, 16)} />;
      case 'jam':
        return (id) => <Input id={id} type="time" {...p} />;
      case 'bool':
        return () => <Switch nyala={!!v} ubah={(x) => set(d.nama, x)} label={d.label} disabled={terkunci} />;
      case 'pilihan':
        return (id) => (
          <Select id={id} {...p}>
            {!d.wajib && <option value="">—</option>}
            {d.wajib && !v && <option value="">Pilih…</option>}
            {d.pilihan.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        );
      case 'ref':
        return (id) => (
          <Select id={id} {...p}>
            <option value="">{d.wajib ? 'Pilih…' : '—'}</option>
            {(opsiRef[d.nama] || []).map((r) => (
              <option key={r.id} value={r.id}>
                {labelBaris(r)}
              </option>
            ))}
          </Select>
        );
      case 'foto':
      case 'foto_banyak':
        return () => (
          <UnggahFoto
            nilai={v}
            ubah={(x) => set(d.nama, x)}
            folder={d.folder || FOLDER_BAWAAN}
            banyak={d.tipe === 'foto_banyak'}
            label={d.label}
          />
        );
      default:
        return (id) => (
          <>
            <Input id={id} {...p} list={d.saran ? `saran-${d.nama}` : undefined} />
            {d.saran && (
              <datalist id={`saran-${d.nama}`}>
                {d.saran.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </>
        );
    }
  };

  return (
    <form onSubmit={kirim} className="space-y-4" aria-label={`Formulir ${skema?.judul || sheet}`}>
      {kolom.map((d) => {
        const render = isian(d);
        return (
          <Field key={d.nama} label={d.label} wajib={d.wajib} galat={galat[d.nama]} petunjuk={d.tipe === 'json' ? 'Lebih mudah lewat menu Editor Zona.' : d.rahasia ? 'Tidak tampil di website.' : undefined}>
            {(p) => render(p.id)}
          </Field>
        );
      })}
      <div className="sticky bottom-0 -mx-5 flex flex-wrap gap-2 border-t border-garis bg-gading px-5 py-3 md:-mx-6 md:px-6">
        <Button type="submit" ikon={Save} memuat={memuat}>
          Simpan
        </Button>
        {onBatal && (
          <Button varian="hantu" onClick={onBatal}>
            Batal
          </Button>
        )}
        {onHapus && (
          <Button varian="bahayaLembut" ikon={Trash2} onClick={onHapus} className="ml-auto">
            Hapus
          </Button>
        )}
      </div>
    </form>
  );
}
