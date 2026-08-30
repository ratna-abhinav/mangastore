import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchHome } from '../api/catalog';
import ProductCard from '../components/ProductCard';

export default function StoreHome() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['home'], queryFn: fetchHome });

  if (isLoading)
    return (
      <div className="space-y-6 py-20">
        <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );

  if (isError || !data) return <p className="py-20 text-center text-red-500">Failed to load the store.</p>;

  return (
    <div className="animate-fade-up space-y-14">
      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 shadow-xl sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            ● Your manga shelf, online
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Manga, manhwa &amp; donghua —
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              one endless shelf.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            Discover curated genres, follow your orders in real time, and grab the next volume of your current
            obsession before it sells out.
          </p>

          <form action="/products" className="mt-7 flex max-w-md overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-white/20">
            <input
              name="keyword"
              placeholder="Search titles…"
              className="w-full bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ---------------------------------------------------------- genres */}
      <section>
        <SectionHeading title="Browse by Genre" sub="Find your world" />
        <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5 lg:flex-wrap lg:overflow-visible">
          {data.categories.map((c, i) => (
            <Link
              key={c.id}
              to={`/products?category=${encodeURIComponent(c.name)}`}
              className="group relative block h-36 min-w-[45%] shrink-0 snap-start overflow-hidden rounded-2xl shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-w-0 lg:h-40"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img
                src={c.imageName}
                alt={c.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://br-wispy-block-a5yj4c8a.storage.c-1.us-east-2.aws.neon.tech/media-storage/defaults/default-image.png";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                <span className="text-sm font-bold tracking-wide text-white drop-shadow">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- new arrivals */}
      <section>
        <SectionHeading title="New Arrivals" sub="Fresh off the press — newest first" />
        {data.products.length === 0 ? (
          <p className="rounded-2xl bg-white p-12 text-center text-slate-500">Currently, no products available!</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.products.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                Browse all titles
                <span aria-hidden>→</span>
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div className="flex items-center gap-3">
        <span className="hidden h-8 w-1.5 rounded-full bg-emerald-500 sm:block" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          {sub && <p className="text-sm text-slate-500">{sub}</p>}
        </div>
      </div>
      <Link to="/products" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
        View all →
      </Link>
    </div>
  );
}
