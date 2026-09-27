import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../utils/cx';

interface PaginationProps {
  pageNo: number;
  totalPages: number;
  onChange: (pageNo: number) => void;
  className?: string;
}

export default function Pagination({ pageNo, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cx('flex items-center justify-center gap-3 pt-2', className)}>
      <button
        type="button"
        onClick={() => onChange(pageNo - 1)}
        disabled={pageNo === 0}
        aria-label="Previous page"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-ink-600 bg-ink-850 px-3.5 text-xs font-semibold text-mist-200 transition hover:border-sakura-400/60 hover:text-sakura-300 disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      <span className="text-xs text-mist-400">
        Page <span className="font-semibold text-mist-100">{pageNo + 1}</span> of{' '}
        <span className="font-semibold text-mist-100">{totalPages}</span>
      </span>

      <button
        type="button"
        onClick={() => onChange(pageNo + 1)}
        disabled={pageNo + 1 >= totalPages}
        aria-label="Next page"
        className="inline-flex h-9 items-center gap-1 rounded-full border border-ink-600 bg-ink-850 px-3.5 text-xs font-semibold text-mist-200 transition hover:border-sakura-400/60 hover:text-sakura-300 disabled:pointer-events-none disabled:opacity-35"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
