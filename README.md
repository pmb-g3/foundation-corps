# FOUNDATION Corps — Gontor Campus 3

Website publik + panel admin Yayasan Gontor Campus 3: jadwal Subuh Berkah, undian firqoh, kalender kegiatan,
dan data empat sektor (Pertanian & Perikanan, Pertanahan, Kendaraan, Pembangunan) lengkap dengan peta interaktif.

- **Frontend**: React 19 + Vite + Tailwind CSS 4 + Motion — folder ini, tayang di GitHub Pages.
- **Backend**: Google Apps Script (JSON API) + Google Sheets + Google Drive — berkas `.gs` terpisah, **tidak** ada di repo ini.

📘 Langkah pasang dari nol: **[PANDUAN-INSTALASI.md](PANDUAN-INSTALASI.md)**
🎨 Catatan desain & komponen: **[DESIGN.md](DESIGN.md)**

## Satu-satunya pengaturan

`public/config.js` → isi `GAS_URL` dengan URL Web App Apps Script (berakhiran `/exec`).

## Terbit otomatis

Setiap `git push` ke branch `main` menjalankan `.github/workflows/deploy.yml`:
`npm ci` → `npm run build` (sekaligus cek JS awal beranda < 200 KB) → terbit ke GitHub Pages.
Di GitHub: **Settings → Pages → Source: GitHub Actions**.

## Menjalankan di komputer (opsional, untuk pengembang)

Butuh Node.js 20.19+ (disarankan 22).

```bash
npm install
```

```bash
npm run dev
```

## Struktur

```
index.html            halaman utama (memuat config.js & meminta data beranda lebih awal)
public/config.js      alamat server (GAS_URL)
public/media/         foto bawaan: drone hero, foto udara kolam & sawah, peta tanah, denah gedung
src/lib/              api, auth, router, format, foto, peta tanah, budidaya, pdf, excel
src/components/       ui, layout, grafik, peta (PetaFoto, PetaKolam), kalender, data
src/pages/beranda/    hero, jadwal hari ini, program, sektor, kalender, staf
src/pages/sektor/     halaman sektor + peta tanah, kolam, zona tanaman, denah bangunan
src/pages/admin/      panel admin (A-01 … A-12)
scripts/cek-ukuran.mjs  cek ukuran JS awal setelah build
```
