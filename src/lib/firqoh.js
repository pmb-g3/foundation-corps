// Susunan anggota firqoh yang sedang berlaku (sama dengan aturan server di Jadwal.gs).

/** Siklus diterapkan terbaru yang belum berakhir — perubahan anggota manual ikut disimpan ke siklus ini. */
export function siklusSasaran(info) {
  const hari = info?.hari_ini || '';
  const s = (info?.siklus || [])
    .filter((x) => x.status === 'Diterapkan')
    .sort((a, b) => (a.tanggal_mulai < b.tanggal_mulai ? 1 : -1))[0];
  return s && s.tanggal_selesai >= hari ? s : null;
}

/**
 * Anggota firqoh saat ini: hasil undian siklus sasaran, atau "anggota tetap" (tanpa siklus)
 * yang diisi manual sebelum ada undian. Diurutkan menurut putaran_ke.
 */
export function anggotaSaatIni(info) {
  const siklus = siklusSasaran(info);
  const semua = info?.anggota || [];
  const dariSiklus = siklus ? semua.filter((a) => a.siklus_id === siklus.id) : [];
  const baris = (dariSiklus.length ? dariSiklus : semua.filter((a) => !a.siklus_id)).sort(
    (a, b) => (Number(a.putaran_ke) || 0) - (Number(b.putaran_ke) || 0)
  );
  return { siklus, baris };
}
