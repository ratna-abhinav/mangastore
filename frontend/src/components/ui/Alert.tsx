import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cx } from '../../utils/cx';

export type AlertTone = 'error' | 'success' | 'info';

const TONES: Record<AlertTone, { box: string; icon: ReactNode }> = {
  error: {
    box: 'border-crimson-500/35 bg-crimson-500/10 text-crimson-300',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  success: {
    box: 'border-mint-500/35 bg-mint-500/10 text-mint-300',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  info: {
    box: 'border-neon-cyan-500/35 bg-neon-cyan-500/10 text-neon-cyan-300',
    icon: <Info className="h-4 w-4" />,
  },
};

export default function Alert({
  tone = 'error',
  children,
  className,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm',
        TONES[tone].box,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{TONES[tone].icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
