// Motion hemat (PRD 6.5): LazyMotion + komponen `m`; fitur animasi dimuat terpisah.
// Animasi hanya transform/opacity; "kurangi gerakan" dihormati otomatis (reducedMotion="user").
import { LazyMotion, MotionConfig } from 'motion/react';

// domAnimation saja tidak mendukung layout & drag, sehingga dipakai domMax yang dimuat
// asinkron agar tidak menambah JavaScript awal beranda.
const muatFitur = () => import('./motionFitur.js').then((r) => r.default);

export function MotionRoot({ children }) {
  return (
    <LazyMotion features={muatFitur} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

export const EASE = [0.22, 1, 0.36, 1];

/** Muncul saat digulir: fade + naik 24 px (PRD 7.2). */
export const muncul = {
  tersembunyi: { opacity: 0, y: 24 },
  tampil: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } }
};

/** Induk yang memunculkan anaknya bergiliran 70 ms. */
export const bergiliran = (jeda = 0.07, awal = 0) => ({
  tersembunyi: {},
  tampil: { transition: { staggerChildren: jeda, delayChildren: awal } }
});

/** Properti siap pakai untuk elemen yang muncul sekali saat terlihat. */
export const saatTerlihat = {
  initial: 'tersembunyi',
  whileInView: 'tampil',
  viewport: { once: true, amount: 0.2 }
};
