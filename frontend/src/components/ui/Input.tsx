import type { InputHTMLAttributes, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

const CONTROL =
  'w-full rounded-xl border border-ink-600/80 bg-ink-900/70 px-3.5 py-2.5 text-sm text-mist-50 placeholder:text-mist-500 outline-none transition-all duration-200 hover:border-ink-600 focus:border-sakura-400/80 focus:bg-ink-900 focus:ring-4 focus:ring-sakura-500/15 disabled:opacity-50';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CONTROL, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CONTROL, 'resize-y leading-relaxed', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(CONTROL, 'cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

/** Native file input, restyled so it matches the rest of the dark UI. */
export function FileInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      type="file"
      accept="image/*"
      className={cx(
        'w-full cursor-pointer rounded-xl border border-dashed border-ink-600 bg-ink-900/50 px-3 py-2.5 text-xs text-mist-400 transition-colors',
        'hover:border-sakura-400/60 hover:text-mist-200',
        'file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-sakura-500/15 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sakura-300',
        'hover:file:bg-sakura-500/25',
        className,
      )}
      {...rest}
    />
  );
}

export function Checkbox({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cx(
        'h-4 w-4 shrink-0 cursor-pointer rounded border-ink-600 bg-ink-900 accent-sakura-500 transition',
        className,
      )}
      {...rest}
    />
  );
}
