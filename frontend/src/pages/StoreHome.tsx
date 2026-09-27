import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Search, Sparkles, Truck, Wallet, Zap } from 'lucide-react';
import { fetchHome } from '../api/catalog';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/ui/SectionHeading';
import { ButtonLink } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { imageFallback } from '../utils/image';
import { cx } from '../utils/cx';

const PERKS = [
  { icon: Truck, title: 'Tracked delivery', copy: 'Live status from shelf to doorstep' },
  { icon: Wallet, title: 'COD & online', copy: 'Pay however you prefer at checkout' },
  { icon: Zap, title: 'Instant search', copy: 'Keyword, genre and semantic lookup' },
];

export default function StoreHome() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['home'], queryFn: fetchHome });
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/products?keyword=${encodeURIComponent(q)}` : '/products');
  };

  if (isLoading) {
    return (
      <div className="space-y-12">
        <Skeleton className="h-[26rem] w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<Zap className="h-7 w-7" />}
        title="We lost the signal"
        description="The catalogue could not be loaded. Give it a moment and try again."
        action={
          <ButtonLink to="/products" variant="gradient">
            Retry browsing
          </ButtonLink>
        }
      />
    );
  }

  const total = data.categories.length + data.products.length;

  return (
    <div className="space-y-20">
      {/* ------------------------------------------------------------- hero */}
      <section className="glow-ink relative overflow-hidden rounded-3xl border border-ink-600 bg-ink-900">
        <div aria-hidden className="screentone absolute inset-0 opacity-40" />
        <div
          aria-hidden
          className="animate-aurora pointer-events-none absolute -left-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-halo-1 blur-[110px]"
        />
        <div
          aria-hidden
          className="animate-aurora-slow pointer-events-none absolute -right-40 bottom-[-12rem] h-[34rem] w-[34rem] rounded-full bg-halo-2 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-4 select-none font-display text-[10rem] font-extrabold leading-none text-watermark sm:text-[16rem]"
        >
          漫画
        </div>

        <div className="relative px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
          <div className="max-w-2xl">
            <Badge tone="pink" dot className="animate-pop-in">
              Manga · Manhwa · Donghua
            </Badge>

            <h1 className="animate-rise-in mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-mist-50 sm:text-6xl lg:text-7xl">
              Every panel,
              <br />
              <span className="text-gradient">every world.</span>
            </h1>

            <p
              className="animate-rise-in mt-6 max-w-lg text-base leading-relaxed text-mist-300"
              style={{ animationDelay: '90ms' }}
            >
              Curated genres, fresh volumes every week and order tracking that actually updates. Build your
              shelf, then never lose your place in the story.
            </p>

            <form
              onSubmit={submit}
              className="animate-rise-in mt-9 max-w-lg"
              style={{ animationDelay: '180ms' }}
            >
              <div className="flex items-center gap-2 rounded-2xl border border-ink-600 bg-ink-950/70 p-2 backdrop-blur transition focus-within:border-sakura-400/70 focus-within:shadow-[var(--shadow-focus-ring)]">
                <Search className="ml-2 h-5 w-5 shrink-0 text-mist-500" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search a title, a genre, a feeling…"
                  aria-label="Search titles"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-mist-50 outline-none placeholder:text-mist-500"
                />
                <button
                  type="submit"
                  className="shine h-10 shrink-0 rounded-xl grad-brand px-5 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Search
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-mist-500">
                <Sparkles className="h-3.5 w-3.5 text-sakura-400" />
                <span>Hybrid keyword, trigram &amp; semantic search</span>
              </div>
            </form>

            <div
              className="animate-rise-in mt-10 flex flex-wrap items-center gap-6"
              style={{ animationDelay: '260ms' }}
            >
              <div>
                <p className="font-display text-3xl font-extrabold text-mist-50">{data.categories.length}</p>
                <p className="text-xs uppercase tracking-wider text-mist-500">Genres</p>
              </div>
              <div aria-hidden className="h-10 w-px bg-ink-600" />
              <div>
                <p className="font-display text-3xl font-extrabold text-mist-50">{data.products.length}</p>
                <p className="text-xs uppercase tracking-wider text-mist-500">Fresh titles</p>
              </div>
              <div aria-hidden className="h-10 w-px bg-ink-600" />
              <div>
                <p className="font-display text-3xl font-extrabold text-mist-50">24×7</p>
                <p className="text-xs uppercase tracking-wider text-mist-500">Shelf open</p>
              </div>
            </div>
          </div>
        </div>

        {/* genre ticker */}
        {total > 0 && (
          <div className="relative border-t border-ink-600/50 py-3">
            <div className="flex overflow-hidden">
              <div className="flex shrink-0 animate-marquee items-center gap-8 pr-8">
                {[...data.categories, ...data.categories].map((c, i) => (
                  <span
                    key={`${c.id}-${i}`}
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mist-500"
                  >
                    <span aria-hidden className="h-1 w-1 rounded-full bg-sakura-400" />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ perks */}
      <section className="grid gap-4 sm:grid-cols-3">
        {PERKS.map((p, i) => (
          <div
            key={p.title}
            className="animate-rise-in edge-light flex items-start gap-4 rounded-2xl border border-ink-600/60 bg-ink-850/60 p-5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neon-violet-400/25 bg-neon-violet-500/10 text-neon-violet-300">
              <p.icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-mist-50">{p.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{p.copy}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ----------------------------------------------------------- genres */}
      {data.categories.length > 0 && (
        <section>
          <SectionHeading title="Browse by Genre" sub="Find your world" viewAll={{ to: '/products' }} />

          <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {data.categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/products?category=${encodeURIComponent(c.name)}`}
                className="animate-rise-in group relative h-40 min-w-[45%] shrink-0 snap-start overflow-hidden rounded-2xl border border-ink-600/60 transition-all duration-300 hover:-translate-y-1.5 hover:border-sakura-400/60 hover:shadow-[var(--shadow-card-hover)] sm:min-w-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <img
                  src={c.imageName}
                  alt={c.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={imageFallback()}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/30 to-transparent transition-opacity duration-300 group-hover:from-sakura-500/30"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: 'inset 0 0 0 1px rgb(244 114 182 / 0.5)' }}
                />

                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <span className="text-sm font-bold tracking-wide text-white drop-shadow-md">{c.name}</span>
                </div>
                <ArrowRight
                  aria-hidden
                  className={cx(
                    'absolute right-3.5 top-3.5 h-4 w-4 -translate-x-2 text-white opacity-0 transition-all duration-300',
                    'group-hover:translate-x-0 group-hover:opacity-100',
                  )}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------- new arrivals */}
      <section>
        <SectionHeading title="New Arrivals" sub="Fresh off the press — newest first" viewAll={{ to: '/products' }} />

        {data.products.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="Nothing on the shelf yet"
            description="New arrivals land here as soon as they're stocked."
            action={
              <ButtonLink to="/products" variant="outline">
                Browse the catalogue
              </ButtonLink>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <ButtonLink to="/products" variant="gradient" size="xl">
                Browse all titles
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
