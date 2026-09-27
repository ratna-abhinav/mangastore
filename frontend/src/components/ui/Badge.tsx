import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

export type BadgeTone = 'pink' | 'violet' | 'cyan' | 'mint' | 'flare' | 'crimson' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  pink: 'border-sakura-400/30 bg-sakura-500/12 text-sakura-200',
  violet: 'border-neon-violet-400/30 bg-neon-violet-500/12 text-neon-violet-300',
  cyan: 'border-neon-cyan-400/30 bg-neon-cyan-500/12 text-neon-cyan-300',
  mint: 'border-mint-400/30 bg-mint-500/12 text-mint-300',
  flare: 'border-flare-400/30 bg-flare-400/12 text-flare-300',
  crimson: 'border-crimson-400/30 bg-crimson-500/12 text-crimson-300',
  neutral: 'border-mist-400/25 bg-ink-700/60 text-mist-300',
};

const DOT: Record<BadgeTone, string> = {
  pink: 'bg-sakura-400',
  violet: 'bg-neon-violet-400',
  cyan: 'bg-neon-cyan-400',
  mint: 'bg-mint-400',
  flare: 'bg-flare-400',
  crimson: 'bg-crimson-400',
  neutral: 'bg-mist-400',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** render a leading status dot */
  dot?: boolean;
  /** add a soft outer glow in the badge colour */
  glow?: boolean;
  className?: string;
}

export default function Badge({ children, tone = 'neutral', dot, glow, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap',
        TONES[tone],
        glow && 'shadow-[0_0_20px_-4px_currentColor]',
        className,
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', DOT[tone])} />}
      {children}
    </span>
  );
}

/** Order-status strings come straight from the backend, so map them by name. */
const STATUS_TONES: Record<string, BadgeTone> = {
  'In Progress': 'flare',
  'Order Received': 'violet',
  'Product Shipped': 'cyan',
  'Out for Delivery': 'pink',
  Delivered: 'mint',
  Success: 'mint',
  Cancelled: 'crimson',
};

export function statusTone(status: string): BadgeTone {
  return STATUS_TONES[status] ?? 'neutral';
}
