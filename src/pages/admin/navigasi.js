// Menu panel admin (mengikuti kode layar Stitch A-01…A-12; A-07 "Form Data" digabung ke Kelola Data).
import {
  CalendarCheck, Dices, PencilRuler, LayoutPanelTop, Database, FileSpreadsheet, MapPinned, Images,
  MessageCircle, UsersRound, LayoutDashboard, CalendarDays
} from 'lucide-react';

export const MENU_ADMIN = [
  {
    grup: 'Utama',
    item: [
      { id: 'hari-ini', kode: 'A-01', label: 'Hari Ini', ikon: CalendarCheck },
      { id: 'undian', kode: 'A-02', label: 'Undian Firqoh', ikon: Dices },
      { id: 'edit-website', kode: 'A-03', label: 'Edit Website', ikon: PencilRuler },
      { id: 'layout', kode: 'A-04', label: 'Editor Layout', ikon: LayoutPanelTop }
    ]
  },
  {
    grup: 'Data Sektor',
    item: [
      { id: 'data', kode: 'A-05', label: 'Kelola Data', ikon: Database },
      { id: 'impor', kode: 'A-06', label: 'Impor Excel', ikon: FileSpreadsheet },
      { id: 'zona', kode: 'A-08', label: 'Editor Zona', ikon: MapPinned },
      { id: 'media', kode: 'A-09', label: 'Media Drive', ikon: Images }
    ]
  },
  {
    grup: 'Sistem & Pengguna',
    item: [
      { id: 'wa', kode: 'A-10', label: 'WhatsApp', ikon: MessageCircle },
      { id: 'pengguna', kode: 'A-11', label: 'Pengguna & Staf', ikon: UsersRound }
    ]
  }
];

// Sektor yang punya peta untuk Editor Zona (tab yang boleh dibuka Kepala Bagian)
export const TAB_ZONA_SEKTOR = { PERTANAHAN: ['tanah'], PERTANIAN: ['tanaman', 'kolam'], PEMBANGUNAN: ['bangunan'] };

export function menuKabag(sektorId) {
  const item = [
    { id: 'sektor', kode: 'A-12', label: 'Ringkasan Sektor', ikon: LayoutDashboard },
    { id: 'data', kode: '', label: 'Data Sektor', ikon: Database },
    { id: 'impor', kode: '', label: 'Impor Excel', ikon: FileSpreadsheet },
    { id: 'media', kode: '', label: 'Media & Foto', ikon: Images }
  ];
  if (TAB_ZONA_SEKTOR[sektorId]) item.push({ id: 'zona', kode: '', label: 'Editor Zona', ikon: MapPinned });
  item.push({ id: 'kalender', kode: '', label: 'Kalender Sektor', ikon: CalendarDays, href: '#/?ke=kalender' });
  return [{ grup: 'Sektor', item }];
}

export const HALAMAN_ADMIN_SAJA = ['hari-ini', 'undian', 'edit-website', 'layout', 'wa', 'pengguna'];
