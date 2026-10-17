import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import './footer.css';
import { usePengaturan } from '../../lib/data.jsx';
import { SEKTOR } from '../../lib/sektor.js';
import { TEMA_BAWAAN } from '../../lib/tema.js';
import { useEditor } from '../../lib/editor.jsx';
import { TombolEdit } from './Bagian.jsx';

// ------------------------------------------------------------
// Matematika berkas cahaya & ukuran wordmark (dari referensi F-07)
// ------------------------------------------------------------
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

const hexKeRgb = (hex, cadangan) => {
  const m = /^#?([\da-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return cadangan;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

const campur = (hex, ke, p) => {
  const a = parseInt(String(hex).slice(1), 16);
  const b = parseInt(String(ke).slice(1), 16);
  if (isNaN(a) || isNaN(b)) return hex;
  return '#' + [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - p) + ((b >> s) & 255) * p).toString(16).padStart(2, '0')).join('');
};

const fitSize = (ukur100, target, batas) => {
  if (!(ukur100 > 0) || !(target > 0)) return 0;
  const s = (100 * target) / ukur100;
  return batas > 0 ? Math.min(s, batas) : s;
};
const beamTarget = (u, lo = 30, hi = 82) => lo + (hi - lo) * clamp(Number.isFinite(u) ? u : 0.5, 0, 1);
const drift = (t, pusat = 58, amp = 9) => pusat + amp * (0.7 * Math.sin(t * 0.21) + 0.3 * Math.sin(t * 0.077 + 1.3));
const approach = (dari, ke, k, dt) => ke + (dari - ke) * Math.pow(1 - clamp(k, 0, 1), clamp(dt, 0, 0.1) * 60);
const baselineAt = (asc, desc) => (!(asc > 0) || !(desc >= 0) ? 0.8 : clamp(((100 - asc - desc) / 2 + asc) / 100, 0.5, 1.2));
const wordHeight = (fs, base, cut) => Math.max(0, fs * (base + clamp(cut, -0.4, 0.4)));

function ukurBaseline(family, weight, teks) {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return 0.8;
    ctx.font = `${weight} 100px ${family}`;
    const m = ctx.measureText(teks);
    return baselineAt(m.fontBoundingBoxAscent, m.fontBoundingBoxDescent);
  } catch {
    return 0.8;
  }
}

