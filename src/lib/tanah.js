// Perhitungan data tanah (F-21): luas ru, nilai perolehan, status dokumen.
const angka = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Number(v));
const ada = (v) => v !== null && v !== undefined && String(v).trim() !== '';

/** Kolom yang wajib terisi agar data dianggap lengkap (sesuai skema `lengkap`). */
export const KOLOM_LENGKAP = ['nama_pemegang_hak', 'letak_tanah', 'luas_m2', 'harga_rp_per_ru'];

export function statusDokumen(r) {
  // harga dianggap terisi bila ada keterangan (Wakaf / Sebagian wakaf / Tidak diketahui)
  if (KOLOM_LENGKAP.some((k) => !ada(r[k]) && !(k === 'harga_rp_per_ru' && ada(r.keterangan_harga))) || (!ada(r.no_shm) && !ada(r.no_petok))) return 'Data belum lengkap';
  return ada(r.no_shm) ? 'SHM' : 'Petok';
}

export const WARNA_STATUS_DOKUMEN = { SHM: 'hijau', Petok: 'emas', 'Data belum lengkap': 'bata' };

/** Tambah kolom hitungan: luas_ru, nilai_perolehan, status, tahun. */
export function olahTanah(rows, konversiRu = 14) {
  const k = Number(konversiRu) || 14;
  return (rows || []).map((r, i) => {
    const luas = angka(r.luas_m2);
    const harga = angka(r.harga_rp_per_ru);
    const ru = luas !== null ? luas / k : null;
    return {
      ...r,
      no: i + 1,
      luas_ru: ru,
      nilai_perolehan: ru !== null && harga !== null ? ru * harga : null,
      status: statusDokumen(r),
      tahun: r.tanggal_penerimaan ? String(r.tanggal_penerimaan).slice(0, 4) : ''
    };
  });
}

export function ringkasTanah(rows) {
  const jumlah = (k) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0);
  const shm = rows.filter((r) => r.status === 'SHM').length;
  const petok = rows.filter((r) => r.status === 'Petok').length;
  return {
    bidang: rows.length,
    luas: jumlah('luas_m2'),
    ru: jumlah('luas_ru'),
    nilai: jumlah('nilai_perolehan'),
    shm,
    petok,
    belum: rows.length - shm - petok
  };
}
