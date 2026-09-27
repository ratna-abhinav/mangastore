import { Link } from 'react-router-dom';
import { cx } from '../utils/cx';

/** The MangaStore mark: an inked "M" on a gradient stroke, in a rounded tile. */
export default function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="MangaStore home" className={cx('group inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-[var(--shadow-logo)] transition-transform duration-300 group-hover:scale-105">
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(135deg,#f472b6,#a78bfa_50%,#22d3ee)] opacity-90"
        />
        <span aria-hidden className="noise absolute inset-0 opacity-25 mix-blend-overlay" />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5" aria-hidden="true">
          <path
            d="M7 24V8l6 9 6-9v16"
            fill="none"
            stroke="#06040d"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight">
          <span className="text-mist-50">Manga</span>
          <span className="text-gradient">Store</span>
        </span>
      )}
    </Link>
  );
}
