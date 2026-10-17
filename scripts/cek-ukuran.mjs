// Cek ukuran JavaScript awal beranda (PRD 6.5: target < 200 KB gzip).
// Dijalankan otomatis setelah `npm run build`. Hanya memberi peringatan, tidak menggagalkan build.
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist';
const BATAS_KB = 200;

if (!existsSync(join(DIST, 'index.html'))) {
  console.log('⚠️  dist/index.html tidak ditemukan. Jalankan "npm run build" dulu.');
  process.exit(0);
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const berkas = new Set();
for (const m of html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)) berkas.add(m[1]);
for (const m of html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)) berkas.add(m[1]);

const kb = (n) => (n / 1024).toFixed(1);
let total = 0;
console.log('\n📦 JavaScript awal beranda (gzip):');
for (const f of berkas) {
  const isi = readFileSync(join(DIST, f.replace(/^\.?\//, '')));
  const gz = gzipSync(isi, { level: 9 }).length;
  total += gz;
  console.log(`   ${f.padEnd(42)} ${kb(gz).padStart(7)} KB`);
}
const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(\.?\/?assets[^"]+)"/g)].map((m) => m[1]);
let totalCss = 0;
for (const f of css) totalCss += gzipSync(readFileSync(join(DIST, f.replace(/^\.?\//, '')))).length;

console.log(`   ${'TOTAL JS'.padEnd(42)} ${kb(total).padStart(7)} KB  (batas ${BATAS_KB} KB)`);
console.log(`   ${'CSS'.padEnd(42)} ${kb(totalCss).padStart(7)} KB`);
console.log(total / 1024 <= BATAS_KB ? '✅ Sesuai target anti-lemot.\n' : '⚠️  MELEBIHI target! Periksa import yang tidak perlu.\n');
