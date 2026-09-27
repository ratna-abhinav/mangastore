import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Field({ label, htmlFor, hint, required, className, children }: FieldProps) {
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-xs font-semibold tracking-wide text-mist-300">
        {label}
        {required && <span className="text-sakura-400">*</span>}
        {hint && <span className="font-normal text-mist-500">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
