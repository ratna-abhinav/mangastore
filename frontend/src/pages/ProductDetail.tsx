import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { addToCart } from '../api/userArea';
import { fetchProduct } from '../api/catalog';
import { inr } from '../utils/format';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { user, refresh } = useAuth();
  const [adding, setAdding] = useState(false);
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    retry: false,
  });

  const add = async () => {
    if (!user) {
      toast('info', 'Please sign in to add items to your cart.');
      return;
    }
    if (adding) return;
    setAdding(true);
    try {
      const res = await addToCart(product!.id);
      await refresh();
      toast('success', `Added to cart !! (cart: ${res.cartCount})`);
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 409) {
        toast('error', 'Cannot add more !!');
      } else {
        toast('error', 'Cannot be added !!');
      }
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return <p className="py-20 text-center text-slate-500">Loading product…</p>;
  if (isError || !product)
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Product not found.</p>
        <Link to="/products" className="text-emerald-600 hover:underline">
          ← Back to products
        </Link>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
        <img
          src={product.image}
          alt={product.title}
          className="max-h-96 w-auto rounded-lg object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="space-y-5 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{product.category}</p>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">{product.title}</h1>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-slate-900">{inr(product.discountedPrice)}</span>
          {product.discount > 0 && (
            <>
              <span className="text-lg text-slate-400 line-through">{inr(product.price)}</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-700">
                {product.discount}% off
              </span>
            </>
          )}
        </div>

        <p>
          {product.stock > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              ● Available ({product.stock} in stock)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              ● Out of stock
            </span>
          )}
        </p>

        <button
          onClick={() => void add()}
          disabled={product.stock === 0 || adding}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-64"
        >
          {adding ? 'Adding…' : 'Add to Cart 🛒'}
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 font-semibold text-slate-800">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
        </div>

        <Link to="/products" className="inline-block text-sm text-emerald-600 hover:underline">
          ← Back to all products
        </Link>
      </div>
    </div>
  );
}
