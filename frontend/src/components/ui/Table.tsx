import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

/* ------------------------------------------------------------------ shell */

export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('edge-light overflow-x-auto rounded-2xl border border-ink-600/60 bg-ink-850/80', className)}>
      {children}
    </div>
  );
}

export function Table({ children, minWidth = 720, className }: { children: ReactNode; minWidth?: number; className?: string }) {
  return (
    <table className={cx('w-full text-left text-sm', className)} style={{ minWidth }}>
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-ink-900/70 text-[11px] uppercase tracking-[0.12em] text-mist-400">{children}</thead>
  );
}

export function TH({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cx('px-4 py-3 font-semibold', className)}>{children}</th>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ink-700/50">{children}</tbody>;
}

export function TR({
  children,
  muted,
  className,
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return <tr className={cx('transition-colors hover:bg-ink-800/60', muted && 'opacity-40', className)}>{children}</tr>;
}

export function TD({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx('px-4 py-3 align-middle text-mist-200', className)}>{children}</td>;
}
