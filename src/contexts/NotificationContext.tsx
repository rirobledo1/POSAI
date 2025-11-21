// src/contexts/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // en milisegundos
  persistent?: boolean; // si es true, no se auto-elimina
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  progress?: number; // Para mostrar progreso (0-100)
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  
  // Helpers para tipos específicos
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, persistent?: boolean) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  
  // Helpers con opciones avanzadas
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  showProgressNotification: (title: string, message?: string) => string;
  updateProgress: (id: string, progress: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number; // Máximo número de notificaciones visibles
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  maxNotifications = 5 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = generateId();
    const notification: Notification = {
      id,
      duration: 4000, // 4 segundos por defecto
      timestamp: new Date(),
      ...notificationData,
    };

    setNotifications(prev => {
      // Mantener solo las últimas notificaciones
      const updated = [notification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-eliminar después del tiempo especificado (si no es persistente)
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, [generateId, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, ...updates }
          : notification
      )
    );
  }, []);

  // Helpers para tipos específicos
  const showSuccess = useCallback((title: string, message?: string, duration = 3000) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, persistent = false) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? undefined : 6000,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, duration = 5000) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, duration = 4000) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [addNotification]);

  // Helper con opciones avanzadas
  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    return addNotification(notification);
  }, [addNotification]);

  // Helper para notificaciones de progreso
  const showProgressNotification = useCallback((title: string, message?: string) => {
    return addNotification({
      type: 'info',
      title,
      message,
      persistent: true,
      progress: 0,
    });
  }, [addNotification]);

  const updateProgress = useCallback((id: string, progress: number) => {
    updateNotification(id, { progress: Math.min(100, Math.max(0, progress)) });
    
    // Auto-cerrar cuando se complete
    if (progress >= 100) {
      setTimeout(() => {
        updateNotification(id, { persistent: false, duration: 2000 });
        setTimeout(() => removeNotification(id), 2000);
      }, 500);
    }
  }, [updateNotification, removeNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    showProgressNotification,
    updateProgress,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
