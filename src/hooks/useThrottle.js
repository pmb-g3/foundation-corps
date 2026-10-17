import { useEffect, useMemo, useRef } from 'react';

/** Batasi pemanggilan fungsi paling sering sekali per `jedaMs` (event gulir, interaksi peta). */
export function useThrottle(fn, jedaMs = 100) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useMemo(() => {
    let terakhir = 0;
    let timer = null;
    return (...args) => {
      const kini = Date.now();
      const sisa = jedaMs - (kini - terakhir);
      if (sisa <= 0) {
        terakhir = kini;
        ref.current(...args);
      } else if (!timer) {
        timer = setTimeout(() => {
          terakhir = Date.now();
          timer = null;
          ref.current(...args);
        }, sisa);
      }
    };
  }, [jedaMs]);
}

/** Tunda pemanggilan sampai pengguna berhenti mengetik (kotak cari). */
export function useDebounce(fn, jedaMs = 250) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useMemo(() => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => ref.current(...args), jedaMs);
    };
  }, [jedaMs]);
}
