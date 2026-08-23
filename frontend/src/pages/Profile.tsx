import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { changePassword, fetchProfile, updateProfile } from '../api/userArea';
import { useToast } from '../components/Toast';

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500';
const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

export default function Profile() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchProfile, placeholderData: keepPreviousData });
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: '', mobileNumber: '', address: '', city: '', state: '', pincode: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setForm({
        name: profile.data.name ?? '',
        mobileNumber: profile.data.mobileNumber ?? '',
        address: profile.data.address ?? '',
        city: profile.data.city ?? '',
        state: profile.data.state ?? '',
        pincode: profile.data.pincode ?? '',
      });
    }
  }, [profile.data]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('mobileNumber', form.mobileNumber);
      if (form.address) fd.append('address', form.address);
      if (form.city) fd.append('city', form.city);
      if (form.state) fd.append('state', form.state);
      if (form.pincode) fd.append('pincode', form.pincode);
      const img = fileRef.current?.files?.[0];
      if (img) fd.append('img', img);

      await updateProfile(fd);
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast('success', 'Profile Updated !!');
    } catch {
      toast('error', 'Profile not updated !! Internal Server Error !!');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await changePassword(pw.currentPassword, pw.newPassword);
      toast('success', 'Password Updated successfully !!');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        toast('error', 'Incorrect Current Password');
      } else {
        toast('error', 'Password not updated !! Internal Server Error !!');
      }
    } finally {
      setSavingPw(false);
    }
  };

  if (profile.isLoading || !profile.data) return <p className="py-16 text-center text-slate-500">Loading profile…</p>;

  const p = profile.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <img
          src={p.profileImage ?? undefined}
          alt=""
          className="h-16 w-16 rounded-full border-2 border-emerald-500 object-cover"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-xl font-bold text-slate-900">{p.name}</h1>
          <p className="text-sm text-slate-500">{p.email}</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Profile details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={set('name')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="mobileNumber">Mobile number</label>
            <input id="mobileNumber" value={form.mobileNumber} onChange={set('mobileNumber')} className={inputCls} />
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
            <label className={labelCls} htmlFor="newImg">Replace picture</label>
            <input
              id="newImg"
              ref={fileRef}
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700"
            />
          </div>
        </div>
        <button type="submit" disabled={savingProfile} className="mt-5 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <form onSubmit={savePassword} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">Change password</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              required
              value={pw.currentPassword}
              onChange={(e) => setPw((v) => ({ ...v, currentPassword: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={pw.newPassword}
              onChange={(e) => setPw((v) => ({ ...v, newPassword: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>
        <button type="submit" disabled={savingPw} className="mt-5 rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
