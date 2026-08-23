import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        setError(body?.error ?? 'Something went wrong. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>

      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Password reset link sent! Check your inbox (and spam folder).
          </div>
          <Link to="/signin" className="block text-center text-sm font-medium text-emerald-600 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we'll send you a reset link.
          </p>
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm">
            <Link to="/signin" className="text-slate-500 hover:text-emerald-600">
              ← Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
