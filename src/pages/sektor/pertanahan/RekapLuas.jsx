import { angka, luasHa } from '../../../lib/format.js';
import { kelompokLokasi, labelZona } from '../../../lib/lokasiTanah.js';
import { GrafikBatang } from '../../../components/chart/GrafikBatang.jsx';
import { AngkaNaik } from '../../../components/chart/Angka.jsx';
import { TombolPdf } from '../../../components/layout/TombolPdf.jsx';

const ha = (m2) => (Number(m2) || 0) / 10000;

/** F-22 Rekap luas per lokasi & zona (m² dan hektar). Lokasi rincian tidak dijumlahkan dua kali. */
export function RekapLuas({ zona = [], lokasi = [] }) {
  const kelompok = kelompokLokasi(zona, lokasi).filter((k) => k.zona.length);
  const utama = kelompok.filter((k) => !k.induk);
  const total = utama.reduce((t, k) => t + k.luas, 0);
  const zonaUtama = utama.flatMap((k) => k.zona.map((z) => ({ ...z, namaLokasi: k.nama })));

  const siapkanPdf = () => ({
    judul: 'Rekap Luas Tanah per Lokasi & Zona',
    ringkasan: [['Total luas', `${angka(total)} m²`], ['Total hektar', luasHa(total)], ['Lokasi', String(utama.length)]],
    tabel: kelompok.map((k) => ({
      judul: k.induk ? `${k.nama} (rincian, tidak dijumlahkan)` : `${k.nama}${k.jarak ? ` — ${k.jarak}` : ''}`,
      kepala: [['No.', 'Zona', 'Luas (m²)', 'Luas (ha)', 'Porsi']],
      badan: k.zona.map((z) => [z.kode || '', z.nama_zona, angka(z.luas_m2), angka(ha(z.luas_m2), 2), k.luas ? `${angka(((Number(z.luas_m2) || 0) / k.luas) * 100, 1)}%` : '–']),
      kaki: ['', 'Subtotal', angka(k.luas), angka(ha(k.luas), 2), '100%'],
      kolomKanan: [2, 3, 4]
    })),
    namaBerkas: 'rekap-luas-tanah'
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="flex flex-col rounded-kartu bg-hijau p-6 text-gading">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gading/70">Total luas tanah</p>
        <p className="mt-3 font-judul text-5xl leading-none">
          <AngkaNaik nilai={ha(total)} format={(v) => angka(v, 2)} /> <span className="text-2xl">ha</span>
        </p>
        <p className="mt-2 text-sm tabular-nums text-emas">{angka(total)} m²</p>

        <ul className="mt-6 space-y-3.5">
          {kelompok.map((k) => (
            <li key={k.id} className={k.induk ? 'pl-3 opacity-80' : undefined}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{k.induk ? `↳ ${k.nama}` : k.nama}</span>
                <span className="tabular-nums">{angka(ha(k.luas), 2)} ha</span>
              </div>
              {!k.induk && (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emas" style={{ width: `${total ? (k.luas / total) * 100 : 0}%` }} />
                </div>
              )}
              <p className="mt-1 text-xs text-gading/60">
                {k.zona.length} zona{k.jarak ? ` · ${k.jarak}` : ''}
                {k.induk ? ' · rincian, tidak dijumlahkan' : ''}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="text-sm text-gading/70">{zonaUtama.length} zona</span>
          <TombolPdf gelap label="Unduh PDF rekap luas" siapkan={siapkanPdf} />
        </div>
      </div>
      <div className="kartu p-5 md:p-6">
        <p className="label-bagian mb-4">Luas per zona (ha) · nomor bidang</p>
        <GrafikBatang
          data={zonaUtama.map((z) => ({ label: z.kode || z.nama_zona.slice(0, 6), sub: `${labelZona(z)} · ${z.namaLokasi}`, nilai: { ha: ha(z.luas_m2) } }))}
          seri={[{ kunci: 'ha', label: 'Luas (ha)', warna: 'var(--color-daun)' }]}
          format={(v) => `${angka(v, 2)} ha`}
          judulAria="Luas per zona dalam hektar"
          tinggi={260}
        />
        <ul className="mt-4 grid gap-x-6 gap-y-1 text-xs text-redup sm:grid-cols-2">
          {zonaUtama.map((z) => (
            <li key={z.id} className="flex justify-between gap-3 border-b border-garis/60 py-1">
              <span className="truncate">
                <b className="mr-1 font-semibold text-tinta">{z.kode}</b>
                {z.nama_zona}
              </span>
              <span className="shrink-0 tabular-nums">{angka(ha(z.luas_m2), 2)} ha</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
