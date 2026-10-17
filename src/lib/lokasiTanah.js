// Lokasi peta tanah (F-20). Tiap lokasi punya gambar dasar sendiri (peta ukur / foto udara);
// zona di sheet Zona_Tanah terikat ke lokasi lewat kolom `lokasi`.
// Lokasi "rincian" (punya `induk`) memerinci satu zona di lokasi lain → luasnya tidak dijumlahkan dua kali.

/** Sama dengan lokasiTanahAwal_() di Peta.gs — dipakai bila Pengaturan belum berisi daftar lokasi. */
export const LOKASI_BAWAAN = [
  { id: 'pondok', nama: 'Kompleks Pondok', foto_id: 'lokal:tanah-pondok', foto_drone_id: '', jarak: '', induk: '', keterangan: 'Peta ukur 7 bidang di sekitar pondok (nomor sesuai peta ukur). Utara di atas.' },
  { id: 'latansa', nama: 'Sawah Depan La-Tansa', foto_id: 'lokal:tanah-latansa', foto_drone_id: '', jarak: 'Utara Jl. Joyoboyo Timur', induk: 'zt-b06', keterangan: 'Foto udara rincian bidang 6. Luas per blok diperkirakan dari panjang sisi.' },
  { id: 'besuk', nama: 'Tanah Besuk', foto_id: 'lokal:tanah-besuk', foto_drone_id: '', jarak: 'Selatan pondok', induk: '', keterangan: 'Bidang 9 dengan masjid. Utara di atas.' },
  { id: 'totok', nama: 'Totok Kerot', foto_id: 'lokal:tanah-totok', foto_drone_id: '', jarak: '± 6 km dari pondok', induk: '', keterangan: 'Bidang 10–13 di sekitar Arca Totok Kerot.' }
];

// Warna zona di atas peta gelap / foto udara: cerah agar terbaca; identitas juga lewat nomor & daftar.
export const WARNA_ZONA = ['#E2BE6E', '#8CC084', '#8DB8CC', '#D9925B', '#C7A3D9', '#E57F6A', '#F2E3B3', '#7FC4B8'];

const urutAlami = (a, b) => String(a ?? '').localeCompare(String(b ?? ''), 'id', { numeric: true });

/** Daftar lokasi dari Pengaturan peta_tanah. Bentuk lama (satu foto drone/datar) → satu lokasi. */
export function daftarLokasi(peta) {
  const p = peta || {};
  if (Array.isArray(p.lokasi) && p.lokasi.length) {
    return p.lokasi.filter((l) => l && l.id).map((l) => ({ nama: l.id, foto_id: '', foto_drone_id: '', jarak: '', induk: '', keterangan: '', ...l }));
  }
  if (p.foto_flat_id || p.foto_drone_id) {
    return [{ id: 'utama', nama: 'Peta tanah', foto_id: p.foto_flat_id || p.foto_drone_id, foto_drone_id: p.foto_flat_id ? p.foto_drone_id || '' : '', jarak: '', induk: '', keterangan: '' }];
  }
  return LOKASI_BAWAAN;
}

/** Id lokasi sebuah zona (zona tanpa lokasi yang dikenal → lokasi pertama). */
export const lokasiDari = (z, lokasi) => (lokasi.some((l) => l.id === z?.lokasi) ? z.lokasi : lokasi[0]?.id);

/** Zona di lokasi rincian tidak ikut dijumlahkan (luasnya sudah terhitung di zona induk). */
export function zonaRincian(z, lokasi) {
  const l = lokasi.find((x) => x.id === lokasiDari(z, lokasi));
  return !!(l && l.induk);
}

export const urutZona = (a, b) => urutAlami(a.kode, b.kode) || urutAlami(a.nama_zona, b.nama_zona);

/** "1 · Pemukiman Pondok" */
export const labelZona = (z) => (z?.kode ? `${z.kode} · ${z.nama_zona}` : z?.nama_zona || '–');

/** Ringkasan per lokasi: zona terurut, total luas (tanpa rincian), lokasi rincian untuk tiap zona. */
export function kelompokLokasi(zona, lokasi) {
  return lokasi.map((l) => {
    const isi = (zona || []).filter((z) => lokasiDari(z, lokasi) === l.id).sort(urutZona);
    return { ...l, zona: isi, luas: isi.reduce((t, z) => t + (Number(z.luas_m2) || 0), 0) };
  });
}

export const totalLuasTanah = (zona, lokasi) =>
  (zona || []).filter((z) => !zonaRincian(z, lokasi)).reduce((t, z) => t + (Number(z.luas_m2) || 0), 0);
