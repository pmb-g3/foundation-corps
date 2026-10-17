// PDF berkop FOUNDATION Corps (F-60), dibuat di browser dari data yang sedang tampil.
// File ini HANYA dimuat saat tombol PDF ditekan (import dinamis) — tidak membebani beranda.
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { tanggal, hariIniWib } from './format.js';
import { hijriah } from './hijriah.js';

const HIJAU = [31, 61, 43];
const EMAS = [201, 162, 74];
const REDUP = [107, 103, 92];
const KREM = [245, 239, 227];

function kop(doc, judul, subjudul) {
  const lebar = doc.internal.pageSize.getWidth();
  doc.setFillColor(...HIJAU);
  doc.rect(0, 0, lebar, 26, 'F');
  doc.setTextColor(...KREM);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FOUNDATION Corps', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...EMAS);
  doc.text('GONTOR CAMPUS 3', 14, 18);
  const hari = hariIniWib();
  doc.setTextColor(...KREM);
  doc.setFontSize(8);
  doc.text(`Dicetak ${tanggal(hari)}`, lebar - 14, 12, { align: 'right' });
  doc.setTextColor(...EMAS);
  doc.text(hijriah(hari), lebar - 14, 18, { align: 'right' });
  doc.setDrawColor(...EMAS);
  doc.setLineWidth(0.6);
  doc.line(0, 26, lebar, 26);

  doc.setTextColor(28, 28, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(judul, 14, 38);
  let y = 38;
  if (subjudul) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...REDUP);
    y += 6;
    doc.text(subjudul, 14, y);
  }
  return y + 6;
}

function kaki(doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(228, 220, 203);
    doc.line(14, h - 12, w - 14, h - 12);
    doc.setFontSize(7.5);
    doc.setTextColor(...REDUP);
    doc.text('FOUNDATION Corps · Gontor Campus 3', 14, h - 7);
    doc.text(`Halaman ${i} dari ${total}`, w - 14, h - 7, { align: 'right' });
  }
}

/**
 * @param {object} o
 * @param {string} o.judul
 * @param {string} [o.subjudul]
 * @param {Array<[string,string]>} [o.ringkasan]  pasangan label–nilai di bawah judul
 * @param {Array<{judul?:string, kepala:Array<Array<string|object>>, badan:Array<Array<string>>, kaki?:Array<string>, kolomKanan?:number[]}>} o.tabel
 * @param {string} o.namaBerkas
 * @param {boolean} [o.lanskap]
 */
export function buatPdf({ judul, subjudul, ringkasan = [], tabel = [], namaBerkas, lanskap = false }) {
  const doc = new jsPDF({ orientation: lanskap ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  let y = kop(doc, judul, subjudul);

  if (ringkasan.length) {
    const lebar = doc.internal.pageSize.getWidth() - 28;
    const kolom = Math.min(4, ringkasan.length);
    const lk = lebar / kolom;
    ringkasan.forEach(([label, nilai], i) => {
      const cx = 14 + (i % kolom) * lk;
      const cy = y + Math.floor(i / kolom) * 16;
      doc.setFontSize(7);
      doc.setTextColor(...REDUP);
      doc.text(String(label).toUpperCase(), cx, cy + 4);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...HIJAU);
      doc.text(String(nilai), cx, cy + 10);
      doc.setFont('helvetica', 'normal');
    });
    y += Math.ceil(ringkasan.length / kolom) * 16 + 2;
  }

  const gaya = {
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, lineColor: [228, 220, 203], lineWidth: 0.1, textColor: [28, 28, 26] },
    headStyles: { fillColor: HIJAU, textColor: KREM, fontStyle: 'bold', halign: 'left' },
    footStyles: { fillColor: [249, 243, 231], textColor: HIJAU, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 248, 241] },
    margin: { left: 14, right: 14, top: 20, bottom: 16 }
  };

  tabel.forEach((t) => {
    if (t.judul) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...HIJAU);
      doc.text(t.judul, 14, y + 4);
      doc.setFont('helvetica', 'normal');
      y += 7;
    }
    const kolomStyles = {};
    (t.kolomKanan || []).forEach((i) => {
      kolomStyles[i] = { halign: 'right' };
    });
    // > 200 baris → satu halaman per 25 baris (F-21)
    const potongan = t.badan.length > 200 ? Array.from({ length: Math.ceil(t.badan.length / 25) }, (_, i) => t.badan.slice(i * 25, i * 25 + 25)) : [t.badan];
    potongan.forEach((badan, i) => {
      if (i > 0) {
        doc.addPage();
        y = 20;
      }
      autoTable(doc, {
        ...gaya,
        startY: y,
        head: t.kepala,
        body: badan,
        foot: i === potongan.length - 1 && t.kaki ? [t.kaki] : undefined,
        columnStyles: kolomStyles,
        showFoot: 'lastPage'
      });
      y = doc.lastAutoTable.finalY + 8;
    });
  });

  kaki(doc);
  doc.save(`${namaBerkas || 'foundation-corps'}.pdf`);
}
