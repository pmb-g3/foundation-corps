// Transisi foto kartu sektor → header halaman sektor (F-04, PRD 7.2 "foto mengembang").
// Kartu mencatat posisinya di layar sebelum pindah halaman; header memakainya sekali.
let catatan = null;

export function catatTransisi(el, fotoId, sektor) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  catatan = { rect: { top: r.top, left: r.left, width: r.width, height: r.height }, fotoId, sektor, waktu: Date.now() };
}

export function ambilTransisi(sektor) {
  const t = catatan;
  catatan = null;
  return t && t.sektor === sektor && Date.now() - t.waktu < 4000 ? t : null;
}
