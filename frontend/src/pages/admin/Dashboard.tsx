import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../../api/adminApi';

const tiles = [
  { key: 'products', label: 'Products', to: '/admin/products' },
  { key: 'categories', label: 'Categories', to: '/admin/categories' },
  { key: 'orders', label: 'Orders', to: '/admin/orders' },
  { key: 'users', label: 'Users', to: '/admin/users' },
  { key: 'admins', label: 'Admins', to: '/admin/users' },
] as const;

export default function Dashboard() {
  const stats = useQuery({ queryKey: ['admin-dashboard'], queryFn: fetchDashboardStats });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.key}
            to={t.to}
            className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
          >
            <p className="text-3xl font-extrabold text-emerald-600">
              {stats.data ? stats.data[t.key as keyof typeof stats.data] : '–'}
            </p>
            <p className="mt-1 text-sm text-slate-500">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink to="/admin/add-product" title="Add Product" desc="Create a new product listing" />
        <QuickLink to="/admin/categories" title="Add Category" desc="Manage storefront genres" />
        <QuickLink to="/admin/orders" title="Orders" desc="Update order statuses" />
        <QuickLink to="/admin/users?type=1" title="Users" desc="Enable / disable accounts" />
        <QuickLink to="/admin/add-admin" title="Add Admin" desc="Register a new administrator" />
      </div>
    </div>
  );
}

function QuickLink({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
    >
      <p className="font-semibold text-slate-800">{title} →</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
