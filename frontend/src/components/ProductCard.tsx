import { Link } from 'react-router-dom';
import type { Product } from '../api/catalog';
import { inr } from '../utils/format';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/product/${product.id}`} className="block">
        <img
          src={product.image}
          alt={product.title}
          className="h-44 w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-emerald-600">{product.category}</p>
        <h3 className="flex-1 text-sm font-semibold leading-snug text-slate-800">
          <Link to={`/product/${product.id}`} className="hover:text-emerald-600">
            {product.title}
          </Link>
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-slate-900">{inr(product.discountedPrice)}</span>
          {product.discount > 0 && (
            <>
              <span className="text-sm text-slate-400 line-through">{inr(product.price)}</span>
              <span className="text-xs font-medium text-emerald-600">{product.discount}% off</span>
            </>
          )}
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-2 rounded-lg bg-emerald-600 py-2 text-center text-sm font-medium text-white hover:bg-emerald-500"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
