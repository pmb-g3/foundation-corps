import { Moon, Plus } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { keIso, jam, namaHari, tanggal } from '../../lib/format.js';
import { hijriah } from '../../lib/hijriah.js';
import { HARI_PENDEK, metaKategori } from './kalenderLib.js';

function BarisKegiatan({ k, onKlik }) {
  const mk = metaKategori(k.kategori);
  return (
    <button
      type="button"
      onClick={(e) => onKlik(k, e.currentTarget)}
      className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-krem', k._sementara && 'opacity-60')}
      style={{ boxShadow: `inset 3px 0 0 ${mk.warna}` }}
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in oklab, ${mk.warna} 15%, transparent)`, color: mk.warna }}>
        <mk.ikon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-snug text-tinta">{k.judul}</span>
        <span className="block text-xs text-redup">
          {k.sepanjang_hari ? 'Sepanjang hari' : `${jam(k.mulai)}${k.selesai ? '–' + jam(k.selesai) : ''}`}
          {k.lokasi ? ` · ${k.lokasi}` : ''}
        </span>
      </span>
    </button>
  );
}

function BarisSubuh({ s }) {
  return (
    <p className="flex items-center gap-2 px-3 py-1 text-xs text-redup">
      <Moon className="size-3.5 text-emas-tua" aria-hidden />
      <span className="size-2 rounded-full" style={{ background: s.warna || 'var(--color-hijau)' }} />
      Subuh Berkah: <b className="font-semibold text-tinta">{s.firqoh}</b>
      {s.jenis === 'Konsekuensi' && <span className="text-bata">(konsekuensi)</span>}
      {s.imam && <span>· Imam {s.imam}</span>}
    </p>
  );
}

/** Tampilan Agenda (bawaan di HP): daftar per tanggal. */
export function TampilanAgenda({ hari, perHari, subuhPerHari, hariIni, lapisanSubuh, onKlikKegiatan }) {
  const isi = hari.filter((d) => {
    const k = keIso(d);
    return (perHari[k] || []).length || (lapisanSubuh && subuhPerHari[k] && k >= hariIni);
  });
  if (!isi.length) return <p className="px-5 py-12 text-center text-sm text-redup">Tidak ada kegiatan pada bulan ini.</p>;
  return (
    <ol className="divide-y divide-garis">
      {isi.map((d) => {
        const k = keIso(d);
        const ini = k === hariIni;
        return (
          <li key={k} className={cn('grid grid-cols-[3.5rem_1fr] gap-2 px-3 py-3 md:grid-cols-[5rem_1fr] md:px-5', k < hariIni && 'opacity-60')}>
            <div className="text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-redup">{namaHari(k).slice(0, 3)}</p>
              <p className={cn('mx-auto mt-0.5 flex size-10 items-center justify-center rounded-full font-judul text-xl', ini && 'ring-2 ring-emas text-hijau')}>{d.getDate()}</p>
            </div>
            <div className="min-w-0">
              <p className="px-3 text-[0.68rem] text-emas-tua">{hijriah(k)}</p>
              {lapisanSubuh && subuhPerHari[k] && <BarisSubuh s={subuhPerHari[k]} />}
              {(perHari[k] || []).map((x) => (
                <BarisKegiatan key={x.id} k={x} onKlik={onKlikKegiatan} />
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Tampilan Minggu: 7 kolom (laptop) / tumpuk (HP), kegiatan urut jam. */
export function TampilanMinggu({ hari, perHari, subuhPerHari, hariIni, libur, lapisanSubuh, bisaTambah, onKlikHari, onKlikKegiatan }) {
  return (
    <div className="grid divide-y divide-garis md:grid-cols-7 md:divide-x md:divide-y-0">
      {hari.map((d, i) => {
        const k = keIso(d);
        const ini = k === hariIni;
        return (
          <div key={k} data-tanggal={k} className={cn('flex min-h-[8rem] flex-col p-2 md:min-h-[26rem]', libur.includes(d.getDay()) && 'bg-emas/[0.07]')}>
            <div className="mb-2 flex items-center gap-2 md:flex-col md:items-start md:gap-0">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-redup">{HARI_PENDEK[i]}</span>
              <span className={cn('flex size-9 items-center justify-center rounded-full font-judul text-lg', ini && 'ring-2 ring-emas text-hijau')}>{d.getDate()}</span>
              <span className="text-[0.62rem] text-emas-tua md:mt-0.5">{tanggal(k, 'hariBulan')}</span>
            </div>
            {lapisanSubuh && subuhPerHari[k] && (
              <p className="mb-1.5 flex items-center gap-1.5 rounded-lg bg-krem px-2 py-1 text-[0.68rem] text-redup" title={subuhPerHari[k].imam ? `Imam ${subuhPerHari[k].imam}` : undefined}>
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: subuhPerHari[k].warna || 'var(--color-hijau)' }} />
                <span className="truncate">{subuhPerHari[k].firqoh}</span>
              </p>
            )}
            <div className="flex-1 space-y-1">
              {(perHari[k] || []).map((x) => (
                <BarisKegiatan key={x.id} k={x} onKlik={onKlikKegiatan} />
              ))}
            </div>
            {bisaTambah && (
              <button type="button" onClick={(e) => onKlikHari(k, e.currentTarget)} className="mt-1 inline-flex min-h-9 items-center gap-1 self-start rounded-full px-2 text-xs text-redup hover:bg-hijau/5 hover:text-hijau">
                <Plus className="size-3.5" aria-hidden /> Tambah
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { BarisKegiatan };
