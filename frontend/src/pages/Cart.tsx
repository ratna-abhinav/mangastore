import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { fetchCart, removeCartItem, updateCartItem } from '../api/userArea';
import { useAuth } from '../context/AuthContext';
import { inr } from '../utils/format';
import { useToast } from '../components/Toast';
import { ButtonLink } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LoadingBlock } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { imageFallback } from '../utils/image';
import { cx } from '../utils/cx';

export default function Cart() {
  const toast = useToast();
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  type PendingKind = 'in' | 'de' | 'remove';
  const [pending, setPending] = useState<{ id: number; kind: PendingKind }[]>([]);
  const cart = useQuery({ queryKey: ['cart'], queryFn: fetchCart, placeholderData: keepPreviousData });

  const isPending = (id: number) => pending.some((p) => p.id === id);
  const pendingKind = (id: number, kind: PendingKind) => pending.some((p) => p.id === id && p.kind === kind);

  const mutate = async (
    id: number,
    kind: PendingKind,
    fn: () => Promise<void>,
    opts?: { successMsg?: string; errorMsg?: string },
  ) => {
    if (isPending(id)) return;
    setPending((prev) => [...prev, { id, kind }]);
    try {
      await fn();
      await refresh();
      if (opts?.successMsg) toast('info', opts.successMsg);
    } catch {
      toast('error', opts?.errorMsg ?? 'Something went wrong. Please try again.');
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['cart'] });
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      setPending((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const changeQty = (id: number, action: 'in' | 'de') =>
    mutate(id, action, () => updateCartItem(id, action), { errorMsg: 'Cannot add more !!' });
  const remove = (id: number) =>
    mutate(id, 'remove', () => removeCartItem(id), {
      successMsg: 'Item removed from cart',
      errorMsg: 'Failed to remove item',
    });

  if (cart.isLoading) return <LoadingBlock label="Loading cart…" />;

  const data = cart.data;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-7 w-7" />}
        title="Your cart is empty"
        description="Nothing on the shelf yet. Find a title worth collecting."
        action={
          <ButtonLink to="/products" variant="gradient" size="lg">
            Browse products
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sakura-300">Your bag</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold text-mist-50 sm:text-4xl">Shopping cart</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {data.items.map((item, i) => (
            <Card
              key={item.id}
              className="animate-rise-in flex gap-4 p-4"
              style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}
            >
              <Link
                to={`/product/${item.productId}`}
                className="shrink-0 overflow-hidden rounded-xl border border-ink-600/60"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={imageFallback()}
                  className="h-24 w-24 object-cover transition-transform duration-500 hover:scale-105"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/product/${item.productId}`}
                    className="line-clamp-2 text-sm font-bold text-mist-50 transition hover:text-sakura-300"
                  >
                    {item.title}
                  </Link>
                  <span className="shrink-0 font-display text-base font-extrabold text-mist-50">
                    {inr(item.totalPrice)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <QtyButton
                      onClick={() => changeQty(item.id, 'de')}
                      disabled={isPending(item.id)}
                      label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </QtyButton>
                    <span className="w-7 text-center text-sm font-bold text-mist-50">{item.quantity}</span>
                    <QtyButton
                      onClick={() => changeQty(item.id, 'in')}
                      disabled={isPending(item.id) || item.quantity >= item.stock}
                      label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </QtyButton>
                    <span className="ml-1 text-xs text-mist-500">{inr(item.discountedPrice)} each</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    disabled={isPending(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-300 transition hover:text-crimson-400 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {pendingKind(item.id, 'remove') ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ----------------------------------------------------- order summary */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="p-6">
            <h2 className="mb-5 text-lg font-bold text-mist-50">Order summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-mist-400">Items ({data.items.length})</dt>
                <dd className="font-semibold text-mist-100">{inr(data.totalOrderPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-mist-400">Fees &amp; delivery</dt>
                <dd className="text-mist-500">Calculated at checkout</dd>
              </div>
              <div className="divider-glow" />
              <div className="flex items-baseline justify-between">
                <dt className="font-bold text-mist-100">Total</dt>
                <dd className="font-display text-2xl font-extrabold text-gradient">{inr(data.totalOrderPrice)}</dd>
              </div>
            </dl>

            <ButtonLink to="/checkout" variant="gradient" size="lg" full className="mt-6">
              Proceed to checkout
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>

            <Link
              to="/products"
              className="mt-4 block text-center text-xs text-mist-400 transition hover:text-sakura-300"
            >
              Keep shopping
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function QtyButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cx(
        'flex h-8 w-8 items-center justify-center rounded-full border border-ink-600 text-mist-300 transition',
        'hover:border-sakura-400/60 hover:bg-sakura-500/10 hover:text-sakura-200 disabled:pointer-events-none disabled:opacity-35',
      )}
    >
      {children}
    </button>
  );
}
