import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { forgotPassword } from '../api/auth';
import AuthShell, { AuthLink } from '../components/ui/AuthShell';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { Input } from '../components/ui/Input';

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

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="We sent you a link to set a new password."
        maxWidth="max-w-sm"
        footer={
          <p className="text-center">
            <AuthLink to="/signin">← Back to sign in</AuthLink>
          </p>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-2xl border border-sakura-500/30 bg-sakura-500/10 text-sakura-300 glow-violet">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="mt-5 text-sm text-mist-400">
            Password reset link sent! Check your inbox (and spam folder).
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <p className="text-center">
          <AuthLink to="/signin">← Back to sign in</AuthLink>
        </p>
      }
    >
      {error && (
        <Alert className="mb-5" tone="error">
          {error}
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Button type="submit" variant="gradient" size="lg" full loading={busy} className="mt-2">
          {busy ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
