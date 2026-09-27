import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingBag, X } from 'lucide-react';
import { fetchAdminOrders, updateOrderStatus } from '../../api/adminApi';
import { inr } from '../../utils/format';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusTone } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Input, Select } from '../../components/ui/Input';
import { Table, TableShell, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { imageFallback } from '../../utils/image';

const STATUSES = [
  { id: 1, name: 'In Progress' },
  { id: 2, name: 'Order Received' },
  { id: 3, name: 'Product Shipped' },
  { id: 4, name: 'Out for Delivery' },
  { id: 5, name: 'Delivered' },
  { id: 6, name: 'Cancelled' },
  { id: 7, name: 'Success' },
];

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
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch {
      toast('error', 'Status not updated. Internal Server Error !!');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Move orders through their fulfilment statuses."
        icon={<ShoppingBag className="h-5 w-5" />}
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Orders' }]}
      />

      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOrderIdFilter(searchInput.trim());
          setPageNo(0);
        }}
      >
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by order id…"
            aria-label="Search orders by order id"
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
        {orderIdFilter && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setOrderIdFilter('');
              setPageNo(0);
            }}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </form>

      {orders.isLoading ? (
        <TableSkeleton />
      ) : !orders.data || orders.data.orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="No orders found"
          description={orderIdFilter ? `No order matches “${orderIdFilter}”.` : 'Orders will appear here as they come in.'}
        />
      ) : (
        <TableShell>
          <Table minWidth={860}>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Product</TH>
                <TH>Qty</TH>
                <TH>Price</TH>
                <TH>Payment</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {orders.data.orders.map((o) => (
                <TR key={o.id} muted={pendingId === o.id}>
                  <TD>
                    <p className="font-mono text-xs whitespace-nowrap text-mist-400">#{o.orderId.slice(0, 8)}…</p>
                    <p className="mt-0.5 text-xs whitespace-nowrap text-mist-500">{o.orderDate}</p>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <img
                        src={o.productImage}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={imageFallback()}
                        className="h-10 w-10 shrink-0 rounded-lg border border-ink-600/60 object-cover"
                      />
                      <span className="font-semibold text-mist-50">{o.productTitle}</span>
                    </div>
                  </TD>
                  <TD>{o.quantity}</TD>
                  <TD className="font-semibold">{inr(o.price)}</TD>
                  <TD className="text-mist-400">{o.paymentType}</TD>
                  <TD>
                    <div className="flex w-44 flex-col items-start gap-1.5">
                      <Badge tone={statusTone(o.status)} dot>
                        {o.status}
                      </Badge>
                      <Select
                        value={[...STATUSES].find((s) => s.name === o.status)?.id ?? ''}
                        onChange={(e) => void changeStatus(o.id, Number(e.target.value))}
                        disabled={pendingId !== null}
                        aria-label={`Update status for order ${o.id}`}
                        className="text-xs"
                      >
                        {[...STATUSES].map((s) => (
                          <option key={s.id} value={s.id}>
                            → {s.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableShell>
      )}

      {orders.data && (orders.data.totalPages ?? 0) > 1 && !orderIdFilter && (
        <Pagination className="mt-5" pageNo={pageNo} totalPages={orders.data.totalPages ?? 1} onChange={setPageNo} />
      )}
    </div>
  );
}
