import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const ToastContext = createContext(null);

const GAYA = {
  sukses: { ikon: CircleCheck, kelas: 'bg-hijau text-gading', ikonKelas: 'text-emas' },
  galat: { ikon: CircleAlert, kelas: 'bg-bata text-gading', ikonKelas: 'text-gading' },
  info: { ikon: Info, kelas: 'bg-tinta text-gading', ikonKelas: 'text-emas' }
};

export function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([]);
  const nomor = useRef(0);

  const hapus = useCallback((id) => setDaftar((d) => d.filter((t) => t.id !== id)), []);

  const tampil = useCallback(
    (pesan, jenis = 'sukses', durasi = 3600) => {
      const id = ++nomor.current;
      setDaftar((d) => [...d.slice(-2), { id, pesan, jenis }]);
      if (durasi) setTimeout(() => hapus(id), durasi);
      return id;
    },
    [hapus]
  );

  const api = useMemo(
    () => ({
      sukses: (p, d) => tampil(p, 'sukses', d),
      galat: (p, d = 5200) => tampil(p, 'galat', d),
      info: (p, d) => tampil(p, 'info', d),
      hapus
    }),
    [tampil, hapus]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:items-end"
      >
        <AnimatePresence initial={false}>
          {daftar.map((t) => {
            const g = GAYA[t.jenis] || GAYA.info;
            const Ikon = g.ikon;
            return (
              <m.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                role={t.jenis === 'galat' ? 'alert' : 'status'}
                className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 shadow-modal', g.kelas)}
              >
                <Ikon className={cn('mt-0.5 size-5 shrink-0', g.ikonKelas)} aria-hidden />
                <p className="flex-1 text-sm leading-snug">{t.pesan}</p>
                <button type="button" aria-label="Tutup pesan" onClick={() => hapus(t.id)} className="-m-1 rounded-full p-1 opacity-70 hover:opacity-100">
                  <X className="size-4" aria-hidden />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastContext);
  if (!c) throw new Error('useToast harus di dalam ToastProvider');
  return c;
}
