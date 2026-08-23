import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchHome } from '../api/catalog';
import ProductCard from '../components/ProductCard';

export default function StoreHome() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['home'], queryFn: fetchHome });

  if (isLoading) return <p className="py-20 text-center text-slate-500">Loading store…</p>;
  if (isError || !data) return <p className="py-20 text-center text-red-500">Failed to load the store.</p>;

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white p-8 shadow-sm">
        <h1 className="max-w-lg text-3xl font-extrabold leading-tight text-slate-900">
          Manga, manhwa &amp; donghua — <span className="text-emerald-600">one shelf.</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Discover curated genres, track your orders, and grab the next volume of your current obsession.
        </p>
        <form action="/products" className="mt-5 flex max-w-md gap-2">
          <input
            name="keyword"
            placeholder="Search titles…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          />
          <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
            Search
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Browse by Genre</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category=${encodeURIComponent(c.name)}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                src={c.imageName}
                alt={c.name}
                className="h-28 w-full object-cover"
                referrerPolicy="no-referrer"
              />
              <p className="py-3 text-center text-sm font-semibold text-slate-700 group-hover:text-emerald-600">
                {c.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">New Arrivals</h2>
            <p className="text-sm text-slate-500">The latest additions to the shelf</p>
          </div>
          <Link to="/products" className="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50">
            View all products →
          </Link>
        </div>
        {data.products.length === 0 ? (
          <p className="rounded-xl bg-white p-8 text-center text-slate-500">Currently, no products available!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
