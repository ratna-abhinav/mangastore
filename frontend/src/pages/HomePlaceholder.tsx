import { useAuth } from '../context/AuthContext';

export default function HomePlaceholder() {
  const { user, loading } = useAuth();

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-800">React shell is live 🎉</h1>
      <p className="mt-3 text-slate-600">
        This is the new frontend served for URLs the classic app doesn't handle. Existing pages like{' '}
        <code className="rounded bg-slate-100 px-1">/home</code> and{' '}
        <code className="rounded bg-slate-100 px-1">/products</code> are still rendered by Thymeleaf and will migrate
        page-by-page in the next phases.
      </p>

      <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
        {loading ? (
          <span className="text-slate-500">Checking session…</span>
        ) : user ? (
          <p className="text-emerald-700">
            Signed in as <strong>{user.email}</strong> ({user.role}) · cart items: {user.cartCount}
          </p>
        ) : (
          <p className="text-slate-500">
            Not signed in. <a href="/signin" className="text-emerald-600 underline">Sign in</a> via the classic login
            page, then return here — the navbar will pick up your session.
          </p>
        )}
      </div>

      <ul className="mt-6 list-inside list-disc space-y-1 text-sm text-slate-500">
        <li>Phase 3: public catalog migrates to React</li>
        <li>Phase 4: auth pages → JSON + toasts</li>
        <li>Phase 5–6: user area &amp; admin dashboard</li>
      </ul>
    </div>
  );
}
