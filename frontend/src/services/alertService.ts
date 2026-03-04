export interface RateLimitAlertContext {
  show: boolean;
  message: string;
  retryAfter?: number;
}

let alertState: RateLimitAlertContext = { show: false, message: '' };
let listeners: Array<(state: RateLimitAlertContext) => void> = [];

export const rateLimitAlert = {
  subscribe: (listener: (state: RateLimitAlertContext) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  trigger: (retryAfter?: number) => {
    alertState = {
      show: true,
      message: retryAfter 
        ? `Muitas tentativas! Aguarde ${retryAfter}s antes de tentar novamente.`
        : 'Muitas tentativas! Por favor, aguarde antes de tentar novamente.',
      retryAfter,
    };
    listeners.forEach((listener) => listener(alertState));
    setTimeout(() => {
      alertState = { show: false, message: '' };
      listeners.forEach((listener) => listener(alertState));
    }, (retryAfter || 60) * 1000);
  },
};
