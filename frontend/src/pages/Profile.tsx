import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldCheck, UserCog } from 'lucide-react';
import { changePassword, fetchProfile, updateProfile } from '../api/userArea';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import Field from '../components/ui/Field';
import { FileInput, Input } from '../components/ui/Input';
import { LoadingBlock } from '../components/ui/Skeleton';

export default function Profile() {
  const toast = useToast();
  const { refresh } = useAuth();
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
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
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

  if (profile.isLoading || !profile.data) return <LoadingBlock label="Loading profile…" />;

  const p = profile.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ------------------------------------------------------------ identity */}
      <Card className="flex flex-wrap items-center gap-5 p-6">
        <div className="relative shrink-0">
          <img
            src={p.profileImage ?? undefined}
            alt=""
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-2xl object-cover ring-2 ring-sakura-500/50"
          />
          <span
            aria-hidden
            className="animate-spin-slow absolute -inset-1.5 rounded-[1.4rem] border border-dashed border-neon-violet-400/30"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-mist-50">{p.name}</h1>
          <p className="truncate text-sm text-mist-400">{p.email}</p>
          <Badge tone="violet" className="mt-2.5">
            Reader account
          </Badge>
        </div>
      </Card>

      {/* -------------------------------------------------------------- details */}
      <Card as="form" onSubmit={saveProfile} className="p-6 sm:p-8">
        <CardHeader
          title="Profile details"
          subtitle="Used to pre-fill your checkout"
          icon={<UserCog className="h-4.5 w-4.5" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name">
            <Input id="name" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Mobile number" htmlFor="mobileNumber">
            <Input id="mobileNumber" value={form.mobileNumber} onChange={set('mobileNumber')} />
          </Field>
          <Field label="Address" htmlFor="address" className="sm:col-span-2">
            <Input id="address" value={form.address} onChange={set('address')} />
          </Field>
          <Field label="City" htmlFor="city">
            <Input id="city" value={form.city} onChange={set('city')} />
          </Field>
          <Field label="State" htmlFor="state">
            <Input id="state" value={form.state} onChange={set('state')} />
          </Field>
          <Field label="Pincode" htmlFor="pincode">
            <Input id="pincode" value={form.pincode} onChange={set('pincode')} />
          </Field>
          <Field label="Replace picture" htmlFor="newImg" hint="PNG or JPG">
            <FileInput id="newImg" ref={fileRef} />
          </Field>
        </div>

        <Button type="submit" variant="gradient" loading={savingProfile} className="mt-6">
          {savingProfile ? 'Saving…' : 'Save changes'}
        </Button>
      </Card>

      {/* ------------------------------------------------------------- password */}
      <Card as="form" onSubmit={savePassword} className="p-6 sm:p-8">
        <CardHeader
          title="Change password"
          subtitle="At least 6 characters"
          icon={<KeyRound className="h-4.5 w-4.5" />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current password" htmlFor="currentPassword">
            <Input
              id="currentPassword"
              type="password"
              required
              value={pw.currentPassword}
              onChange={(e) => setPw((v) => ({ ...v, currentPassword: e.target.value }))}
            />
          </Field>
          <Field label="New password" htmlFor="newPassword">
            <Input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={pw.newPassword}
              onChange={(e) => setPw((v) => ({ ...v, newPassword: e.target.value }))}
            />
          </Field>
        </div>

        <Button type="submit" variant="outline" loading={savingPw} className="mt-6">
          <ShieldCheck className="h-4 w-4" />
          {savingPw ? 'Updating…' : 'Update password'}
        </Button>
      </Card>
    </div>
  );
}
