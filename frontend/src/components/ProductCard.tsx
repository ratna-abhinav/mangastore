import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Product } from '../api/catalog';
import { inr } from '../utils/format';
import { imageFallback } from '../utils/image';
import Badge from './ui/Badge';

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const discounted = product.discount > 0;

  return (
    <article
      className="animate-rise-in group relative flex flex-col overflow-hidden rounded-2xl border border-ink-600/60 bg-ink-850/80 transition-all duration-300 hover:-translate-y-1.5 hover:border-sakura-400/50 hover:shadow-[var(--shadow-card-hover)]"
      style={{ animationDelay: `${Math.min(index, 12) * 70}ms` }}
    >
      {/* gradient hairline on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-[linear-gradient(90deg,transparent,#f472b6,#22d3ee,transparent)] transition-transform duration-500 group-hover:scale-x-100"
      />

      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        <div className="relative h-52 overflow-hidden bg-ink-800">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={imageFallback()}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/20 to-transparent"
          />

          {discounted && (
            <Badge tone="pink" className="absolute left-3 top-3 shadow-[var(--shadow-logo)]">
              {product.discount}% off
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sakura-300">{product.category}</p>

        <h3 className="flex-1 text-sm font-bold leading-snug text-mist-50">
          <Link
            to={`/product/${product.id}`}
            className="line-clamp-2 transition-colors hover:text-sakura-300"
          >
            {product.title}
          </Link>
        </h3>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-extrabold text-mist-50">{inr(product.discountedPrice)}</span>
          {discounted && (
            <span className="text-xs text-mist-500 line-through">{inr(product.price)}</span>
          )}
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-ink-600 bg-ink-800 py-2 text-xs font-semibold text-mist-200 transition-all duration-200 group-hover:border-transparent group-hover:grad-brand group-hover:text-white"
        >
          View details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
