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
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Browse by Genre</h2>
          <Link to="/products" className="text-sm text-emerald-600 hover:underline">
            View all products →
          </Link>
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
        <h2 className="mb-4 text-xl font-bold text-slate-800">Featured Titles</h2>
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
