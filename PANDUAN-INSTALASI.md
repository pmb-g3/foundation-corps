# Panduan Instalasi FOUNDATION Corps (untuk pemula)

Website FOUNDATION Corps terdiri dari dua bagian:

| Bagian | Tempat | Isi |
| --- | --- | --- |
| **Backend** (server data) | Google Apps Script + Google Sheets + Google Drive | 10 berkas `.gs` + `appsscript.json` |
| **Frontend** (tampilan website) | GitHub Pages (gratis) | isi `foundation-corps.zip` |

Kerjakan **berurutan**: Bagian A dulu (karena alamat server dari Bagian A dibutuhkan di Bagian B), lalu Bagian B, lalu Bagian C.
Perkiraan waktu: A ±20 menit, B ±30 menit, C ±15 menit.

---

## Isi paket

| Berkas | Untuk apa |
| --- | --- |
| `foundation-corps.zip` | Seluruh kode website. Setelah diekstrak, folder ini yang diunggah ke GitHub. |
| `Kode.gs`, `Config.gs`, `Util.gs`, `Setup.gs`, `Auth.gs`, `Data.gs`, `Jadwal.gs`, `WA.gs`, `Media.gs`, `Peta.gs` | Kode backend, **disalin-tempel** ke editor Apps Script. Tidak masuk GitHub. |
| `appsscript.json` | Pengaturan proyek Apps Script (zona waktu, izin Web App). |
| `PANDUAN-INSTALASI.md` | Panduan ini (salinannya juga ada di dalam ZIP). |

### Istilah singkat

- **Repository (repo)**: folder proyek yang disimpan di GitHub.
- **Commit**: "simpan versi" perubahan di komputer Anda.
- **Push**: kirim commit dari komputer ke GitHub.
- **Branch `main`**: jalur utama kode. Setiap push ke `main` otomatis membangun ulang website.
- **Web App / URL `/exec`**: alamat server Apps Script yang dihubungi website.
- **Token**: kata sandi khusus untuk program (GitHub, Fonnte). Simpan baik-baik, jangan dibagikan.

---

## Bagian A — Pasang backend (Google Apps Script)

> 💡 Pakai akun Google yang akan menjadi **pemilik data** (spreadsheet & foto). Akun Gmail pribadi paling aman. Akun Google Workspace kantor kadang melarang berbagi file ke publik, sehingga foto tidak tampil untuk pengunjung.

### A1. Buat proyek Apps Script

1. Buka **https://script.google.com** → klik **Proyek baru**.
2. Klik judul "Proyek tanpa judul" di kiri atas → ganti menjadi `FOUNDATION Corps API` → **Ganti nama**.

### A2. Tempel `appsscript.json`

1. Klik ikon ⚙️ **Setelan proyek** (menu kiri).
2. Centang **"Tampilkan file manifes 'appsscript.json' di editor"**.
3. Kembali ke ikon **< > Editor**. Sekarang ada berkas `appsscript.json` di daftar berkas.
4. Buka `appsscript.json` dari paket dengan Notepad → **Ctrl+A**, **Ctrl+C**.
5. Di editor Apps Script, klik `appsscript.json` → **Ctrl+A** → **Ctrl+V** (isi lama tertimpa) → **Ctrl+S**.

### A3. Tempel 10 berkas `.gs`

1. Berkas bawaan bernama `Kode.gs` (atau `Code.gs`). Bila namanya `Code.gs`, klik titik tiga di sampingnya → **Ganti nama** → `Kode`.
2. Buka `Kode.gs` dari paket dengan Notepad → **Ctrl+A**, **Ctrl+C** → di editor, klik `Kode.gs` → **Ctrl+A** → **Ctrl+V**.
3. Untuk berkas lain: klik **+** (Tambah berkas) → **Skrip** → ketik namanya **tanpa** `.gs` (editor menambahkannya sendiri) → tempel isinya.
   Ulangi untuk: `Config`, `Util`, `Setup`, `Auth`, `Data`, `Jadwal`, `WA`, `Media`, `Peta`.
