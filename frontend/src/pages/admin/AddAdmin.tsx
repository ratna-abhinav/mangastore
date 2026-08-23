import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addAdmin } from '../../api/adminApi';
import { useToast } from '../../components/Toast';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

export default function AddAdmin() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobileNumber: '', password: '', confirm: '' });
  const [img, setImg] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await addAdmin({
        name: form.name.trim(),
        email: form.email,
        mobileNumber: form.mobileNumber,
        password: form.password,
        img,
      });
      toast('success', 'Admin registered successfully !!');
      navigate('/admin/users?type=2');
    } catch (err) {
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        setError(body?.error ?? 'Admin not registered !! Internal Server Error');
      } else {
        setError('Admin not registered !! Internal Server Error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Add administrator</h1>
      <p className="text-sm text-slate-500">New admins get full dashboard access.</p>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div>
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
      <div>
        <label className={labelCls} htmlFor="img">Profile picture</label>
        <input
          id="img"
          type="file"
          accept="image/*"
          onChange={(e) => setImg(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="password">Password * <span className="text-slate-400">(min 6)</span></label>
        <input id="password" type="password" required minLength={6} value={form.password} onChange={set('password')} className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {busy ? 'Registering…' : 'Register admin'}
      </button>
    </form>
  );
}
