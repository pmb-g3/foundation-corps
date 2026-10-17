// Data panel admin (getAdmin) + aksi simpan/hapus dengan pesan singkat.
// Dipakai panel admin dan panel editor di website (mode edit).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiPost } from './api.js';
import { useAuth } from './auth.jsx';
import { useToast } from '../components/ui/Toast.jsx';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const ada = useContext(AdminContext);
  if (ada) return children; // sudah di dalam provider
  return <AdminProviderInti>{children}</AdminProviderInti>;
}

function AdminProviderInti({ children }) {
  const auth = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);
  const cacheSheet = useRef({});

  const muatUlang = useCallback(async () => {
    if (!auth.masukLogin) return;
    setMemuat(true);
    try {
      const d = await apiPost('getAdmin');
      setInfo(d);
      setGalat(null);
    } catch (e) {
      setGalat(e);
    } finally {
      setMemuat(false);
    }
  }, [auth.masukLogin]);

  useEffect(() => {
    muatUlang();
  }, [muatUlang]);

  /** Isi lengkap satu sheet (Kelola Data). */
  const ambilSheet = useCallback(async (sheet, paksa = false) => {
    if (!paksa && cacheSheet.current[sheet]) return cacheSheet.current[sheet];
    const d = await apiPost('getSheet', { sheet });
    cacheSheet.current[sheet] = d;
    return d;
  }, []);

  const lupakanSheet = useCallback((sheet) => {
    if (sheet) delete cacheSheet.current[sheet];
    else cacheSheet.current = {};
  }, []);

  const jalankan = useCallback(
    async (aksi, body, pesanSukses) => {
      try {
        const hasil = await apiPost(aksi, body, aksi === 'uploadFoto' || aksi === 'importExcel' ? 120000 : undefined);
        if (pesanSukses) toast.sukses(pesanSukses);
        return hasil;
      } catch (e) {
        toast.galat(e.message);
        throw e;
      }
    },
    [toast]
  );

  const simpan = useCallback(
    async (sheet, data, pesan = 'Tersimpan.') => {
      const h = await jalankan('saveRecord', { sheet, data }, pesan);
      lupakanSheet(sheet);
      return h.data;
    },
    [jalankan, lupakanSheet]
  );

  const hapus = useCallback(
    async (sheet, id, pesan = 'Dihapus.') => {
      const h = await jalankan('deleteRecord', { sheet, id }, pesan);
      lupakanSheet(sheet);
      return h;
    },
    [jalankan, lupakanSheet]
  );

  const simpanPengaturan = useCallback(
    async (kunci, nilai, pesan = 'Pengaturan tersimpan.') => {
      const h = await jalankan('simpanPengaturan', { kunci, nilai }, pesan);
      setInfo((i) => (i && i.pengaturan ? { ...i, pengaturan: { ...i.pengaturan, [kunci]: h.nilai } } : i));
      return h;
    },
    [jalankan]
  );

  const nilai = useMemo(
    () => ({ info, memuat, galat, muatUlang, ambilSheet, lupakanSheet, jalankan, simpan, hapus, simpanPengaturan, skema: info?.skema || {} }),
    [info, memuat, galat, muatUlang, ambilSheet, lupakanSheet, jalankan, simpan, hapus, simpanPengaturan]
  );
  return <AdminContext.Provider value={nilai}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const c = useContext(AdminContext);
  if (!c) throw new Error('useAdmin harus di dalam AdminProvider');
  return c;
}

/** Label tampilan untuk baris referensi (dropdown ref). */
export function labelBaris(r) {
  if (!r) return '';
  return r.nama || r.nama_firqoh || r.nama_zona || r.kode_bilik || r.judul || r.komoditas || r.username || r.kunci || r.id;
}
