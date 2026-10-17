// Router hash mini (tanpa library): #/  #/sektor/pertanian  #/admin/hari-ini
// Hash dipakai agar refresh di GitHub Pages tidak menghasilkan 404.
import { useSyncExternalStore } from 'react';

function bacaJalur() {
  const h = window.location.hash.replace(/^#/, '');
  const [jalur, query = ''] = (h || '/').split('?');
  return { jalur: jalur.startsWith('/') ? jalur : '/' + jalur, query };
}

let cache = bacaJalur();
const pendengar = new Set();

window.addEventListener('hashchange', () => {
  cache = bacaJalur();
  pendengar.forEach((fn) => fn());
});

function langgan(fn) {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

export function useRute() {
  const r = useSyncExternalStore(langgan, () => cache);
  return {
    jalur: r.jalur,
    bagian: r.jalur.split('/').filter(Boolean),
    query: new URLSearchParams(r.query)
  };
}

export function navigasi(jalur, { ganti = false } = {}) {
  const url = '#' + jalur;
  if (ganti) {
    history.replaceState(null, '', url);
    cache = bacaJalur();
    pendengar.forEach((fn) => fn());
  } else {
    window.location.hash = jalur;
  }
}

export function Tautan({ ke, children, onClick, ...props }) {
  return (
    <a
      href={'#' + ke}
      onClick={(e) => {
        if (onClick) onClick(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
