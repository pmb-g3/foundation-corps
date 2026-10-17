import { useEffect, useState } from 'react';
import * as m from 'motion/react-m';
import { ExternalLink, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useAuth } from '../../lib/auth.jsx';
import { useAdmin } from '../../lib/admin.jsx';
import { Tautan, useRute } from '../../lib/router.jsx';
import { tanggal, hariIniWib, inisial } from '../../lib/format.js';
import { hijriah } from '../../lib/hijriah.js';
import { apiPost } from '../../lib/api.js';
import { Merek } from '../../components/layout/HeaderPublik.jsx';
import { Laci, Dialog } from '../../components/ui/Dialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input } from '../../components/ui/Isian.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { MENU_ADMIN, menuKabag } from './navigasi.js';

function DaftarMenu({ menu, aktif, ciut, onPilih }) {
  return (
    <nav aria-label="Menu panel" className="space-y-6">
      {menu.map((g) => (
        <div key={g.grup}>
          {!ciut && <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gading/45">{g.grup}</p>}
          <ul className="space-y-1">
            {g.item.map((it) => {
              const dipilih = aktif === it.id;
              const Ikon = it.ikon;
              return (
                <li key={it.id}>
                  <a
                    href={it.href || `#/admin/${it.id}`}
                    onClick={onPilih}
                    title={ciut ? it.label : undefined}
                    aria-current={dipilih ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors',
                      dipilih ? 'bg-white/10 font-semibold text-gading' : 'text-gading/70 hover:bg-white/5 hover:text-gading',
                      ciut && 'justify-center px-0'
                    )}
                  >
                    {dipilih && <m.span layoutId="nav-aktif-admin" className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emas" />}
                    <Ikon className="size-[1.15rem] shrink-0" aria-hidden />
                    {!ciut && (
                      <>
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.kode && <span className="text-[0.65rem] tabular-nums text-gading/35">{it.kode}</span>}
                      </>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function GantiSandi({ buka, tutup }) {
  const toast = useToast();
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [proses, setProses] = useState(false);
  const simpan = async (e) => {
    e.preventDefault();
    setProses(true);
    try {
      await apiPost('gantiSandi', { sandi_lama: lama, sandi_baru: baru });
      toast.sukses('Sandi diganti.');
      setLama('');
      setBaru('');
      tutup();
    } catch (err) {
      toast.galat(err.message);
    } finally {
      setProses(false);
    }
  };
  return (
    <Dialog buka={buka} tutup={tutup} judul="Ganti sandi" lebar="sm">
      <form onSubmit={simpan} className="space-y-4">
        <Field label="Sandi lama">{(p) => <Input {...p} type="password" value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" required />}</Field>
        <Field label="Sandi baru" petunjuk="Minimal 8 karakter.">
          {(p) => <Input {...p} type="password" value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" minLength={8} required />}
        </Field>
        <Button type="submit" memuat={proses} className="w-full">
          Simpan sandi
        </Button>
      </form>
    </Dialog>
  );
}

/** Kerangka panel admin (pola ref_admin: sidebar dapat diciutkan, laci di HP, penanda menu aktif). */
export function AdminLayout({ children, judul }) {
  const auth = useAuth();
  const admin = useAdmin();
  const { bagian } = useRute();
  const [ciut, setCiut] = useState(() => {
    try {
      return localStorage.getItem('fc_sidebar_ciut') === '1';
    } catch {
      return false;
    }
  });
  const [laci, setLaci] = useState(false);
  const [sandi, setSandi] = useState(false);
  const aktif = bagian[1] || (auth.isKabag ? 'sektor' : 'hari-ini');
  const menu = auth.isKabag ? menuKabag(auth.sektorKabag) : MENU_ADMIN;
  const hari = admin.info?.hari_ini || hariIniWib();

  useEffect(() => {
    try {
      localStorage.setItem('fc_sidebar_ciut', ciut ? '1' : '0');
    } catch {
      /* abaikan */
    }
  }, [ciut]);

  const kakiPengguna = (kecil) => (
    <div className={cn('rounded-2xl bg-white/[0.06] p-3', kecil && 'p-2')}>
      <div className={cn('flex items-center gap-3', kecil && 'justify-center')}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emas text-xs font-bold text-hijau">{inisial(auth.pengguna?.nama)}</span>
        {!kecil && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gading">{auth.pengguna?.nama}</p>
            <p className="truncate text-xs text-emas">{auth.isAdmin ? 'Admin Utama' : `Kabag ${auth.pengguna?.sektor_label || ''}`}</p>
          </div>
        )}
      </div>
      {!kecil && (
        <div className="mt-3 flex gap-1">
          <button type="button" onClick={() => setSandi(true)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs text-gading/75 hover:bg-white/10 hover:text-gading">
            <KeyRound className="size-3.5" aria-hidden /> Sandi
          </button>
          <button type="button" onClick={auth.keluar} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-xs text-gading/75 hover:bg-white/10 hover:text-gading">
            <LogOut className="size-3.5" aria-hidden /> Keluar
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-krem">
      {/* sidebar laptop */}
      <m.aside
        initial={false}
        animate={{ width: ciut ? 80 : 264 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden bg-hijau text-gading lg:flex"
      >
        <div className={cn('flex h-[4.5rem] items-center border-b border-white/10 px-4', ciut ? 'justify-center' : 'justify-between')}>
          {!ciut && (
            <Tautan ke="/" aria-label="Ke beranda publik">
              <Merek terang />
            </Tautan>
          )}
          <button
            type="button"
            onClick={() => setCiut(!ciut)}
            aria-label={ciut ? 'Lebarkan menu' : 'Ciutkan menu'}
            className="flex size-9 items-center justify-center rounded-lg text-gading/70 hover:bg-white/10 hover:text-gading"
          >
            {ciut ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>
        <div className="tanpa-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <DaftarMenu menu={menu} aktif={aktif} ciut={ciut} />
        </div>
        <div className="border-t border-white/10 p-3">{kakiPengguna(ciut)}</div>
      </m.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-garis bg-krem/90 px-4 backdrop-blur-md md:h-[4.5rem] md:px-8">
          <button type="button" onClick={() => setLaci(true)} aria-label="Buka menu" className="flex size-11 items-center justify-center rounded-full text-hijau hover:bg-hijau/5 lg:hidden">
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-judul text-lg text-tinta md:text-xl">{judul}</p>
            <p className="hidden truncate text-xs text-redup sm:block">
              {tanggal(hari)} · {hijriah(hari)}
            </p>
          </div>
          <a
            href="#/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-garis bg-gading px-3.5 text-xs font-semibold text-hijau hover:border-emas"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Lihat Website</span>
          </a>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      {/* menu HP */}
      <Laci buka={laci} tutup={() => setLaci(false)} sisi="kiri" lebar="max-w-[18rem]" className="!bg-hijau text-gading" gelap>
        <div className="-mx-2 mb-6">
          <Merek terang />
        </div>
        <DaftarMenu menu={menu} aktif={aktif} onPilih={() => setLaci(false)} />
        <div className="mt-8">{kakiPengguna(false)}</div>
      </Laci>
      <GantiSandi buka={sandi} tutup={() => setSandi(false)} />
    </div>
  );
}

/** Pembungkus isi halaman admin: judul serif, keterangan singkat, aksi di kanan. */
export function HalamanAdmin({ label, judul, keterangan, aksi, children, className }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl', className)}>
      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-3 md:mb-8">
        <div className="min-w-0 flex-1">
          {label && <p className="label-bagian">{label}</p>}
          <h1 className="mt-1 text-3xl leading-tight text-tinta md:text-[2.6rem]">{judul}</h1>
          {keterangan && <p className="mt-2 max-w-2xl text-sm text-redup md:text-base">{keterangan}</p>}
        </div>
        {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
      </div>
      {children}
    </div>
  );
}
