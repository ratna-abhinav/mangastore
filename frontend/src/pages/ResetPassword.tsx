import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Unlink } from 'lucide-react';
import { checkResetToken, resetPassword } from '../api/auth';
import AuthShell, { AuthLink } from '../components/ui/AuthShell';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { Input } from '../components/ui/Input';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const tokenCheck = useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => checkResetToken(token),
    enabled: token.length > 0,
    retry: false,
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      navigate('/signin');
    } catch (err) {
      if (err && typeof err === 'object' && 'body' in err) {
        const body = (err as { body?: { error?: string } }).body;
        setError(body?.error ?? 'Reset failed. Please try again.');
      } else {
        setError('Reset failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!token || (tokenCheck.isSuccess && !tokenCheck.data.valid)) {
    return (
      <AuthShell title="Link expired" maxWidth="max-w-sm">
        <div className="flex flex-col items-center py-4 text-center">
          <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-2xl border border-crimson-500/30 bg-crimson-500/10 text-crimson-300">
            <Unlink className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm text-mist-400">Your link is invalid or expired !!</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/forgot-password')}>
            Request a new link
          </Button>
          <p className="mt-4 text-xs text-mist-500">
            Or <AuthLink to="/signin">go back to sign in</AuthLink>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="At least 6 characters."
      footer={
        <p className="text-center">
          Remembered it? <AuthLink to="/signin">Sign in instead</AuthLink>
        </p>
      }
    >
      {error && (
        <Alert className="mb-5" tone="error">
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="New password" htmlFor="newPassword" required>
          <Input
            id="newPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword" required>
          <Input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" variant="gradient" size="lg" full loading={busy} disabled={tokenCheck.isLoading} className="mt-2">
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
