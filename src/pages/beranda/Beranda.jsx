import { useEffect } from 'react';
import { CalendarCheck, CalendarDays, LayoutGrid, Sparkles, Users } from 'lucide-react';
import { IndikatorGulir } from '../../components/layout/IndikatorGulir.jsx';
import { useData, usePengaturan } from '../../lib/data.jsx';
import { useEditor } from '../../lib/editor.jsx';
import { useRute } from '../../lib/router.jsx';
import { Bagian } from '../../components/layout/Bagian.jsx';
import { Hero } from './Hero.jsx';
import { JadwalHariIni } from './JadwalHariIni.jsx';
import { ProgramUnggulan } from './ProgramUnggulan.jsx';
import { PilihanSektor } from './PilihanSektor.jsx';
import { KalenderKegiatan } from './KalenderKegiatan.jsx';
import { StafMalas } from './StafMalas.jsx';

const LAYOUT_BAWAAN = {
  urutan: ['hero', 'jadwal', 'sektor', 'kalender', 'staf'],
  tampil: { hero: true, jadwal: true, sektor: true, kalender: true, staf: true },
  varian: { program: 'carousel', sektor: 'bento', staf: 'grid' }
};

const TEKS_BAWAAN = {
  jadwal: { label: 'Hari Ini', judul: 'Subuh Berkah' },
  sektor: { label: 'Sektor', judul: 'Data Sektor' },
  kalender: { label: 'Kalender', judul: 'Kegiatan' },
  staf: { label: 'Staf', judul: 'Staf Yayasan' }
};

/** Beranda: urutan, tampil/sembunyi, dan varian tiap bagian mengikuti Editor Layout (F-52). */
export default function Beranda({ pratinjauLayout }) {
  const { boot, muatUlang } = useData();
  const pengaturan = usePengaturan();
  const editor = useEditor();
  const { query } = useRute();
  const layout = pratinjauLayout || { ...LAYOUT_BAWAAN, ...(pengaturan.layout || {}) };
  const varian = { ...LAYOUT_BAWAAN.varian, ...(layout.varian || {}) };
  const teks = (k) => ({ ...TEKS_BAWAAN[k], ...((pengaturan.teks_bagian || {})[k] || {}) });
  const edit = (target) => (editor.bisa() ? () => editor.buka({ ...target, setelahSimpan: muatUlang }) : undefined);

  // tautan footer "#/?ke=kalender" → gulir ke bagian itu
  const ke = query.get('ke');
  useEffect(() => {
    if (!ke) return;
    const t = setTimeout(() => document.getElementById(ke)?.scrollIntoView({ behavior: 'smooth' }), 120);
    return () => clearTimeout(t);
  }, [ke, boot]);

  const bagian = {
    hero: <Hero key="hero" />,
    jadwal: (
      <Bagian key="jadwal" id="jadwal" label={teks('jadwal').label} judul={teks('jadwal').judul} onEdit={edit({ jenis: 'teks', bagian: 'jadwal' })}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="min-w-0 lg:col-span-7">
            <JadwalHariIni jadwal={boot?.jadwal} />
          </div>
          <div id="program" className="min-w-0 scroll-mt-24 lg:col-span-5">
            <ProgramUnggulan program={boot?.program} varian={varian.program} onEdit={edit({ jenis: 'program' })} />
          </div>
        </div>
      </Bagian>
    ),
    sektor: (
      <Bagian key="sektor" id="sektor" label={teks('sektor').label} judul={teks('sektor').judul} onEdit={edit({ jenis: 'sektor_kartu' })}>
        <PilihanSektor kartu={pengaturan.sektor_kartu} ringkasan={boot?.sektor} varian={varian.sektor} />
      </Bagian>
    ),
    kalender: (
      <Bagian key="kalender" id="kalender" label={teks('kalender').label} judul={teks('kalender').judul} onEdit={edit({ jenis: 'teks', bagian: 'kalender' })}>
        <KalenderKegiatan />
      </Bagian>
    ),
    staf: (
      <Bagian key="staf" id="staf" label={teks('staf').label} judul={teks('staf').judul} onEdit={edit({ jenis: 'tabel', sheet: 'Staf', judul: 'Staf' })} className="pb-24">
        <StafMalas staf={boot?.staf} varian={varian.staf} />
      </Bagian>
    )
  };

  const urutan = ['hero', ...(layout.urutan || LAYOUT_BAWAAN.urutan).filter((b) => b !== 'hero')];
  const tampil = urutan.filter((b) => b === 'hero' || layout.tampil?.[b] !== false);
  // F-61: ikon per bagian (Jadwal, Program, Sektor, Kalender, Staf) mengikuti urutan & tampil
  const penanda = tampil.flatMap((b) => (b === 'jadwal' ? [PENANDA.jadwal, PENANDA.program] : PENANDA[b] ? [PENANDA[b]] : []));
  return (
    <>
      {tampil.map((b) => bagian[b])}
      <IndikatorGulir bagian={penanda} />
    </>
  );
}

const PENANDA = {
  jadwal: { id: 'jadwal', label: 'Jadwal', ikon: CalendarCheck },
  program: { id: 'program', label: 'Program', ikon: Sparkles },
  sektor: { id: 'sektor', label: 'Sektor', ikon: LayoutGrid },
  kalender: { id: 'kalender', label: 'Kalender', ikon: CalendarDays },
  staf: { id: 'staf', label: 'Staf', ikon: Users }
};