const Panah = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2.5 9.5l7-7M4 2.5h5.5V8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Footer() {
  const pengaturan = usePengaturan();
  const editor = useEditor();
  const info = pengaturan.footer || {};
  const warna = { ...TEMA_BAWAAN.warna, ...(pengaturan.tema?.warna || {}) };
  const tahun = new Date().getFullYear();
  const kata = 'FOUNDATION';
  const huruf = useMemo(() => Array.from(kata), []);
  const potong = 0.14;
  const tebal = 500;

  const kolom = [
    { judul: 'Sektor', tautan: SEKTOR.map((s) => ({ label: s.label, href: `#/sektor/${s.slug}` })) },
    {
      judul: 'Beranda',
      tautan: [
        { label: 'Jadwal Hari Ini', href: '#/?ke=jadwal' },
        { label: 'Program Unggulan', href: '#/?ke=program' },
        { label: 'Kalender', href: '#/?ke=kalender' },
        { label: 'Staf', href: '#/?ke=staf' },
        { label: 'Masuk Pengelola', href: '#/admin' }
      ]
    }
  ];

  const rootRef = useRef(null);
  const wordRef = useRef(null);
  const innerRef = useRef(null);
  const [ukuran, setUkuran] = useState(0);
  const [dasar, setDasar] = useState(0.8);
  const [pernahTerlihat, setPernahTerlihat] = useState(false);
  const [terlihat, setTerlihat] = useState(false);
  const kurangi = useReducedMotion();
  const ptr = useRef({ u: 0.5, x: 0, y: 0, di: false });

  // Ukur wordmark selebar kolom, lalu catat posisi tiap huruf agar berkas cahaya sejajar.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner) return;
    let frame = 0;
    const tempatkan = () => {
      const r = root.getBoundingClientRect();
      root.style.setProperty('--bwf-rw', r.width + 'px');
      root.style.setProperty('--bwf-rh', r.height + 'px');
      let atas = 0;
      inner.querySelectorAll('.bwf-l').forEach((s, i) => {
        let x = 0;
        let y = 0;
        let el = s;
        while (el && el !== root) {
          x += el.offsetLeft;
          y += el.offsetTop;
          el = el.offsetParent;
        }
        s.style.setProperty('--bwf-x', x + 'px');
        s.style.setProperty('--bwf-y', y + 'px');
        if (i === 0) atas = y;
      });
      root.style.setProperty('--bwf-top', atas + 'px');
      root.style.setProperty('--bwf-bot', atas + (parseFloat(inner.style.fontSize) || 0) * 0.92 + 'px');
    };
    const pas = () => {
      const kotak = inner.parentElement;
      const pad = parseFloat(getComputedStyle(kotak).paddingLeft) || 0;
      const target = kotak.clientWidth - pad * 2;
      inner.style.fontSize = '100px';
      const diukur = inner.offsetWidth;
      setDasar(ukurBaseline(getComputedStyle(inner).fontFamily, tebal, kata));
      const besar = fitSize(diukur, target, target * 0.42);
      inner.style.fontSize = besar + 'px';
      setUkuran(besar);
      tempatkan();
    };
    const jadwalkan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(pas);
    };
    pas();
    const ro = new ResizeObserver(jadwalkan);
    ro.observe(root);
    let hidup = true;
    document.fonts?.ready.then(() => hidup && jadwalkan());
    return () => {
      hidup = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setTerlihat(e.isIntersecting);
        if (e.isIntersecting) setPernahTerlihat(true);
      },
      { threshold: 0.12 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Berkas cahaya bergerak pelan hanya saat footer terlihat & gerakan tidak dikurangi.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const set = (b, px, py, g) => {
      root.style.setProperty('--bwf-b', b.toFixed(2) + '%');
      root.style.setProperty('--bwf-px', px.toFixed(1) + 'px');
      root.style.setProperty('--bwf-py', py.toFixed(1) + 'px');
      root.style.setProperty('--bwf-g', g.toFixed(3));
    };
    if (kurangi || !terlihat) {
      set(58, ptr.current.x, ptr.current.y, 0);
      return;
    }
    let raf = 0;
    let akhir = performance.now();
    let t = akhir / 1000;
    let b = 58;
    let px = ptr.current.x;
    let py = ptr.current.y;
    let g = 0;
    const tick = (kini) => {
      const dt = Math.min(0.1, (kini - akhir) / 1000);
      akhir = kini;
      t += dt;
      const p = ptr.current;
      const diam = drift(t);
      const tujuan = p.di ? beamTarget(p.u) * 0.75 + diam * 0.25 : diam;
      b = approach(b, tujuan, 0.035, dt);
      px = approach(px, p.x, 0.16, dt);
      py = approach(py, p.y, 0.16, dt);
      g = approach(g, p.di ? 1 : 0, 0.06, dt);
      set(b, px, py, g);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [kurangi, terlihat]);

  const onPointer = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = ptr.current;
    p.x = e.clientX - r.left;
    p.y = e.clientY - r.top;
    p.u = r.width ? p.x / r.width : 0.5;
    p.di = e.type !== 'pointerleave';
  };

  const latar = campur(warna.hijau_tua, '#000000', 0.38);
  const vars = {
    '--bwf-bg': latar,
    '--bwf-bg-rgb': hexKeRgb(latar, '18, 36, 25'),
    '--bwf-ink': warna.krem,
    '--bwf-ink-rgb': hexKeRgb(warna.krem, '245, 239, 227'),
    '--bwf-muted': `rgba(${hexKeRgb(warna.krem, '245, 239, 227')}, .62)`,
    '--bwf-acc': hexKeRgb(warna.emas, '201, 162, 74'),
    '--bwf-lit': hexKeRgb(warna.emas, '201, 162, 74'),
    '--bwf-wt': campur(warna.hijau_daun, '#000000', 0.05),
    '--bwf-wf': campur(warna.hijau_tua, '#000000', 0.5),
    '--bwf-ww': String(tebal),
    '--bwf-ang': '118deg',
    '--bwf-b': '58%',
    '--bwf-px': '50%',
    '--bwf-py': '50%',
    '--bwf-g': '0',
    '--bwf-top': '0px',
    '--bwf-bot': '100%'
  };

  let d = 0;
  const jeda = () => ({ '--bwf-d': (d += 70) + 'ms' });

  return (
    <footer
      ref={rootRef}
      className="bwf"
      style={vars}
      data-in={pernahTerlihat || kurangi ? 'true' : 'false'}
      onPointerMove={onPointer}
      onPointerEnter={onPointer}
      onPointerLeave={onPointer}
    >
      <div className="bwf-rule" aria-hidden="true" />
      <div style={{ position: 'absolute', right: 16, top: 16, zIndex: 5 }}>
        <TombolEdit gelap label="Edit footer" onClick={editor.bisa() ? () => editor.buka({ jenis: 'footer' }) : undefined} />
      </div>
      <div className="bwf-sky" aria-hidden="true">
        <div className="bwf-wash" />
        <div className="bwf-bands" />
        <div className="bwf-beam" />
        <div className="bwf-glow" />
        <div className="bwf-grain" />
      </div>

      <div className="bwf-inner">
        <div className="bwf-col">
          <p className="bwf-label" style={jeda()}>
            © {tahun} FOUNDATION Corps · Gontor Campus 3
          </p>
          {info.kutipan && (
            <p className="bwf-quote bwf-fade" style={jeda()}>
              “{info.kutipan}”
            </p>
          )}
          <div className="bwf-credits">
            {info.alamat && (
              <p className="bwf-fade" style={jeda()}>
                {info.alamat}
              </p>
            )}
            {info.telepon && (
              <p className="bwf-fade" style={jeda()}>
                <a href={`tel:${String(info.telepon).replace(/[^\d+]/g, '')}`}>{info.telepon}</a>
              </p>
            )}
            {info.email && (
              <p className="bwf-fade" style={jeda()}>
                <a href={`mailto:${info.email}`}>{info.email}</a>
              </p>
            )}
          </div>
        </div>

        {kolom.map((k) => (
          <nav key={k.judul} className="bwf-col" aria-label={k.judul}>
            <p className="bwf-label" style={jeda()}>
              {k.judul}
            </p>
            <ul className="bwf-links">
              {k.tautan.map((l) => (
                <li key={l.label} className="bwf-fade" style={jeda()}>
                  <a className="bwf-link" href={l.href}>
                    <span className="bwf-link-t">{l.label}</span>
                    <Panah />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div ref={wordRef} className="bwf-word" style={{ height: ukuran ? wordHeight(ukuran, dasar, potong) : `calc(${(0.8 + potong) * 26}cqw)` }}>
        <p className="sr-only">{kata}</p>
        <div className="bwf-word-box">
          <div ref={innerRef} className="bwf-word-in" aria-hidden="true">
            {huruf.map((ch, i) => (
              <span key={i} className="bwf-lw" style={{ '--bwf-d': 260 + i * 75 + 'ms' }}>
                <span className="bwf-l">{ch}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="bwf-foot" aria-hidden="true" />
      </div>
    </footer>
  );
}
