import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/** Angka berhitung naik saat `aktif` (PRD 7.2). Tanpa animasi bila "kurangi gerakan". */
export function useCountUp(target, aktif = true, durasiMs = 1100) {
  const kurangi = useReducedMotion();
  const tujuan = Number(target) || 0;
  const [nilai, setNilai] = useState(kurangi ? tujuan : 0);

  useEffect(() => {
    if (!aktif) return;
    if (kurangi) {
      setNilai(tujuan);
      return;
    }
    let raf = 0;
    const mulai = performance.now();
    const dari = 0;
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / durasiMs);
      const e = 1 - Math.pow(1 - p, 3);
      setNilai(dari + (tujuan - dari) * e);
      if (p < 1) raf = requestAnimationFrame(langkah);
    };
    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [tujuan, aktif, kurangi, durasiMs]);

  return nilai;
}
