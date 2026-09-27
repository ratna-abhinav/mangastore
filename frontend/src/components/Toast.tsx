import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cx } from '../utils/cx';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(kind: ToastKind, message: string) => void>(() => {});

const STYLES: Record<ToastKind, { shell: string; icon: React.ReactNode }> = {
  success: {
    shell: 'border-mint-500/40 bg-ink-850/95 text-mist-100',
    icon: <CheckCircle2 className="h-4 w-4 text-mint-400" />,
  },
  error: {
    shell: 'border-crimson-500/40 bg-ink-850/95 text-mist-100',
    icon: <AlertTriangle className="h-4 w-4 text-crimson-400" />,
  },
  info: {
    shell: 'border-neon-cyan-500/40 bg-ink-850/95 text-mist-100',
    icon: <Info className="h-4 w-4 text-neon-cyan-400" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-60 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              'animate-pop-in pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-overlay)] backdrop-blur',
              STYLES[t.kind].shell,
            )}
          >
            <span className="mt-0.5 shrink-0">{STYLES[t.kind].icon}</span>
            <span className="min-w-0 flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-0.5 text-mist-500 transition hover:text-mist-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
