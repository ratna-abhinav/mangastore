import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  FolderTree,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  UserCog,
  Users,
} from 'lucide-react';
import { fetchDashboardStats } from '../../api/adminApi';
import PageHeader from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { cx } from '../../utils/cx';

const TILES = [
  { key: 'products', label: 'Products', to: '/admin/products', icon: Package, tint: 'sakura' },
  { key: 'categories', label: 'Categories', to: '/admin/categories', icon: FolderTree, tint: 'violet' },
  { key: 'orders', label: 'Orders', to: '/admin/orders', icon: ShoppingBag, tint: 'cyan' },
  { key: 'users', label: 'Users', to: '/admin/users', icon: Users, tint: 'mint' },
  { key: 'admins', label: 'Admins', to: '/admin/users?type=2', icon: UserCog, tint: 'flare' },
] as const;

const TINTS: Record<string, string> = {
  sakura: 'border-sakura-500/25 bg-sakura-500/10 text-sakura-300',
  violet: 'border-neon-violet-500/25 bg-neon-violet-500/10 text-neon-violet-300',
  cyan: 'border-neon-cyan-500/25 bg-neon-cyan-500/10 text-neon-cyan-300',
  mint: 'border-mint-500/25 bg-mint-500/10 text-mint-300',
  flare: 'border-flare-500/25 bg-flare-500/10 text-flare-300',
};

const QUICK_LINKS = [
  { to: '/admin/add-product', title: 'Add product', desc: 'Create a new listing', icon: Plus },
  { to: '/admin/categories', title: 'Manage categories', desc: 'Storefront genres & artwork', icon: FolderTree },
  { to: '/admin/orders', title: 'Update orders', desc: 'Move orders through statuses', icon: ShoppingBag },
  { to: '/admin/users?type=1', title: 'Manage users', desc: 'Enable / disable accounts', icon: Users },
  { to: '/admin/add-admin', title: 'Add admin', desc: 'Register an administrator', icon: UserCog },
  { to: '/products', title: 'View storefront', desc: 'See what shoppers see', icon: LayoutDashboard },
];

export default function Dashboard() {
  const stats = useQuery({ queryKey: ['admin-dashboard'], queryFn: fetchDashboardStats });

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Everything happening across the store right now."
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {TILES.map((t, i) => (
          <Link
            key={t.key}
            to={t.to}
            className="animate-rise-in card-hover group relative overflow-hidden rounded-2xl border border-ink-600/60 bg-ink-850/80 p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className={cx(
                'mb-4 flex h-10 w-10 items-center justify-center rounded-xl border',
                TINTS[t.tint],
              )}
            >
              <t.icon className="h-4.5 w-4.5" />
            </span>
            {stats.data ? (
              <p className="font-display text-3xl font-extrabold text-mist-50">
                {stats.data[t.key as keyof typeof stats.data]}
              </p>
            ) : (
              <Skeleton className="h-8 w-12" />
            )}
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-mist-500">{t.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-bold text-mist-50">Quick actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map((q, i) => (
          <Link
            key={q.to + q.title}
            to={q.to}
            className="animate-rise-in card-hover group flex items-start gap-4 rounded-2xl border border-ink-600/60 bg-ink-850/80 p-5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 text-mist-300 transition group-hover:border-sakura-500/30 group-hover:bg-sakura-500/10 group-hover:text-sakura-300">
              <q.icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-mist-50">
                {q.title}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </p>
              <p className="mt-0.5 text-xs text-mist-400">{q.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
