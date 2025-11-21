// src/components/settings/POSSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Volume2, VolumeX, ShoppingCart, Bell, Printer, Save, RotateCcw, Loader2 } from 'lucide-react';
import { soundManager } from '@/lib/sounds';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface POSSettings {
  posTitle: string;
  receiptFooter: string;
  enableSounds: boolean;
  enableNotifications: boolean;
  autoCompleteEnabled: boolean;
  requireCustomer: boolean;
  defaultPaymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';
  showProductImages: boolean;
  itemsPerPage: number;
  printerEnabled: boolean;
  printerName: string;
  autoPrint: boolean;
  companyName?: string;
}

const defaultSettings: POSSettings = {
  posTitle: 'Punto de Venta',
  receiptFooter: '¡Gracias por su compra!',
  enableSounds: true,
  enableNotifications: true,
  autoCompleteEnabled: true,
  requireCustomer: false,
  defaultPaymentMethod: 'EFECTIVO',
  showProductImages: true,
  itemsPerPage: 20,
  printerEnabled: false,
  printerName: '',
  autoPrint: false
};

export function POSSettings() {
  const [settings, setSettings] = useState<POSSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Cargar configuración desde el servidor
  useEffect(() => {
    loadSettings();
  }, []);

  // Sincronizar sonidos con soundManager
  useEffect(() => {
    soundManager.setEnabled(settings.enableSounds);
  }, [settings.enableSounds]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/pos');
      
      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }
      
      const data = await response.json();
      setSettings(data);
      
      console.log('✅ Configuración POS cargada:', data);
    } catch (error) {
      console.error('❌ Error cargando configuración POS:', error);
      showError('Error', 'No se pudo cargar la configuración del POS');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/settings/pos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar configuración');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
      showSuccess('¡Guardado!', 'La configuración del POS se ha guardado correctamente');
      console.log('✅ Configuración POS guardada:', updatedSettings);
    } catch (error) {
      console.error('❌ Error guardando configuración POS:', error);
      showError('Error', error instanceof Error ? error.message : 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que deseas restablecer la configuración a los valores por defecto?')) {
      return;
    }

    try {
      setResetting(true);
      
      const response = await fetch('/api/settings/pos', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al restablecer configuración');
      }

      const resetSettings = await response.json();
      setSettings(resetSettings);
      
      showSuccess('¡Restablecido!', 'La configuración se ha restablecido a los valores por defecto');
      console.log('✅ Configuración POS restablecida:', resetSettings);
    } catch (error) {
      console.error('❌ Error restableciendo configuración POS:', error);
      showError('Error', 'No se pudo restablecer la configuración');
    } finally {
      setResetting(false);
    }
  };

  const testSound = (type: 'add' | 'success' | 'error') => {
    if (!settings.enableSounds) {
      showSuccess('Activa los sonidos', 'Activa los sonidos para escuchar el efecto');
      return;
    }

    switch (type) {
      case 'add':
        soundManager.playAddToCart();
        break;
      case 'success':
        soundManager.playSuccess();
        break;
      case 'error':
        soundManager.playError();
        break;
    }
  };

  const updateSetting = (key: keyof POSSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Configuración del Punto de Venta
          </h2>
          <p className="text-gray-600">
            Personaliza el comportamiento y las notificaciones del sistema POS
            {settings.companyName && (
              <span className="ml-2 text-blue-600 font-medium">
                · {settings.companyName}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving || resetting}
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Restablecer
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || resetting}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Información General */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>
            Configura el título y mensajes del punto de venta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="posTitle">Título del POS</Label>
            <Input
              id="posTitle"
              value={settings.posTitle}
              onChange={(e) => updateSetting('posTitle', e.target.value)}
              placeholder="Punto de Venta"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Este título aparecerá en la interfaz del punto de venta
            </p>
          </div>

          <div>
            <Label htmlFor="receiptFooter">Pie de Recibo</Label>
            <Textarea
              id="receiptFooter"
              value={settings.receiptFooter}
              onChange={(e) => updateSetting('receiptFooter', e.target.value)}
              placeholder="¡Gracias por su compra!"
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mensaje que aparecerá al final de cada recibo impreso
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sonidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {settings.enableSounds ? (
              <Volume2 className="h-6 w-6 text-blue-600" />
            ) : (
              <VolumeX className="h-6 w-6 text-gray-400" />
            )}
            <div>
              <CardTitle>Sonidos del Sistema</CardTitle>
              <CardDescription>
                Controla los sonidos de retroalimentación al usar el POS
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle principal */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <div>
                <Label htmlFor="sound-enabled" className="text-base font-medium cursor-pointer">
                  Activar sonidos en el POS
                </Label>
                <p className="text-sm text-gray-500">
                  Reproducir sonidos al agregar productos, procesar ventas, etc.
                </p>
              </div>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.enableSounds}
              onCheckedChange={(checked) => {
                updateSetting('enableSounds', checked);
                if (checked) {
                  soundManager.playSuccess();
                  showSuccess('Sonidos activados', 'Los sonidos del POS están ahora activos');
                }
              }}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          {/* Pruebas de sonido */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Probar sonidos
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => testSound('add')}
                disabled={!settings.enableSounds}
                className="flex items-center justify-center gap-2 h-20"
              >
                <ShoppingCart className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Agregar producto</div>
                  <div className="text-xs text-gray-500">Ding suave</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => testSound('success')}
                disabled={!settings.enableSounds}
                className="flex items-center justify-center gap-2 h-20"
              >
                <Bell className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Venta exitosa</div>
                  <div className="text-xs text-gray-500">Tono alegre</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => testSound('error')}
                disabled={!settings.enableSounds}
                className="flex items-center justify-center gap-2 h-20"
              >
                <Bell className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <div className="font-medium">Error</div>
                  <div className="text-xs text-gray-500">Tono grave</div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comportamiento */}
      <Card>
        <CardHeader>
          <CardTitle>Comportamiento del POS</CardTitle>
          <CardDescription>
            Configura cómo funciona el punto de venta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="enableNotifications" className="text-base font-medium cursor-pointer">
                Notificaciones visuales
              </Label>
              <p className="text-sm text-gray-500">
                Mostrar notificaciones en pantalla para acciones importantes
              </p>
            </div>
            <Switch
              id="enableNotifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="requireCustomer" className="text-base font-medium cursor-pointer">
                Requerir cliente en ventas
              </Label>
              <p className="text-sm text-gray-500">
                Obligar a seleccionar un cliente antes de completar una venta
              </p>
            </div>
            <Switch
              id="requireCustomer"
              checked={settings.requireCustomer}
              onCheckedChange={(checked) => updateSetting('requireCustomer', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="showProductImages" className="text-base font-medium cursor-pointer">
                Mostrar imágenes de productos
              </Label>
              <p className="text-sm text-gray-500">
                Visualizar imágenes de productos en el POS
              </p>
            </div>
            <Switch
              id="showProductImages"
              checked={settings.showProductImages}
              onCheckedChange={(checked) => updateSetting('showProductImages', checked)}
            />
          </div>

          <div>
            <Label htmlFor="itemsPerPage">Productos por página</Label>
            <Input
              id="itemsPerPage"
              type="number"
              min="5"
              max="100"
              value={settings.itemsPerPage}
              onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value) || 20)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cantidad de productos a mostrar por página en el POS
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impresión */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Printer className="h-6 w-6 text-gray-600" />
            <div>
              <CardTitle>Configuración de Impresión</CardTitle>
              <CardDescription>
                Configura la impresora y opciones de impresión
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="printerEnabled" className="text-base font-medium cursor-pointer">
                Habilitar impresora
              </Label>
              <p className="text-sm text-gray-500">
                Activar la funcionalidad de impresión de recibos
              </p>
            </div>
            <Switch
              id="printerEnabled"
              checked={settings.printerEnabled}
              onCheckedChange={(checked) => updateSetting('printerEnabled', checked)}
            />
          </div>

          {settings.printerEnabled && (
            <>
              <div>
                <Label htmlFor="printerName">Nombre de la impresora</Label>
                <Input
                  id="printerName"
                  value={settings.printerName}
                  onChange={(e) => updateSetting('printerName', e.target.value)}
                  placeholder="Impresora térmica"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="autoPrint" className="text-base font-medium cursor-pointer">
                    Impresión automática
                  </Label>
                  <p className="text-sm text-gray-500">
                    Imprimir recibo automáticamente al completar una venta
                  </p>
                </div>
                <Switch
                  id="autoPrint"
                  checked={settings.autoPrint}
                  onCheckedChange={(checked) => updateSetting('autoPrint', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Sobre la configuración del POS</p>
            <p className="text-blue-700">
              Estos ajustes se guardan automáticamente para tu compañía y se aplicarán 
              a todos los usuarios. Los cambios entran en vigencia inmediatamente después 
              de guardar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
