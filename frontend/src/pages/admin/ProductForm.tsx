import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createProduct, fetchAllCategories, updateProduct } from '../../api/adminApi';
import { fetchProduct } from '../../api/catalog';
import { useToast } from '../../components/Toast';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

interface FormState {
  title: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  discount: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  title: '', description: '', category: '', price: '', stock: '', discount: '0', isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const toast = useToast();
  const navigate = useNavigate();

  const categories = useQuery({ queryKey: ['admin-categories-all'], queryFn: fetchAllCategories });
  const existing = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: editing,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing && existing.data) {
      setForm({
        title: existing.data.title ?? '',
        description: existing.data.description ?? '',
        category: existing.data.category ?? '',
        price: String(existing.data.price ?? ''),
        stock: String(existing.data.stock ?? ''),
        discount: String(existing.data.discount ?? 0),
        isActive: existing.data.isActive === 1,
      });
    }
  }, [editing, existing.data]);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((f) => ({
      ...f,
      [key]: key === 'isActive' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const discount = Number(form.discount || 0);

    if (!form.category) return void setError('Please choose a category.');
    if (Number.isNaN(price) || price < 0) return void setError('Enter a valid price.');
    if (Number.isNaN(stock) || stock < 0) return void setError('Enter a valid stock.');
    if (discount < 0 || discount > 100) return void setError('invalid Discount!');

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(), description: form.description.trim(), category: form.category,
        price, stock, discount, isActive: form.isActive, file,
      };
      if (editing) await updateProduct(Number(id), payload);
      else await createProduct(payload);
      toast('success', editing ? 'Product updated successfully !!' : 'Product added successfully !!');
      navigate('/admin/products');
    } catch (err) {
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        setError(body?.error ?? 'Something went wrong.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (editing && existing.isLoading) return <p className="py-16 text-center text-slate-500">Loading product…</p>;
  if (editing && (!existing.data)) return (
    <div className="py-16 text-center">
      <p className="text-slate-600">Product not found.</p>
      <Link to="/admin/products" className="text-emerald-600 hover:underline">← Back</Link>
    </div>
  );

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">{editing ? `Edit product #${id}` : 'Add product'}</h1>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div>
        <label className={labelCls} htmlFor="title">Title *</label>
        <input id="title" required value={form.title} onChange={set('title')} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="description">Description *</label>
        <textarea id="description" required rows={4} value={form.description} onChange={set('description')} className={inputCls} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="category">Category *</label>
          <select id="category" required value={form.category} onChange={set('category')} className={inputCls}>
            <option value="">— select —</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="price">Price (₹) *</label>
          <input id="price" type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="stock">Stock *</label>
          <input id="stock" type="number" min="0" required value={form.stock} onChange={set('stock')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="discount">Discount %</label>
          <input id="discount" type="number" min="0" max="100" value={form.discount} onChange={set('discount')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="img">Image</label>
          <input
            id="img"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 accent-emerald-600" />
          Active (visible in store)
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? 'Saving…' : editing ? 'Update product' : 'Save product'}
        </button>
        <Link to="/admin/products" className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
