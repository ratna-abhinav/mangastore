import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { deleteProduct, fetchAdminProducts } from '../../api/adminApi';
import { inr } from '../../utils/format';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button, { ButtonLink } from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Table, TableShell, TBody, TD, TH, THead, TR } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useConfirm } from '../../components/ui/Confirm';
import { imageFallback } from '../../utils/image';

export default function AdminProducts() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageNo = Number(searchParams.get('pageNo') ?? 0);
  const keyword = searchParams.get('keyword') ?? '';
  const [searchInput, setSearchInput] = useState(keyword);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const products = useQuery({
    queryKey: ['admin-products', keyword, pageNo],
    queryFn: () => fetchAdminProducts(keyword, pageNo),
    placeholderData: keepPreviousData,
  });

  const remove = async (id: number, title: string) => {
    const ok = await confirm({
      title: 'Delete this product?',
      message: `“${title}” will be removed permanently.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await deleteProduct(id);
      toast('info', 'Product successfully deleted');
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch {
      toast('error', 'Product not deleted! Internal server error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Everything listed in the storefront."
        icon={<Package className="h-5 w-5" />}
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Products' }]}
        actions={
          <ButtonLink to="/admin/add-product" variant="gradient">
            <Plus className="h-4 w-4" />
            Add product
          </ButtonLink>
        }
      />

      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(searchParams);
          searchInput ? next.set('keyword', searchInput.trim()) : next.delete('keyword');
          next.delete('pageNo');
          setSearchParams(next);
        }}
      >
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title…"
            aria-label="Search products by title"
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {products.isLoading ? (
        <TableSkeleton />
      ) : !products.data || products.data.content.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="No products found"
          description="Nothing matches that search, or nothing has been added yet."
          action={
            <ButtonLink to="/admin/add-product" variant="gradient">
              <Plus className="h-4 w-4" />
              Add product
            </ButtonLink>
          }
        />
      ) : (
        <TableShell>
          <Table minWidth={760}>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Stock</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {products.data.content.map((p) => (
                <TR key={p.id} muted={deletingId === p.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={imageFallback()}
                        className="h-10 w-10 shrink-0 rounded-lg border border-ink-600/60 object-cover"
                      />
                      <span className="font-semibold text-mist-50">{p.title}</span>
                    </div>
                  </TD>
                  <TD className="text-mist-400">{p.category}</TD>
                  <TD className="font-semibold">{inr(p.discountedPrice)}</TD>
                  <TD>{p.stock}</TD>
                  <TD>
                    <Badge tone={p.isActive === 1 ? 'mint' : 'crimson'} dot>
                      {p.isActive === 1 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-2">
                      <ButtonLink to={`/admin/edit-product/${p.id}`} variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </ButtonLink>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void remove(p.id, p.title)}
                        disabled={deletingId !== null}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === p.id ? 'Deleting…' : 'Delete'}
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableShell>
      )}

      {products.data && (
        <Pagination
          className="mt-5"
          pageNo={products.data.pageNo}
          totalPages={products.data.totalPages}
          onChange={(p) => setSearchParams({ ...(keyword ? { keyword } : {}), pageNo: String(p) })}
        />
      )}
    </div>
  );
}
