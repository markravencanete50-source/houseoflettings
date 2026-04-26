'use client';
// components/ui/Toast.tsx
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32,
      background: type === 'error' ? '#c0392b' : '#0a0a0a',
      color: '#fff', padding: '14px 24px', borderRadius: 6,
      fontSize: 14, fontWeight: 500, zIndex: 9999,
      transform: visible ? 'translateY(0)' : 'translateY(100px)',
      opacity: visible ? 1 : 0, transition: 'all 0.3s ease',
      borderLeft: `3px solid ${type === 'error' ? '#ff6b6b' : 'var(--red)'}`,
      maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      {message}
    </div>
  );
}

// ── Global toast hook ────────────────────────────────────────
import { createContext, useContext, ReactNode } from 'react';

interface ToastContextType {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'error' }>>([]);
  let counter = 0;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter;
    setToasts(prev => [...prev, { id, msg, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map(t => (
        <Toast key={t.id} message={t.msg} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
