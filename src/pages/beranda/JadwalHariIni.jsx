import * as m from 'motion/react-m';
import { CalendarClock, CircleCheck, CircleAlert, CupSoda, Moon, Sunrise, Users } from 'lucide-react';
import { tanggal } from '../../lib/format.js';
import { susunJadwal } from '../../lib/jadwalTampil.js';
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

function siapkanPdf({ utama, berikut }) {
  const baris = [utama, berikut].filter(Boolean).map((j) => [
    tanggal(j.tanggal),
    j.firqoh ? j.firqoh.nama + (j.jenis === 'Konsekuensi' ? ' (Konsekuensi)' : '') : j.libur ? 'Ditiadakan' + (j.libur.alasan ? ` (${j.libur.alasan})` : '') : '–',
    j.firqoh ? j.firqoh.anggota.map((a) => a.nama).join(', ') : '–',
    j.imam ? j.imam.nama : '–',
    j.pj_minuman_siang?.length ? j.pj_minuman_siang.map((p) => p.nama).join(', ') : '–'
  ]);
  return {
    judul: 'Jadwal Subuh Berkah',
    subjudul: `${tanggal(utama.tanggal)} · ${hijriah(utama.tanggal)}`,
    tabel: [{ kepala: [['Tanggal', 'Firqoh', 'Anggota', 'Imam Subuh', 'PJ Minuman Siang']], badan: baris }],
    namaBerkas: `jadwal-subuh-${utama.tanggal}`,
    lanskap: true
  };
}

/**
 * F-02 Jadwal Subuh Berkah: firqoh + anggota, imam, konsekuensi, PJ Minuman Siang, pratinjau hari berikutnya.
 * Menampilkan jadwal ESOK hari agar staf bisa mengecek sehari sebelumnya; berganti tiap pukul 06.00 WIB
 * (setelah Subuh Berkah). Sebelum 06.00 yang tampil masih subuh hari ini.
 */
export function JadwalHariIni({ jadwal }) {
  const susun = susunJadwal(jadwal);
  if (!susun) {
    return (
      <div className="kartu space-y-4 p-6">
        <Kerangka className="h-6 w-40" />
        <Kerangka className="h-10 w-3/4" />
        <Kerangka className="h-24" />
      </div>
    );
  }
  const { utama: j, berikut: b, esok, jamGanti } = susun;

  return (
    <m.article variants={muncul} {...saatTerlihat} className="kartu overflow-hidden">
      <header className="flex items-start gap-3 border-b border-garis px-5 py-4 md:px-6">
        <div className="min-w-0 flex-1">
          <Lencana warna={esok ? 'gelap' : 'emas'} ikon={esok ? CalendarClock : Sunrise} className="mb-2">
            {esok ? 'Jadwal besok' : 'Subuh hari ini'}
          </Lencana>
          <p className="font-judul text-xl text-tinta md:text-2xl">{tanggal(j.tanggal)}</p>
          <p className="mt-0.5 text-sm text-emas-tua">{hijriah(j.tanggal)}</p>
        </div>
        <TombolPdf label="Unduh PDF jadwal" siapkan={() => siapkanPdf(susun)} />
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
          ) : j.libur ? (
            <>
              <h3 className="mt-2 text-[1.7rem] leading-tight text-tinta">Ditiadakan</h3>
              <p className="mt-2 rounded-xl bg-emas/12 px-3 py-2 text-sm text-tinta">
                Subuh Berkah {esok ? 'besok' : 'hari ini'} ditiadakan{j.libur.alasan ? ` (${j.libur.alasan})` : ''}. Giliran firqoh diundur ke hari berikutnya.
              </p>
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

      {/* Pratinjau hari berikutnya */}
      {b && (
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-krem/60 px-5 py-3 text-sm md:px-6">
          <span className="font-semibold text-hijau">{esok ? 'Lusa' : 'Besok'}</span>
          <span className="text-redup">{tanggal(b.tanggal, 'hariBulan')}</span>
          <span className="text-tinta">{b.firqoh ? b.firqoh.nama : b.libur ? 'Subuh Berkah ditiadakan' : 'Belum ada jadwal'}</span>
          {b.jenis === 'Konsekuensi' && <Lencana warna="bata">Konsekuensi</Lencana>}
          {b.imam && <span className="text-redup">· Imam {b.imam.nama}</span>}
        </footer>
      )}
      <p className="border-t border-garis px-5 py-2 text-xs text-redup md:px-6">
        Berganti ke jadwal hari berikutnya setiap pukul {String(jamGanti).padStart(2, '0')}.00 WIB, setelah Subuh Berkah.
      </p>
    </m.article>
  );
}
