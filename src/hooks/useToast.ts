import { toast } from 'sonner';
import { NotificationType } from '@/types';

export function useToast() {
  const notify = (message: string, type: NotificationType = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
      default:
        toast.info(message);
        break;
    }
  };

  return { notify };
}
