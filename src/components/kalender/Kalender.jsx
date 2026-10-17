import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { addMonths, addWeeks, format } from 'date-fns';
import { id as lokalId } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { apiGet, apiPost } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { usePengaturan } from '../../lib/data.jsx';
import { hariIniWib, keIso, keTanggal } from '../../lib/format.js';
import { hijriah } from '../../lib/hijriah.js';
import { useLayarLebar } from '../../hooks/useMedia.js';
import { Segmen } from '../ui/Segmen.jsx';
import { Switch } from '../ui/Isian.jsx';
import { Button, IkonTombol } from '../ui/Button.jsx';
import { useToast } from '../ui/Toast.jsx';
import { TampilanBulan } from './TampilanBulan.jsx';
import { TampilanAgenda, TampilanMinggu } from './TampilanDaftar.jsx';
import { FormKegiatan, buatDraf, drafKeBaris } from './FormKegiatan.jsx';
import { DetailKegiatan } from './DetailKegiatan.jsx';
import { KATEGORI, KATEGORI_SEKTOR, daftarHari, indeksPerHari, pindahTanggal, rentangTampilan } from './kalenderLib.js';

const cacheRentang = new Map(); // simpanan per rentang selama halaman terbuka

/**
 * F-05 Kalender kegiatan — diadaptasi dari ReUI Event Calendar.
 * Tampilan Bulan (laptop) / Agenda (HP) / Minggu; lokal Indonesia; minggu mulai Sabtu.
 * Pengunjung hanya melihat. Admin & Kabag (kategori sektornya): tambah, ubah, hapus, seret pindah tanggal (laptop).
 * Penyimpanan pola "external CRUD": tampilan berubah seketika, dikembalikan bila server menolak.
 */
