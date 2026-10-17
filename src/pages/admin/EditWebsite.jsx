import { useState } from 'react';
import { CalendarDays, Image, LayoutGrid, PanelBottom, Pencil, Sparkles, SquareStack, Type, Users } from 'lucide-react';
import { useEditor } from '../../lib/editor.jsx';
import { useData } from '../../lib/data.jsx';
import { SEKTOR } from '../../lib/sektor.js';
import { HalamanAdmin } from './AdminLayout.jsx';
import { PratinjauSitus } from './PratinjauSitus.jsx';

/** A-03 Edit Website (F-51): ubah teks, foto, dan data langsung; pratinjau berpensil di samping. */
export default function EditWebsite() {
  const editor = useEditor();
  const data = useData();
  const [kunci, setKunci] = useState(0);
  const [halaman, setHalaman] = useState('/');
  const setelah = () => {
    setKunci((k) => k + 1);
    data.muatUlang();
  };
  const buka = (t) => editor.buka({ ...t, setelahSimpan: setelah });

  const daftar = [
    { label: 'Hero (foto drone & judul)', ikon: Image, t: { jenis: 'hero' } },
    { label: 'Teks bagian Jadwal', ikon: Type, t: { jenis: 'teks', bagian: 'jadwal' } },
    { label: 'Program unggulan', ikon: Sparkles, t: { jenis: 'program' } },
    { label: 'Kartu 4 sektor', ikon: LayoutGrid, t: { jenis: 'sektor_kartu' } },
    { label: 'Teks bagian Kalender', ikon: CalendarDays, t: { jenis: 'teks', bagian: 'kalender' } },
    { label: 'Teks bagian Staf', ikon: Type, t: { jenis: 'teks', bagian: 'staf' } },
    { label: 'Data staf', ikon: Users, t: { jenis: 'tabel', sheet: 'Staf', judul: 'Staf' } },
    { label: 'Footer', ikon: PanelBottom, t: { jenis: 'footer' } }
  ];

  return (
    <HalamanAdmin
      label="Mode edit"
      judul="Edit Website"
      keterangan="Ketuk pensil di pratinjau atau pilih bagian di daftar. Perubahan langsung terbit."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {[{ ke: '/', label: 'Beranda' }, ...SEKTOR.map((s) => ({ ke: `/sektor/${s.slug}`, label: s.pendek }))].map((h) => (
              <button
                key={h.ke}
                type="button"
                onClick={() => setHalaman(h.ke)}
                className={halaman === h.ke ? 'min-h-10 rounded-full bg-hijau px-3.5 text-sm font-semibold text-gading' : 'min-h-10 rounded-full border border-garis bg-gading px-3.5 text-sm text-hijau hover:border-emas'}
              >
                {h.label}
              </button>
            ))}
          </div>
          <PratinjauSitus query="mode=edit" jalur={halaman} kunci={kunci} />
        </div>
        <aside className="space-y-3">
          <p className="label-bagian">Bagian beranda</p>
          <ul className="kartu divide-y divide-garis">
            {daftar.map((d) => (
              <li key={d.label}>
                <button type="button" onClick={() => buka(d.t)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-krem">
                  <d.ikon className="size-4 text-emas-tua" aria-hidden />
                  <span className="flex-1">{d.label}</span>
                  <Pencil className="size-3.5 text-redup" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <p className="label-bagian pt-3">Halaman sektor</p>
          <ul className="kartu divide-y divide-garis">
            {SEKTOR.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => buka({ jenis: 'sektor_kartu', sektor: s.id })} className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-krem">
                  <SquareStack className="size-4 text-emas-tua" aria-hidden />
                  <span className="flex-1">Foto & judul {s.pendek}</span>
                  <Pencil className="size-3.5 text-redup" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-redup">Urutan, tampil/sembunyi, varian, warna, dan huruf diatur di menu Editor Layout.</p>
        </aside>
      </div>
    </HalamanAdmin>
  );
}
