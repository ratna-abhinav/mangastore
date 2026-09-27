import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';
import { cx } from '../../utils/cx';

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/**
 * Split-screen frame shared by every auth screen: a branded ink panel on the
 * left, the form on the right. Collapses to a single column on mobile.
 */
export default function AuthShell({ title, subtitle, children, footer, maxWidth = 'max-w-md' }: AuthShellProps) {
  return (
    <div className="glow-ink mx-auto grid w-full max-w-5xl items-stretch overflow-hidden rounded-3xl border border-ink-600 bg-ink-900 lg:grid-cols-[1.1fr_1fr]">
      {/* ------------------------------------------------------ brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-ink-600/60 lg:block">
        <div aria-hidden className="screentone absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="animate-aurora pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-halo-1 blur-[100px]"
        />
        <div
          aria-hidden
          className="animate-aurora-slow pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-halo-3 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 top-6 select-none font-display text-[9rem] font-extrabold leading-none text-watermark"
        >
          漫画
        </div>

        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo />

          <div>
            <h2 className="font-display text-4xl font-extrabold leading-[1.05] text-mist-50">
              Your shelf
              <br />
              <span className="text-gradient">waits for you.</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-400">
              Collect manga, manhwa and donghua in one place — with live order tracking and a shelf that
              remembers where you stopped.
            </p>
          </div>

          <ul className="space-y-2.5 text-xs text-mist-400">
            {['Curated genres, updated weekly', 'Tracked delivery on every order', 'COD or online payment'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[linear-gradient(135deg,#f472b6,#22d3ee)]" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </aside>

      {/* --------------------------------------------------------- form side */}
      <div className="flex items-center p-6 sm:p-10">
        <div className={cx('mx-auto w-full', maxWidth)}>
          <div className="mb-7 lg:hidden">
            <Logo />
          </div>

          <h1 className="font-display text-2xl font-extrabold text-mist-50 sm:text-3xl">{title}</h1>
          {subtitle && <div className="mt-1.5 text-sm text-mist-400">{subtitle}</div>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-7 text-sm text-mist-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** "or continue with" rule between the Google button and the email form. */
export function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="divider-glow flex-1" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist-500">{label}</span>
      <div className="divider-glow flex-1" />
    </div>
  );
}

/** Branded Google button — the Google "G" is a trademark, so it stays inline SVG. */
export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-ink-600 bg-ink-850 px-4 py-3 text-sm font-semibold text-mist-100 transition hover:border-mist-400/40 hover:bg-ink-800"
    >
      <svg className="h-4.5 w-4.5" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export function AuthLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-semibold text-sakura-300 transition hover:text-sakura-200 hover:underline">
      {children}
    </Link>
  );
}
