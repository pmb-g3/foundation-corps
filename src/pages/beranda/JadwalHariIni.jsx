import * as m from 'motion/react-m';
import { CircleCheck, CircleAlert, CupSoda, Moon, Users } from 'lucide-react';
import { tanggal } from '../../lib/format.js';
import { hijriah } from '../../lib/hijriah.js';
import { bergiliran, muncul, saatTerlihat } from '../../lib/motion.jsx';
import { FotoStaf } from '../../components/ui/Gambar.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { Kerangka } from '../../components/ui/Kerangka.jsx';
import { TombolPdf } from '../../components/layout/TombolPdf.jsx';

function StatusHari({ status }) {
  if (status === 'Sudah') return <Lencana warna="hijau" ikon={CircleCheck}>Terlaksana</Lencana>;
  if (status === 'Belum') return <Lencana warna="bata" ikon={CircleAlert}>Belum</Lencana>;
  return null;
}

function siapkanPdf(jadwal) {
  const baris = [jadwal.hari_ini, jadwal.besok].filter(Boolean).map((j) => [
    tanggal(j.tanggal),
    j.firqoh ? j.firqoh.nama + (j.jenis === 'Konsekuensi' ? ' (Konsekuensi)' : '') : '–',
    j.firqoh ? j.firqoh.anggota.map((a) => a.nama).join(', ') : '–',
    j.imam ? j.imam.nama : '–',
    j.pj_minuman_siang?.length ? j.pj_minuman_siang.map((p) => p.nama).join(', ') : '–'
  ]);
  return {
    judul: 'Jadwal Subuh Berkah',
    subjudul: `${tanggal(jadwal.hari_ini.tanggal)} · ${hijriah(jadwal.hari_ini.tanggal)}`,
    tabel: [{ kepala: [['Tanggal', 'Firqoh', 'Anggota', 'Imam Subuh', 'PJ Minuman Siang']], badan: baris }],
    namaBerkas: `jadwal-subuh-${jadwal.hari_ini.tanggal}`,
    lanskap: true
  };
}

/** F-02 Jadwal hari ini: firqoh + anggota, imam, konsekuensi, PJ Minuman Siang, pratinjau besok. */
export function JadwalHariIni({ jadwal }) {
  if (!jadwal) {
    return (
      <div className="kartu space-y-4 p-6">
        <Kerangka className="h-6 w-40" />
        <Kerangka className="h-10 w-3/4" />
        <Kerangka className="h-24" />
      </div>
    );
  }
  const j = jadwal.hari_ini;
  const b = jadwal.besok;

  return (
    <m.article variants={muncul} {...saatTerlihat} className="kartu overflow-hidden">
      <header className="flex items-start gap-3 border-b border-garis px-5 py-4 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="font-judul text-xl text-tinta md:text-2xl">{tanggal(j.tanggal)}</p>
          <p className="mt-0.5 text-sm text-emas-tua">{hijriah(j.tanggal)}</p>
        </div>
        <TombolPdf label="Unduh PDF jadwal" siapkan={() => siapkanPdf(jadwal)} />
      </header>

      <div className="grid gap-px bg-garis md:grid-cols-[1.35fr_1fr]">
        {/* Firqoh */}
        <section className="bg-gading px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-bagian flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden /> Firqoh Subuh Berkah
            </p>
            {j.jenis === 'Konsekuensi' && <Lencana warna="bata">Konsekuensi</Lencana>}
            <StatusHari status={j.status} />
          </div>
          {j.firqoh ? (
            <>
              <h3 className="mt-2 text-[1.7rem] leading-tight text-tinta">{j.firqoh.nama}</h3>
              {j.konsekuensi && (
                <p className="mt-2 rounded-xl bg-bata/8 px-3 py-2 text-sm text-bata">
                  {j.konsekuensi.alasan}
                  {j.konsekuensi.hari_ke ? ` · hari ke-${j.konsekuensi.hari_ke}` : ''}
                </p>
              )}
              <m.ul variants={bergiliran(0.06, 0.15)} {...saatTerlihat} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {j.firqoh.anggota.map((a) => (
                  <m.li key={a.id} variants={muncul} className="flex items-center gap-2.5 rounded-xl bg-krem/70 px-2.5 py-2">
                    <FotoStaf nama={a.nama} fotoId={a.foto_id} ukuran="sm" />
                    <span className="truncate text-sm font-medium">{a.nama}</span>
                  </m.li>
                ))}
                {!j.firqoh.anggota.length && <li className="text-sm text-redup">Anggota belum ditetapkan.</li>}
              </m.ul>
            </>
          ) : (
            <p className="mt-3 text-sm text-redup">Belum ada jadwal. Menunggu undian berikutnya.</p>
          )}
        </section>

        {/* Imam */}
        <section className="flex flex-col bg-gading px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-bagian flex items-center gap-1.5">
              <Moon className="size-3.5" aria-hidden /> Imam Subuh
            </p>
            {j.imam && <StatusHari status={j.imam.status} />}
          </div>
          {j.imam ? (
            <div className="mt-3 flex items-center gap-3">
              <FotoStaf nama={j.imam.nama} fotoId={j.imam.foto_id} ukuran="lg" />
              <div>
                <p className="font-judul text-xl leading-tight text-tinta">{j.imam.nama}</p>
                <p className="text-sm text-redup">Masjid Jami'</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-redup">Belum terjadwal.</p>
          )}
          {j.pj_minuman_siang?.length > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-emas/15 px-3 py-2.5 text-sm text-tinta">
              <CupSoda className="mt-0.5 size-4 shrink-0 text-emas-tua" aria-hidden />
              <p>
                <b className="font-semibold">PJ Minuman Siang:</b> {j.pj_minuman_siang.map((p) => p.nama).join(', ')}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Pratinjau besok */}
      {b && (
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-krem/60 px-5 py-3 text-sm md:px-6">
          <span className="font-semibold text-hijau">Besok</span>
          <span className="text-redup">{tanggal(b.tanggal, 'hariBulan')}</span>
          <span className="text-tinta">{b.firqoh ? b.firqoh.nama : 'Belum ada jadwal'}</span>
          {b.jenis === 'Konsekuensi' && <Lencana warna="bata">Konsekuensi</Lencana>}
          {b.imam && <span className="text-redup">· Imam {b.imam.nama}</span>}
        </footer>
      )}
    </m.article>
  );
}
