'use client';

// Wrapper para mantener compatibilidad con el sistema anterior
// mientras se migra al nuevo sistema mejorado
import React from 'react';
import { NotificationProvider as NewNotificationProvider, useNotifications as useNewNotifications } from '@/contexts/NotificationContext';
import { NotificationContainer } from '@/components/notifications/NotificationContainer';

// Re-exportar el hook para compatibilidad
export const useNotifications = useNewNotifications;

// Provider que combina el nuevo sistema con el contenedor
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return (
    <NewNotificationProvider>
      {children}
      <NotificationContainer />
    </NewNotificationProvider>
  );
}
