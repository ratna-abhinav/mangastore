import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** lifts + glows on hover, for anything clickable */
  interactive?: boolean;
  /** adds the frosted translucent treatment */
  glass?: boolean;
  as?: 'div' | 'section' | 'article' | 'aside' | 'form';
}

export default function Card({
  children,
  className,
  style,
  interactive,
  glass,
  as: Tag = 'div',
  ...rest
}: CardProps) {
  return (
    <Tag
      style={style}
      className={cx(
        'edge-light rounded-2xl',
        glass ? 'glass' : 'border border-ink-600/60 bg-ink-850/80',
        interactive && 'card-hover cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sakura-500/25 bg-sakura-500/10 text-sakura-300">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-mist-50">{title}</h2>
          {subtitle && <p className="truncate text-xs text-mist-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
