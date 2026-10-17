import { useInView } from '../../hooks/useInView.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { cn } from '../../lib/cn.js';

/** Angka yang berhitung naik saat terlihat (PRD 7.2). */
export function AngkaNaik({ nilai, format = (v) => Math.round(v).toLocaleString('id-ID'), className }) {
  const [ref, terlihat] = useInView({ rootMargin: '0px', threshold: 0.4 });
  const v = useCountUp(nilai, terlihat);
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {format(v)}
    </span>
  );
}

/** Kotak statistik: label kecil, angka besar serif, keterangan, garis emas tipis (DESIGN.md: Stat Displays). */
export function KotakStat({ label, nilai, format, sub, ikon: Ikon, className, gelap = false, children }) {
  return (
    <div className={cn(gelap ? 'rounded-kartu border border-white/15 bg-white/[0.06] p-5' : 'kartu p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn('text-xs font-semibold uppercase tracking-[0.08em]', gelap ? 'text-gading/70' : 'text-redup')}>{label}</p>
        {Ikon && <Ikon className={cn('size-5 shrink-0', gelap ? 'text-emas' : 'text-emas-tua')} aria-hidden />}
      </div>
      <p className={cn('mt-3 font-judul text-[2rem] leading-none', gelap ? 'text-gading' : 'text-tinta')}>
        {typeof nilai === 'number' ? <AngkaNaik nilai={nilai} format={format} /> : nilai}
      </p>
      <div className="garis-emas mt-4 w-12" />
      {sub && <p className={cn('mt-2 text-xs', gelap ? 'text-gading/65' : 'text-redup')}>{sub}</p>}
      {children}
    </div>
  );
}

/** Bilah proporsi dua bagian atau lebih (mis. SHM vs Petok). */
export function BilahProporsi({ bagian, className }) {
  const total = bagian.reduce((t, b) => t + (b.nilai || 0), 0) || 1;
  const [ref, terlihat] = useInView({ rootMargin: '0px', threshold: 0.4 });
  return (
    <div ref={ref} className={className}>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-garis/60">
        {bagian.map((b) =>
          b.nilai > 0 ? (
            <div
              key={b.label}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(b.nilai / total) * 100}%`,
                background: b.warna,
                transform: terlihat ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform .9s cubic-bezier(.22,1,.36,1)'
              }}
            />
          ) : null
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-redup">
        {bagian.map((b) => (
          <li key={b.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: b.warna }} />
            {b.label} <b className="font-semibold text-tinta tabular-nums">{b.nilai}</b>
            <span className="tabular-nums">({Math.round((b.nilai / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
