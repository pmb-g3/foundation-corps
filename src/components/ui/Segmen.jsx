import * as m from 'motion/react-m';
import { cn } from '../../lib/cn.js';

/**
 * Tab/segmen pil dengan penanda yang bergeser halus.
 * pilihan: [{ nilai, label, jumlah?, ikon? }]
 */
export function Segmen({ pilihan, nilai, ubah, idTata, gelap = false, className, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'tanpa-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto rounded-full p-1',
        gelap ? 'bg-white/10' : 'bg-hijau/[0.06]',
        className
      )}
    >
      {pilihan.map((p) => {
        const aktif = p.nilai === nilai;
        const Ikon = p.ikon;
        return (
          <button
            key={p.nilai}
            type="button"
            role="tab"
            aria-selected={aktif}
            onClick={() => ubah(p.nilai)}
            className={cn(
              'relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
              aktif ? (gelap ? 'text-hijau' : 'text-gading') : gelap ? 'text-gading/80 hover:text-gading' : 'text-hijau/75 hover:text-hijau'
            )}
          >
            {aktif && (
              <m.span
                layoutId={`segmen-${idTata}`}
                className={cn('absolute inset-0 rounded-full', gelap ? 'bg-gading' : 'bg-hijau')}
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {Ikon && <Ikon className="size-4" aria-hidden />}
              {p.label}
              {p.jumlah !== undefined && (
                <span className={cn('rounded-full px-1.5 text-[0.7rem] tabular-nums', aktif ? 'bg-white/20' : 'bg-hijau/10')}>{p.jumlah}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
