import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { useUkuran } from '../../hooks/useUkuran.js';
import { useInView } from '../../hooks/useInView.js';
import { jalurHalus, skalaLinier, tickRapi } from './skala.js';
import { Tooltip } from './GrafikBatang.jsx';

/**
 * Grafik garis (kurva) satu seri dengan penanda titik tertinggi (F-43).
 * data: [{ label, nilai, detail?: ReactNode, catatan?: string }]
 */
export function GrafikGaris({ data, format = (v) => v, formatSumbu, warna = 'var(--color-daun)', tinggi = 260, sorotMaks = true, className, judulAria }) {
  const [ref, { lebar }] = useUkuran();
  const [refTampil, tampil] = useInView({ rootMargin: '0px', threshold: 0.3 });
  const [aktif, setAktif] = useState(null);

  const kiri = 56;
  const kanan = 16;
  const atas = 36;
  const bawah = 30;
  const w = Math.max(0, lebar - kiri - kanan);
  const h = tinggi - atas - bawah;

  const nilai = data.map((d) => (d.nilai === null || d.nilai === undefined ? null : Number(d.nilai)));
  const { tick, min, max } = useMemo(() => {
    const ada = nilai.filter((v) => v !== null);
    return tickRapi(0, Math.max(1, ...ada), 4);
  }, [nilai.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const x = skalaLinier(0, Math.max(1, data.length - 1), kiri, kiri + w);
  const y = skalaLinier(min, max, atas + h, atas);
  const titik = data.map((d, i) => (nilai[i] === null ? null : [x(i), y(nilai[i])]));
  const terisi = titik.filter(Boolean);
  const jalur = jalurHalus(terisi);
  const iMaks = sorotMaks && terisi.length ? nilai.indexOf(Math.max(...nilai.filter((v) => v !== null))) : -1;
  const fmtSumbu = formatSumbu || format;

  const dariPointer = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let terbaik = null;
    let jarak = Infinity;
    titik.forEach((t, i) => {
      if (!t) return;
      const dd = Math.abs(t[0] - px);
      if (dd < jarak) {
        jarak = dd;
        terbaik = i;
      }
    });
    setAktif(terbaik);
  };

  return (
    <div
      ref={(el) => {
        ref.current = el;
        refTampil.current = el;
      }}
      className={cn('relative', className)}
      style={{ height: tinggi }}
    >
      {lebar > 0 && (
        <svg
          width={lebar}
          height={tinggi}
          role="img"
          aria-label={judulAria}
          className="block touch-pan-y overflow-visible"
          onPointerMove={dariPointer}
          onPointerDown={dariPointer}
          onPointerLeave={() => setAktif(null)}
        >
          {tick.map((t) => (
            <g key={t}>
              <line x1={kiri} x2={kiri + w} y1={y(t)} y2={y(t)} stroke="var(--color-garis)" strokeDasharray={t === 0 ? undefined : '2 4'} />
              <text x={kiri - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-redup text-[11px] tabular-nums">
                {fmtSumbu(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={d.label + i} x={x(i)} y={tinggi - 8} textAnchor="middle" className="fill-redup text-[11px]">
              {d.label}
            </text>
          ))}
          {jalur && (
            <path
              d={jalur}
              fill="none"
              stroke={warna}
              strokeWidth={2}
              strokeLinecap="round"
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: tampil ? 0 : 1, transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)' }}
            />
          )}
          {/* garis bantu vertikal saat disentuh */}
          {aktif !== null && titik[aktif] && <line x1={titik[aktif][0]} x2={titik[aktif][0]} y1={atas} y2={atas + h} stroke="var(--color-redup)" strokeOpacity={0.35} />}
          {titik.map((t, i) =>
            t ? (
              <circle
                key={i}
                cx={t[0]}
                cy={t[1]}
                r={aktif === i || i === iMaks ? 5 : 3}
                fill={i === iMaks ? 'var(--color-bata)' : warna}
                stroke="var(--color-gading)"
                strokeWidth={2}
                style={{ opacity: tampil ? 1 : 0, transition: `opacity .3s ${300 + i * 50}ms` }}
              />
            ) : null
          )}
          {iMaks >= 0 && titik[iMaks] && aktif === null && (
            <g style={{ opacity: tampil ? 1 : 0, transition: 'opacity .4s 1s' }}>
              <text x={titik[iMaks][0]} y={titik[iMaks][1] - 14} textAnchor={titik[iMaks][0] > lebar - 80 ? 'end' : titik[iMaks][0] < 100 ? 'start' : 'middle'} className="fill-tinta text-[11px] font-semibold tabular-nums">
                Tertinggi · {format(nilai[iMaks])}
              </text>
            </g>
          )}
        </svg>
      )}
      {aktif !== null && data[aktif] && titik[aktif] && (
        <Tooltip x={titik[aktif][0]} lebar={lebar}>
          <p className="font-semibold">{data[aktif].label}</p>
          <p className="mt-0.5 tabular-nums">{format(nilai[aktif])}</p>
          {data[aktif].detail}
        </Tooltip>
      )}
    </div>
  );
}
