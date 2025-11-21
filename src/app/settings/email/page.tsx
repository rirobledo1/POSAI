'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MainLayout from '@/components/layout/MainLayout'
import RouteProtector from '@/components/layout/RouteProtector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react'
import { useNotifications } from '@/components/ui/NotificationProvider'

interface EmailConfig {
  provider: 'GMAIL' | 'OUTLOOK' | 'SMTP' | 'NONE'
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromName: string
  configured: boolean
}

const PROVIDERS = [
  {
    value: 'GMAIL',
    label: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    instructions: [
      'Ve a tu cuenta de Google: myaccount.google.com',
      'Navega a Seguridad → Verificación en 2 pasos (debe estar activada)',
      'Busca "Contraseñas de aplicaciones"',
      'Genera una nueva contraseña para "Correo"',
      'Copia la contraseña generada (16 caracteres sin espacios)'
    ],
    link: 'https://myaccount.google.com/apppasswords'
  },
  {
    value: 'OUTLOOK',
    label: 'Outlook / Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    instructions: [
      'Usa tu email completo de Outlook/Hotmail',
      'Usa tu contraseña normal de Microsoft',
      'No necesitas contraseña de aplicación'
    ],
    link: null
  },
  {
    value: 'SMTP',
    label: 'SMTP Personalizado',
    host: '',
    port: 587,
    secure: false,
    instructions: [
      'Contacta a tu proveedor de hosting',
      'Solicita los datos de conexión SMTP',
      'Generalmente necesitas: servidor, puerto, usuario y contraseña'
    ],
    link: null
  }
]

export default function EmailSettingsPage() {
  const { data: session } = useSession()
  const { showSuccess, showError } = useNotifications()

  const [config, setConfig] = useState<EmailConfig>({
    provider: 'NONE',
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: '',
    configured: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/email')
      
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (provider: string) => {
    const preset = PROVIDERS.find(p => p.value === provider)
    if (preset) {
      setConfig(prev => ({
        ...prev,
        provider: preset.value as any,
        host: preset.host,
        port: preset.port,
        secure: preset.secure
      }))
    }
  }

  const handleTestConnection = async () => {
    if (!config.user || !config.password) {
      showError('Error', 'Por favor completa el email y la contraseña')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({ success: true, message: '✅ Conexión exitosa' })
        showSuccess('Conexión exitosa', 'La configuración de email funciona correctamente')
      } else {
        setTestResult({ success: false, message: data.error || 'Error de conexión' })
        showError('Error de conexión', data.error || 'No se pudo conectar al servidor')
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error al probar conexión' })
      showError('Error', 'No se pudo probar la conexión')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!config.user || !config.password || !config.fromName) {
      showError('Error', 'Por favor completa todos los campos requeridos')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('Guardado exitoso', 'La configuración de email ha sido guardada')
        setConfig(prev => ({ ...prev, configured: true }))
      } else {
        showError('Error', data.error || 'No se pudo guardar la configuración')
      }
    } catch (error) {
      showError('Error', 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const selectedProvider = PROVIDERS.find(p => p.value === config.provider)

  if (loading) {
    return (
      <RouteProtector allowedRoles={['ADMIN']}>
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </MainLayout>
      </RouteProtector>
    )
  }

  return (
    <RouteProtector allowedRoles={['ADMIN']}>
      <MainLayout>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración de Email</h1>
            <p className="text-gray-600 mt-2">
              Configura tu cuenta de email para enviar estados de cuenta, cotizaciones y más
            </p>
          </div>

          {/* Estado actual */}
          {config.configured && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Email configurado</p>
                    <p className="text-sm text-green-700">
                      Los emails se enviarán desde: {config.user}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración SMTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor de Email
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NONE">Selecciona un proveedor...</option>
                  {PROVIDERS.map(provider => (
                    <option key={provider.value} value={provider.value}>
                      {provider.label}
                    </option>
                  ))}
                </select>
              </div>

              {config.provider !== 'NONE' && (
                <>
                  {/* Instrucciones */}
                  {selectedProvider && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 mb-2">
                            Instrucciones para {selectedProvider.label}:
                          </p>
                          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            {selectedProvider.instructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                          {selectedProvider.link && (
                            <a
                              href={selectedProvider.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              Ir a configuración →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nombre remitente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Remitente *
                    </label>
                    <input
                      type="text"
                      value={config.fromName}
                      onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
                      placeholder="Mi Ferretería"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nombre que verán tus clientes al recibir emails
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={config.user}
                      onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
                      placeholder="tuempresa@gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={config.password}
                        onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                        placeholder={config.provider === 'GMAIL' ? 'xxxx xxxx xxxx xxxx' : 'Tu contraseña'}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {config.provider === 'GMAIL' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Usa una "Contraseña de aplicación", no tu contraseña normal
                      </p>
                    )}
                  </div>

                  {/* Configuración avanzada (solo SMTP) */}
                  {config.provider === 'SMTP' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Servidor SMTP
                          </label>
                          <input
                            type="text"
                            value={config.host}
                            onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                            placeholder="smtp.tuservidor.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Puerto
                          </label>
                          <input
                            type="number"
                            value={config.port}
                            onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="secure"
                          checked={config.secure}
                          onChange={(e) => setConfig(prev => ({ ...prev, secure: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="secure" className="ml-3 text-sm text-gray-700">
                          Usar SSL/TLS (generalmente puerto 465)
                        </label>
                      </div>
                    </>
                  )}

                  {/* Resultado del test */}
                  {testResult && (
                    <div className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                      <div className="flex items-center gap-3">
                        {testResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <p className={`text-sm font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                          {testResult.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testing || !config.user || !config.password}
                      variant="outline"
                      className="flex-1"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Probando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Probar Conexión
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={saving || !config.user || !config.password || !config.fromName}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Configuración
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info adicional */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-gray-900">¿Para qué se usa el email?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Enviar estados de cuenta a clientes</li>
                    <li>Enviar cotizaciones</li>
                    <li>Recordatorios de pago</li>
                    <li>Confirmaciones de pago recibido</li>
                    <li>Facturas y recibos</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">
                    🔒 Tus credenciales se guardan encriptadas y solo se usan para enviar emails desde tu cuenta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RouteProtector>
  )
}
