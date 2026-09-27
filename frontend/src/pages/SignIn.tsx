import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { fetchAuthConfig, type AuthConfig } from '../api/auth';
import { ApiError } from '../api/client';
import AuthShell, { AuthLink, Divider, GoogleButton } from '../components/ui/AuthShell';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { Input } from '../components/ui/Input';

export default function SignIn() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    void fetchAuthConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const googleLogin = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      toast('success', 'Signed in!');
      navigate('/home');
    } catch (err) {
      let msg = 'Sign-in failed. Please try again.';
      if (err instanceof ApiError && err.body && typeof err.body === 'object' && 'error' in err.body) {
        msg = String((err.body as { error: string }).error);
      } else if (err instanceof Error && err.message.includes('401')) {
        msg = 'Invalid email or password';
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <div className="flex items-center justify-between gap-4">
          <AuthLink to="/forgot-password">Forgot password?</AuthLink>
          <span>
            New here? <AuthLink to="/register">Create account</AuthLink>
          </span>
        </div>
      }
    >
      {error && (
        <Alert className="mb-5" tone="error">
          {error}
        </Alert>
      )}

      {config?.googleEnabled && (
        <>
          <GoogleButton onClick={googleLogin} />
          <Divider />
        </>
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

        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <Button type="submit" variant="gradient" size="lg" full loading={busy} className="mt-2">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
