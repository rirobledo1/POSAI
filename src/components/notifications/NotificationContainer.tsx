// src/components/notifications/NotificationContainer.tsx
'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationToast } from './NotificationToast';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification, clearAllNotifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Botón para limpiar todas las notificaciones (solo si hay más de 2) */}
      {notifications.length > 2 && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllNotifications}
            className="bg-white/90 backdrop-blur-sm shadow-sm text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar todo ({notifications.length})
          </Button>
        </div>
      )}
      
      {/* Lista de notificaciones */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};
