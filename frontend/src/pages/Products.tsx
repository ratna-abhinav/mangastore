import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts } from '../api/catalog';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const category = searchParams.get('category') ?? '';
  const pageNo = Number(searchParams.get('pageNo') ?? 0);
  const [searchInput, setSearchInput] = useState(keyword);

  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const products = useQuery({
    queryKey: ['products', keyword, category, pageNo],
    queryFn: () => fetchProducts({ keyword, category, pageNo }),
    placeholderData: keepPreviousData,
  });

  const updateParams = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '' || value === 0 && key === 'pageNo') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    if (!('pageNo' in patch)) next.delete('pageNo');
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ keyword: searchInput.trim() });
          }}
        >
          <input
            value={searchInput}
            onChange={(e) => {
              const next = e.target.value;
              setSearchInput(next);
              if (next.trim() === '') {
                updateParams({ keyword: '', pageNo: 0 });
              }
            }}
            placeholder="Search titles…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
            Search
          </button>
          {(keyword || category) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-red-400 hover:text-red-500"
            >
              Clear
            </button>
          )}
        </form>

        <select
          value={category}
          onChange={(e) => updateParams({ category: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All genres</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {(keyword || category) && (
        <p className="text-sm text-slate-500">
          Showing results
          {keyword && (
            <>
              {' '}for “<span className="font-medium text-slate-700">{keyword}</span>”
            </>
          )}
          {category && (
            <>
              {' '}in <span className="font-medium text-emerald-600">{category}</span>
            </>
          )}
          {products.data ? <> · {products.data.totalElements} found</> : null}
        </p>
      )}

      {products.isLoading ? (
        <p className="py-16 text-center text-slate-500">Loading products…</p>
      ) : !products.data || products.data.content.length === 0 ? (
        <p className="rounded-xl bg-white p-12 text-center text-slate-500">Currently, no products available!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.data.content.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {products.data && products.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={products.data.first}
            onClick={() => updateParams({ pageNo: pageNo - 1 })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="px-2 text-sm text-slate-600">
            Page {products.data.pageNo + 1} of {products.data.totalPages}
          </span>
          <button
            disabled={products.data.last}
            onClick={() => updateParams({ pageNo: pageNo + 1 })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
