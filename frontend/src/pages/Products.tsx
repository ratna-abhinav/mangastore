import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Filter, PackageSearch, Search, X } from 'lucide-react';
import { fetchCategories, fetchProducts } from '../api/catalog';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

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
      if (value === undefined || value === '' || (value === 0 && key === 'pageNo')) next.delete(key);
      else next.set(key, String(value));
    }
    if (!('pageNo' in patch)) next.delete('pageNo');
    setSearchParams(next);
  };

  const hasFilters = Boolean(keyword || category);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sakura-300">Catalogue</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold text-mist-50 sm:text-4xl">
          {category ? (
            <>
              <span className="text-gradient">{category}</span>
            </>
          ) : keyword ? (
            <>
              Results for <span className="text-gradient">“{keyword}”</span>
            </>
          ) : (
            <>All titles</>
          )}
        </h1>
      </header>

      {/* ------------------------------------------------------- filter bar */}
      <div className="edge-light flex flex-col gap-3 rounded-2xl border border-ink-600/60 bg-ink-850/70 p-3.5 sm:flex-row sm:items-center">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ keyword: searchInput.trim() });
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
            <Input
              value={searchInput}
              onChange={(e) => {
                const next = e.target.value;
                setSearchInput(next);
                if (next.trim() === '') updateParams({ keyword: '', pageNo: 0 });
              }}
              placeholder="Search titles…"
              aria-label="Search titles"
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="gradient">
            Search
          </Button>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchInput('');
                setSearchParams({});
              }}
              aria-label="Clear filters"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </form>

        <div className="relative sm:w-56">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
          <Select
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
            aria-label="Filter by genre"
            className="pl-10"
          >
            <option value="">All genres</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasFilters && products.data && (
        <p className="text-sm text-mist-400">
          {products.data.totalElements} {products.data.totalElements === 1 ? 'title' : 'titles'} found
          {keyword && (
            <>
              {' '}for “<span className="font-semibold text-mist-100">{keyword}</span>”
            </>
          )}
          {category && (
            <>
              {' '}in <span className="font-semibold text-sakura-300">{category}</span>
            </>
          )}
        </p>
      )}

      {/* ----------------------------------------------------------- results */}
      {products.isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !products.data || products.data.content.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-7 w-7" />}
          title={hasFilters ? 'No titles match that' : 'The shelf is empty'}
          description={
            hasFilters
              ? 'Try a different keyword, or clear the filters to see everything we stock.'
              : 'Nothing has been added to the catalogue yet.'
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams({});
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.data.content.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}

      {products.data && (
        <Pagination
          pageNo={products.data.pageNo}
          totalPages={products.data.totalPages}
          onChange={(p) => updateParams({ pageNo: p })}
        />
      )}
    </div>
  );
}
