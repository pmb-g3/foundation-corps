import { useEffect, useRef, useState } from 'react';

/**
 * true sekali saat elemen mendekati layar (default ±300 px sebelum terlihat, PRD 6.5).
 * Dipakai untuk lazy load foto & bagian berat (kalender).
 */
export function useInView({ rootMargin = '300px 0px', sekali = true, threshold = 0 } = {}) {
  const ref = useRef(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setTerlihat(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTerlihat(true);
          if (sekali) io.disconnect();
        } else if (!sekali) {
          setTerlihat(false);
        }
      },
      { rootMargin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, sekali, threshold]);

  return [ref, terlihat];
}
