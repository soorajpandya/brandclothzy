import { useUI } from '../context/UIContext';

export function useToast() {
  const { addToast, removeToast, toasts } = useUI();
  return { addToast, removeToast, toasts };
}
