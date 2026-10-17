import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { tanggal } from '../../lib/format.js';
import { Dialog } from '../ui/Dialog.jsx';
import { Button } from '../ui/Button.jsx';
import { Field, Input, Select, Switch, Textarea } from '../ui/Isian.jsx';
import { DURASI, JAM_MULAI } from './kalenderLib.js';

const keMenit = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return h * 60 + m;
};
const dariMenit = (n) => `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/** Draf dari kegiatan (ubah) atau dari tanggal (baru) — pola "external CRUD" referensi. */
export function buatDraf(k, tanggalBaru, kategoriAwal) {
  if (k) {
    const m = String(k.mulai || '');
    const s = String(k.selesai || '');
    const durasi = !k.sepanjang_hari && s.slice(11, 16) ? Math.max(30, keMenit(s.slice(11, 16)) - keMenit(m.slice(11, 16))) : 60;
    return { id: k.id, judul: k.judul, kategori: k.kategori, tanggal: m.slice(0, 10), sepanjang_hari: !!k.sepanjang_hari, jam: m.slice(11, 16) || '08:00', durasi, lokasi: k.lokasi || '', keterangan: k.keterangan || '' };
  }
  return { id: null, judul: '', kategori: kategoriAwal, tanggal: tanggalBaru, sepanjang_hari: false, jam: '08:00', durasi: 60, lokasi: '', keterangan: '' };
}

/** Draf → baris sheet Kalender. */
export function drafKeBaris(d) {
  const mulai = d.sepanjang_hari ? `${d.tanggal}T00:00` : `${d.tanggal}T${d.jam}`;
  const selesai = d.sepanjang_hari ? `${d.tanggal}T23:59` : `${d.tanggal}T${dariMenit(Math.min(keMenit(d.jam) + Number(d.durasi), 23 * 60 + 59))}`;
  return { ...(d.id ? { id: d.id } : {}), judul: d.judul.trim(), kategori: d.kategori, mulai, selesai, sepanjang_hari: d.sepanjang_hari, lokasi: d.lokasi, keterangan: d.keterangan };
}

/** Formulir tambah/ubah kegiatan: Judul, Kategori, Tanggal, Sepanjang hari / Jam + Durasi, Lokasi, Keterangan. */
export function FormKegiatan({ awal, kategoriBoleh, tutup, simpan, hapus }) {
  const [d, setD] = useState(awal);
  const [proses, setProses] = useState(false);
  const ubah = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const kirim = async (e) => {
    e.preventDefault();
    if (!d.judul.trim()) return;
    setProses(true);
    await simpan(d);
    setProses(false);
  };
  return (
    <Dialog
      buka
      tutup={tutup}
      judul={d.id ? 'Ubah kegiatan' : 'Kegiatan baru'}
      deskripsi={d.tanggal ? tanggal(d.tanggal) : ''}
      lebar="sm"
      kaki={
        <>
          {d.id && hapus && (
            <Button varian="bahayaLembut" ikon={Trash2} onClick={() => hapus(d)} className="mr-auto">
              Hapus
            </Button>
          )}
          <Button varian="hantu" onClick={tutup}>
            Batal
          </Button>
          <Button ikon={Save} memuat={proses} disabled={!d.judul.trim()} onClick={kirim}>
            {d.id ? 'Simpan' : 'Tambah'}
          </Button>
        </>
      }
    >
      <form onSubmit={kirim} className="space-y-4">
        <Field label="Judul" wajib>
          {(p) => <Input {...p} value={d.judul} onChange={(e) => ubah('judul', e.target.value)} placeholder="Nama kegiatan" maxLength={80} data-autofocus />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            {(p) => (
              <Select {...p} value={d.kategori} onChange={(e) => ubah('kategori', e.target.value)} disabled={kategoriBoleh.length < 2}>
                {kategoriBoleh.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Tanggal">{(p) => <Input {...p} type="date" value={d.tanggal} onChange={(e) => ubah('tanggal', e.target.value)} />}</Field>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Sepanjang hari</span>
          <Switch nyala={d.sepanjang_hari} ubah={(v) => ubah('sepanjang_hari', v)} label="Sepanjang hari" />
        </div>
        {!d.sepanjang_hari && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam mulai">
              {(p) => (
                <Select {...p} value={d.jam} onChange={(e) => ubah('jam', e.target.value)}>
                  {(JAM_MULAI.includes(d.jam) ? JAM_MULAI : [d.jam, ...JAM_MULAI]).map((j) => (
                    <option key={j} value={j}>
                      {j.replace(':', '.')}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Durasi">
              {(p) => (
                <Select {...p} value={d.durasi} onChange={(e) => ubah('durasi', Number(e.target.value))}>
                  {(DURASI.some((x) => x.nilai === d.durasi) ? DURASI : [{ nilai: d.durasi, label: `${d.durasi} menit` }, ...DURASI]).map((x) => (
                    <option key={x.nilai} value={x.nilai}>
                      {x.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}
        <Field label="Lokasi">{(p) => <Input {...p} value={d.lokasi} onChange={(e) => ubah('lokasi', e.target.value)} maxLength={60} />}</Field>
        <Field label="Keterangan">{(p) => <Textarea {...p} value={d.keterangan} onChange={(e) => ubah('keterangan', e.target.value)} rows={2} />}</Field>
      </form>
    </Dialog>
  );
}
