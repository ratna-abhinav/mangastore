import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cx } from '../../utils/cx';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Themed replacement for `window.confirm`. Mount once inside Layout, then
 * call `useConfirm()` from any descendant.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setRequest(options);
      }),
    [],
  );

  const settle = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    if (request) cancelRef.current?.focus();
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {request && (
        <div
          role="presentation"
          onClick={() => settle(false)}
          className="fixed inset-0 z-70 flex animate-pop-in items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="glow-ink w-full max-w-sm rounded-2xl border border-ink-600 bg-ink-850 p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="confirm-title" className="text-lg font-bold text-mist-50">
                {request.title}
              </h2>
              <button
                type="button"
                onClick={() => settle(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-mist-400 transition hover:bg-ink-750 hover:text-mist-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {request.message && <p className="mt-2 text-sm text-mist-400">{request.message}</p>}

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => settle(false)}
                className="h-10 rounded-full border border-ink-600 px-4 text-sm font-semibold text-mist-200 transition hover:bg-ink-750"
              >
                {request.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => settle(true)}
                className={cx(
                  'h-10 rounded-full px-5 text-sm font-semibold text-white transition active:scale-95',
                  request.tone === 'primary'
                    ? 'bg-sakura-500 hover:bg-sakura-400'
                    : 'bg-crimson-500 hover:bg-crimson-400',
                )}
              >
                {request.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
