"use client"

import { useContext } from 'react';
import { ToastContext } from '@/components/ui/toaster';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a Toaster Provider');
  }
  return context;
};
