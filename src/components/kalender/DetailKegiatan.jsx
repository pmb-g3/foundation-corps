import { useEffect, useRef } from 'react';
import * as m from 'motion/react-m';
import { Clock, MapPin, Pencil, X } from 'lucide-react';
import { jam, tanggal } from '../../lib/format.js';
import { useLayarLebar } from '../../hooks/useMedia.js';
import { Laci } from '../ui/Dialog.jsx';
import { Button } from '../ui/Button.jsx';
import { metaKategori } from './kalenderLib.js';

function Isi({ k, onUbah }) {
  const mk = metaKategori(k.kategori);
  const sampai = String(k.selesai || '').slice(0, 10);
  const banyakHari = sampai && sampai !== String(k.mulai).slice(0, 10);
  return (
    <div className="space-y-3">
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `color-mix(in oklab, ${mk.warna} 15%, transparent)`, color: mk.warna }}>
        <mk.ikon className="size-3.5" aria-hidden /> {k.kategori}
      </span>
      <p className="font-judul text-2xl leading-tight text-tinta">{k.judul}</p>
      <p className="flex items-start gap-2 text-sm text-tinta">
        <Clock className="mt-0.5 size-4 shrink-0 text-emas-tua" aria-hidden />
        <span>
          {tanggal(k.mulai)}
          {banyakHari ? ` – ${tanggal(sampai)}` : ''}
          <span className="block text-redup">{k.sepanjang_hari ? 'Sepanjang hari' : `${jam(k.mulai)}${k.selesai ? ' – ' + jam(k.selesai) : ''} WIB`}</span>
        </span>
      </p>
      {k.lokasi && (
        <p className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 shrink-0 text-emas-tua" aria-hidden /> {k.lokasi}
        </p>
      )}
      {k.keterangan && <p className="whitespace-pre-line text-sm text-redup">{k.keterangan}</p>}
      {onUbah && (
        <Button varian="sekunder" ukuran="sm" ikon={Pencil} onClick={onUbah}>
          Ubah / hapus
        </Button>
      )}
    </div>
  );
}

/** Kartu detail kegiatan: di laptop muncul dari sel yang diketuk, di HP sebagai lembar bawah. */
export function DetailKegiatan({ detail, wadah, tutup, onUbah }) {
  const lebar = useLayarLebar();
  const ref = useRef(null);

  useEffect(() => {
    if (!detail || !lebar) return;
    const luar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) tutup();
    };
    const esc = (e) => e.key === 'Escape' && tutup();
    setTimeout(() => document.addEventListener('pointerdown', luar), 0);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', luar);
      document.removeEventListener('keydown', esc);
    };
  }, [detail, lebar, tutup]);

  if (!lebar) {
    return (
      <Laci buka={!!detail} tutup={tutup} judul="Kegiatan">
        {detail && <Isi k={detail.k} onUbah={onUbah} />}
      </Laci>
    );
  }
  if (!detail || !wadah) return null;
  // posisikan dekat elemen yang diketuk, di dalam kotak kalender
  const r = detail.el.getBoundingClientRect();
  const w = wadah.getBoundingClientRect();
  const lebarKartu = 300;
  const kiri = Math.min(Math.max(8, r.left - w.left), w.width - lebarKartu - 8);
  const atas = r.bottom - w.top + 6;
  const asalX = r.left - w.left + r.width / 2 - kiri;
  return (
    <m.div
      ref={ref}
      role="dialog"
      aria-label={detail.k.judul}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ left: kiri, top: atas, width: lebarKartu, transformOrigin: `${asalX}px 0px` }}
      className="absolute z-40 rounded-2xl border border-garis bg-gading p-4 shadow-modal"
    >
      <button type="button" onClick={tutup} aria-label="Tutup" className="absolute right-2 top-2 rounded-full p-1.5 text-redup hover:bg-hijau/5">
        <X className="size-4" aria-hidden />
      </button>
      <Isi k={detail.k} onUbah={onUbah} />
    </m.div>
  );
}
