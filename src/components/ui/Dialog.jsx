import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useLayarLebar } from '../../hooks/useMedia.js';
import { IkonTombol } from './Button.jsx';

const FOKUSABEL = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

let jumlahTerbuka = 0;

/** Kunci gulir halaman, jebak fokus Tab, Esc menutup, kembalikan fokus saat tutup. */
function usePanelModal(buka, tutup, ref) {
  const tutupRef = useRef(tutup);
  tutupRef.current = tutup;

  useEffect(() => {
    if (!buka) return;
    const sebelum = document.activeElement;
    jumlahTerbuka++;
    document.documentElement.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const pertama = el.querySelector('[data-autofocus]') || el.querySelector(FOKUSABEL);
      (pertama || el).focus({ preventScroll: true });
    }, 30);
    const tombol = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        tutupRef.current?.();
      }
      if (e.key === 'Tab' && ref.current) {
        const daftar = [...ref.current.querySelectorAll(FOKUSABEL)];
        if (!daftar.length) return;
        const awal = daftar[0];
        const akhir = daftar[daftar.length - 1];
        if (e.shiftKey && document.activeElement === awal) {
          e.preventDefault();
          akhir.focus();
        } else if (!e.shiftKey && document.activeElement === akhir) {
          e.preventDefault();
          awal.focus();
        }
      }
    };
    document.addEventListener('keydown', tombol);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', tombol);
      jumlahTerbuka--;
      if (jumlahTerbuka <= 0) document.documentElement.style.overflow = '';
      if (sebelum && sebelum.focus) sebelum.focus({ preventScroll: true });
    };
  }, [buka, ref]);
}

function Kepala({ judul, deskripsi, tutup, gelap }) {
  if (!judul && !tutup) return null;
  return (
    <div className={cn('flex items-start gap-3 border-b px-5 py-4 md:px-6', gelap ? 'border-white/10' : 'border-garis')}>
      <div className="min-w-0 flex-1">
        {judul && <h2 className="font-judul text-xl leading-tight text-tinta md:text-2xl">{judul}</h2>}
        {deskripsi && <p className="mt-1 text-sm text-redup">{deskripsi}</p>}
      </div>
      {tutup && <IkonTombol ikon={X} label="Tutup" varian={gelap ? 'kaca' : 'hantu'} onClick={tutup} className="-mr-2 -mt-1" />}
    </div>
  );
}

const LEBAR = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

/** Dialog tengah layar. */
export function Dialog({ buka, tutup, judul, deskripsi, children, kaki, lebar = 'md', className }) {
  const ref = useRef(null);
  usePanelModal(buka, tutup, ref);
  return createPortal(
    <AnimatePresence>
      {buka && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <m.div
            className="absolute inset-0 bg-tinta/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={tutup}
          />
          <m.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={typeof judul === 'string' ? judul : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-kartu bg-gading shadow-modal outline-none sm:rounded-kartu',
              LEBAR[lebar],
              className
            )}
          >
            <Kepala judul={judul} deskripsi={deskripsi} tutup={tutup} />
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>
            {kaki && <div className="flex flex-wrap justify-end gap-2 border-t border-garis bg-krem/60 px-5 py-3 md:px-6">{kaki}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Laci: lembar dari bawah di HP, panel samping kanan di laptop. */
export function Laci({ buka, tutup, judul, deskripsi, children, kaki, sisi, lebar = 'max-w-md', className, gelap = false }) {
  const ref = useRef(null);
  const lebarLayar = useLayarLebar();
  const dariKiri = sisi === 'kiri';
  const dariKanan = sisi ? sisi === 'kanan' : lebarLayar;
  const samping = dariKanan || dariKiri;
  usePanelModal(buka, tutup, ref);
  return createPortal(
    <AnimatePresence>
      {buka && (
        <div className="fixed inset-0 z-[80]">
          <m.div
            className="absolute inset-0 bg-tinta/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={tutup}
          />
          <m.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={typeof judul === 'string' ? judul : undefined}
            tabIndex={-1}
            initial={dariKiri ? { x: '-100%' } : dariKanan ? { x: '100%' } : { y: '100%' }}
            animate={samping ? { x: 0 } : { y: 0 }}
            exit={dariKiri ? { x: '-100%' } : dariKanan ? { x: '100%' } : { y: '100%' }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            drag={samping ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) tutup();
            }}
            className={cn(
              'absolute flex flex-col bg-gading shadow-modal outline-none',
              dariKiri ? cn('inset-y-0 left-0 w-full', lebar) : dariKanan ? cn('inset-y-0 right-0 w-full', lebar) : 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-kartu',
              className
            )}
          >
            {!samping && <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-garis" aria-hidden />}
            <Kepala judul={judul} deskripsi={deskripsi} tutup={tutup} gelap={gelap} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-6">{children}</div>
            {kaki && <div className="flex flex-wrap justify-end gap-2 border-t border-garis bg-krem/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">{kaki}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
