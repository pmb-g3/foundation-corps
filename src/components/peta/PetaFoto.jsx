import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { fotoUrl, rasioFoto } from '../../lib/foto.js';
import { useUkuran } from '../../hooks/useUkuran.js';
import { useInView } from '../../hooks/useInView.js';
import { VIEW_PENUH, VIEW_W, aturLabel, batasiView, bbox, fitView, gabungBBox, jalurPoligon, keUnit, titikTengah } from './petaLib.js';

/**
 * Mesin peta foto — satu komponen untuk F-10 (zona tanaman), F-20 (zona tanah), F-44 (denah) & Editor Zona.
 * Diadaptasi dari referensi peta SVG: zoom halus ke wilayah (fitView), label tetap tajam di semua
 * tingkat zoom (ukuran dibagi skala), dan peta mini saat diperbesar.
 *
 * wilayah: [{ id, nama, sub?, titik: [[x%,y%],...], warna? }]
 * pin:     [{ id, x, y, label, warna?, nomor?, redup? }]   (x,y dalam persen; redup = tampil samar)
 * tinggiMaks: batas tinggi bingkai (mis. '74svh') untuk gambar tegak; lebar menyesuaikan rasio.
 * fokusTitik: [x%, y%] → perbesar ke titik itu (mis. pin terpilih).
 * hoverId/onHover: sorot wilayah yang sedang ditunjuk dari luar (daftar ↔ peta).
 * pasKeWilayah: pandangan awal memuat semua wilayah (untuk wilayah kecil di foto yang luas).
 */
