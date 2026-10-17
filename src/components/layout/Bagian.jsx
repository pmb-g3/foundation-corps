import * as m from 'motion/react-m';
import { AnimatePresence } from 'motion/react';
import { Pencil } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAuth } from '../../lib/auth.jsx';
import { muncul, saatTerlihat } from '../../lib/motion.jsx';

/** Tombol pensil kecil yang muncul di tiap bagian saat Mode Edit aktif (F-51). */
export function TombolEdit({ onClick, label = 'Edit', className, gelap = false }) {
  const { modeEdit } = useAuth();
  return (
    <AnimatePresence>
      {modeEdit && onClick && (
        <m.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={onClick}
          className={cn(
            'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-angkat transition-colors',
            gelap ? 'border-emas/60 bg-hijau/80 text-emas backdrop-blur hover:bg-hijau' : 'border-emas bg-gading text-emas-tua hover:bg-emas/10',
            className
          )}
        >
          <Pencil className="size-3.5" aria-hidden />
          {label}
        </m.button>
      )}
    </AnimatePresence>
  );
}

/**
 * Pembungkus bagian halaman: label kecil emas, judul serif, aksi di kanan,
 * muncul halus saat digulir (fade + naik 24 px), dan pensil edit untuk admin.
 */
export function Bagian({ id, label, judul, keterangan, aksi, onEdit, children, className, kepalaClassName, gelap = false }) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-14 md:py-20', className)}>
      <div className="wadah">
        {(label || judul || aksi || onEdit) && (
          <m.div variants={muncul} {...saatTerlihat} className={cn('mb-7 flex flex-wrap items-end gap-x-6 gap-y-3 md:mb-9', kepalaClassName)}>
            <div className="min-w-0 flex-1">
              {label && <p className={cn('label-bagian', gelap && 'text-emas')}>{label}</p>}
              {judul && (
                <h2 className={cn('mt-2 text-[1.85rem] leading-tight md:text-[2.5rem]', gelap ? 'text-gading' : 'text-tinta')}>{judul}</h2>
              )}
              {keterangan && <p className={cn('mt-2 max-w-2xl text-sm md:text-base', gelap ? 'text-gading/70' : 'text-redup')}>{keterangan}</p>}
            </div>
            <div className="flex items-center gap-2">
              {aksi}
              <TombolEdit onClick={onEdit} gelap={gelap} />
            </div>
          </m.div>
        )}
        {children}
      </div>
    </section>
  );
}
