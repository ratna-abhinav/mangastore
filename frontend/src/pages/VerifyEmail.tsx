import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resendVerification, verifyEmail } from '../api/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email…');
  const [resendEmail, setResendEmail] = useState('');
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
        setTimeout(() => navigate('/signin'), 2500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err && typeof err === 'object' && 'body' in err
            ? ((err as { body?: { error?: string } }).body?.error ?? 'Verification failed.')
            : 'Verification failed.',
        );
      });
  }, [token, navigate]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMsg(null);
    try {
      const res = await resendVerification(resendEmail.trim());
      setResendMsg(res.message);
    } catch {
      setResendMsg('Could not send the verification email. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Email verification</h1>
      <p className="mt-3 text-sm text-slate-600">{message}</p>

      {status === 'success' && (
        <p className="mt-4 text-xs text-slate-400">Redirecting to sign in…</p>
      )}

      {status === 'error' && (
        <form onSubmit={resend} className="mt-6 space-y-3 text-left">
          <label htmlFor="resendEmail" className="mb-1 block text-sm font-medium text-slate-700">
            Enter your email to resend the link
          </label>
          <input
            id="resendEmail"
            type="email"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500"
          >
            Resend verification email
          </button>
          {resendMsg && <p className="text-center text-xs text-slate-500">{resendMsg}</p>}
        </form>
      )}

      <p className="mt-6 text-sm text-slate-500">
        <Link to="/signin" className="font-medium text-emerald-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}