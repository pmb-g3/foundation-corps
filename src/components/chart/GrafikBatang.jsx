import { useId, useMemo, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { useUkuran } from '../../hooks/useUkuran.js';
import { useInView } from '../../hooks/useInView.js';
import { jalurBatang, skalaLinier, tickRapi } from './skala.js';

/**
 * Grafik batang (tunggal atau berkelompok) SVG.
 * data : [{ label, sub?, nilai: { [kunciSeri]: number } }]
 * seri : [{ kunci, label, warna, tekstur? }]  — warna dari token tema (PRD 7.1)
 * Legenda tampil bila ≥2 seri; tekstur arsir sebagai pengenal kedua (aman buta warna).
 */
export function GrafikBatang({ data, seri, format = (v) => v, formatSumbu, formatLabel, tinggi = 240, labelNilai = false, className, judulAria }) {
  const fmtLabel = formatLabel || formatSumbu || format;
  const [ref, { lebar }] = useUkuran();
  const [refTampil, tampil] = useInView({ rootMargin: '0px', threshold: 0.3 });
  const [aktif, setAktif] = useState(null);
  const uid = useId().replace(/:/g, '');

  const kiri = 56;
  const kanan = 8;
  const atas = 12;
  const bawah = 34;
  const w = Math.max(0, lebar - kiri - kanan);
  const h = tinggi - atas - bawah;

  const { tick, min, max } = useMemo(() => {
    const semua = data.flatMap((d) => seri.map((s) => Number(d.nilai[s.kunci]) || 0));
    return tickRapi(Math.min(0, ...semua), Math.max(0, ...semua), 4);
  }, [data, seri]);
  const y = skalaLinier(min, max, atas + h, atas);
  const pita = data.length ? w / data.length : 0;
  const celah = 2;
  const lebarBatang = Math.max(4, Math.min(36, (pita * 0.62 - celah * (seri.length - 1)) / seri.length));
  const lebarKelompok = lebarBatang * seri.length + celah * (seri.length - 1);
  const fmtSumbu = formatSumbu || format;

  return (
    <div className={cn('relative', className)}>
      {seri.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-redup" aria-hidden>
          {seri.map((s) => (
            <li key={s.kunci} className="flex items-center gap-1.5">
              <svg width="12" height="12" className="shrink-0">
                <rect width="12" height="12" rx="3" fill={s.tekstur ? `url(#${uid}-tekstur-${s.kunci})` : s.warna} />
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={(el) => {
          ref.current = el;
          refTampil.current = el;
        }}
        style={{ height: tinggi }}
        className="relative"
        onPointerLeave={() => setAktif(null)}
      >
        {lebar > 0 && (
          <svg width={lebar} height={tinggi} role="img" aria-label={judulAria} className="block overflow-visible">
            <defs>
              {seri
                .filter((s) => s.tekstur)
                .map((s) => (
                  <pattern key={s.kunci} id={`${uid}-tekstur-${s.kunci}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="6" height="6" fill={s.warna} />
                    <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(255 255 255 / 0.38)" strokeWidth="2" />
                  </pattern>
                ))}
            </defs>
            {/* garis bantu (tipis, tidak menonjol) */}
            {tick.map((t) => (
              <g key={t}>
                <line x1={kiri} x2={kiri + w} y1={y(t)} y2={y(t)} stroke="var(--color-garis)" strokeWidth={t === 0 ? 1.25 : 1} strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text x={kiri - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-redup text-[11px] tabular-nums">
                  {fmtSumbu(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x0 = kiri + i * pita + (pita - lebarKelompok) / 2;
              return (
                <g key={d.label + i}>
                  {seri.map((s, j) => {
                    const v = Number(d.nilai[s.kunci]) || 0;
                    const x = x0 + j * (lebarBatang + celah);
                    return (
                      <path
                        key={s.kunci}
                        d={jalurBatang(x, y(0), lebarBatang, y(v))}
                        fill={s.tekstur ? `url(#${uid}-tekstur-${s.kunci})` : s.warna}
                        opacity={aktif === null || aktif === i ? 1 : 0.45}
                        style={{
                          transformBox: 'fill-box',
                          transformOrigin: v >= 0 ? 'bottom' : 'top',
                          transform: tampil ? 'scaleY(1)' : 'scaleY(0)',
                          transition: `transform 0.7s cubic-bezier(.22,1,.36,1) ${i * 60}ms, opacity .2s`
                        }}
                      />
                    );
                  })}
                  {labelNilai && seri.length === 1 && (
                    <text
                      x={x0 + lebarKelompok / 2}
                      y={y(Number(d.nilai[seri[0].kunci]) || 0) - 6}
                      textAnchor="middle"
                      className="fill-tinta text-[11px] font-semibold tabular-nums"
                      style={{ opacity: tampil ? 1 : 0, transition: `opacity .4s ${400 + i * 60}ms` }}
                    >
                      {fmtLabel(Number(d.nilai[seri[0].kunci]) || 0)}
                    </text>
                  )}
                  <text x={kiri + i * pita + pita / 2} y={tinggi - bawah + 18} textAnchor="middle" className="fill-redup text-[11px]">
                    {d.label}
                  </text>
                  {/* area sentuh selebar pita, lebih besar dari batang */}
                  <rect
                    x={kiri + i * pita}
                    y={atas}
                    width={pita}
                    height={h + bawah}
                    fill="transparent"
                    onPointerEnter={() => setAktif(i)}
                    onClick={() => setAktif((a) => (a === i ? null : i))}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {aktif !== null && data[aktif] && (
          <Tooltip x={kiri + aktif * pita + pita / 2} lebar={lebar}>
            <p className="font-semibold">
              {data[aktif].label}
              {data[aktif].sub ? <span className="font-normal text-gading/70"> · {data[aktif].sub}</span> : null}
            </p>
            {seri.map((s) => (
              <p key={s.kunci} className="mt-0.5 flex items-center gap-2 tabular-nums">
                <span className="size-2 rounded-full" style={{ background: s.warna }} />
                <span className="text-gading/75">{s.label}</span>
                <span className="ml-auto font-semibold">{format(Number(data[aktif].nilai[s.kunci]) || 0)}</span>
              </p>
            ))}
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function Tooltip({ x, lebar, children, atas = 0 }) {
  const lebarKotak = 200;
  const kiri = Math.max(0, Math.min(lebar - lebarKotak, x - lebarKotak / 2));
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-xl bg-tinta/95 px-3 py-2 text-xs text-gading shadow-modal"
      style={{ left: kiri, top: atas, width: lebarKotak }}
    >
      {children}
    </div>
  );
}
