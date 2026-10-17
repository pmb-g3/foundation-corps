# DESIGN.md — FOUNDATION Corps (Gontor Campus 3)

Catatan desain hasil build (PRD Lampiran C). Unggah file ini bersama PRD dan kode saat meminta perubahan tampilan.

## 1. Gaya: Elegan Alami

Tenang, berwibawa, hangat seperti jurnal botani: latar krem, hijau tua, aksen emas tipis, banyak ruang kosong.

### Warna (token di `src/index.css`, bisa diganti Admin lewat Editor Layout)

| Token Tailwind | Nilai awal | Pemakaian |
| --- | --- | --- |
| `hijau` | `#1F3D2B` | Header gelap, tombol utama, bagian gelap, footer |
| `daun` | `#3E6B4A` | Aksen, grafik pemasukan, bilik Lele |
| `krem` | `#F5EFE3` | Latar utama |
| `gading` | `#FBF8F1` | Permukaan kartu |
| `emas` | `#C9A24A` | Garis tipis, ikon, cincin "hari ini", sorotan (bukan untuk teks kecil) |
| `emas-tua` | `#7A5C14` | Teks emas di latar terang (kontras AA) — dihitung otomatis dari `emas` |
| `tinta` | `#1C1C1A` | Teks utama |
| `redup` | `#6B675C` | Teks pendukung |
| `garis` | `#E4DCCB` | Garis & batas |
| `bata` | `#A8432F` | Rusak, Konsekuensi, pengeluaran |
| `kayu` / `batu` | `#8A5A35` / `#4F6D7A` | Kategori Pembangunan / Kendaraan, bilik Nila |

Catatan aksesibilitas warna (diuji dengan validator palet):
- Pasangan pemasukan (daun) vs pengeluaran (bata) dan lima warna kategori kalender **tidak cukup berbeda bagi buta warna**. Karena warnanya ditetapkan PRD, dipakai pengenal kedua: arsir pada batang pengeluaran, legenda + label, ikon per kategori kalender, huruf L/N pada bilik kolam.
- Emas (`#C9A24A`) hanya untuk garis/ikon/aksen; teks emas memakai `emas-tua`.

### Huruf
- Judul & angka penting: **Fraunces** (serif). PRD menetapkan Fraunces; DESIGN.md Stitch menyebut Newsreader → diikuti PRD.
- Isi, tabel, tombol: **Plus Jakarta Sans**.
- Pilihan lain di Editor Layout: Newsreader, Playfair Display, Lora (judul); Inter, DM Sans, Nunito Sans (isi).

### Bentuk & kedalaman
- Kartu: sudut 20 px (`rounded-kartu`), latar gading, garis 1 px `garis`.
- Tombol, chip, lencana: pil penuh. Isian: sudut 12 px (`rounded-isian`).
- Bayangan bernuansa hijau: `shadow-angkat` (0 8 24 / 8%), `shadow-modal` (0 16 40 / 14%).
- Area sentuh minimal 44 px.

## 2. Tata letak
- Lebar maksimum 1.280 px (`wadah`), bantalan 20 px (HP) / 32 px (laptop).
- Beranda: Hero → Jadwal + Program → Sektor (bento) → Kalender → Staf → Footer. Urutan/tampil/varian diatur Editor Layout.
- Halaman sektor: header foto 72% tinggi layar, sub-navigasi menempel (laptop), indikator gulir (HP).

## 3. Animasi (Motion)
- `LazyMotion` + komponen `m`; fitur `domMax` dimuat terpisah setelah halaman tampil (dibutuhkan layout/drag).
- Muncul saat digulir: fade + naik 24 px, anak bergiliran 60–80 ms (`lib/motion.jsx`).
- Hero: parallax pelan + judul per huruf. Kartu sektor → header: foto "mengembang" (clip-path).
- Pertanahan: pilih lokasi (kartu geser), garis zona tergambar bertahap saat peta terlihat; drone → peta datar dikendalikan gulir bila lokasi punya foto drone sejajar.
- Kolam: permukaan air beriak, bilik ≤ 14 hari panen berdenyut emas.
- Angka berhitung naik saat terlihat. Durasi 0,3–0,8 detik, tanpa pantulan berlebihan.
- "Kurangi gerakan" dihormati di seluruh situs (`MotionConfig reducedMotion="user"` + CSS).

## 4. Komponen kunci
| Komponen | Lokasi |
| --- | --- |
| Tombol, isian, dialog/laci, segmen, lencana, toast, foto lazy | `src/components/ui/` |
| Mesin peta foto (F-10, F-20, F-44, Editor Zona) | `src/components/peta/PetaFoto.jsx` |
| Peta tanah banyak lokasi (F-20) + rekap per lokasi | `src/pages/sektor/pertanahan/`, `src/lib/lokasiTanah.js` |
| Peta kolam di atas foto udara / denah otomatis (F-11) | `src/components/peta/PetaKolam.jsx`, `denahKolam.js` |
| Denah bangunan berkategori (F-44) | `src/pages/sektor/pembangunan/DenahBangunan.jsx`, `src/lib/bangunan.js` |
| Foto bawaan (`lokal:nama`) | `public/media/`, `src/lib/foto.js` |
| Grafik batang & garis (SVG sendiri) | `src/components/chart/` |
| Kalender (F-05, adaptasi ReUI) | `src/components/kalender/` |
| Footer beam wordmark (F-07) | `src/components/layout/Footer.jsx`, `footer.css` |

## 5. Anti-lemot (PRD 6.5)
- JS awal beranda ±113 KB gzip (batas 200 KB) — dicek otomatis tiap `npm run build`.
- Halaman sektor, panel admin, kalender, PDF (jsPDF), Excel (SheetJS) dimuat saat dibutuhkan.
- Foto: lazy ±300 px sebelum terlihat, placeholder blur, `srcset` 480/1.200/1.920 px, unggahan dikompres WebP.
- Data beranda diminta sebelum aplikasi selesai dimuat dan disimpan di perangkat untuk kunjungan ulang.

## 6. Peta & foto bawaan
- Peta ukur tanah (CAD) diwarnai ulang: latar hijau tua, garis terang (merah → emas, biru → biru muda), utara di atas.
- Warna zona tanah di atas peta gelap/foto: emas muda, hijau muda, biru muda, oranye kayu, ungu muda, bata muda, krem, toska (`WARNA_ZONA`). Pengenal kedua: nomor bidang di label & daftar.
- Kategori bangunan: 7 warna pastel (`lib/bangunan.js`), nomor hijau tua di dalam pin; di peta kecil (HP) pin jadi titik dan nomor muncul saat diperbesar.
- Hero: foto drone bawaan, titik fokus `56% 40%` (masjid).

## 7. Hal yang menunggu bahan dari tim
- Foto tanah yang belum ada → unggah per lokasi di Editor Zona → Zona Tanah (Lokasi peta), lalu rapikan poligonnya.
- Poligon bilik kolam → rapikan di Editor Zona → Bilik Kolam.
- Luas zona tanaman (Bedengan Sayur, Tanaman Polybag, Area Kerja & Rumah Bibit, Lahan Pengembangan) belum diisi; poligonnya perkiraan — rapikan di Editor Zona → Zona Tanaman & Pin.
- Foto sektor & staf → unggah lewat panel admin.
- Spesifikasi genset, SOP Kendaraan (di luar fase 1).