4. Tekan **Ctrl+S**. Pastikan di daftar berkas ada **10 berkas `.gs` + `appsscript.json`**, tanpa tanda error merah.

> ✅ **Cek:** nama berkas harus persis (huruf besar-kecil boleh sama seperti di paket). Urutan berkas di daftar tidak berpengaruh.

### A4. Jalankan `setup()` (sekali saja)

1. Klik berkas `Setup.gs`.
2. Di bilah atas, pada pilihan fungsi, pilih **`setup`** → klik **▷ Jalankan**.
3. Muncul **"Otorisasi diperlukan"** → **Tinjau izin** → pilih akun Google Anda.
4. Muncul **"Google belum memverifikasi aplikasi ini"** — ini **normal** karena skrip buatan sendiri. Klik **Lanjutan** → **Buka FOUNDATION Corps API (tidak aman)** → **Izinkan**.
5. Tunggu ±1 menit sampai **Log eksekusi** menampilkan `SETUP SELESAI`.

### A5. Catat hasil setup

Di **Log eksekusi** akan tampil:

```
Spreadsheet : https://docs.google.com/spreadsheets/d/....
Folder Drive: https://drive.google.com/drive/folders/....
🔑 AKUN ADMIN UTAMA (catat sekarang, sandi hanya tampil sekali):
   Username : admin
   Sandi    : xxxxxxxxxx
```

> ⚠️ **Salin sandi admin sekarang** (misalnya ke catatan HP). Sandi ini hanya tampil sekali. Kalau terlanjur hilang, jalankan fungsi `resetSandiAdmin` (cara sama seperti `setup`).

Setup otomatis membuat spreadsheet `DB_FOUNDATION_CORPS`, folder `FOUNDATION_CORPS_MEDIA`, data awal (firqoh, program unggulan, genset, peta tanah, kolam, zona tanaman, 57 bangunan), data **contoh** untuk uji coba, akun admin, dan trigger harian (pengingat WA & backup).

### A6. Terbitkan sebagai Web App

1. Klik tombol biru **Terapkan** (kanan atas) → **Deployment baru**.
2. Klik ikon ⚙️ di samping "Pilih jenis" → **Aplikasi web**.
3. Isi:

   | Kolom | Nilai |
   | --- | --- |
   | Deskripsi | `v1` |
   | Jalankan sebagai | **Saya** (email Anda) |
   | Yang memiliki akses | **Siapa saja** |

4. Klik **Terapkan** → bila diminta, izinkan lagi seperti A4.
5. Salin **URL Aplikasi web** — bentuknya `https://script.google.com/macros/s/AKfy..../exec`.
   Simpan di Notepad; dipakai di Bagian B.

### A7. Uji server

Buka di browser: URL tadi + `?action=ping`, misalnya
`https://script.google.com/macros/s/AKfy..../exec?action=ping`

✅ Berhasil bila tampil teks seperti `{"success":true,"data":{"versi":...,"siap":true}}`.

> ⚠️ Pakai URL yang berakhiran **`/exec`**, bukan `/dev`. URL `/dev` hanya bisa dibuka oleh Anda sendiri.

---

## Bagian B — Terbitkan website ke GitHub Pages

> ⚠️ **Jangan** memakai tombol "Add file → Upload files" di situs GitHub. Cara itu merusak struktur folder dan website tidak akan jalan. Selalu lewat terminal seperti di bawah.

### B1. Pasang Git (sekali per komputer)

1. Unduh dari **https://git-scm.com/download/win** → pasang dengan pilihan bawaan (Next terus).
2. Buka **PowerShell** dari menu Start, ketik:

   ```bash
   git --version
   ```

   ✅ Muncul `git version 2.xx...`.

### B2. Akun GitHub

Daftar di **https://github.com** bila belum punya. Username akan menjadi bagian alamat website: `https://USERNAME.github.io/...`.

### B3. Kenalkan identitas ke Git (sekali per komputer)

```bash
git config --global user.name "Nama Anda"
```

```bash
git config --global user.email "email-akun-github@contoh.com"
```

`user.name` hanya label riwayat (bebas). Email sebaiknya sama dengan akun GitHub.

