import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Loader2, MailWarning } from 'lucide-react';
import { resendVerification, verifyEmail } from '../api/auth';
import AuthShell, { AuthLink } from '../components/ui/AuthShell';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import { Input } from '../components/ui/Input';

type Status = 'pending' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('pending');
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
    <AuthShell
      title="Email verification"
      maxWidth="max-w-sm"
      footer={
        <p className="text-center">
          <AuthLink to="/signin">Back to sign in</AuthLink>
        </p>
      }
    >
      <div className="flex flex-col items-center py-3 text-center">
        {status === 'pending' && (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-cyan-500/30 bg-neon-cyan-500/10 text-neon-cyan-300">
              <Loader2 className="h-7 w-7 animate-spin" />
            </span>
            <p className="mt-5 text-sm text-mist-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-2xl border border-mint-500/30 bg-mint-500/10 text-mint-300 glow-violet">
              <BadgeCheck className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-mist-300">{message}</p>
            <p className="mt-2 text-xs text-mist-500">Redirecting to sign in…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-crimson-500/30 bg-crimson-500/10 text-crimson-300">
              <MailWarning className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm text-mist-400">{message}</p>
          </>
        )}
      </div>

      {status === 'error' && (
        <form onSubmit={resend} className="mt-4 space-y-4">
          <Field label="Resend the verification email" htmlFor="resendEmail" required>
            <Input
              id="resendEmail"
              type="email"
              required
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Button type="submit" variant="gradient" size="lg" full>
            Resend verification email
          </Button>
          {resendMsg && <p className="text-center text-xs text-mist-400">{resendMsg}</p>}
        </form>
      )}
    </AuthShell>
  );
}
