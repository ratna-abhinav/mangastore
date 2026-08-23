import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCart, removeCartItem, updateCartItem } from '../api/userArea';
import { inr } from '../utils/format';
import { useToast } from '../components/Toast';

export default function Cart() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const cart = useQuery({ queryKey: ['cart'], queryFn: fetchCart, placeholderData: keepPreviousData });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['cart'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
    void queryClient.invalidateQueries({ queryKey: ['auth'] });
  };

  const changeQty = async (id: number, action: 'in' | 'de') => {
    try {
      await updateCartItem(id, action);
      refreshAll();
    } catch {
      toast('error', 'Cannot add more !!');
    }
  };

  const remove = async (id: number) => {
    try {
      await removeCartItem(id);
      toast('info', 'Item removed from cart');
      refreshAll();
    } catch {
      toast('error', 'Failed to remove item');
    }
  };

  if (cart.isLoading) return <p className="py-16 text-center text-slate-500">Loading cart…</p>;

  const data = cart.data;
  if (!data || data.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-slate-600">Your cart is currently empty 🛒</p>
        <Link to="/products" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {data.items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <img src={item.image} alt={item.title} className="h-20 w-20 rounded-lg object-cover" referrerPolicy="no-referrer" />
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/product/${item.productId}`} className="font-semibold text-slate-800 hover:text-emerald-600">
                  {item.title}
                </Link>
                <span className="whitespace-nowrap font-bold text-slate-900">{inr(item.totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void changeQty(item.id, 'de')}
                    className="h-8 w-8 rounded-full border border-slate-300 text-slate-600 hover:border-emerald-500"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => void changeQty(item.id, 'in')}
                    className="h-8 w-8 rounded-full border border-slate-300 text-slate-600 hover:border-emerald-500"
                  >
                    +
                  </button>
                  <span className="ml-2 text-xs text-slate-400">{inr(item.discountedPrice)} each</span>
                </div>
                <button onClick={() => void remove(item.id)} className="text-sm text-red-400 hover:text-red-600">
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Order Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Items ({data.items.length})</dt>
            <dd className="font-semibold">{inr(data.totalOrderPrice)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Fees &amp; delivery</dt>
            <dd className="text-slate-500">Calculated at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-extrabold">{inr(data.totalOrderPrice)}</dd>
          </div>
        </dl>
        <Link
          to="/checkout"
          className="mt-5 block rounded-lg bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-500"
        >
          Proceed to checkout →
        </Link>
      </aside>
    </div>
  );
}
