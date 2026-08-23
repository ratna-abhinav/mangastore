import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, fetchMyOrders } from '../api/userArea';
import { inr } from '../utils/format';
import { useToast } from '../components/Toast';

const statusStyles: Record<string, string> = {
  'In Progress': 'bg-amber-100 text-amber-700',
  'Order Received': 'bg-blue-100 text-blue-700',
  'Product Shipped': 'bg-indigo-100 text-indigo-700',
  'Out for Delivery': 'bg-violet-100 text-violet-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
  Success: 'bg-emerald-100 text-emerald-700',
};

export default function MyOrders() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const orders = useQuery({ queryKey: ['my-orders'], queryFn: fetchMyOrders });

  const cancel = async (id: number) => {
    if (cancellingId !== null) return;
    setCancellingId(id);
    try {
      await cancelOrder(id);
      toast('info', 'Order cancelled !!');
      void queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch {
      toast('error', 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (orders.isLoading) return <p className="py-16 text-center text-slate-500">Loading your orders…</p>;

  const data = orders.data;
  if (!data || data.orders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-slate-600">No previous orders yet 📦</p>
        <Link to="/products" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
        <p className="text-sm text-slate-500">Total spent (incl. fees): <span className="font-semibold text-slate-700">{inr(data.totalSpent)}</span></p>
      </div>

      {data.orders.map((o) => (
        <div key={o.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <img src={o.productImage} alt={o.productTitle} className="h-20 w-20 rounded-lg object-cover" referrerPolicy="no-referrer" />
          <div className="flex-1">
            <p className="font-semibold text-slate-800">{o.productTitle}</p>
            <p className="text-xs text-slate-400">Order #{o.orderId} · {o.orderDate} · {o.paymentType}</p>
            <p className="mt-1 text-sm text-slate-500">
              Qty {o.quantity} × {inr(o.price / Math.max(o.quantity, 1))}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {o.status}
            </span>
            <span className="font-bold text-slate-900">{inr(o.price)}</span>
            {(o.status === 'In Progress' || o.status === 'Order Received') && (
              <button
                onClick={() => void cancel(o.id)}
                disabled={cancellingId !== null}
                className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
              >
                {cancellingId === o.id ? 'Cancelling…' : 'Cancel order'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
