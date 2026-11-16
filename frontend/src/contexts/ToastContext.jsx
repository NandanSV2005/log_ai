import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ variant = 'info', title = '', message = '', duration = 3800 }) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, variant, title, message }]);
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-16 right-4 z-[150] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
          aria-live="polite"
          role="status"
        >
          {toasts.map((t) => {
            const styleClass =
              t.variant === 'error'
                ? 'bg-[var(--color-severity-high-bg)] border-[var(--color-severity-high-border)] text-[var(--color-severity-high)]'
                : t.variant === 'success'
                  ? 'bg-[var(--color-severity-low-bg)] border-[var(--color-severity-low-border)] text-[var(--color-severity-low)]'
                  : 'bg-surface border-border-muted text-text-primary';
            return (
              <div
                key={t.id}
                className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 font-mono text-xs ${styleClass}`}
              >
                <div className="min-w-0">
                  {t.title && <div className="font-bold uppercase tracking-wider">{t.title}</div>}
                  {t.message && <div className="text-[11px] opacity-90 mt-0.5 break-words">{t.message}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  aria-label="Dismiss notification"
                  className="opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
}
