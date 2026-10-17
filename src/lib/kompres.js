// Kompres foto di browser sebelum diunggah (PRD 4.3 & 6.5):
// WebP ±80%, sisi terpanjang 1.920 px (foto besar) atau 1.200 px, + versi 480 px; target < 300 KB.

const TARGET_BYTE = 300 * 1024;

async function bacaGambar(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* lanjut ke cara lama */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Berkas bukan gambar yang bisa dibaca.'));
    img.src = URL.createObjectURL(file);
  });
}

function kanvas(sumber, sisiMaks) {
  const w0 = sumber.width;
  const h0 = sumber.height;
  const skala = Math.min(1, sisiMaks / Math.max(w0, h0));
  const w = Math.round(w0 * skala);
  const h = Math.round(h0 * skala);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sumber, 0, 0, w, h);
  return c;
}

const keBlob = (c, tipe, mutu) => new Promise((r) => c.toBlob(r, tipe, mutu));

function keBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

async function simpanKecil(c, batas) {
  // Safari lama tidak bisa membuat WebP → otomatis JPEG
  let tipe = 'image/webp';
  let mutu = 0.8;
  let blob = await keBlob(c, tipe, mutu);
  if (!blob || blob.type !== 'image/webp') {
    tipe = 'image/jpeg';
    blob = await keBlob(c, tipe, mutu);
  }
  while (blob.size > batas && mutu > 0.5) {
    mutu -= 0.1;
    blob = await keBlob(c, tipe, mutu);
  }
  return { blob, tipe };
}

/**
 * @param {File} file
 * @param {'besar'|'biasa'} jenis  besar = hero/drone/denah (1.920 px), biasa = 1.200 px
 * @returns {Promise<{tipe, besar:{base64,lebar,tinggi,ukuran}, kecil:{base64,ukuran}, pratinjau:string}>}
 */
export async function kompresFoto(file, jenis = 'biasa') {
  if (!file || !/^image\//.test(file.type)) throw new Error('Pilih berkas gambar (JPG, PNG, WebP, HEIC).');
  const gambar = await bacaGambar(file);
  const cBesar = kanvas(gambar, jenis === 'besar' ? 1920 : 1200);
  const cKecil = kanvas(gambar, 480);
  const besar = await simpanKecil(cBesar, TARGET_BYTE);
  const kecil = await simpanKecil(cKecil, 60 * 1024);
  if (gambar.close) gambar.close();
  return {
    tipe: besar.tipe,
    besar: { base64: await keBase64(besar.blob), lebar: cBesar.width, tinggi: cBesar.height, ukuran: besar.blob.size },
    kecil: { base64: await keBase64(kecil.blob), ukuran: kecil.blob.size },
    pratinjau: URL.createObjectURL(kecil.blob)
  };
}
