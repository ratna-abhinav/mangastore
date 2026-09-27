import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';
import { fetchAuthConfig, register, type AuthConfig } from '../api/auth';
import AuthShell, { AuthLink, Divider, GoogleButton } from '../components/ui/AuthShell';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { FileInput, Input } from '../components/ui/Input';

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
      <AuthShell
        title="Almost there!"
        subtitle={done}
        maxWidth="max-w-sm"
        footer={
          <p className="text-center">
            Prefer signing in now? <AuthLink to="/signin">Go to sign in</AuthLink>
          </p>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-2xl border border-mint-500/30 bg-mint-500/10 text-mint-300 glow-violet">
            <PartyPopper className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm text-mist-400">{done}</p>
          <Button variant="gradient" size="lg" full className="mt-7" onClick={() => navigate('/signin')}>
            Go to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join MangaStore in under a minute."
      maxWidth="max-w-2xl"
      footer={
        <p className="text-center">
          Already have an account? <AuthLink to="/signin">Sign in</AuthLink>
        </p>
      }
    >
      {config?.googleEnabled && (
        <>
          <GoogleButton onClick={googleLogin} />
          <Divider />
        </>
      )}

      {error && (
        <Alert className="mb-5" tone="error">
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required className="sm:col-span-2">
          <Input id="name" required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input id="email" type="email" required value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Mobile number" htmlFor="mobileNumber" required>
          <Input id="mobileNumber" required value={form.mobileNumber} onChange={set('mobileNumber')} />
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
        <Field label="Profile picture" htmlFor="profileImg" hint="optional">
          <FileInput id="profileImg" onChange={(e) => setImg(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Password" htmlFor="password" required hint="(min 6)">
          <Input id="password" type="password" required minLength={6} value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" required>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
          />
        </Field>

        <Button type="submit" variant="gradient" size="lg" full loading={busy} className="mt-2 sm:col-span-2">
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
