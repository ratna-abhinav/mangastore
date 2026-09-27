import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, PackageOpen, Wallet } from 'lucide-react';
import { cancelOrder, fetchMyOrders } from '../api/userArea';
import { inr } from '../utils/format';
import { useToast } from '../components/Toast';
import Badge, { statusTone } from '../components/ui/Badge';
import { ButtonLink } from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LoadingBlock } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useConfirm } from '../components/ui/Confirm';
import { imageFallback } from '../utils/image';

export default function MyOrders() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [cancellingIds, setCancellingIds] = useState<number[]>([]);
  const orders = useQuery({ queryKey: ['my-orders'], queryFn: fetchMyOrders });

  const cancel = async (id: number) => {
    if (cancellingIds.includes(id)) return;
    const ok = await confirm({
      title: 'Cancel this order?',
      message: 'This cannot be undone.',
      confirmLabel: 'Cancel order',
    });
    if (!ok) return;

    setCancellingIds((prev) => [...prev, id]);
    try {
      await cancelOrder(id);
      toast('info', 'Order cancelled !!');
      void queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch {
      toast('error', 'Failed to cancel order');
    } finally {
      setCancellingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  if (orders.isLoading) return <LoadingBlock label="Loading your orders…" />;

  const data = orders.data;
  if (!data || data.orders.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen className="h-7 w-7" />}
        title="No previous orders yet"
        description="Once you place an order it will show up here with live status updates."
        action={
          <ButtonLink to="/products" variant="gradient" size="lg">
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sakura-300">History</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold text-mist-50 sm:text-4xl">My orders</h1>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-ink-600/60 bg-ink-850/70 px-4 py-2">
          <Wallet className="h-4 w-4 text-sakura-300" />
          <span className="text-xs text-mist-400">Total spent</span>
          <span className="text-sm font-extrabold text-mist-50">{inr(data.totalSpent)}</span>
        </div>
      </header>

      <div className="space-y-4">
        {data.orders.map((o, i) => {
          const cancellable = o.status === 'In Progress' || o.status === 'Order Received';
          return (
            <Card
              key={o.id}
              className="animate-rise-in flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}
            >
              <img
                src={o.productImage}
                alt={o.productTitle}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={imageFallback()}
                className="h-24 w-24 shrink-0 rounded-xl border border-ink-600/60 object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="font-bold text-mist-50">{o.productTitle}</p>
                <p className="mt-0.5 font-mono text-xs text-mist-500">
                  #{o.orderId} · {o.orderDate} · {o.paymentType}
                </p>
                <p className="mt-1.5 text-sm text-mist-400">
                  Qty {o.quantity} × {inr(o.price / Math.max(o.quantity, 1))}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <Badge tone={statusTone(o.status)} dot glow>
                  {o.status}
                </Badge>
                <span className="font-display text-lg font-extrabold text-mist-50">{inr(o.price)}</span>
                {cancellable && (
                  <button
                    type="button"
                    onClick={() => void cancel(o.id)}
                    disabled={cancellingIds.includes(o.id)}
                    className="text-xs font-semibold text-crimson-300 transition hover:text-crimson-400 disabled:opacity-40"
                  >
                    {cancellingIds.includes(o.id) ? 'Cancelling…' : 'Cancel order'}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
