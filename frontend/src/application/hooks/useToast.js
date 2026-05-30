/**
 * Application Layer — useToast Hook
 * Manages the global toast notification system.
 */
import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'success') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  return { toasts, showToast };
}
