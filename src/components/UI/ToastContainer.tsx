import React, { useState, useEffect } from 'react';

interface Toast {
  id: string;
  msg: string;
  type: 'info' | 'success' | 'error';
}

let toastListeners: ((toast: Toast) => void)[] = [];

export const showToast = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
  const id = Math.random().toString(36).substring(7);
  toastListeners.forEach(l => l({ id, msg, type }));
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToast: Toast) => {
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id}
          className={`border px-4 py-3 rounded-lg shadow-2xl transition-all duration-300 flex items-center gap-3 pointer-events-auto
            ${t.type === 'error' ? 'bg-[#3E141A] border-hex-red text-red-200' : 
              t.type === 'success' ? 'bg-[#0A2A20] border-hex-green text-green-200' : 
              'bg-hex-panel border-hex-gold text-hex-goldlight'}
          `}
        >
          <i className={`fa-solid ${t.type === 'error' ? 'fa-triangle-exclamation' : t.type === 'success' ? 'fa-check' : 'fa-circle-info'}`}></i>
          <span className="text-sm">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