### B4. Buat repository kosong di GitHub

1. Di github.com klik **+** (kanan atas) → **New repository**.
2. **Repository name**: `foundation-corps` (boleh nama lain, huruf kecil tanpa spasi).
3. Pilih **Public** (GitHub Pages gratis hanya untuk repo publik; aman — tidak ada kata sandi di kode website).
4. **Jangan** centang README, .gitignore, atau license.
5. Klik **Create repository**. Biarkan halaman itu terbuka (alamat repo dipakai di B8).

### B5. Ekstrak ZIP ke folder kerja

1. Klik kanan `foundation-corps.zip` → **Extract All...** → tujuan misalnya `C:\Users\NAMA-ANDA\Documents\foundation-corps` → **Extract**.
2. Buka folder hasil ekstrak. **Folder yang benar** adalah folder yang **langsung** berisi `index.html` dan `package.json`:

   ```
   foundation-corps\            ← ✅ git init dijalankan DI SINI
   ├── .github\workflows\deploy.yml
   ├── public\   (config.js, favicon.svg, media\)
   ├── scripts\
   ├── src\
   ├── DESIGN.md
   ├── index.html
   ├── package.json
   ├── package-lock.json
   ├── PANDUAN-INSTALASI.md
   ├── README.md
   └── vite.config.js
   ```

   Bila di dalamnya masih ada folder `foundation-corps` lagi, masuklah satu tingkat dulu.

### B6. Isi alamat server di `public\config.js`

1. Buka `public\config.js` dengan **Notepad**.
2. Ganti `https://script.google.com/macros/s/XXXX/exec` dengan URL `/exec` dari A6 (tetap di antara tanda kutip):

   ```js
   window.FC_CONFIG = {
     GAS_URL: 'https://script.google.com/macros/s/AKfy..../exec'
   };
   ```

3. Simpan (**Ctrl+S**).

### B7. Buka PowerShell di folder kerja dan periksa isinya

1. Di File Explorer, buka folder `foundation-corps` (yang berisi `index.html`).
2. Klik bilah alamat (address bar) → ketik `powershell` → **Enter**. PowerShell terbuka tepat di folder itu.
3. Ketik:

   ```bash
   dir
   ```

   ✅ Harus terlihat `index.html`, `package.json`, `src`, `public`, `.github`.
   ❌ Bila yang terlihat hanya satu folder `foundation-corps`, ketik `cd foundation-corps` lalu `dir` lagi. **Jangan lanjut sebelum `index.html` terlihat.**

### B8. Kirim kode ke GitHub (satu per satu, cek hasil tiap langkah)

```bash
git init
```

Hasil normal: `Initialized empty Git repository in ...`

```bash
git add .
```

(Ada **titik** di akhir.) Hasil normal: diam saja, atau peringatan `LF will be replaced by CRLF` — aman diabaikan.

```bash
git commit -m "Upload pertama"
```

Hasil normal: daftar berkas `create mode 100644 ...`.

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/USERNAME/foundation-corps.git
```

Ganti `USERNAME` (dan nama repo bila berbeda). Alamat ini ada di halaman repo dari B4.

```bash
git push -u origin main
```

**Saat diminta masuk:**

- Biasanya muncul jendela **"Connect to GitHub"** → pilih **Sign in with your browser** → login → **Authorize**. Selesai, tidak perlu token.
- Bila terminal meminta *Username* dan *Password*: username = username GitHub; password = **Personal Access Token** (bukan sandi akun). Cara membuat token:
  1. Buka **https://github.com/settings/tokens** → **Generate new token** → **Generate new token (classic)**.
  2. Note: `foundation-corps`; Expiration: `90 days`.
  3. Centang **`repo`** dan **`workflow`** (wajib keduanya — `workflow` diperlukan karena paket berisi berkas `.github/workflows/deploy.yml`).
  4. **Generate token** → salin token `ghp_...` (hanya tampil sekali).
  5. Tempel sebagai password. **Layar memang tidak menampilkan apa-apa saat menempel** — itu normal. Tekan Enter.

✅ Berhasil bila muncul `Writing objects: 100%` dan `* [new branch] main -> main`.

### B9. Aktifkan GitHub Pages (sumber: GitHub Actions)

Website React ini perlu "dibangun" dulu sebelum tayang. Pembangunan dilakukan otomatis oleh **GitHub Actions** setiap kali Anda push.

1. Di halaman repo GitHub: **Settings** → menu kiri **Pages**.
2. Pada **Build and deployment → Source**, pilih **GitHub Actions** (bukan "Deploy from a branch").
3. Buka tab **Actions** di repo. Workflow **"Terbitkan ke GitHub Pages"** dari push pertama kemungkinan **gagal ❌** karena Pages tadi belum aktif — itu wajar. Klik workflow tersebut → **Re-run all jobs**.
4. Tunggu 2–3 menit sampai centang hijau ✅ pada **build** dan **deploy**.
5. Alamat website tampil di kotak **deploy** dan di **Settings → Pages**:
   `https://USERNAME.github.io/foundation-corps/`

