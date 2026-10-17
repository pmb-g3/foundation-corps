import { useState } from 'react';
import { ExternalLink, Monitor, RotateCw, Smartphone } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Segmen } from '../../components/ui/Segmen.jsx';
import { IkonTombol } from '../../components/ui/Button.jsx';

/** Pratinjau website asli di dalam bingkai (HP 390 px / Desktop). */
export function PratinjauSitus({ query, jalur = '/', kunci = 0, tinggi = 'h-[72vh]' }) {
  const [perangkat, setPerangkat] = useState('desktop');
  const [ulang, setUlang] = useState(0);
  const src = `${location.pathname}?${query}#${jalur}`;
  return (
    <div className="kartu overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-garis bg-krem/70 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-bata/70" />
          <span className="size-2.5 rounded-full bg-emas/80" />
          <span className="size-2.5 rounded-full bg-daun/70" />
        </div>
        <Segmen
          pilihan={[
            { nilai: 'hp', label: 'HP', ikon: Smartphone },
            { nilai: 'desktop', label: 'Desktop', ikon: Monitor }
          ]}
          nilai={perangkat}
          ubah={setPerangkat}
          idTata="pratinjau-perangkat"
          label="Ukuran pratinjau"
          className="ml-2"
        />
        <div className="ml-auto flex gap-1">
          <IkonTombol ikon={RotateCw} label="Muat ulang pratinjau" kecil onClick={() => setUlang((x) => x + 1)} />
          <a href={src} target="_blank" rel="noreferrer" aria-label="Buka di tab baru" className="flex size-9 items-center justify-center rounded-full text-hijau hover:bg-hijau/5">
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div className={cn('flex justify-center bg-[#E9E3D6]', tinggi)}>
        <iframe
          key={`${kunci}-${ulang}`}
          src={src}
          title="Pratinjau website"
          className={cn('h-full bg-krem transition-[width] duration-300', perangkat === 'hp' ? 'my-3 w-[390px] rounded-[1.6rem] border-[6px] border-tinta/80 shadow-modal' : 'w-full')}
        />
      </div>
    </div>
  );
}
