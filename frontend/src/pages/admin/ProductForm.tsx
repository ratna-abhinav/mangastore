import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PackagePlus, Save } from 'lucide-react';
import { createProduct, fetchAllCategories, updateProduct } from '../../api/adminApi';
import { fetchProduct } from '../../api/catalog';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Alert from '../../components/ui/Alert';
import Button, { ButtonLink } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import { Checkbox, FileInput, Input, Select, Textarea } from '../../components/ui/Input';
import { LoadingBlock } from '../../components/ui/Skeleton';

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

  if (editing && existing.isLoading) return <LoadingBlock label="Loading product…" />;

  if (editing && !existing.data) {
    return (
      <div className="py-16 text-center">
        <p className="text-mist-400">Product not found.</p>
        <Link to="/admin/products" className="mt-3 inline-block text-sm font-semibold text-sakura-300 hover:underline">
          ← Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={editing ? `Edit product #${id}` : 'Add product'}
        description={editing ? 'Update the listing details below.' : 'Create a new listing for the storefront.'}
        icon={<PackagePlus className="h-5 w-5" />}
        crumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Products', to: '/admin/products' },
          { label: editing ? `Edit #${id}` : 'New' },
        ]}
      />

      <Card as="form" onSubmit={submit} className="space-y-5 p-6 sm:p-8">
        {error && <Alert tone="error">{error}</Alert>}

        <Field label="Title" htmlFor="title" required>
          <Input id="title" required value={form.title} onChange={set('title')} />
        </Field>

        <Field label="Description" htmlFor="description" required>
          <Textarea id="description" required rows={5} value={form.description} onChange={set('description')} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" required>
            <Select id="category" required value={form.category} onChange={set('category')}>
              <option value="">— select —</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Price (₹)" htmlFor="price" required>
            <Input id="price" type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} />
          </Field>
          <Field label="Stock" htmlFor="stock" required>
            <Input id="stock" type="number" min="0" required value={form.stock} onChange={set('stock')} />
          </Field>
          <Field label="Discount" htmlFor="discount" hint="%">
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={form.discount}
              onChange={set('discount')}
            />
          </Field>
          <Field label="Cover image" htmlFor="img" hint="optional">
            <FileInput id="img" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          <label className="flex items-end gap-2.5 pb-2.5 text-sm font-medium text-mist-200">
            <Checkbox checked={form.isActive} onChange={set('isActive')} />
            Active (visible in store)
          </label>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button type="submit" variant="gradient" loading={busy}>
            <Save className="h-4 w-4" />
            {busy ? 'Saving…' : editing ? 'Update product' : 'Save product'}
          </Button>
          <ButtonLink to="/admin/products" variant="outline">
            Cancel
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
