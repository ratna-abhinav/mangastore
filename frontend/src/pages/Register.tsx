import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAuthConfig, register, type AuthConfig } from '../api/auth';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

export default function Register() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    void fetchAuthConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const googleLogin = () => {
    window.location.href = '/oauth2/authorization/google';
  };
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: '',
  });
  const [img, setImg] = useState<File | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email.trim());
      fd.append('mobileNumber', form.mobileNumber);
      if (form.address) fd.append('address', form.address);
      if (form.city) fd.append('city', form.city);
      if (form.state) fd.append('state', form.state);
      if (form.pincode) fd.append('pincode', form.pincode);
      fd.append('password', form.password);
      if (img) fd.append('img', img);

      const result = await register(fd);
      setDone(result.message || 'Account created! Please sign in.');
    } catch (err) {
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        setError(body?.error ?? 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✅
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Almost there!</h1>
        <p className="mt-2 text-sm text-slate-600">{done}</p>
        <button
          onClick={() => navigate('/signin')}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Join MangaStore in under a minute</p>

      {config?.googleEnabled && (
        <>
          <button
            type="button"
            onClick={googleLogin}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="name">Full name *</label>
          <input id="name" required value={form.name} onChange={set('name')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">Email *</label>
          <input id="email" type="email" required value={form.email} onChange={set('email')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="mobileNumber">Mobile number *</label>
          <input id="mobileNumber" required value={form.mobileNumber} onChange={set('mobileNumber')} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="address">Address</label>
          <input id="address" value={form.address} onChange={set('address')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="city">City</label>
          <input id="city" value={form.city} onChange={set('city')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="state">State</label>
          <input id="state" value={form.state} onChange={set('state')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="pincode">Pincode</label>
          <input id="pincode" value={form.pincode} onChange={set('pincode')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="profileImg">Profile picture</label>
          <input
            id="profileImg"
            type="file"
            accept="image/*"
            onChange={(e) => setImg(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">Password * <span className="text-slate-400">(min 6)</span></label>
          <input id="password" type="password" required value={form.password} onChange={set('password')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="confirmPassword">Confirm password *</label>
          <input id="confirmPassword" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} className={inputCls} />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="sm:col-span-2 mt-2 w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/signin" className="font-medium text-emerald-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
