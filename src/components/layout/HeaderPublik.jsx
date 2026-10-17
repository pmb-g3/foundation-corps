import { useEffect, useState } from 'react';
import { LayoutDashboard, LogIn, Menu, PencilLine, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Tautan, useRute } from '../../lib/router.jsx';
import { useAuth } from '../../lib/auth.jsx';
import { usePengaturan } from '../../lib/data.jsx';
import { SEKTOR } from '../../lib/sektor.js';
import { useThrottle } from '../../hooks/useThrottle.js';
import { Laci } from '../ui/Dialog.jsx';

/** Merek: FOUNDATION Corps + subjudul kecil Gontor Campus 3 (PRD 1). */
export function Merek({ terang = false, className }) {
  const situs = usePengaturan().situs || {};
  const judul = situs.judul || 'FOUNDATION Corps';
  const [kata1, ...sisa] = judul.split(' ');
  return (
    <span className={cn('flex flex-col leading-none', className)}>
      <span className={cn('whitespace-nowrap font-judul text-[1.05rem] tracking-[0.02em] sm:text-[1.15rem]', terang ? 'text-gading' : 'text-hijau')}>
        <span className="font-semibold">{kata1}</span> <span className="italic">{sisa.join(' ')}</span>
      </span>
      <span className={cn('mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.24em]', terang ? 'text-emas' : 'text-emas-tua')}>
        {situs.subjudul || 'Gontor Campus 3'}
      </span>
    </span>
  );
}

/**
 * Header publik. `diAtasFoto`: transparan dengan teks terang selama berada di atas foto hero,
 * berubah menjadi krem buram saat digulir.
 */
export function HeaderPublik({ diAtasFoto = true }) {
  const auth = useAuth();
  const { jalur } = useRute();
  const [tergulir, setTergulir] = useState(false);
  const [menu, setMenu] = useState(false);

  const cekGulir = useThrottle(() => setTergulir(window.scrollY > 40), 80);
  useEffect(() => {
    cekGulir();
    window.addEventListener('scroll', cekGulir, { passive: true });
    return () => window.removeEventListener('scroll', cekGulir);
  }, [cekGulir]);

  useEffect(() => setMenu(false), [jalur]);

  const terang = diAtasFoto && !tergulir;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300',
        terang ? 'border-b border-transparent' : 'border-b border-garis/80 bg-krem/85 shadow-[0_1px_0_rgb(31_61_43/0.03)] backdrop-blur-md'
      )}
    >
      <div className="wadah flex h-16 items-center gap-3 md:h-[4.5rem]">
        <Tautan ke="/" aria-label="Beranda FOUNDATION Corps" className="mr-auto rounded-lg py-1">
          <Merek terang={terang} />
        </Tautan>

        <nav aria-label="Sektor" className="hidden items-center gap-1 lg:flex">
          {SEKTOR.map((s) => {
            const aktif = jalur === `/sektor/${s.slug}`;
            return (
              <Tautan
                key={s.id}
                ke={`/sektor/${s.slug}`}
                aria-current={aktif ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                  aktif
                    ? terang ? 'bg-white/15 text-gading' : 'bg-hijau text-gading'
                    : terang ? 'text-gading/85 hover:bg-white/10 hover:text-gading' : 'text-hijau/80 hover:bg-hijau/5 hover:text-hijau'
                )}
              >
                {s.label}
              </Tautan>
            );
          })}
        </nav>

        {auth.masukLogin ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => auth.setModeEdit(!auth.modeEdit)}
              aria-pressed={auth.modeEdit}
              className={cn(
                'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors',
                auth.modeEdit
                  ? 'bg-emas text-hijau'
                  : terang ? 'border border-white/30 text-gading hover:bg-white/10' : 'border border-garis text-hijau hover:border-emas'
              )}
            >
              <PencilLine className="size-4" aria-hidden />
              <span className="hidden sm:inline">{auth.modeEdit ? 'Mode Edit Aktif' : 'Mode Edit'}</span>
            </button>
            <Tautan
              ke="/admin"
              className={cn(
                'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors',
                terang ? 'bg-gading text-hijau hover:bg-white' : 'bg-hijau text-gading hover:bg-daun'
              )}
            >
              <LayoutDashboard className="size-4" aria-hidden />
              <span className="hidden sm:inline">Panel</span>
            </Tautan>
          </div>
        ) : (
          <Tautan
            ke="/admin"
            className={cn(
              'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors',
              terang ? 'border border-white/30 text-gading hover:bg-white/10' : 'bg-hijau text-gading hover:bg-daun'
            )}
          >
            <LogIn className="size-4" aria-hidden />
            Masuk
          </Tautan>
        )}

        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Buka menu sektor"
          className={cn(
            'inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden',
            terang ? 'text-gading hover:bg-white/10' : 'text-hijau hover:bg-hijau/5'
          )}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      <Laci buka={menu} tutup={() => setMenu(false)} judul="Menu" sisi="kanan" lebar="max-w-xs">
        <nav aria-label="Menu utama" className="-mx-2 flex flex-col">
          <Tautan ke="/" className="flex min-h-12 items-center justify-between rounded-xl px-3 font-medium text-hijau hover:bg-hijau/5">
            Beranda <ChevronRight className="size-4 text-redup" aria-hidden />
          </Tautan>
          <p className="label-bagian mt-4 mb-1 px-3">Sektor</p>
          {SEKTOR.map((s) => (
            <Tautan
              key={s.id}
              ke={`/sektor/${s.slug}`}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium text-tinta hover:bg-hijau/5"
            >
              <s.ikon className="size-5" style={{ color: s.warna }} aria-hidden />
              <span className="flex-1">{s.label}</span>
              <ChevronRight className="size-4 text-redup" aria-hidden />
            </Tautan>
          ))}
        </nav>
      </Laci>
    </header>
  );
}
