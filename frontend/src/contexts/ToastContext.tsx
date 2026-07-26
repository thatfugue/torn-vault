'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md transform transition-all duration-300 flex items-center justify-between min-w-[300px]
              ${toast.type === 'error' ? 'bg-red-950/80 border-red-900/50 text-red-200' : ''}
              ${toast.type === 'success' ? 'bg-green-950/80 border-green-900/50 text-green-200' : ''}
              ${toast.type === 'info' ? 'bg-zinc-900/80 border-zinc-800/50 text-zinc-200' : ''}
            `}
            role="alert"
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Close"
            >
                ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
