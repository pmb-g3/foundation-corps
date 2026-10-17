// Excel (F-58) — SheetJS dimuat HANYA saat menu Impor Excel dipakai.
import * as XLSX from 'xlsx';

const pad = (n) => String(n).padStart(2, '0');

function nilaiSel(v) {
  if (v instanceof Date) {
    const ada = v.getHours() || v.getMinutes();
    const t = `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
    return ada ? `${t}T${pad(v.getHours())}:${pad(v.getMinutes())}` : t;
  }
  return v;
}

/** Baca lembar pertama .xlsx → array objek (judul kolom = baris pertama). */
export async function bacaExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
  return rows
    .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [String(k).trim(), nilaiSel(v)])))
    .filter((r) => Object.values(r).some((v) => String(v).trim() !== ''));
}

/** Template .xlsx: lembar "Data" (judul = nama kolom) + lembar "Petunjuk". dataSaatIni → isi dengan id agar bisa diperbarui. */
export function unduhTemplate(namaSheet, skema, dataSaatIni) {
  const kolom = skema.kolom.filter((d) => !d.otomatis && d.tipe !== 'foto' && d.tipe !== 'foto_banyak');
  const kepala = [...(dataSaatIni ? ['id'] : []), ...kolom.map((d) => d.nama)];
  const isi = dataSaatIni
    ? dataSaatIni.map((r) => kepala.map((k) => (r[k] === null || r[k] === undefined ? '' : typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])))
    : [];
  const wsData = XLSX.utils.aoa_to_sheet([kepala, ...isi]);
  wsData['!cols'] = kepala.map((k) => ({ wch: Math.max(12, k.length + 4) }));
  const petunjuk = [
    ['Kolom', 'Keterangan', 'Wajib', 'Format / pilihan'],
    ...kolom.map((d) => [
      d.nama,
      d.label,
      d.wajib ? 'Ya' : '',
      d.tipe === 'pilihan'
        ? d.pilihan.join(' / ')
        : { tanggal: 'yyyy-mm-dd atau dd/mm/yyyy', waktu: 'yyyy-mm-dd jj:mm', jam: 'jj:mm', uang: 'angka (Rp)', angka: 'angka', persen: '0–100', bool: 'TRUE / FALSE', ref: `id dari tabel ${d.ref}`, json: 'JSON' }[d.tipe] || 'teks'
    ]),
    [],
    ['Catatan', 'Baris dengan id (atau nilai kolom unik) yang sudah ada akan DIPERBARUI; baris lain DITAMBAHKAN.']
  ];
  const wsPetunjuk = XLSX.utils.aoa_to_sheet(petunjuk);
  wsPetunjuk['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 8 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, 'Data');
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');
  XLSX.writeFile(wb, `template-${namaSheet}${dataSaatIni ? '-data' : ''}.xlsx`);
}
