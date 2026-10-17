// ============================================================
// Komunikasi dengan backend Google Apps Script (JSON).
// GET  → data publik.  POST → aksi bertoken, Content-Type text/plain
// (agar tidak memicu CORS preflight yang ditolak GAS).
// ============================================================

const cfg = (typeof window !== 'undefined' && window.FC_CONFIG) || {};

function alamatServer() {
  // Hanya saat pengembangan lokal: boleh diarahkan ke server tiruan.
  if (import.meta.env.DEV) {
    try {
      const ganti = localStorage.getItem('fc_api_dev');
      if (ganti) return ganti;
    } catch {
      /* localStorage tidak tersedia */
    }
  }
  return cfg.GAS_URL || '';
}

export const GAS_URL = alamatServer();
export const apiSiap = !!GAS_URL && !GAS_URL.includes('XXXX');

const KUNCI_SESI = 'fc_sesi';

export class GalatApi extends Error {
  constructor(pesan, kode = 'GALAT') {
    super(pesan);
    this.kode = kode;
  }
}

export function ambilSesiTersimpan() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KUNCI_SESI) || 'null');
    if (s && s.token && s.kedaluwarsa > Date.now()) return s;
  } catch {
    /* abaikan */
  }
  return null;
}

export function simpanSesi(sesi) {
  try {
    if (sesi) sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesi));
    else sessionStorage.removeItem(KUNCI_SESI);
  } catch {
    /* abaikan */
  }
}

async function minta(url, opsi = {}, batasMs = 45000) {
  if (!apiSiap) throw new GalatApi('Website belum terhubung ke server. Isi GAS_URL di public/config.js.', 'BELUM_DIATUR');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), batasMs);
  let res;
  try {
    res = await fetch(url, { ...opsi, redirect: 'follow', signal: ctrl.signal });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new GalatApi('Server terlalu lama merespons. Coba lagi.', 'WAKTU');
    throw new GalatApi('Tidak dapat terhubung ke server. Periksa koneksi internet.', 'JARINGAN');
  }
  clearTimeout(timer);
  let json;
  try {
    json = await res.json();
  } catch {
    throw new GalatApi('Jawaban server tidak terbaca. Pastikan Web App GAS di-deploy untuk "Anyone".', 'FORMAT');
  }
  if (!json.success) {
    if (json.kode === 'SESI') {
      simpanSesi(null);
      window.dispatchEvent(new CustomEvent('fc:sesi-habis'));
    }
    throw new GalatApi(json.message || 'Terjadi kesalahan.', json.kode);
  }
  return json.data;
}

export function apiGet(action, params = {}) {
  const q = new URLSearchParams({ action, ...params });
  return minta(`${GAS_URL}?${q.toString()}`);
}

export function apiPost(action, body = {}, batasMs) {
  const sesi = ambilSesiTersimpan();
  return minta(
    GAS_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: sesi ? sesi.token : undefined, ...body })
    },
    batasMs
  );
}

/** Pakai hasil bootstrap yang sudah diminta index.html (bila ada), sekali saja. */
export function ambilBootAwal() {
  const p = window.__BOOT__;
  window.__BOOT__ = null;
  if (!p) return null;
  return p.then((json) => {
    if (!json || !json.success) throw new GalatApi((json && json.message) || 'Gagal memuat data.', json && json.kode);
    return json.data;
  });
}
