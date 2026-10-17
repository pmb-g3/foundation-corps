import { Suspense, lazy } from 'react';
import { useInView } from '../../hooks/useInView.js';
import { Kerangka } from '../../components/ui/Kerangka.jsx';

// Kalender (F-05) termasuk bagian berat → dimuat saat mendekati layar.
const Kalender = lazy(() => import('../../components/kalender/Kalender.jsx'));

export function KalenderKegiatan() {
  const [ref, dekat] = useInView({ rootMargin: '600px 0px' });
  const kerangka = <Kerangka className="h-[520px] w-full rounded-kartu" />;
  return <div ref={ref}>{dekat ? <Suspense fallback={kerangka}><Kalender /></Suspense> : kerangka}</div>;
}
