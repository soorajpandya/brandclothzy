import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useUI } from '../context/UIContext';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-luxury-charcoal text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-white text-luxury-charcoal border border-neutral-200',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || icons.success;
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3.5 shadow-xl animate-slide-up ${styles[toast.type] || styles.success}`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <p className="text-sm font-light flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
