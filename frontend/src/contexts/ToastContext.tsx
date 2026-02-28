'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    const timer = setTimeout(() => removeToast(id), type === 'error' ? 5000 : 3000);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  const toast = {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    info: (message: string) => addToast('info', message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-in slide-in-from-bottom-2 fade-in duration-200 flex items-start gap-2.5 min-w-[280px] max-w-[380px] rounded-lg border px-3.5 py-3 shadow-lg text-sm bg-white dark:bg-[#111] border-gray-200 dark:border-[#252525]"
          >
            {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />}
            <span className="flex-1 text-gray-800 dark:text-gray-200 leading-snug">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-0.5"
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
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context.toast;
}
