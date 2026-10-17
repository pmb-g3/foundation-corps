import { useState } from 'react';
import * as m from 'motion/react-m';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { Tautan, navigasi } from '../../lib/router.jsx';
import { apiSiap } from '../../lib/api.js';
import { EASE } from '../../lib/motion.jsx';
import { Merek } from '../../components/layout/HeaderPublik.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input } from '../../components/ui/Isian.jsx';

/** F-50 Login Admin Utama / Kepala Bagian. Sesi 8 jam; Kabag langsung ke sektornya. */
export default function Login() {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState('');
  const [proses, setProses] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setGalat('');
    setProses(true);
    try {
      const p = await auth.masuk(username.trim(), password);
      navigasi(p.peran === 'KABAG' ? '/admin/sektor' : '/admin/hari-ini', { ganti: true });
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-hijau px-5 py-10">
      <div
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: 'radial-gradient(circle at 15% 10%, rgb(201 162 74 / .22), transparent 40%), radial-gradient(circle at 90% 90%, rgb(62 107 74 / .5), transparent 45%)' }}
        aria-hidden
      />
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Tautan ke="/" aria-label="Ke beranda">
            <Merek terang />
          </Tautan>
        </div>
        <form onSubmit={kirim} className="rounded-kartu bg-gading p-6 shadow-modal md:p-7">
          <h1 className="text-2xl text-tinta">Masuk Pengelola</h1>
          <p className="mt-1 text-sm text-redup">Admin Utama & Kepala Bagian.</p>
          <div className="mt-6 space-y-4">
            <Field label="Username">
              {(p) => <Input {...p} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required data-autofocus />}
            </Field>
            <Field label="Sandi">
              {(p) => (
                <div className="relative">
                  <Input {...p} type={lihat ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-12" />
                  <button
                    type="button"
                    onClick={() => setLihat(!lihat)}
                    aria-label={lihat ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-redup hover:text-hijau"
                  >
                    {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
          </div>
          {galat && (
            <p role="alert" className="mt-4 rounded-xl bg-bata/10 px-3 py-2 text-sm text-bata">
              {galat}
            </p>
          )}
          {!apiSiap && <p className="mt-4 rounded-xl bg-emas/15 px-3 py-2 text-sm text-tinta">GAS_URL belum diisi di public/config.js.</p>}
          <Button type="submit" ukuran="lg" ikon={LogIn} memuat={proses} className="mt-6 w-full">
            Masuk
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-gading/60">Lupa sandi? Hubungi Admin Utama.</p>
      </m.div>
    </div>
  );
}
