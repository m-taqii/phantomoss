"use client"

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'id'>) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-accent" />;
  }
};

export const Toaster = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(({ title, description, type }: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-100 p-4 flex flex-col gap-3 w-full sm:w-[400px] pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-card border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-xl p-4 flex items-start gap-3 relative overflow-hidden backdrop-blur-xl"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${
                  t.type === 'success' ? 'bg-emerald-500' :
                  t.type === 'error' ? 'bg-red-500' :
                  t.type === 'warning' ? 'bg-amber-500' :
                  'bg-accent'
                }`} 
              />
              <div className="shrink-0 mt-0.5"><ToastIcon type={t.type} /></div>
              <div className="flex-1 min-w-0 pr-6">
                <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
                {t.description && <p className="text-xs text-muted-foreground mt-1 wrap-break-word">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
