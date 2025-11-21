'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';

export default function NotificationDemo() {
  const notifications = useEnhancedNotifications();
  const [progressOp, setProgressOp] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const demoBasicNotifications = () => {
    setTimeout(() => notifications.success('¡Éxito!', 'Operación completada correctamente'), 100);
    setTimeout(() => notifications.info('Información', 'Este es un mensaje informativo'), 600);
    setTimeout(() => notifications.warning('Advertencia', 'Verifica los datos antes de continuar'), 1100);
    setTimeout(() => notifications.error('Error', 'Algo salió mal en el proceso'), 1600);
  };

  const demoProgressNotification = () => {
    const op = notifications.startProgressOperation(
      'Procesando archivo',
      'Subiendo documento...'
    );
    setProgressOp(op);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        op.updateProgress(newProgress);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          op.complete('Archivo subido exitosamente');
          setProgressOp(null);
        }
        
        return newProgress;
      });
    }, 500);
  };

  const demoActionNotification = () => {
    notifications.showActionNotification(
      'Nueva actualización disponible',
      'Hay una nueva versión del sistema disponible para descargar',
      'Actualizar ahora',
      () => {
        notifications.success('Actualización iniciada', 'El sistema se actualizará en segundo plano');
      },
      'info'
    );
  };

  const demoPersistentNotification = () => {
    notifications.showPersistentNotification(
      'Conexión perdida',
      'Se perdió la conexión con el servidor. Reconectando automáticamente...',
      'warning'
    );
  };

  const clearAllNotifications = () => {
    notifications.clearAllNotifications();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Notificaciones Mejorado
        </h1>
        <p className="text-gray-600">
          El sistema de notificaciones ha sido restaurado y mejorado con nuevas funcionalidades
        </p>
      </div>

      {/* Notificaciones Básicas */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Notificaciones Básicas
          <Badge variant="outline">Restauradas</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={demoBasicNotifications}
            className="w-full"
          >
            Probar Notificaciones
          </Button>
          <Button 
            variant="outline"
            onClick={clearAllNotifications}
            className="w-full"
          >
            Limpiar Todas
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          ✅ Sistema de notificaciones completamente funcional
        </p>
      </Card>

      {/* Nuevas Características */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Nuevas Funciones
          <Badge variant="outline">Mejorado</Badge>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={demoProgressNotification}
            disabled={progressOp !== null}
            className="w-full"
          >
            {progressOp ? `Progreso: ${progress}%` : 'Notificación con Progreso'}
          </Button>
          <Button 
            variant="outline"
            onClick={demoActionNotification}
            className="w-full"
          >
            Notificación con Acción
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          🚀 Nuevas funcionalidades: progreso, acciones, timestamps
        </p>
      </Card>

      {/* Estado del Sistema */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-semibold mb-4 text-green-800">
          ✅ Sistema Restaurado Exitosamente
        </h2>
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Notificaciones anteriores restauradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Compatibilidad mantenida con componentes existentes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Nuevas funcionalidades agregadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Errores de pantalla solucionados</span>
          </div>
        </div>
      </Card>

      {/* Guía de Migración */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Uso en Componentes</h2>
        <div className="space-y-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Para componentes existentes:</h3>
            <code className="text-blue-600">
              const &#123; showSuccess, showError &#125; = useNotifications();
            </code>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Para nuevas funcionalidades:</h3>
            <code className="text-blue-600">
              const notifications = useEnhancedNotifications();
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}
