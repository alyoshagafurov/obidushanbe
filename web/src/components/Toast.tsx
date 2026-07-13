import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType }
interface Ctx { toast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++seq;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'i'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
