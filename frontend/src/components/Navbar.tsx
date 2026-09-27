import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Moon, Package, Search, ShoppingCart, Sun, User, X } from 'lucide-react';
import Logo from './Logo';
import Button, { ButtonLink } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isAdmin } from '../api/auth';
import { cx } from '../utils/cx';

const STORE_LINKS = [
  { to: '/home', label: 'Home' },
  { to: '/products', label: 'Browse' },
];

function navClass({ isActive }: { isActive: boolean }) {
  return cx(
    'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-mist-50' : 'text-mist-400 hover:text-mist-50',
  );
}

function NavIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      aria-hidden
      className="absolute inset-x-3 -bottom-0.5 h-px bg-[linear-gradient(90deg,transparent,#f472b6,#22d3ee,transparent)]"
    />
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close every transient surface whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/products?keyword=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-ink-600/60 shadow-[var(--shadow-sticky)]' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 md:flex">
          {STORE_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navClass}>
              {({ isActive }) => (
                <>
                  {l.label}
                  <NavIndicator active={isActive} />
                </>
              )}
            </NavLink>
          ))}

          {user && (
            <NavLink to="/my-orders" className={navClass}>
              {({ isActive }) => (
                <>
                  Orders
                  <NavIndicator active={isActive} />
                </>
              )}
            </NavLink>
          )}

          {isAdmin(user) && (
            <NavLink to="/admin" className={navClass}>
              {({ isActive }) => (
                <>
                  Dashboard
                  <NavIndicator active={isActive} />
                </>
              )}
            </NavLink>
          )}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 items-center lg:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search titles…"
              aria-label="Search titles"
              className="h-9 w-full rounded-full border border-ink-600/70 bg-ink-900/60 pl-9 pr-3 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 hover:border-ink-600 focus:border-sakura-400/70 focus:bg-ink-900 focus:ring-4 focus:ring-sakura-500/10"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600/70 bg-ink-900/60 text-mist-300 transition hover:border-sakura-400/60 hover:text-sakura-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {loading ? (
            <span className="skeleton hidden h-9 w-24 rounded-full sm:block" />
          ) : user ? (
            <>
              <Link
                to="/cart"
                aria-label={`Cart, ${user.cartCount} items`}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink-600/70 bg-ink-900/60 text-mist-200 transition hover:border-sakura-400/60 hover:text-sakura-300"
              >
                <ShoppingCart className="h-4 w-4" />
                {user.cartCount > 0 && (
                  <span className="animate-badge-pop absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f472b6,#a78bfa)] px-1 text-[10px] font-bold text-white">
                    {user.cartCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((v) => !v)}
                  aria-expanded={userOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                  className="flex h-9 items-center gap-2 rounded-full border border-ink-600/70 bg-ink-900/60 pl-1 pr-2.5 transition hover:border-sakura-400/60"
                >
                  <img
                    src={user.profileImage ?? undefined}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-sakura-500/40"
                  />
                  <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-mist-200 sm:block">
                    {user.name}
                  </span>
                </button>

                {userOpen && (
                  <div
                    role="menu"
                    className="animate-pop-in absolute right-0 top-11 w-56 overflow-hidden rounded-2xl border border-ink-600 bg-ink-850 p-1.5 shadow-[var(--shadow-overlay)]"
                  >
                    <div className="border-b border-ink-700 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-mist-50">{user.name}</p>
                      <p className="truncate text-xs text-mist-500">{user.email}</p>
                    </div>

                    <MenuLink to="/profile" icon={<User className="h-4 w-4" />}>
                      Profile
                    </MenuLink>
                    <MenuLink to="/cart" icon={<ShoppingCart className="h-4 w-4" />}>
                      Cart
                    </MenuLink>
                    <MenuLink to="/my-orders" icon={<Package className="h-4 w-4" />}>
                      My orders
                    </MenuLink>
                    {isAdmin(user) && (
                      <MenuLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
                        Admin dashboard
                      </MenuLink>
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void logout()}
                      className="mt-1 flex w-full items-center gap-2.5 border-t border-ink-700 px-3 py-2.5 text-left text-sm font-medium text-crimson-300 transition hover:bg-crimson-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink to="/signin" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" variant="gradient" size="sm">
                Register
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-600/70 bg-ink-900/60 text-mist-200 transition hover:text-sakura-300 md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ mobile drawer */}
      {menuOpen && (
        <div className="glass animate-pop-in border-t border-ink-600/60 md:hidden">
          <div className="space-y-4 px-4 py-5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggle}
                className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-900 px-3.5 py-2 text-xs font-semibold text-mist-200 transition hover:border-sakura-400/60"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>

            <form onSubmit={submitSearch}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search titles…"
                  aria-label="Search titles"
                  className="h-11 w-full rounded-full border border-ink-600 bg-ink-900 pl-9 pr-3 text-sm text-mist-100 outline-none placeholder:text-mist-500 focus:border-sakura-400"
                />
              </div>
            </form>

            <nav aria-label="Mobile" className="grid gap-1">
              {STORE_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cx(
                      'rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-sakura-500/12 text-sakura-200'
                        : 'text-mist-300 hover:bg-ink-800 hover:text-mist-50',
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              {user && (
                <>
                  <NavLink
                    to="/my-orders"
                    className={({ isActive }) =>
                      cx(
                        'rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                        isActive
                          ? 'bg-sakura-500/12 text-sakura-200'
                          : 'text-mist-300 hover:bg-ink-800 hover:text-mist-50',
                      )
                    }
                  >
                    My orders
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      cx(
                        'rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                        isActive
                          ? 'bg-sakura-500/12 text-sakura-200'
                          : 'text-mist-300 hover:bg-ink-800 hover:text-mist-50',
                      )
                    }
                  >
                    Profile
                  </NavLink>
                </>
              )}

              {isAdmin(user) && (
                <NavLink
                  to="/admin"
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neon-violet-300 transition hover:bg-ink-800"
                >
                  Admin dashboard
                </NavLink>
              )}
            </nav>

            {!user && !loading && (
              <div className="grid grid-cols-2 gap-2.5">
                <ButtonLink to="/signin" variant="outline" full>
                  Sign in
                </ButtonLink>
                <ButtonLink to="/register" variant="gradient" full>
                  Register
                </ButtonLink>
              </div>
            )}

            {user && (
              <Button variant="danger" full onClick={() => void logout()}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      role="menuitem"
      className={({ isActive }) =>
        cx(
          'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive ? 'bg-sakura-500/12 text-sakura-200' : 'text-mist-300 hover:bg-ink-800 hover:text-mist-50',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
