import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  ShoppingBag,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { cx } from '../utils/cx';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Accounts', icon: Users },
];

const SHORTCUTS = [
  { to: '/admin/add-product', label: 'Add product', icon: Plus },
  { to: '/admin/add-admin', label: 'Add admin', icon: UserCog },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist-500">Admin studio</p>
      </div>

      <nav aria-label="Admin" className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cx(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-sakura-500/12 text-sakura-200'
                  : 'text-mist-400 hover:bg-ink-800 hover:text-mist-50',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span aria-hidden className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-sakura-400" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="divider-glow" />

      <div>
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-mist-500">Quick actions</p>
        <div className="flex flex-col gap-1">
          {SHORTCUTS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-mist-400 transition hover:bg-ink-800 hover:text-mist-50"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-ink-700 pt-4">
        <div className="flex items-center gap-3 px-1">
          <img
            src={user?.profileImage ?? undefined}
            alt=""
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover ring-1 ring-sakura-500/40"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-mist-100">{user?.name}</p>
            <p className="truncate text-[11px] text-mist-500">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-crimson-300 transition hover:bg-crimson-500/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* mobile bar */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close admin menu' : 'Open admin menu'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600/70 bg-ink-900/60 text-mist-200"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="animate-pop-in mb-4 overflow-hidden rounded-2xl border border-ink-600/60 bg-ink-850 lg:hidden">
          {sidebar}
        </div>
      )}

      <div className="flex gap-6">
        <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] w-60 shrink-0 overflow-y-auto rounded-2xl border border-ink-600/60 bg-ink-850/70 lg:block">
          {sidebar}
        </aside>

        <div key={location.pathname} className="min-w-0 flex-1 animate-fade-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