export function PetaFoto({
  foto,
  fotoKedua,
  campur = 0,
  rasio: rasioAwal = 16 / 10,
  wilayah = [],
  pin = [],
  fokusId = null,
  onFokus,
  pinTerpilih = null,
  onPin,
  sorot = null,
  progresGaris = 1,
  tampilLabel = true,
  petaMini = true,
  zoomBebas = false,
  pasKeWilayah = false,
  modeGambar = false,
  onKlikPeta,
  poligonSementara,
  labelSemua = 'Semua',
  tinggiMaks,
  isiOpasitas = 0.24,
  fokusTitik = null,
  hoverId,
  onHover,
  className,
  children,
  ariaLabel = 'Peta'
}) {
  const uid = useId().replace(/:/g, '');
  const [refUkuran, { lebar }] = useUkuran();
  const [refLihat, terlihat] = useInView({ rootMargin: '400px 0px' });
  const svgRef = useRef(null);
  const [rasio, setRasio] = useState(() => rasioFoto(foto) || rasioAwal);
  const viewH = VIEW_W / rasio;
  const [view, setView] = useState(VIEW_PENUH);
  const [menyeret, setMenyeret] = useState(false);
  const [hoverDalam, setHoverDalam] = useState(null);
  const hover = hoverId !== undefined && hoverId !== null ? hoverId : hoverDalam;
  const setHover = (id) => {
    setHoverDalam(id);
    onHover?.(id);
  };
  const pointer = useRef(new Map());
  const gerak = useRef({ jarak: 0, awal: null });

  // ukuran asli foto → rasio peta sama persis dengan foto (garis zona pas)
  useEffect(() => {
    if (!foto || !terlihat) return;
    const img = new Image();
    img.onload = () => img.naturalWidth && setRasio(img.naturalWidth / img.naturalHeight);
    img.src = fotoUrl(foto, 480);
  }, [foto, terlihat]);

  const geo = useMemo(
    () =>
      wilayah.map((w) => {
        const t = (w.titik || []).map((p) => keUnit(p, viewH));
        return { ...w, t, d: jalurPoligon(t), bbox: bbox(t), pusat: titikTengah(t) };
      }),
    [wilayah, viewH]
  );

  // zoom ke wilayah fokus / wilayah yang disorot (hanya bila pandangan benar-benar berubah)
  const kunciSorot = sorot ? [...sorot].sort().join('|') : '';
  const kunciGeo = geo.map((w) => w.id + ':' + (w.bbox || []).join(',')).join(';');
  const kunciTitik = fokusTitik ? fokusTitik.join(',') : '';
  const viewAwal = useMemo(
    () => (pasKeWilayah && geo.some((w) => w.bbox) ? fitView(gabungBBox(geo.map((w) => w.bbox)), viewH, 1.35) : VIEW_PENUH),
    [pasKeWilayah, kunciGeo, viewH] // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    let tujuan = null;
    if (fokusTitik) {
      const [x, y] = keUnit(fokusTitik, viewH);
      tujuan = fitView([x - 70, y - 70, x + 70, y + 70], viewH, 1, 3.2);
    } else if (fokusId) {
      const g = geo.find((w) => w.id === fokusId);
      if (g?.bbox) tujuan = fitView(g.bbox, viewH);
    } else if (sorot && sorot.size && sorot.size < geo.length) {
      tujuan = fitView(gabungBBox(geo.filter((w) => sorot.has(w.id)).map((w) => w.bbox)), viewH);
    } else if (!zoomBebas || pasKeWilayah) {
      tujuan = viewAwal;
    }
    if (tujuan) setView((v) => (Math.abs(v.s - tujuan.s) < 1e-3 && Math.abs(v.tx - tujuan.tx) < 0.5 && Math.abs(v.ty - tujuan.ty) < 0.5 ? v : tujuan));
  }, [fokusId, kunciSorot, kunciGeo, kunciTitik, viewH, zoomBebas, viewAwal]); // eslint-disable-line react-hooks/exhaustive-deps

  const pxPerUnit = lebar ? lebar / VIEW_W : 0.6;
  const unit = 1 / (view.s * pxPerUnit); // satu piksel layar dalam unit peta
  const diperbesar = view.s > viewAwal.s * 1.04;
  // pin bernomor dirapatkan jadi titik bila ruang per pin terlalu sempit (lebar peta efektif < 11 px per pin)
  const pinRingkas = pin.length > 12 && lebar > 0 && lebar * view.s < pin.length * 11;

  const labelTampil = useMemo(
    () =>
      tampilLabel
        ? aturLabel(
            geo.filter((w) => w.t.length).map((w) => ({ id: w.id, pos: w.pusat, teks: w.nama, luas: w.bbox ? (w.bbox[2] - w.bbox[0]) * (w.bbox[3] - w.bbox[1]) : 0 })),
            view.s * pxPerUnit,
            fokusId
          )
        : new Set(),
    [geo, view.s, pxPerUnit, fokusId, tampilLabel]
  );

  // ---------- konversi layar → persen ----------
  const kePersen = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = (p.x - view.tx) / view.s;
    const y = (p.y - view.ty) / view.s;
    return [Math.round((x / VIEW_W) * 10000) / 100, Math.round((y / viewH) * 10000) / 100];
  };

  // ---------- geser & cubit (zoom bebas) ----------
  const zoomDi = (faktor, cx = VIEW_W / 2, cy = viewH / 2) =>
    setView((v) => {
      const s = Math.max(1, Math.min(8, v.s * faktor));
      const k = s / v.s;
      return batasiView({ s, tx: cx - (cx - v.tx) * k, ty: cy - (cy - v.ty) * k }, viewH);
    });

  const onPointerDown = (e) => {
    pointer.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gerak.current = { jarak: 0, awal: { x: e.clientX, y: e.clientY } };
    if (zoomBebas && (view.s > 1 || pointer.current.size === 2)) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setMenyeret(true);
    }
  };
  const onPointerMove = (e) => {
    const lama = pointer.current.get(e.pointerId);
    if (!lama) return;
    const baru = { x: e.clientX, y: e.clientY };
    pointer.current.set(e.pointerId, baru);
    if (gerak.current.awal) gerak.current.jarak = Math.max(gerak.current.jarak, Math.hypot(baru.x - gerak.current.awal.x, baru.y - gerak.current.awal.y));
    if (!zoomBebas || !lebar) return;
    const k = VIEW_W / lebar;
    if (pointer.current.size === 2) {
      const [a, b] = [...pointer.current.values()];
      const lainId = [...pointer.current.keys()].find((id) => id !== e.pointerId);
      const lain = pointer.current.get(lainId);
      const dLama = Math.hypot(lama.x - lain.x, lama.y - lain.y);
      const dBaru = Math.hypot(a.x - b.x, a.y - b.y);
      if (dLama > 0) {
        const r = svgRef.current.getBoundingClientRect();
        zoomDi(dBaru / dLama, ((a.x + b.x) / 2 - r.left) * k, ((a.y + b.y) / 2 - r.top) * k);
      }
    } else if (view.s > 1) {
      setView((v) => batasiView({ ...v, tx: v.tx + (baru.x - lama.x) * k, ty: v.ty + (baru.y - lama.y) * k }, viewH));
    }
  };
  const onPointerUp = (e) => {
    pointer.current.delete(e.pointerId);
    if (pointer.current.size === 0) setMenyeret(false);
  };
  const bukanSeret = () => gerak.current.jarak < 6;

  const klikLatar = (e) => {
    if (!bukanSeret()) return;
    if (modeGambar && onKlikPeta) {
      const p = kePersen(e.clientX, e.clientY);
      if (p) onKlikPeta(p);
    }
  };

  const reset = () => {
    setView(viewAwal);
    onFokus?.(null);
  };

  const fill = (w) => {
    const redup = sorot && !sorot.has(w.id);
    if (redup) return 0.05;
    if (w.id === fokusId) return Math.max(0.1, isiOpasitas * 0.45);
    if (w.id === hover) return Math.min(0.6, isiOpasitas + 0.16);
    return isiOpasitas;
  };

  const urlFoto = foto ? fotoUrl(foto, lebar > 900 ? 1920 : 1200) : '';
  const urlKedua = fotoKedua ? fotoUrl(fotoKedua, lebar > 900 ? 1920 : 1200) : '';

  return (
    <div
      ref={(el) => {
        refUkuran.current = el;
        refLihat.current = el;
      }}
      className={cn('relative w-full overflow-hidden rounded-kartu bg-hijau', className)}
      style={tinggiMaks ? { aspectRatio: rasio, width: `min(100%, calc(${tinggiMaks} * ${rasio}))`, marginInline: 'auto' } : { aspectRatio: rasio }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${viewH}`}
        className={cn('absolute inset-0 size-full select-none', modeGambar ? 'cursor-crosshair' : menyeret ? 'cursor-grabbing' : '')}
        style={{ touchAction: zoomBebas && diperbesar ? 'none' : 'pan-y' }}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (!zoomBebas || modeGambar) return;
          const r = svgRef.current.getBoundingClientRect();
          const k = VIEW_W / r.width;
          zoomDi(1.8, (e.clientX - r.left) * k, (e.clientY - r.top) * k);
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <pattern id={`${uid}-kosong`} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="24" height="24" fill="var(--color-hijau)" />
            <line x1="0" y1="0" x2="0" y2="24" stroke="rgb(245 239 227 / 0.06)" strokeWidth="6" />
          </pattern>
        </defs>
        <g
          style={{
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
            transformOrigin: '0 0',
            transition: menyeret ? 'none' : 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          <rect width={VIEW_W} height={viewH} fill={`url(#${uid}-kosong)`} onClick={klikLatar} />
          {terlihat && urlFoto && (
            <image href={urlFoto} width={VIEW_W} height={viewH} preserveAspectRatio="xMidYMid slice" onClick={klikLatar} />
          )}
          {terlihat && urlKedua && (
            <m.image
              href={urlKedua}
              width={VIEW_W}
              height={viewH}
              preserveAspectRatio="xMidYMid slice"
              style={{ opacity: campur }}
              onClick={klikLatar}
            />
          )}

          {geo.map((w) => (
            <g key={w.id}>
              <path
                d={w.d}
                fill={w.warna || 'var(--color-emas)'}
                fillOpacity={fill(w)}
                stroke="none"
                style={{ transition: 'fill-opacity .3s', cursor: modeGambar ? 'crosshair' : 'pointer' }}
                onMouseEnter={() => setHover(w.id)}
                onClick={(e) => {
                  if (!bukanSeret()) return;
                  if (modeGambar) return klikLatar(e);
                  onFokus?.(w.id === fokusId ? null : w.id);
                }}
              />
              <m.path
                d={w.d}
                fill="none"
                stroke={w.id === fokusId ? 'var(--color-emas)' : w.id === hover ? '#fff' : 'rgb(245 239 227)'}
                strokeOpacity={sorot && !sorot.has(w.id) ? 0.3 : 0.95}
                strokeWidth={(w.id === fokusId ? 3 : w.id === hover ? 2.6 : 2) * unit}
                strokeLinejoin="round"
                pointerEvents="none"
                style={{ pathLength: progresGaris }}
              />
            </g>
          ))}

          {poligonSementara && poligonSementara.length > 0 && (
            <g pointerEvents="none">
              <path
                d={'M' + poligonSementara.map((p) => keUnit(p, viewH).join(',')).join('L')}
                fill="var(--color-emas)"
                fillOpacity={0.18}
                stroke="var(--color-emas)"
                strokeWidth={2.5 * unit}
                strokeDasharray={`${6 * unit} ${4 * unit}`}
              />
              {poligonSementara.map((p, i) => {
                const [x, y] = keUnit(p, viewH);
                return <circle key={i} cx={x} cy={y} r={(i === 0 ? 7 : 5) * unit} fill={i === 0 ? 'var(--color-gading)' : 'var(--color-emas)'} stroke="var(--color-hijau)" strokeWidth={2 * unit} />;
              })}
            </g>
          )}

          {/* label wilayah: ukuran tetap di layar berapa pun zoomnya */}
          {geo
            .filter((w) => labelTampil.has(w.id) && w.t.length)
            .map((w) => (
              <text
                key={w.id}
                x={w.pusat[0]}
                y={w.pusat[1]}
                textAnchor="middle"
                pointerEvents="none"
                fontSize={13 * unit}
                fontWeight={600}
                fill="var(--color-gading)"
                stroke="rgb(31 61 43 / 0.85)"
                strokeWidth={3.5 * unit}
                strokeLinejoin="round"
                paintOrder="stroke"
                opacity={sorot && !sorot.has(w.id) ? 0.4 : 1}
              >
                {w.nama}
                {w.sub && (
                  <tspan x={w.pusat[0]} dy={15 * unit} fontSize={11 * unit} fontWeight={500} fill="var(--color-emas)">
                    {w.sub}
                  </tspan>
                )}
              </text>
            ))}

          {pin.filter((p) => p.x !== null && p.x !== '' && p.y !== null && p.y !== '' && isFinite(Number(p.x)) && isFinite(Number(p.y))).map((p) => {
            const [x, y] = keUnit([p.x, p.y], viewH);
            const pilih = p.id === pinTerpilih;
            // peta kecil & banyak pin bernomor (mis. denah di HP): tampil titik dulu, nomor muncul saat diperbesar
            const ringkas = p.nomor !== undefined && !pilih && pinRingkas;
            const r = (ringkas ? 5 : p.nomor !== undefined ? 12 : pilih ? 11 : 8) * unit;
            return (
              <g
                key={p.id}
                transform={`translate(${x} ${y})`}
                opacity={p.redup && !pilih ? 0.22 : 1}
                style={{ cursor: onPin ? 'pointer' : 'default', transition: 'opacity .3s' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (bukanSeret()) onPin?.(p);
                }}
              >
                <title>{p.nomor !== undefined ? `${p.nomor}. ${p.label || ''}` : p.label}</title>
                {pilih && <circle r={r * 1.9} fill="var(--color-emas)" className="animate-denyut-emas" />}
                <circle r={r * 1.6} fill="transparent" />
                <circle r={r} fill={pilih ? 'var(--color-emas)' : p.warna || 'var(--color-gading)'} stroke={pilih ? 'var(--color-gading)' : 'var(--color-hijau)'} strokeWidth={(ringkas ? 1.5 : 2) * unit} />
                {ringkas ? null : p.nomor !== undefined ? (
                  <text textAnchor="middle" dy="0.35em" fontSize={11 * unit} fontWeight={700} fill={pilih ? 'var(--color-hijau)' : 'var(--color-hijau)'} pointerEvents="none">
                    {p.nomor}
                  </text>
                ) : (
                  <circle r={r * 0.35} fill={pilih ? 'var(--color-hijau)' : 'var(--color-emas)'} pointerEvents="none" />
                )}
                {(pilih || (view.s > Math.max(1.6, viewAwal.s * 1.5) && p.label && p.nomor === undefined)) && (
                  <text
                    y={-r - 6 * unit}
                    textAnchor="middle"
                    fontSize={12 * unit}
                    fontWeight={600}
                    fill="var(--color-gading)"
                    stroke="rgb(31 61 43 / 0.85)"
                    strokeWidth={3 * unit}
                    paintOrder="stroke"
                    pointerEvents="none"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* kendali */}
      {pinRingkas && !modeGambar && (
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-hijau/85 px-3 py-1.5 text-[0.7rem] font-semibold text-gading backdrop-blur">
          Perbesar untuk melihat nomor
        </span>
      )}
      {diperbesar && !modeGambar && (
        <button
          type="button"
          onClick={reset}
          className="absolute left-3 top-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-gading/95 px-3.5 text-xs font-semibold text-hijau shadow-angkat backdrop-blur"
        >
          <Maximize2 className="size-3.5" aria-hidden /> {labelSemua}
        </button>
      )}
      {zoomBebas && (
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-full bg-gading/95 shadow-angkat backdrop-blur">
          <button type="button" aria-label="Perbesar" className="flex size-10 items-center justify-center text-hijau hover:bg-hijau/5" onClick={() => zoomDi(1.4)}>
            <Plus className="size-4" aria-hidden />
          </button>
          <button type="button" aria-label="Perkecil" className="flex size-10 items-center justify-center border-t border-garis text-hijau hover:bg-hijau/5" onClick={() => zoomDi(1 / 1.4)}>
            <Minus className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* peta mini: posisi pandangan saat diperbesar */}
      {petaMini && diperbesar && (
        <button
          type="button"
          onClick={reset}
          aria-label="Tampilkan seluruh peta"
          className="absolute bottom-3 left-3 hidden w-28 overflow-hidden rounded-lg border-2 border-gading/90 bg-hijau shadow-angkat sm:block"
          style={{ aspectRatio: rasio }}
        >
          {foto && <img src={fotoUrl(foto, 480)} alt="" className="absolute inset-0 size-full object-cover opacity-80" />}
          <svg viewBox={`0 0 ${VIEW_W} ${viewH}`} className="absolute inset-0 size-full" aria-hidden>
            {geo.map((w) => (
              <path key={w.id} d={w.d} fill={w.id === fokusId ? 'var(--color-emas)' : 'rgb(245 239 227 / .35)'} />
            ))}
            <rect x={-view.tx / view.s} y={-view.ty / view.s} width={VIEW_W / view.s} height={viewH / view.s} fill="none" stroke="var(--color-emas)" strokeWidth={18} />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
}
