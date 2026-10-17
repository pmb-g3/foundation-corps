import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';

// Isian formulir Elegan Alami: sudut 12 px, latar gading, garis hangat, fokus cincin hijau.
const dasarIsian =
  'w-full rounded-isian border border-garis bg-gading px-4 text-[0.95rem] text-tinta placeholder:text-redup/70 ' +
  'transition-[border-color,box-shadow] duration-200 focus:border-hijau focus:outline-none focus:ring-4 focus:ring-hijau/10 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-bata';

export function Field({ label, petunjuk, galat, wajib, id, children, className }) {
  const otomatis = useId();
  const idIsian = id || otomatis;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={idIsian} className="text-sm font-semibold text-tinta">
          {label}
          {wajib && <span className="ml-0.5 text-bata">*</span>}
        </label>
      )}
      {typeof children === 'function' ? children({ id: idIsian, 'aria-invalid': galat ? true : undefined }) : children}
      {galat ? (
        <p className="text-xs text-bata" role="alert">
          {galat}
        </p>
      ) : petunjuk ? (
        <p className="text-xs text-redup">{petunjuk}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn(dasarIsian, 'min-h-12', className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea rows={rows} className={cn(dasarIsian, 'py-3 leading-relaxed', className)} {...props} />;
}

/** Select bawaan browser (paling nyaman di HP), diberi gaya Elegan Alami. */
export function Select({ className, children, ...props }) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(dasarIsian, 'min-h-12 appearance-none pr-10')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-redup" aria-hidden />
    </div>
  );
}

export function Switch({ nyala, ubah, label, disabled, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!nyala}
      aria-label={label}
      disabled={disabled}
      onClick={() => ubah(!nyala)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
        'before:absolute before:-inset-2 before:content-[""]',
        nyala ? 'bg-hijau' : 'bg-garis',
        className
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-gading shadow transition-transform duration-200 ease-halus',
          nyala ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
