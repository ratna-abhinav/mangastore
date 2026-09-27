import { cx } from '../../utils/cx';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-xl', className)} />;
}

/** Full-page loading block, replaces the bare "Loading…" <p> in every page. */
export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3 py-20">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-sakura-400/30 border-t-sakura-400" />
      <span className="text-sm text-mist-400">{label}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-600/60 bg-ink-850/80">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Placeholder rows shaped like a dashboard data table. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading table" className="space-y-2.5">
      <Skeleton className="h-11 w-full rounded-2xl" />
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}
