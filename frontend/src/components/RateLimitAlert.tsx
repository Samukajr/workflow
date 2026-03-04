import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { rateLimitAlert, type RateLimitAlertContext } from '@/services/alertService';

export function RateLimitAlert() {
  const [alert, setAlert] = useState<RateLimitAlertContext>({ show: false, message: '' });
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = rateLimitAlert.subscribe((state: RateLimitAlertContext) => {
      setAlert(state);
      if (state.retryAfter) {
        setCountdown(state.retryAfter);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  if (!alert.show) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-100 border-l-4 border-red-500 p-4 rounded shadow-lg max-w-sm z-50 animate-pulse">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">Limite de Requisições</h3>
          <p className="text-red-700 text-sm mt-1">{alert.message}</p>
          {countdown && countdown > 0 && (
            <p className="text-red-600 text-xs mt-2">Aguarde: {countdown}s</p>
          )}
        </div>
        <button
          onClick={() => setAlert({ show: false, message: '' })}
          className="text-red-500 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
