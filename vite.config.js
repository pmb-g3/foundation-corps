import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' = semua aset memakai alamat relatif, jadi website jalan di
// https://USERNAME.github.io/NAMA-REPO/ apa pun nama repositorinya.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700
  },
  server: { port: 5173 }
});
