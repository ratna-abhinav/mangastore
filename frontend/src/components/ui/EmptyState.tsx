import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink-600 bg-ink-900/40 px-6 py-16 text-center',
        className,
      )}
    >
      <div aria-hidden className="screentone pointer-events-none absolute inset-0 opacity-30" />
      {icon && (
        <span className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-sakura-500/25 bg-sakura-500/10 text-sakura-300 glow-violet">
          {icon}
        </span>
      )}
      <h3 className="relative text-lg font-bold text-mist-50">{title}</h3>
      {description && <p className="relative mt-1.5 max-w-sm text-sm text-mist-400">{description}</p>}
      {action && <div className="relative mt-6">{action}</div>}
    </div>
  );
}
