import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Brush, Droplets, Flame, Hammer, PlugZap, Sparkles, LayoutGrid } from 'lucide-react';
import { cn } from '../../../lib/cn.js';
import { Lencana, warnaStatus } from '../../../components/ui/Lencana.jsx';
import { KotakPesan } from '../../../components/ui/Kerangka.jsx';

// Enam bidang (F-40)
const BIDANG = [
  { nilai: 'Tambal Sulam', ikon: Brush },
  { nilai: 'Pengelasan', ikon: Flame },
  { nilai: 'Perairan', ikon: Droplets },
  { nilai: 'Pelistrikan', ikon: PlugZap },
  { nilai: 'Perkayuan', ikon: Hammer },
  { nilai: 'Kebersihan Lingkungan', ikon: Sparkles }
];

/** F-40 Program tambal sulam per bidang (chip) beserta statusnya. */
export function TambalSulam({ rows = [] }) {
  const [bidang, setBidang] = useState('');
  const daftar = rows.filter((r) => !bidang || r.bidang === bidang);
  const chip = (nilai, label, Ikon, n) => (
    <button
      key={nilai || 'semua'}
      type="button"
      aria-pressed={bidang === nilai}
      onClick={() => setBidang(nilai)}
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors',
        bidang === nilai ? 'bg-hijau text-gading' : 'border border-garis bg-gading text-hijau hover:border-emas'
      )}
    >
      <Ikon className="size-4" aria-hidden />
      {label}
      <span className={cn('rounded-full px-1.5 text-[0.7rem] tabular-nums', bidang === nilai ? 'bg-white/20' : 'bg-hijau/8')}>{n}</span>
    </button>
  );
  return (
    <div>
      <div className="tanpa-scrollbar -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1">
        {chip('', 'Semua', LayoutGrid, rows.length)}
        {BIDANG.map((b) => chip(b.nilai, b.nilai, b.ikon, rows.filter((r) => r.bidang === b.nilai).length))}
      </div>
      <m.ul layout className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {daftar.map((r) => {
            const Ikon = BIDANG.find((b) => b.nilai === r.bidang)?.ikon || Hammer;
            return (
              <m.li
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
                className="kartu flex gap-3 p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-kayu/10 text-kayu">
                  <Ikon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug text-tinta">{r.judul}</p>
                    {r.status && <Lencana warna={warnaStatus(r.status)}>{r.status}</Lencana>}
                  </div>
                  <p className="mt-0.5 text-xs text-redup">{r.bidang}</p>
                  {r.keterangan && <p className="mt-2 text-sm text-redup">{r.keterangan}</p>}
                </div>
              </m.li>
            );
          })}
        </AnimatePresence>
      </m.ul>
      {!daftar.length && <KotakPesan teks="Belum ada program di bidang ini." />}
    </div>
  );
}
