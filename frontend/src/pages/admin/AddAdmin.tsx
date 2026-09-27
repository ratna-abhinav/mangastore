import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { addAdmin } from '../../api/adminApi';
import { useToast } from '../../components/Toast';
import PageHeader from '../../components/ui/PageHeader';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import { FileInput, Input } from '../../components/ui/Input';

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
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Add administrator"
        description="New admins get full dashboard access."
        icon={<UserCog className="h-5 w-5" />}
        crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Add admin' }]}
      />

      <Card as="form" onSubmit={submit} className="space-y-4 p-6 sm:p-8">
        {error && <Alert tone="error">{error}</Alert>}

        <Field label="Full name" htmlFor="name" required>
          <Input id="name" required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input id="email" type="email" required value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Mobile number" htmlFor="mobileNumber" required>
          <Input id="mobileNumber" required value={form.mobileNumber} onChange={set('mobileNumber')} />
        </Field>
        <Field label="Profile picture" htmlFor="img" hint="optional">
          <FileInput id="img" onChange={(e) => setImg(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Password" htmlFor="password" required hint="(min 6)">
          <Input id="password" type="password" required minLength={6} value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" required>
          <Input id="confirm" type="password" required minLength={6} value={form.confirm} onChange={set('confirm')} />
        </Field>

        <Button type="submit" variant="gradient" size="lg" full loading={busy} className="mt-2">
          {busy ? 'Registering…' : 'Register admin'}
        </Button>
      </Card>
    </div>
  );
}
