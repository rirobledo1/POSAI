// src/components/notifications/NotificationToast.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { Notification, NotificationType } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';

interface NotificationToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-600" />;
    default:
      return <Info className="h-5 w-5 text-blue-600" />;
  }
};

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        container: 'bg-green-50 border-green-200 shadow-green-100',
        title: 'text-green-900',
        message: 'text-green-700',
        progress: 'bg-green-500',
        border: 'border-l-green-500',
      };
    case 'error':
      return {
        container: 'bg-red-50 border-red-200 shadow-red-100',
        title: 'text-red-900',
        message: 'text-red-700',
        progress: 'bg-red-500',
        border: 'border-l-red-500',
      };
    case 'warning':
      return {
        container: 'bg-amber-50 border-amber-200 shadow-amber-100',
        title: 'text-amber-900',
        message: 'text-amber-700',
        progress: 'bg-amber-500',
        border: 'border-l-amber-500',
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 shadow-blue-100',
        title: 'text-blue-900',
        message: 'text-blue-700',
        progress: 'bg-blue-500',
        border: 'border-l-blue-500',
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200 shadow-gray-100',
        title: 'text-gray-900',
        message: 'text-gray-700',
        progress: 'bg-gray-500',
        border: 'border-l-gray-500',
      };
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onRemove 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeProgress, setTimeProgress] = useState(100);
  const styles = getNotificationStyles(notification.type);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Barra de progreso de tiempo (solo si no es persistente y no tiene progreso manual)
    if (!notification.persistent && notification.duration && notification.progress === undefined) {
      const interval = setInterval(() => {
        setTimeProgress(prev => {
          const decrement = (100 / notification.duration!) * 50; // Actualizar cada 50ms
          const newProgress = prev - decrement;
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [notification.persistent, notification.duration, notification.progress]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(notification.id), 300); // Esperar animación de salida
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
    >
      <div
        className={`
          relative max-w-sm w-full shadow-lg rounded-lg border-l-4 border p-4
          backdrop-blur-sm
          ${styles.container} ${styles.border}
        `}
      >
        {/* Barra de progreso de tiempo o progreso manual */}
        {((notification.progress !== undefined) || (!notification.persistent && notification.duration)) && (
          <div className="absolute bottom-0 left-0 h-1 bg-gray-200 rounded-b-lg w-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ease-linear ${styles.progress}`}
              style={{ 
                width: `${notification.progress !== undefined ? notification.progress : timeProgress}%` 
              }}
            />
          </div>
        )}

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={`text-sm font-semibold leading-5 ${styles.title}`}>
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className={`mt-1 text-sm leading-5 ${styles.message}`}>
                    {notification.message}
                  </p>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                {/* Timestamp */}
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimestamp(notification.timestamp)}
                </div>
                
                {/* Botón cerrar */}
                <button
                  onClick={handleClose}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Acción */}
            {notification.action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    notification.action!.onClick();
                    handleClose();
                  }}
                  className="text-xs"
                >
                  {notification.action.label}
                </Button>
              </div>
            )}

            {/* Indicador de progreso (solo para notificaciones con progreso) */}
            {notification.progress !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{Math.round(notification.progress)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