### B10. Buka website

Buka alamat tadi. ✅ Beranda tampil dengan foto drone pondok, jadwal Subuh Berkah, dan kartu sektor.

Bila muncul pesan **"Website belum terhubung ke server"**, periksa kembali `public\config.js` (B6), lalu kirim ulang (lihat Bagian D).

---

## Bagian C — Setelah website online

### C1. Masuk panel admin & ganti sandi

1. Di website, klik **Masuk** (kanan atas).
2. Username `admin`, sandi dari A5.
3. Di panel kiri bawah, klik **Sandi** → ganti dengan sandi baru (minimal 8 karakter).

### C2. Hapus data contoh sebelum diumumkan

Setup mengisi data **contoh** (staf "Ust. Contoh", keuangan, kendaraan, dll.) agar semua halaman bisa dicoba.
Setelah selesai mencoba:

1. Di editor Apps Script, pilih fungsi **`hapusDataContoh`** → **▷ Jalankan**.
2. Data asli tetap ada: firqoh, program unggulan, genset, parameter budidaya, zona & lokasi tanah, kolam, zona tanaman, 57 bangunan, akun admin.
3. Isi staf asli lewat panel **Pengguna & Staf**, lalu lakukan **Undian Firqoh**.

### C3. WhatsApp otomatis (Fonnte) — kirim ke grup

1. Daftar di **https://fonnte.com** → hubungkan nomor WhatsApp pengirim (pindai QR di menu *Device*).
2. Salin **token** device → panel **WhatsApp** → kotak **Token Fonnte** → **Simpan**.
3. Masukkan nomor pengirim Fonnte ke **grup WhatsApp** staf (sebagai anggota).
4. Di panel **WhatsApp → Tujuan pengiriman**: pilih **Grup WhatsApp** → klik **Perbarui dari WhatsApp** (**sekali saja**; menurut Fonnte terlalu sering bisa membuat nomor diblokir) → klik **Ambil daftar grup** → pilih grupnya.
5. Klik **Uji kirim ke grup** → cek pesan masuk di grup.
6. Klik **Simpan pengaturan WA**. Pengingat malam (bawaan 20.00 WIB) dan pesan konsekuensi kini dikirim **satu pesan ke grup**.
   Pilihan lain: **Personal satu-satu** (ke nomor tiap staf) atau **Keduanya**.

### C4. Akun Kepala Bagian (opsional)

Panel **Pengguna & Staf** → tambah pengguna dengan peran **Kepala Bagian** dan pilih sektornya. Kepala Bagian hanya bisa mengubah data sektornya.

### C5. Rapikan peta

Poligon tanah, kolam, dan zona tanaman dibuat dari gambar dokumen pondok (perkiraan). Rapikan di **Editor Zona**:
- **Zona Tanah** → pilih lokasi → ✏️ gambar ulang / ubah nama & luas; foto lokasi baru bisa ditambahkan di panel *Lokasi peta*.
- **Zona Tanaman & Pin** dan **Bilik Kolam** → ✏️ gambar ulang bentuknya.
- **Nomor Bangunan** → pilih bangunan lalu ketuk posisinya di denah.

