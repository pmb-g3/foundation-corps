// Data beranda (bootstrap) dengan pola "tampil dulu dari simpanan, lalu perbarui":
// kunjungan ulang langsung tampil dari localStorage, lalu data terbaru dari server menyusul.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiSiap, ambilBootAwal } from './api.js';
import { terapkanTema } from './tema.js';

const DataContext = createContext(null);
const KUNCI = 'fc_boot_v1';

function bacaSimpanan() {
  try {
    const s = JSON.parse(localStorage.getItem(KUNCI) || 'null');
    return s && s.data ? s.data : null;
  } catch {
    return null;
  }
}

function tulisSimpanan(data) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify({ waktu: Date.now(), data }));
  } catch {
    /* penyimpanan penuh / diblokir */
  }
}

// Pratinjau Editor Layout (F-52): halaman dibuka di iframe dengan ?pratinjau=1 dan
// membaca draf layout/tema/teks dari localStorage (berubah seketika saat admin mengedit).
const MODE_PRATINJAU = typeof location !== 'undefined' && new URLSearchParams(location.search).get('pratinjau') === '1';
export const KUNCI_PRATINJAU = 'fc_pratinjau';

function bacaDraf() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_PRATINJAU) || 'null');
  } catch {
    return null;
  }
}

export function DataProvider({ children }) {
  const [bootAsli, setBoot] = useState(() => bacaSimpanan());
  const [draf, setDraf] = useState(() => (MODE_PRATINJAU ? bacaDraf() : null));
  useEffect(() => {
    if (!MODE_PRATINJAU) return;
    const dengar = (e) => {
      if (e.key === KUNCI_PRATINJAU) setDraf(bacaDraf());
    };
    window.addEventListener('storage', dengar);
    return () => window.removeEventListener('storage', dengar);
  }, []);
  const boot = useMemo(
    () => (draf && bootAsli ? { ...bootAsli, pengaturan: { ...bootAsli.pengaturan, ...draf } } : bootAsli),
    [bootAsli, draf]
  );
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);
  const pertama = useRef(true);

  const muat = useCallback(async () => {
    if (!apiSiap) {
      setMemuat(false);
      setGalat({ kode: 'BELUM_DIATUR', message: 'Website belum terhubung ke server. Isi GAS_URL di public/config.js.' });
      return;
    }
    setMemuat(true);
    try {
      const awal = pertama.current ? ambilBootAwal() : null;
      pertama.current = false;
      const data = await (awal || apiGet('bootstrap'));
      setBoot(data);
      setGalat(null);
      tulisSimpanan(data);
    } catch (e) {
      setGalat({ kode: e.kode, message: e.message });
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  // ganti hari (00.00 WIB) → ambil ulang jadwal saat tab kembali aktif
  useEffect(() => {
    const cek = () => {
      if (document.visibilityState !== 'visible' || !boot) return;
      const hariIni = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
      if (boot.hari_ini && boot.hari_ini !== hariIni) muat();
    };
    document.addEventListener('visibilitychange', cek);
    return () => document.removeEventListener('visibilitychange', cek);
  }, [boot, muat]);

  useEffect(() => {
    terapkanTema(boot?.pengaturan?.tema);
  }, [boot?.pengaturan?.tema]);

  /** Perbarui sebagian data lokal setelah admin menyimpan (tampil seketika). */
  const ubahLokal = useCallback((fn) => {
    setBoot((lama) => {
      if (!lama) return lama;
      const baru = fn(structuredClone(lama));
      tulisSimpanan(baru);
      return baru;
    });
  }, []);

  return (
    <DataContext.Provider value={{ boot, memuat, galat, muatUlang: muat, ubahLokal }}>{children}</DataContext.Provider>
  );
}

export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error('useData harus di dalam DataProvider');
  return c;
}

export function usePengaturan() {
  return useData().boot?.pengaturan || {};
}
