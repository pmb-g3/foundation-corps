/** Gabungkan nama kelas, abaikan nilai kosong/false. */
export function cn(...kelas) {
  return kelas.filter(Boolean).join(' ');
}