---

## Bagian D — Cara memperbarui

### Mengubah tampilan / kode website

Dari PowerShell di folder `foundation-corps` (yang berisi `index.html`):

```bash
git add .
```

```bash
git commit -m "Tulis singkat perubahannya"
```

```bash
git push
```

GitHub Actions membangun ulang otomatis (2–3 menit, pantau di tab **Actions**). Bila halaman masih versi lama, tekan **Ctrl+Shift+R**.

> Isi website sehari-hari (jadwal, staf, data sektor, foto, teks beranda) **tidak** perlu push — cukup diubah dari panel admin.

### Mengubah kode backend (`.gs`)

1. Tempel berkas `.gs` yang baru di editor Apps Script → **Ctrl+S**.
2. **Terapkan → Kelola deployment** → klik ✏️ pada deployment yang ada → **Versi: Versi baru** → **Terapkan**.
   (Jangan membuat "Deployment baru" — URL `/exec` akan berganti dan `config.js` harus diubah lagi.)
3. Bila pembaruan menambah kolom/pengaturan, jalankan fungsi **`perbaikiStruktur`** sekali.
4. Khusus database yang dibuat **sebelum** data peta tersedia: jalankan **`isiPetaBawaan`** sekali.

---

## Masalah umum

| Yang terlihat | Penyebab | Solusi |
| --- | --- | --- |
| Halaman GitHub **404 File not found** | Pages belum aktif / build belum selesai, atau folder yang di-push salah (di repo terlihat folder `foundation-corps` alih-alih `index.html`) | Cek B9 dan tab Actions. Bila folder salah: masuk ke folder yang berisi `index.html`, lalu `git init`, `git add .`, `git commit -m "Perbaiki folder"`, `git branch -M main`, `git remote add origin URL-REPO`, `git push -u origin main --force` (menimpa isi repo yang salah). |
| Tab Actions ❌ di langkah **Siapkan Pages** | Source Pages belum "GitHub Actions" | B9 langkah 2, lalu **Re-run all jobs**. |
| Tab Actions ❌ di langkah **Pasang paket** | `package-lock.json` tidak ikut terkirim | Pastikan berkas itu ada di folder, lalu push ulang. |
| `refusing to allow a Personal Access Token ... without workflow scope` | Token tidak mencentang `workflow` | Buat token baru dengan **repo** + **workflow** (B8). |
| `Password authentication is not supported` | Memakai sandi akun GitHub | Pakai Personal Access Token (B8). |
| `remote origin already exists` | Langkah `git remote add` sudah pernah dijalankan | Lewati, atau `git remote set-url origin URL-REPO`. |
| Website tampil tapi muncul **"Website belum terhubung ke server"** | `GAS_URL` masih `XXXX` atau salah | Perbaiki `public\config.js` (harus berakhiran `/exec`), lalu push. |
| **Data gagal dimuat** / error CORS di Console (F12) | Akses Web App bukan "Siapa saja", memakai URL `/dev`, atau kode `.gs` diubah tanpa versi baru | Ulangi A6 / Bagian D (Kelola deployment → Versi baru). |
| Foto unggahan tidak tampil untuk pengunjung | Akun Google Workspace melarang berbagi publik | Minta admin Workspace mengizinkan, atau pakai akun Gmail pribadi. |
| Lupa sandi admin | — | Jalankan `resetSandiAdmin` di editor Apps Script; sandi baru tampil di log. |
| Log WA berstatus `TOKEN_KOSONG` | Token Fonnte belum diisi | C3 langkah 2. |
| Log WA berstatus `GRUP_KOSONG` | Mode grup tetapi grup belum dipilih | C3 langkah 4–6. |
| Log WA berstatus `GAGAL: ...` | Device Fonnte terputus, kuota habis, atau token salah | Cek status device & kuota di dashboard Fonnte; simpan ulang token bila perlu. |
| Daftar grup kosong | Daftar grup di Fonnte belum diperbarui / nomor belum masuk grup | Masukkan nomor ke grup → **Perbarui dari WhatsApp** sekali → **Ambil daftar grup**. |
