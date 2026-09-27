import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx } from '../../utils/cx';

interface SectionHeadingProps {
  title: string;
  sub?: string;
  /** optional "View all" affordance */
  viewAll?: { to: string; label?: string };
  className?: string;
}

export default function SectionHeading({ title, sub, viewAll, className }: SectionHeadingProps) {
  return (
    <div className={cx('mb-6 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-9 w-1.5 shrink-0 rounded-full bg-[linear-gradient(180deg,#f472b6,#22d3ee)]" />
        <div>
          <h2 className="text-2xl font-extrabold text-mist-50 sm:text-3xl">{title}</h2>
          {sub && <p className="mt-0.5 text-sm text-mist-400">{sub}</p>}
        </div>
      </div>

      {viewAll && (
        <Link
          to={viewAll.to}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-mist-300 transition hover:text-sakura-300"
        >
          {viewAll.label ?? 'View all'}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
