import { useEffect, useRef, useState } from 'react';

/** Lebar & tinggi elemen (ResizeObserver) — grafik digambar dalam piksel agar teks tetap tajam. */
export function useUkuran() {
  const ref = useRef(null);
  const [ukuran, setUkuran] = useState({ lebar: 0, tinggi: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setUkuran((u) => (Math.abs(u.lebar - r.width) < 1 && Math.abs(u.tinggi - r.height) < 1 ? u : { lebar: r.width, tinggi: r.height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ukuran];
}
