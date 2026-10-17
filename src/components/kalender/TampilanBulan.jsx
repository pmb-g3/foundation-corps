import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { keIso, jam } from '../../lib/format.js';
import { bagianHijriah, BULAN_HIJRIAH } from '../../lib/hijriah.js';
import { useLayarLebar } from '../../hooks/useMedia.js';
import { HARI_PENDEK, metaKategori } from './kalenderLib.js';

/** Tampilan Bulan: sel hari ini bercincin emas, hari libur pekanan berlatar lembut, Hijriah kecil, titik Subuh Berkah. */
export function TampilanBulan({ hari, acuan, perHari, subuhPerHari, hariIni, libur, tampilHijriah, lapisanSubuh, bisaTambah, bisaSeret, onKlikHari, onKlikKegiatan, onPindah }) {
  const lebar = useLayarLebar();
  const seret = useRef(null);
  const [hantu, setHantu] = useState(null); // { k, x, y }
  const [sasaran, setSasaran] = useState(null);
  const maks = lebar ? 3 : 0;

  const mulaiSeret = (e, k) => {
    if (!lebar || !bisaSeret(k) || e.button !== 0) return;
    seret.current = { k, x0: e.clientX, y0: e.clientY, aktif: false };
    const gerak = (ev) => {
      const s = seret.current;
      if (!s) return;
      if (!s.aktif && Math.hypot(ev.clientX - s.x0, ev.clientY - s.y0) < 6) return;
      s.aktif = true;
      setHantu({ k, x: ev.clientX, y: ev.clientY });
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-tanggal]');
      setSasaran(el ? el.getAttribute('data-tanggal') : null);
    };
    const lepas = (ev) => {
      window.removeEventListener('pointermove', gerak);
      window.removeEventListener('pointerup', lepas);
      const s = seret.current;
      if (s?.aktif) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-tanggal]');
        const tujuan = el?.getAttribute('data-tanggal');
        if (tujuan && tujuan !== String(k.mulai).slice(0, 10)) onPindah(k, tujuan);
        // cegah klik setelah seret
        setTimeout(() => {
          seret.current = null;
        }, 0);
      } else {
        seret.current = null;
      }
      setHantu(null);
      setSasaran(null);
    };
    window.addEventListener('pointermove', gerak);
    window.addEventListener('pointerup', lepas);
  };

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 border-b border-garis">
        {HARI_PENDEK.map((h, i) => (
          <div key={h} className={cn('py-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.1em]', libur.includes((i + 6) % 7) ? 'text-emas-tua' : 'text-redup')}>
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {hari.map((d) => {
          const kunci = keIso(d);
          const daftar = perHari[kunci] || [];
          const diLuar = d.getMonth() !== acuan.getMonth();
          const ini = kunci === hariIni;
          const hj = tampilHijriah ? bagianHijriah(kunci) : null;
          const subuh = lapisanSubuh ? subuhPerHari[kunci] : null;
          const isLibur = libur.includes(d.getDay());
          return (
            <div
              key={kunci}
              data-tanggal={kunci}
              role="button"
              tabIndex={0}
              aria-label={`${d.getDate()} — ${daftar.length} kegiatan`}
              onClick={(e) => onKlikHari(kunci, e.currentTarget)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onKlikHari(kunci, e.currentTarget)}
              className={cn(
                'group relative min-h-[4.25rem] cursor-pointer border-b border-r border-garis/70 p-1 text-left outline-none transition-colors focus-visible:bg-emas/10 md:min-h-[7.5rem] md:p-1.5 [&:nth-child(7n)]:border-r-0',
                isLibur && 'bg-emas/[0.07]',
                diLuar && 'bg-krem/50',
                sasaran === kunci && 'bg-daun/10 ring-2 ring-inset ring-daun'
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
                    ini ? 'font-bold text-hijau ring-2 ring-emas' : diLuar ? 'text-redup/50' : 'text-tinta'
                  )}
                >
                  {d.getDate()}
                </span>
                {hj && (
                  <span className={cn('pt-1 text-[0.6rem] tabular-nums', diLuar ? 'text-redup/40' : 'text-emas-tua/80')}>
                    {hj.hari === 1 ? BULAN_HIJRIAH[hj.bulan - 1].split(' ')[0].slice(0, 6) : hj.hari}
                  </span>
                )}
              </div>
              {subuh && (
                <span className="mt-0.5 flex items-center gap-1 px-1" title={`Subuh Berkah: ${subuh.firqoh}${subuh.imam ? ' · Imam ' + subuh.imam : ''}`}>
                  <span className={cn('size-1.5 shrink-0 rounded-full', subuh.jenis === 'Konsekuensi' && 'ring-2 ring-bata/40')} style={{ background: subuh.warna || 'var(--color-hijau)' }} />
                  <span className="hidden truncate text-[0.62rem] text-redup md:inline">{subuh.firqoh.split(' ')[0]}</span>
                </span>
              )}
              {/* HP: titik kategori; laptop: pil kegiatan */}
              {!lebar && daftar.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-0.5 px-1">
                  {daftar.slice(0, 4).map((k) => (
                    <span key={k.id} className="size-1.5 rounded-full" style={{ background: metaKategori(k.kategori).warna }} />
                  ))}
                </span>
              )}
              {lebar && (
                <ul className="mt-1 space-y-0.5">
                  {daftar.slice(0, maks).map((k) => {
                    const mk = metaKategori(k.kategori);
                    return (
                      <li key={k.id}>
                        <button
                          type="button"
                          onPointerDown={(e) => mulaiSeret(e, k)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (seret.current?.aktif) return;
                            onKlikKegiatan(k, e.currentTarget);
                          }}
                          className={cn(
                            'flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-[0.7rem] leading-tight text-tinta transition-colors hover:brightness-95',
                            k._sementara && 'opacity-60',
                            bisaSeret(k) && 'cursor-grab active:cursor-grabbing'
                          )}
                          style={{ background: `color-mix(in oklab, ${mk.warna} 16%, var(--color-gading))`, boxShadow: `inset 2px 0 0 ${mk.warna}` }}
                        >
                          <mk.ikon className="size-3 shrink-0" style={{ color: mk.warna }} aria-hidden />
                          {!k.sepanjang_hari && <span className="shrink-0 tabular-nums text-redup">{jam(k.mulai)}</span>}
                          <span className="truncate">{k.judul}</span>
                        </button>
                      </li>
                    );
                  })}
                  {daftar.length > maks && <li className="px-1.5 text-[0.68rem] font-semibold text-redup">+{daftar.length - maks} lagi</li>}
                </ul>
              )}
              {bisaTambah && lebar && (
                <Plus className="absolute bottom-1.5 right-1.5 size-3.5 text-redup opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      {hantu && (
        <div
          className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gading px-2 py-1 text-xs font-semibold shadow-modal ring-2 ring-emas"
          style={{ left: hantu.x, top: hantu.y }}
        >
          {hantu.k.judul}
        </div>
      )}
    </div>
  );
}
