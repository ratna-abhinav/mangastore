import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../utils/cx';

export type ButtonVariant = 'gradient' | 'primary' | 'outline' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const BASE =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97]';

const VARIANTS: Record<ButtonVariant, string> = {
  gradient:
    'shine grad-brand text-white shadow-[var(--shadow-cta)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-cta-hover)]',
  primary:
    'bg-sakura-500 text-white shadow-[var(--shadow-cta)] hover:-translate-y-0.5 hover:bg-sakura-400',
  outline:
    'edge-light border border-mist-400/25 bg-ink-800/70 text-mist-100 hover:-translate-y-0.5 hover:border-sakura-400/60 hover:bg-ink-750 hover:text-mist-50',
  ghost: 'text-mist-300 hover:bg-ink-750 hover:text-mist-50',
  subtle: 'bg-ink-750 text-mist-100 hover:bg-ink-700 hover:text-mist-50',
  danger:
    'border border-crimson-500/40 bg-crimson-500/10 text-crimson-300 hover:-translate-y-0.5 hover:bg-crimson-500/20',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-sm',
  xl: 'h-14 px-9 text-base',
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  children?: ReactNode;
};

function classes({ variant = 'primary', size = 'md', full, className }: CommonProps) {
  return cx(BASE, VARIANTS[variant], SIZES[size], full && 'w-full', className);
}

interface ButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  loading?: boolean;
}

export default function Button({
  variant,
  size,
  full,
  className,
  children,
  loading,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button className={classes({ variant, size, full, className })} disabled={disabled || loading} {...rest}>
      {loading && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps {
  to: string;
  state?: unknown;
  'aria-label'?: string;
  onClick?: () => void;
}

export function ButtonLink({ to, state, variant, size, full, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link to={to} state={state} className={classes({ variant, size, full, className })} {...rest}>
      {children}
    </Link>
  );
}
