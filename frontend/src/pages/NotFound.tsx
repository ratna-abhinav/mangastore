import { Compass, Home, Search } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-3xl border border-ink-600/60 bg-ink-900/40 px-6 py-20 text-center">
      <div aria-hidden className="screentone pointer-events-none absolute inset-0 opacity-40" />
      <div
        aria-hidden
        className="animate-aurora pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-halo-1 blur-[110px]"
      />
      <div
        aria-hidden
        className="animate-aurora-slow pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-halo-3 blur-[110px]"
      />

      <p
        aria-hidden
        className="select-none font-display text-[7rem] font-extrabold leading-none text-gradient opacity-90 sm:text-[11rem]"
      >
        404
      </p>

      <h1 className="relative mt-2 text-2xl font-extrabold text-mist-50 sm:text-3xl">This page slipped out of the shelf</h1>
      <p className="relative mt-3 max-w-md text-sm leading-relaxed text-mist-400">
        The volume you&apos;re looking for isn&apos;t on our shelves. It may have been moved, or the link might be
        from an older chapter of the store.
      </p>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink to="/" variant="gradient" size="lg">
          <Home className="h-4 w-4" />
          Back to home
        </ButtonLink>
        <ButtonLink to="/products" variant="outline" size="lg">
          <Compass className="h-4 w-4" />
          Browse titles
        </ButtonLink>
      </div>

      <p className="relative mt-8 inline-flex items-center gap-2 text-xs text-mist-500">
        <Search className="h-3.5 w-3.5" />
        Or search the full catalogue from the header
      </p>
    </div>
  );
}
