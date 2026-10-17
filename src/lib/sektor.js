// Daftar sektor untuk navigasi, ikon, dan warna (dipakai di header, beranda, footer, admin).
import { Sprout, Landmark, Truck, Building2, House } from 'lucide-react';

export const SEKTOR = [
  { id: 'PERTANIAN', slug: 'pertanian', label: 'Pertanian & Perikanan', pendek: 'Pertanian', ikon: Sprout, warna: 'var(--color-daun)' },
  { id: 'PERTANAHAN', slug: 'pertanahan', label: 'Pertanahan', pendek: 'Pertanahan', ikon: Landmark, warna: 'var(--color-emas-tua)' },
  { id: 'KENDARAAN', slug: 'kendaraan', label: 'Kendaraan', pendek: 'Kendaraan', ikon: Truck, warna: 'var(--color-batu)' },
  { id: 'PEMBANGUNAN', slug: 'pembangunan', label: 'Pembangunan', pendek: 'Pembangunan', ikon: Building2, warna: 'var(--color-kayu)' }
];

export const SEKTOR_RUMAH = { id: 'RUMAH', slug: 'rumah', label: 'Rumah', pendek: 'Rumah', ikon: House, warna: 'var(--color-hijau)' };

export const sektorDariSlug = (slug) => SEKTOR.find((s) => s.slug === String(slug || '').toLowerCase()) || null;
export const sektorDariId = (id) => (id === 'RUMAH' ? SEKTOR_RUMAH : SEKTOR.find((s) => s.id === id) || null);
