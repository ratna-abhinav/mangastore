import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminOrders, updateOrderStatus } from '../../api/adminApi';
import { inr } from '../../utils/format';
import { useToast } from '../../components/Toast';

const STATUSES = [
  { id: 1, name: 'In Progress' },
  { id: 2, name: 'Order Received' },
  { id: 3, name: 'Product Shipped' },
  { id: 4, name: 'Out for Delivery' },
  { id: 5, name: 'Delivered' },
  { id: 6, name: 'Cancelled' },
  { id: 7, name: 'Success' },
];

const statusStyles: Record<string, string> = {
  'In Progress': 'bg-amber-100 text-amber-700',
  'Order Received': 'bg-blue-100 text-blue-700',
  'Product Shipped': 'bg-indigo-100 text-indigo-700',
  'Out for Delivery': 'bg-violet-100 text-violet-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-600',
  Success: 'bg-emerald-100 text-emerald-700',
};

export default function AdminOrders() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pageNo, setPageNo] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [pendingId, setPendingId] = useState<number | null>(null);

  const orders = useQuery({
    queryKey: ['admin-orders', orderIdFilter, pageNo],
    queryFn: () => fetchAdminOrders(orderIdFilter, pageNo),
    placeholderData: (prev) => prev,
  });

  const changeStatus = async (id: number, st: number) => {
    if (pendingId !== null) return;
    setPendingId(id);
    try {
      await updateOrderStatus(id, st);
      toast('success', 'Order Status Updated !!');
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch {
      toast('error', 'Status not updated. Internal Server Error !!');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Orders</h1>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOrderIdFilter(searchInput);
          setPageNo(0);
        }}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by order id…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">Search</button>
        {orderIdFilter && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setOrderIdFilter('');
              setPageNo(0);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-red-400 hover:text-red-500"
          >
            Clear
          </button>
        )}
      </form>

      {orders.isLoading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : !orders.data || orders.data.orders.length === 0 ? (
        <p className="rounded-xl bg-white p-10 text-center text-slate-500">No such OrderID present !!</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.data.orders.map((o) => (
                <tr key={o.id} className={pendingId === o.id ? 'opacity-40' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-500">#{o.orderId.slice(0, 8)}…</p>
                    <p className="text-xs text-slate-400">{o.orderDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={o.productImage} alt="" className="h-10 w-10 rounded object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-slate-800">{o.productTitle}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{o.quantity}</td>
                  <td className="px-4 py-3 font-semibold">{inr(o.price)}</td>
                  <td className="px-4 py-3 text-slate-600">{o.paymentType}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[o.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {o.status}
                      </span>
                      <select
                        value={[...STATUSES].find((s) => s.name === o.status)?.id ?? ''}
                        onChange={(e) => void changeStatus(o.id, Number(e.target.value))}
                        disabled={pendingId !== null}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-emerald-500 disabled:opacity-40"
                        aria-label={`Update status for order ${o.id}`}
                      >
                        {[...STATUSES].map((s) => (
                          <option key={s.id} value={s.id}>
                            → {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.data && (orders.data.totalPages ?? 0) > 1 && !orderIdFilter && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={pageNo === 0} onClick={() => setPageNo(pageNo - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40">
            ← Prev
          </button>
          <span className="text-slate-600">
            Page {pageNo + 1} of {orders.data.totalPages}
          </span>
          <button
            disabled={(orders.data.totalPages ?? 0) <= pageNo + 1}
            onClick={() => setPageNo(pageNo + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
