import { lazy, Suspense } from 'react';
import { useInView } from '../../hooks/useInView.js';
import { Kerangka } from '../../components/ui/Kerangka.jsx';

// Bagian staf (animasi geser) dimuat terpisah saat mendekati layar agar JS awal beranda tetap kecil (PRD 6.5).
const Staf = lazy(() => import('./Staf.jsx').then((m) => ({ default: m.Staf })));

export function StafMalas(props) {
  const [ref, dekat] = useInView({ rootMargin: '600px 0px' });
  const kerangka = <Kerangka className="h-[540px] w-full rounded-kartu" />;
  return <div ref={ref}>{dekat ? <Suspense fallback={kerangka}><Staf {...props} /></Suspense> : kerangka}</div>;
}
