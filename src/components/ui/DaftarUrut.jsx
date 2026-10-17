import { useRef, useState } from 'react';
import * as m from 'motion/react-m';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/**
 * Daftar yang bisa diurutkan dengan seret-lepas (mouse & sentuh) atau tombol naik/turun (keyboard).
 * Dipakai urutan bagian beranda (F-52), urutan imam & firqoh (F-57).
 * render(item, { pegangan, indeks }) → isi baris (pegangan = elemen tombol seret).
 */
export function DaftarUrut({ items, getId = (x) => x.id, onUbah, render, className, terkunci = () => false }) {
  const [diseret, setDiseret] = useState(null);
  const refs = useRef({});
  const daftarRef = useRef(items);
  daftarRef.current = items;

  const geser = (i, arah) => {
    const j = i + arah;
    if (j < 0 || j >= items.length || terkunci(items[j])) return;
    const baru = [...items];
    [baru[i], baru[j]] = [baru[j], baru[i]];
    onUbah(baru);
  };

  const mulai = (e, id) => {
    e.preventDefault();
    setDiseret(id);
    const pindah = (ev) => {
      const urutan = daftarRef.current;
      const idx = urutan.findIndex((x) => getId(x) === id);
      for (let j = 0; j < urutan.length; j++) {
        if (j === idx || terkunci(urutan[j])) continue;
        const el = refs.current[getId(urutan[j])];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const tengah = r.top + r.height / 2;
        if ((j < idx && ev.clientY < tengah) || (j > idx && ev.clientY > tengah)) {
          const baru = [...urutan];
          const [x] = baru.splice(idx, 1);
          baru.splice(j, 0, x);
          daftarRef.current = baru;
          onUbah(baru);
          break;
        }
      }
    };
    const lepas = () => {
      setDiseret(null);
      window.removeEventListener('pointermove', pindah);
      window.removeEventListener('pointerup', lepas);
      window.removeEventListener('pointercancel', lepas);
    };
    window.addEventListener('pointermove', pindah);
    window.addEventListener('pointerup', lepas);
    window.addEventListener('pointercancel', lepas);
  };

  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((it, i) => {
        const id = getId(it);
        const kunci = terkunci(it);
        const pegangan =
          kunci ? (
            <span className="flex size-9 items-center justify-center text-redup/40" aria-hidden>
              <GripVertical className="size-4" />
            </span>
          ) : (
            <span className="flex items-center">
              <button
                type="button"
                onPointerDown={(e) => mulai(e, id)}
                style={{ touchAction: 'none' }}
                aria-label="Seret untuk mengurutkan"
                className="flex size-9 cursor-grab items-center justify-center rounded-lg text-redup hover:bg-hijau/5 hover:text-hijau active:cursor-grabbing"
              >
                <GripVertical className="size-4" aria-hidden />
              </button>
              <span className="flex flex-col">
                <button type="button" onClick={() => geser(i, -1)} aria-label="Naikkan" className="flex h-4 w-6 items-center justify-center text-redup hover:text-hijau">
                  <ChevronUp className="size-3.5" />
                </button>
                <button type="button" onClick={() => geser(i, 1)} aria-label="Turunkan" className="flex h-4 w-6 items-center justify-center text-redup hover:text-hijau">
                  <ChevronDown className="size-3.5" />
                </button>
              </span>
            </span>
          );
        return (
          <m.li
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className={cn('relative', diseret === id && 'z-10 [&>*]:shadow-modal [&>*]:ring-2 [&>*]:ring-emas')}
          >
            {render(it, { pegangan, indeks: i })}
          </m.li>
        );
      })}
    </ul>
  );
}
