import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';

// Data satu sektor diambil saat halaman sektor dibuka (PRD 6.1),
// disimpan sementara di sessionStorage agar kembali ke halaman terasa instan.
const kunci = (id) => `fc_sektor_${id}`;

function bacaSimpanan(id) {
  try {
    return JSON.parse(sessionStorage.getItem(kunci(id)) || 'null');
  } catch {
    return null;
  }
}

export function useSektor(id) {
  const [data, setData] = useState(() => bacaSimpanan(id));
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState(null);

  const muat = useCallback(async () => {
    setMemuat(true);
    try {
      const d = await apiGet('getSektor', { sektor: id });
      setData(d);
      setGalat(null);
      try {
        sessionStorage.setItem(kunci(id), JSON.stringify(d));
      } catch {
        /* abaikan */
      }
    } catch (e) {
      setGalat(e);
    } finally {
      setMemuat(false);
    }
  }, [id]);

  useEffect(() => {
    setData(bacaSimpanan(id));
    muat();
  }, [id, muat]);

  /** Perbarui data lokal setelah admin menyimpan (tampil seketika). */
  const ubahLokal = useCallback(
    (fn) =>
      setData((lama) => {
        if (!lama) return lama;
        const baru = fn(structuredClone(lama));
        try {
          sessionStorage.setItem(kunci(id), JSON.stringify(baru));
        } catch {
          /* abaikan */
        }
        return baru;
      }),
    [id]
  );

  return { data, memuat, galat, muatUlang: muat, ubahLokal };
}
