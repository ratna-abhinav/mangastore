import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cx } from '../../utils/cx';

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}

/** Shared page chrome for every dashboard screen. */
export default function PageHeader({ title, description, icon, crumbs, actions, className }: PageHeaderProps) {
  return (
    <div className={cx('mb-7', className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-xs text-mist-500">
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1.5">
              {c.to ? (
                <Link to={c.to} className="transition hover:text-sakura-300">
                  {c.label}
                </Link>
              ) : (
                <span className="text-mist-300">{c.label}</span>
              )}
              <ChevronRight className="h-3 w-3 opacity-50" />
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sakura-500/25 bg-sakura-500/10 text-sakura-300">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold text-mist-50 sm:text-3xl">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-mist-400">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
