import { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { useReducedMotion } from 'motion/react';

const W = 400;
const C = 200;
const R = 190;

function titik(sudut, r) {
  const rad = ((sudut - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
}

function irisan(a0, a1, r) {
  const [x0, y0] = titik(a0, r);
  const [x1, y1] = titik(a1, r);
  const besar = a1 - a0 > 180 ? 1 : 0;
  return `M${C},${C} L${x0},${y0} A${r},${r} 0 ${besar} 1 ${x1},${y1} Z`;
}

/** Bilangan acak adil (PRD F-55: crypto.getRandomValues). */
export function acakIndeks(n) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % n;
}

const pendek = (s, maks) => (s.length > maks ? s.slice(0, maks - 1) + '…' : s);

/**
 * Roda slot lingkaran (F-55): kartu nama staf yang belum ditempatkan, penanda emas di atas,
 * berputar cepat lalu melambat halus (±3,8 detik) dan berhenti tepat di satu nama.
 */
export function RodaUndian({ nama, target, putaranKe, onSelesai, onPutar, bisaPutar }) {
  const kurangi = useReducedMotion();
  const [sudut, setSudut] = useState(0);
  const [berputar, setBerputar] = useState(false);
  const sudutRef = useRef(0);
  const n = nama.length;
  const a = n ? 360 / n : 360;

  useEffect(() => {
    if (target === null || target === undefined || !n) return;
    const pusat = target * a;
    const jitter = (acakIndeks(1000) / 1000 - 0.5) * a * 0.5;
    const sekarang = sudutRef.current;
    const delta = (((-pusat - jitter - sekarang) % 360) + 360) % 360;
    const baru = sekarang + (kurangi ? 0 : 360 * 5) + delta;
    sudutRef.current = baru;
    setBerputar(!kurangi);
    setSudut(baru);
    if (kurangi) onSelesai(target);
  }, [putaranKe]); // eslint-disable-line react-hooks/exhaustive-deps

  const fs = n > 24 ? 9 : n > 16 ? 10.5 : 12;
  const maksHuruf = n > 24 ? 14 : 18;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
      <svg viewBox={`0 0 ${W} ${W}`} className="size-full" role="img" aria-label={`Roda undian berisi ${n} nama staf`}>
        <circle cx={C} cy={C} r={R + 8} fill="var(--color-gading)" stroke="var(--color-garis)" strokeWidth="2" />
        <m.g
          animate={{ rotate: sudut }}
          transition={{ duration: kurangi ? 0 : 3.8, ease: [0.12, 0.85, 0.15, 1] }}
          style={{ originX: '200px', originY: '200px', transformBox: 'view-box' }}
          onAnimationComplete={() => {
            if (berputar) {
              setBerputar(false);
              onSelesai(target);
            }
          }}
        >
          {n === 0 && <circle cx={C} cy={C} r={R} fill="var(--color-krem)" />}
          {nama.map((s, i) => {
            const gelap = i % 2 === 0;
            return (
              <g key={s.id}>
                <path d={n === 1 ? `M${C},${C - R} A${R},${R} 0 1 1 ${C - 0.01},${C - R} Z` : irisan(i * a - a / 2, i * a + a / 2, R)} fill={gelap ? 'var(--color-hijau)' : i % 3 === 1 ? 'var(--color-krem)' : 'var(--color-daun)'} stroke="var(--color-gading)" strokeWidth="1.5" />
                <text
                  x={C}
                  y={C - 120}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fs}
                  fontWeight={600}
                  fill={gelap || i % 3 !== 1 ? 'var(--color-gading)' : 'var(--color-hijau)'}
                  transform={`rotate(${i * a} ${C} ${C}) rotate(-90 ${C} ${C - 120})`}
                >
                  {pendek(s.nama.replace(/^Ust\.\s*/i, 'Ust. '), maksHuruf)}
                </text>
              </g>
            );
          })}
        </m.g>
        {/* penanda emas di atas roda */}
        <path d={`M${C - 14},4 L${C + 14},4 L${C},34 Z`} fill="var(--color-emas)" stroke="var(--color-gading)" strokeWidth="2" />
        <circle cx={C} cy={C} r={52} fill="var(--color-gading)" stroke="var(--color-emas)" strokeWidth="3" />
      </svg>
      <button
        type="button"
        onClick={onPutar}
        disabled={!bisaPutar || berputar}
        className="absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-hijau font-judul text-sm uppercase tracking-[0.18em] text-gading shadow-angkat transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
      >
        <span>Putar</span>
        <span className="text-[0.6rem] tracking-[0.1em] text-emas">{n ? `${n} nama` : 'selesai'}</span>
      </button>
    </div>
  );
}