export default function Kalender() {
  const auth = useAuth();
  const toast = useToast();
  const lebar = useLayarLebar();
  const kurangi = useReducedMotion();
  const set = usePengaturan().kalender || {};
  const libur = Array.isArray(set.libur_pekanan) ? set.libur_pekanan.map(Number) : [5];
  const tampilHijriah = set.tampil_hijriah !== false;
  const hariIni = hariIniWib();

  const [tampilan, setTampilan] = useState(() => (window.matchMedia('(min-width: 768px)').matches ? 'bulan' : 'agenda'));
  const [acuan, setAcuan] = useState(() => keTanggal(hariIni));
  const [arah, setArah] = useState(0);
  const [lapisan, setLapisan] = useState(set.lapisan_subuh !== false);
  const [filter, setFilter] = useState(() => new Set(KATEGORI.map((k) => k.nilai)));
  const [data, setData] = useState(null);
  const [memuat, setMemuat] = useState(false);
  const [detail, setDetail] = useState(null);
  const [draf, setDraf] = useState(null);
  const wadahRef = useRef(null);
  const geser = useRef(null);

  const { mulai, selesai } = rentangTampilan(tampilan, acuan);
  const kunciRentang = `${keIso(mulai)}_${keIso(selesai)}`;

  // hak ubah (tampilan; server tetap memeriksa ulang)
  const kategoriBoleh = auth.isAdmin ? KATEGORI.map((k) => k.nilai) : auth.isKabag && KATEGORI_SEKTOR[auth.sektorKabag] ? [KATEGORI_SEKTOR[auth.sektorKabag]] : [];
  const bisaTambah = kategoriBoleh.length > 0;
  const bisaUbah = useCallback((k) => kategoriBoleh.includes(k.kategori), [kategoriBoleh.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const muat = useCallback(async (paksa = false) => {
    if (!paksa && cacheRentang.has(kunciRentang)) {
      setData(cacheRentang.get(kunciRentang));
      return;
    }
    setMemuat(true);
    try {
      const d = await apiGet('getKalender', { mulai: keIso(mulai), selesai: keIso(selesai) });
      cacheRentang.set(kunciRentang, d);
      setData(d);
    } catch (e) {
      if (e.kode !== 'BELUM_DIATUR') toast.galat(e.message);
      setData({ kegiatan: [], subuh: [] });
    } finally {
      setMemuat(false);
    }
  }, [kunciRentang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    muat();
  }, [muat]);

  const kegiatan = useMemo(() => (data?.kegiatan || []).filter((k) => filter.has(k.kategori)), [data, filter]);
  const perHari = useMemo(() => indeksPerHari(kegiatan), [kegiatan]);
  const subuhPerHari = useMemo(() => Object.fromEntries((data?.subuh || []).map((s) => [s.tanggal, s])), [data]);
  const hari = useMemo(() => daftarHari(mulai, selesai), [kunciRentang]); // eslint-disable-line react-hooks/exhaustive-deps

  const pindahPeriode = (n) => {
    setArah(n);
    setDetail(null);
    setAcuan((a) => (tampilan === 'minggu' ? addWeeks(a, n) : addMonths(a, n)));
  };
  const keHariIni = () => {
    setArah(0);
    setAcuan(keTanggal(hariIni));
  };

  // ---------- simpan (pola external CRUD + kembalikan bila gagal) ----------
  const ubahLokal = (fn) =>
    setData((d) => {
      const baru = { ...d, kegiatan: fn(d?.kegiatan || []) };
      cacheRentang.clear();
      cacheRentang.set(kunciRentang, baru);
      return baru;
    });

  const simpan = async (d) => {
    const baris = drafKeBaris(d);
    const sebelum = data;
    const idSementara = 'sementara-' + Date.now();
    ubahLokal((daftar) => (d.id ? daftar.map((x) => (x.id === d.id ? { ...x, ...baris } : x)) : [...daftar, { ...baris, id: idSementara, _sementara: true }]));
    setDraf(null);
    setDetail(null);
    try {
      const r = await apiPost('saveRecord', { sheet: 'Kalender', data: baris });
      ubahLokal((daftar) => daftar.map((x) => (x.id === (d.id || idSementara) ? r.data : x)));
      toast.sukses(d.id ? 'Kegiatan diperbarui.' : 'Kegiatan ditambahkan.');
    } catch (e) {
      setData(sebelum);
      cacheRentang.clear();
      toast.galat(e.message);
    }
  };

  const hapus = async (d) => {
    const sebelum = data;
    ubahLokal((daftar) => daftar.filter((x) => x.id !== d.id));
    setDraf(null);
    setDetail(null);
    try {
      await apiPost('deleteRecord', { sheet: 'Kalender', id: d.id });
      toast.sukses('Kegiatan dihapus.');
    } catch (e) {
      setData(sebelum);
      toast.galat(e.message);
    }
  };

  const pindah = async (k, tanggalBaru) => {
    const baru = pindahTanggal(k, tanggalBaru);
    const sebelum = data;
    ubahLokal((daftar) => daftar.map((x) => (x.id === k.id ? { ...baru, _sementara: true } : x)));
    try {
      const r = await apiPost('saveRecord', { sheet: 'Kalender', data: { id: k.id, mulai: baru.mulai, selesai: baru.selesai } });
      ubahLokal((daftar) => daftar.map((x) => (x.id === k.id ? r.data : x)));
      toast.sukses('Tanggal kegiatan dipindah.');
    } catch (e) {
      setData(sebelum);
      toast.galat(e.message);
    }
  };

  // ---------- interaksi ----------
  const klikHari = (tgl, el) => {
    const ada = perHari[tgl] || [];
    if (bisaTambah && (lebar || !ada.length)) {
      setDraf(buatDraf(null, tgl, kategoriBoleh[0]));
    } else if (ada.length) {
      setDetail({ k: ada[0], el });
    }
  };
  const klikKegiatan = (k, el) => setDetail({ k, el });

  // geser kiri/kanan di HP untuk ganti bulan
  const onPointerDown = (e) => {
    if (e.pointerType !== 'touch') return;
    geser.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const g = geser.current;
    geser.current = null;
    if (!g) return;
    const dx = e.clientX - g.x;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - g.y) * 1.5) pindahPeriode(dx < 0 ? 1 : -1);
  };

  const judul =
    tampilan === 'minggu'
      ? `${format(mulai, 'd MMM', { locale: lokalId })} – ${format(selesai, 'd MMM yyyy', { locale: lokalId })}`
      : format(acuan, 'MMMM yyyy', { locale: lokalId });
  const hj = `${hijriah(keIso(mulai)).replace(/^\d+\s/, '')} – ${hijriah(keIso(selesai)).replace(/^\d+\s/, '')}`;

  const isiTampilan =
    tampilan === 'bulan' ? (
      <TampilanBulan
        hari={hari}
        acuan={acuan}
        perHari={perHari}
        subuhPerHari={subuhPerHari}
        hariIni={hariIni}
        libur={libur}
        tampilHijriah={tampilHijriah}
        lapisanSubuh={lapisan}
        bisaTambah={bisaTambah}
        bisaSeret={(k) => lebar && bisaUbah(k)}
        onKlikHari={klikHari}
        onKlikKegiatan={klikKegiatan}
        onPindah={pindah}
      />
    ) : tampilan === 'minggu' ? (
      <TampilanMinggu hari={hari} perHari={perHari} subuhPerHari={subuhPerHari} hariIni={hariIni} libur={libur} lapisanSubuh={lapisan} bisaTambah={bisaTambah} onKlikHari={klikHari} onKlikKegiatan={klikKegiatan} />
    ) : (
      <TampilanAgenda hari={hari} perHari={perHari} subuhPerHari={subuhPerHari} hariIni={hariIni} lapisanSubuh={lapisan} onKlikKegiatan={klikKegiatan} />
    );

  return (
    <div ref={wadahRef} className="kartu relative overflow-visible">
      {/* bilah atas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-garis px-3 py-3 md:px-5">
        <div className="flex items-center gap-1">
          <IkonTombol ikon={ChevronLeft} label="Sebelumnya" kecil varian="garis" onClick={() => pindahPeriode(-1)} />
          <IkonTombol ikon={ChevronRight} label="Berikutnya" kecil varian="garis" onClick={() => pindahPeriode(1)} />
        </div>
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate font-judul text-xl capitalize leading-tight md:text-2xl">{judul}</p>
          {tampilHijriah && <p className="truncate text-xs text-emas-tua">{hj}</p>}
        </div>
        <Button varian="hantu" ukuran="sm" ikon={CalendarDays} onClick={keHariIni}>
          Hari ini
        </Button>
        <Segmen
          pilihan={[
            { nilai: 'bulan', label: 'Bulan' },
            { nilai: 'minggu', label: 'Minggu' },
            { nilai: 'agenda', label: 'Agenda' }
          ]}
          nilai={tampilan}
          ubah={(v) => {
            setArah(0);
            setDetail(null);
            setTampilan(v);
          }}
          idTata="kalender-tampilan"
          label="Tampilan kalender"
        />
        {bisaTambah && (
          <Button ukuran="sm" ikon={Plus} onClick={() => setDraf(buatDraf(null, hariIni, kategoriBoleh[0]))}>
            Tambah
          </Button>
        )}
      </div>

      {/* legenda = saringan kategori; + lapisan Subuh Berkah */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-garis px-3 py-2.5 md:px-5">
        {KATEGORI.map((k) => {
          const aktif = filter.has(k.nilai);
          return (
            <button
              key={k.nilai}
              type="button"
              aria-pressed={aktif}
              onClick={() =>
                setFilter((f) => {
                  const n = new Set(f);
                  if (n.has(k.nilai)) n.delete(k.nilai);
                  else n.add(k.nilai);
                  return n;
                })
              }
              className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-all', aktif ? 'border-transparent text-tinta' : 'border-garis text-redup opacity-60')}
              style={aktif ? { background: `color-mix(in oklab, ${k.warna} 14%, transparent)` } : undefined}
            >
              <k.ikon className="size-3.5" style={{ color: k.warna }} aria-hidden />
              {k.nilai}
            </button>
          );
        })}
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-redup">
          Subuh Berkah
          <Switch nyala={lapisan} ubah={setLapisan} label="Tampilkan lapisan Subuh Berkah" />
        </label>
      </div>

      <div className="relative overflow-hidden rounded-b-kartu" onPointerDown={onPointerDown} onPointerUp={onPointerUp} style={{ touchAction: 'pan-y' }}>
        {memuat && <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-emas" aria-hidden />}
        <AnimatePresence mode="popLayout" initial={false} custom={arah}>
          <m.div
            key={tampilan + kunciRentang}
            custom={arah}
            variants={{
              masuk: (a) => ({ x: kurangi ? 0 : a * 48, opacity: 0 }),
              tampil: { x: 0, opacity: 1 },
              keluar: (a) => ({ x: kurangi ? 0 : a * -48, opacity: 0 })
            }}
            initial="masuk"
            animate="tampil"
            exit="keluar"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {isiTampilan}
          </m.div>
        </AnimatePresence>
      </div>

      <DetailKegiatan
        detail={detail}
        wadah={wadahRef.current}
        tutup={() => setDetail(null)}
        onUbah={detail && bisaUbah(detail.k) ? () => {
          setDraf(buatDraf(detail.k));
          setDetail(null);
        } : undefined}
      />
      {draf && <FormKegiatan awal={draf} kategoriBoleh={kategoriBoleh.includes(draf.kategori) ? kategoriBoleh : [draf.kategori, ...kategoriBoleh]} tutup={() => setDraf(null)} simpan={simpan} hapus={draf.id ? hapus : null} />}
    </div>
  );
}
