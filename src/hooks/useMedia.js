import { useSyncExternalStore } from 'react';

/** true bila media query cocok, mis. useMedia('(min-width: 768px)'). */
export function useMedia(query) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export const useLayarLebar = () => useMedia('(min-width: 768px)');
