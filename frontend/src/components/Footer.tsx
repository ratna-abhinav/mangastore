import { Link } from 'react-router-dom';
import { Heart, Mail } from 'lucide-react';
import Logo from './Logo';
import { ButtonLink } from './ui/Button';

const COLUMNS = [
  {
    title: 'Store',
    links: [
      { to: '/home', label: 'Home' },
      { to: '/products', label: 'All titles' },
      { to: '/cart', label: 'Your cart' },
      { to: '/my-orders', label: 'Order tracking' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/profile', label: 'Profile' },
      { to: '/signin', label: 'Sign in' },
      { to: '/register', label: 'Create account' },
      { to: '/forgot-password', label: 'Reset password' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-ink-600/60 bg-ink-900/60">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px divider-glow" />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-halo-2 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-400">
              Manga, manhwa &amp; donghua in one endless shelf. Curated genres, live order tracking and a
              built-in admin studio.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="mailto:abhinavratna1984@gmail.com"
                aria-label="Email MangaStore"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 bg-ink-850 text-mist-300 transition hover:border-sakura-400/60 hover:text-sakura-300"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/ratna-abhinav"
                target="_blank"
                rel="noreferrer"
                aria-label="MangaStore on GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 bg-ink-850 text-mist-300 transition hover:border-sakura-400/60 hover:text-sakura-300"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                </svg>
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-mist-500">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-mist-300 transition hover:translate-x-0.5 hover:text-sakura-300 inline-block"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-mist-500">Get started</h3>
            <p className="mt-4 text-sm leading-relaxed text-mist-400">
              New chapters land every week. Create an account to start collecting.
            </p>
            <ButtonLink to="/register" variant="gradient" size="sm" className="mt-4">
              Create account
            </ButtonLink>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-700 pt-6 sm:flex-row">
          <p className="text-xs text-mist-500">
            © {new Date().getFullYear()} MangaStore · Manga, manhwa &amp; donghua
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-mist-500">
            Built with <Heart className="h-3.5 w-3.5 text-sakura-400" aria-hidden /> by Abhinav Ratna
          </p>
        </div>
      </div>
    </footer>
  );
}
