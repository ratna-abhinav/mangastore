import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProduct, fetchAdminProducts } from '../../api/adminApi';
import { inr } from '../../utils/format';
import { useToast } from '../../components/Toast';

export default function AdminProducts() {
  const toast = useToast();
  const queryClient = useQueryClient();
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

  const remove = async (id: number) => {
    if (!window.confirm('Delete this product permanently?')) return;
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Products</h1>
        <Link
          to="/admin/add-product"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + Add Product
        </Link>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new URLSearchParams(searchParams);
          searchInput ? next.set('keyword', searchInput.trim()) : next.delete('keyword');
          next.delete('pageNo');
          setSearchParams(next);
        }}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by title…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">Search</button>
      </form>

      {products.isLoading ? (
        <p className="py-12 text-center text-slate-500">Loading…</p>
      ) : !products.data || products.data.content.length === 0 ? (
        <p className="rounded-xl bg-white p-10 text-center text-slate-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.data.content.map((p) => (
                <tr key={p.id} className={deletingId === p.id ? 'opacity-40' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-slate-800">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                  <td className="px-4 py-3">{inr(p.discountedPrice)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.isActive === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {p.isActive === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/admin/edit-product/${p.id}`} className="font-medium text-emerald-600 hover:underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => void remove(p.id)}
                        disabled={deletingId !== null}
                        className="font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        {deletingId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.data && products.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1 text-sm">
          <button
            disabled={products.data.first}
            onClick={() => setSearchParams({ ...(keyword ? { keyword } : {}), pageNo: String(pageNo - 1) })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-slate-600">Page {products.data.pageNo + 1} of {products.data.totalPages}</span>
          <button
            disabled={products.data.last}
            onClick={() => setSearchParams({ ...(keyword ? { keyword } : {}), pageNo: String(pageNo + 1) })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
