import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../api/auth';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-emerald-600">
          Manga<span className="text-slate-800">Store</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <a href="/home" className="hover:text-emerald-600">
            Home
          </a>
          <a href="/products" className="hover:text-emerald-600">
            Products
          </a>

          {loading ? (
            <span className="h-8 w-20 animate-pulse rounded bg-slate-100" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {isAdmin(user) && (
                <a href="/admin/" className="rounded-md border border-slate-300 px-2 py-1 hover:border-emerald-500">
                  Admin
                </a>
              )}
              <span className="relative" title={`Cart (${user.cartCount})`}>
                🛒
                {user.cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
                    {user.cartCount}
                  </span>
                )}
              </span>
              <img
                src={user.profileImage ?? undefined}
                alt=""
                className="h-9 w-9 rounded-full border border-emerald-500 object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => void logout()}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <a href="/signin" className="hover:text-emerald-600">
                Sign in
              </a>
              <a
                href="/register"
                className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-500"
              >
                Register
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
