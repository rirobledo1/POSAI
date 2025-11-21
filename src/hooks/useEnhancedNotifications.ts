// src/hooks/useEnhancedNotifications.ts
'use client';

import { useNotifications } from '@/contexts/NotificationContext';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ProgressOperation {
  id: string;
  updateProgress: (progress: number) => void;
  complete: (successMessage?: string) => void;
  error: (errorMessage: string) => void;
}

/**
 * Hook mejorado para notificaciones que incluye helpers para migrar
 * desde alert() y confirm() nativos
 */
export const useEnhancedNotifications = () => {
  const notifications = useNotifications();

  // Reemplaza alert() nativo con notificaciones elegantes
  const alert = (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        return notifications.showSuccess(title, message);
      case 'error':
        return notifications.showError(title, message);
      case 'warning':
        return notifications.showWarning(title, message);
      default:
        return notifications.showInfo(title, message);
    }
  };

  // Reemplaza confirm() nativo con un modal elegante (simulado)
  const confirm = async (options: string | ConfirmOptions): Promise<boolean> => {
    // Para mantener compatibilidad, temporalmente usamos confirm nativo
    // pero mostramos una notificación antes
    const opts = typeof options === 'string' 
      ? { title: 'Confirmar', message: options }
      : options;

    // Mostrar notificación de tipo warning para indicar que requiere confirmación
    const id = notifications.showNotification({
      type: opts.type === 'danger' ? 'error' : 'warning',
      title: opts.title,
      message: opts.message,
      persistent: true,
      action: {
        label: opts.confirmText || 'Confirmar',
        onClick: () => {
          notifications.removeNotification(id);
          return true;
        }
      }
    });

    // Por ahora, usar confirm nativo pero eventualmente implementar modal
    return window.confirm(`${opts.title}\n\n${opts.message}`);
  };

  // Helper para operaciones con progreso
  const startProgressOperation = (title: string, message?: string): ProgressOperation => {
    const id = notifications.showProgressNotification(title, message);
    
    return {
      id,
      updateProgress: (progress: number) => {
        notifications.updateProgress(id, progress);
      },
      complete: (successMessage?: string) => {
        notifications.updateProgress(id, 100);
        setTimeout(() => {
          notifications.removeNotification(id);
          if (successMessage) {
            notifications.showSuccess('Completado', successMessage);
          }
        }, 1000);
      },
      error: (errorMessage: string) => {
        notifications.removeNotification(id);
        notifications.showError('Error', errorMessage);
      }
    };
  };

  // Helper para notificaciones con acción
  const showActionNotification = (
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    return notifications.showNotification({
      type,
      title,
      message,
      action: {
        label: actionLabel,
        onClick: actionCallback
      },
      duration: 8000 // Más tiempo para permitir acción
    });
  };

  // Helper para notificaciones persistentes (requieren acción manual)
  const showPersistentNotification = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    return notifications.showNotification({
      type,
      title,
      message,
      persistent: true
    });
  };

  // Helper para notificaciones de operaciones async
  const notifyAsyncOperation = async <T>(
    operation: () => Promise<T>,
    messages: {
      loading: { title: string; message?: string };
      success: { title: string; message?: string };
      error: { title: string; message?: string };
    }
  ): Promise<T> => {
    const progressOp = startProgressOperation(messages.loading.title, messages.loading.message);
    
    try {
      progressOp.updateProgress(10);
      const result = await operation();
      progressOp.complete(messages.success.message);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : messages.error.message || 'Error desconocido';
      progressOp.error(errorMessage);
      throw error;
    }
  };

  // Helper para múltiples notificaciones relacionadas
  const showBulkNotifications = (
    notifications_list: Array<{
      title: string;
      message?: string;
      type: 'success' | 'error' | 'warning' | 'info';
      delay?: number;
    }>
  ) => {
    notifications_list.forEach((notif, index) => {
      setTimeout(() => {
        alert(notif.title, notif.message, notif.type);
      }, (notif.delay || 500) * index);
    });
  };

  return {
    // API original
    ...notifications,
    
    // Helpers para migración
    alert,
    confirm,
    
    // Helpers avanzados
    startProgressOperation,
    showActionNotification,
    showPersistentNotification,
    notifyAsyncOperation,
    showBulkNotifications,

    // Shortcuts comunes
    success: (title: string, message?: string) => alert(title, message, 'success'),
    error: (title: string, message?: string) => alert(title, message, 'error'),
    warning: (title: string, message?: string) => alert(title, message, 'warning'),
    info: (title: string, message?: string) => alert(title, message, 'info'),
  };
};
