// Skala & tick sederhana untuk grafik SVG buatan sendiri (tanpa library grafik).

/** Tick "rapi" (1, 2, 2.5, 5 × 10^n) yang mencakup [min, max]. */
export function tickRapi(min, max, jumlah = 4) {
  if (max === min) {
    max = min + 1;
  }
  const kasar = (max - min) / jumlah;
  const pangkat = Math.pow(10, Math.floor(Math.log10(kasar)));
  const pilihan = [1, 2, 2.5, 5, 10].map((x) => x * pangkat);
  const langkah = pilihan.find((p) => p >= kasar) || pilihan[pilihan.length - 1];
  const awal = Math.floor(min / langkah) * langkah;
  const akhir = Math.ceil(max / langkah) * langkah;
  const tick = [];
  for (let v = awal; v <= akhir + langkah / 2; v += langkah) tick.push(Math.round(v * 1e6) / 1e6);
  return { tick, min: awal, max: akhir };
}

export const skalaLinier = (d0, d1, r0, r1) => (v) => (d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0));

/** Kurva halus melewati titik (Catmull-Rom → Bézier), tidak melampaui titik secara berlebihan. */
export function jalurHalus(titik) {
  if (titik.length < 2) return '';
  let d = `M${titik[0][0]},${titik[0][1]}`;
  for (let i = 0; i < titik.length - 1; i++) {
    const p0 = titik[i - 1] || titik[i];
    const p1 = titik[i];
    const p2 = titik[i + 1];
    const p3 = titik[i + 2] || p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Bar dengan ujung data membulat 4 px, pangkal rata di garis dasar. */
export function jalurBatang(x, y0, lebar, y1, r = 4) {
  const atas = Math.min(y0, y1);
  const bawah = Math.max(y0, y1);
  const tinggi = bawah - atas;
  if (tinggi <= 0.5) return '';
  const rr = Math.min(r, lebar / 2, tinggi);
  if (y1 <= y0) {
    // naik dari garis dasar → ujung atas membulat
    return `M${x},${bawah} V${atas + rr} Q${x},${atas} ${x + rr},${atas} H${x + lebar - rr} Q${x + lebar},${atas} ${x + lebar},${atas + rr} V${bawah} Z`;
  }
  // nilai negatif → ujung bawah membulat
  return `M${x},${atas} V${bawah - rr} Q${x},${bawah} ${x + rr},${bawah} H${x + lebar - rr} Q${x + lebar},${bawah} ${x + lebar},${bawah - rr} V${atas} Z`;
}
