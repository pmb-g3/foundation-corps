// Status login Admin Utama / Kepala Bagian (F-50).
// Token disimpan di sessionStorage (hilang saat tab ditutup), berlaku 8 jam.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiPost, ambilSesiTersimpan, simpanSesi } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesi, setSesi] = useState(() => ambilSesiTersimpan());
  // ?mode=edit (dipakai pratinjau menu Edit Website) langsung menyalakan pensil edit
  const [modeEdit, setModeEdit] = useState(() => new URLSearchParams(location.search).get('mode') === 'edit');

  // sesi ditolak server → keluar
  useEffect(() => {
    const habis = () => {
      setSesi(null);
      setModeEdit(false);
    };
    window.addEventListener('fc:sesi-habis', habis);
    return () => window.removeEventListener('fc:sesi-habis', habis);
  }, []);

  // keluar otomatis saat 8 jam berakhir
  useEffect(() => {
    if (!sesi) return;
    const sisa = sesi.kedaluwarsa - Date.now();
    const t = setTimeout(() => {
      simpanSesi(null);
      setSesi(null);
      setModeEdit(false);
    }, Math.max(0, Math.min(sisa, 2 ** 31 - 1)));
    return () => clearTimeout(t);
  }, [sesi]);

  const masuk = useCallback(async (username, password) => {
    const hasil = await apiPost('login', { username, password });
    const baru = { token: hasil.token, pengguna: hasil.pengguna, kedaluwarsa: hasil.kedaluwarsa };
    simpanSesi(baru);
    setSesi(baru);
    return baru.pengguna;
  }, []);

  const keluar = useCallback(async () => {
    try {
      await apiPost('logout');
    } catch {
      /* tetap keluar di sisi tampilan */
    }
    simpanSesi(null);
    setSesi(null);
    setModeEdit(false);
  }, []);

  const nilai = useMemo(() => {
    const pengguna = sesi ? sesi.pengguna : null;
    return {
      pengguna,
      masukLogin: !!pengguna,
      isAdmin: pengguna?.peran === 'ADMIN',
      isKabag: pengguna?.peran === 'KABAG',
      sektorKabag: pengguna?.peran === 'KABAG' ? pengguna.sektor_id : '',
      modeEdit: !!pengguna && modeEdit,
      setModeEdit,
      masuk,
      keluar
    };
  }, [sesi, modeEdit, masuk, keluar]);

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth harus di dalam AuthProvider');
  return c;
}

/** Bolehkah pengguna mengubah data sektor ini? (pengecekan tampilan; server tetap memeriksa ulang) */
export function bolehUbahSektor(auth, sektorId) {
  return auth.isAdmin || (auth.isKabag && auth.sektorKabag === sektorId);
}
