'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Phone, Lock, Store, BarChart3, Smartphone, Monitor } from 'lucide-react'
import { useNotifications } from '@/components/ui/NotificationProvider'
import Link from 'next/link'

function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState('')
  const router = useRouter()
  const { showSuccess, showError, showInfo } = useNotifications()

  // Detectar tipo de login automáticamente
  useEffect(() => {
    if (login.includes('@')) {
      setLoginType('email')
    } else if (login.match(/^\+?\d+$/)) {
      setLoginType('phone')
    } else {
      setLoginType('')
    }
  }, [login])

  // Función para determinar la ruta según el rol
  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '/dashboard'
      case 'VENDEDOR':
        return '/pos'
      case 'ALMACEN':
        return '/inventory'
      case 'SOLO_LECTURA':
        return '/reports'
      default:
        return '/dashboard'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Intentando autenticar con:', { login, password: '***' })
      }
      
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Resultado de signIn:', result)
      }

      if (result?.error) {
        const errorMessage = 'Credenciales inválidas. Verifica tu email/celular y contraseña'
        // Log solo en desarrollo - es comportamiento esperado cuando usuario/password no coinciden
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Intento de login fallido:', result.error)
        }
        setError(errorMessage)
        showError('Error de autenticación', errorMessage)
      } else if (result?.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Autenticación exitosa')
        }
        
        // Obtener la sesión para redirigir según el rol
        const session = await getSession()
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📋 Sesión obtenida:', session)
        }
        
        const redirectPath = getRedirectPath(session?.user?.role || 'ADMIN')
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Redirigiendo usuario:', {
            role: session?.user?.role,
            email: session?.user?.email,
            redirectPath
          })
        }
        
        // Mostrar notificación de éxito
        showSuccess(
          'Inicio de sesión exitoso',
          `Bienvenido ${session?.user?.name || session?.user?.email}`
        )
        
        // Mostrar información sobre el rol
        showInfo(
          `Acceso como ${session?.user?.role || 'ADMIN'}`,
          `Redirigiendo a ${redirectPath.replace('/', '')}`
        )
        
        router.push(redirectPath)
      } else {
        console.error('❌ Respuesta inesperada:', result)
        setError('Error inesperado durante la autenticación')
      }
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error)
      const errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo'
      setError(errorMessage)
      showError('Error del sistema', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Panel Izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Elementos geométricos de fondo */}
        <div className="absolute inset-0">
          {/* Círculos decorativos similares a SICAR */}
          <div className="absolute top-20 left-20 w-32 h-32 border border-blue-400/20 rounded-full"></div>
          <div className="absolute top-32 left-32 w-24 h-24 border border-blue-300/30 rounded-full"></div>
          <div className="absolute top-40 left-16 w-16 h-16 bg-blue-400/10 rounded-full"></div>
          
          {/* Formas geométricas grandes */}
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-blue-300/20 rounded-full"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 bg-blue-400/10 rounded-full"></div>
          
          {/* Elementos adicionales */}
          <div className="absolute top-1/2 left-10 w-2 h-20 bg-blue-300/20 rounded-full transform -rotate-45"></div>
          <div className="absolute top-1/3 right-16 w-2 h-16 bg-blue-300/20 rounded-full transform rotate-45"></div>
          
          {/* Iconos de fondo sutiles */}
          <Store className="absolute top-1/4 left-1/4 w-8 h-8 text-blue-300/20 transform rotate-12" />
          <BarChart3 className="absolute bottom-1/3 left-1/3 w-6 h-6 text-blue-300/20 transform -rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">PosAI</h1>
                <p className="text-blue-100 text-lg">Sistema Inteligente</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-light mb-4 leading-tight">
              Transforma tu negocio con<br/>
              <span className="font-bold">tecnología avanzada</span>
            </h2>
            
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Gestiona inventario, ventas y clientes desde una plataforma 
              unificada diseñada para diferentes giros comerciales.
            </p>
          </div>

          {/* Disponible para dispositivos móviles */}
          <div className="space-y-6">
            <p className="text-blue-200 text-sm font-medium">Disponible para dispositivos móviles</p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">iOS & Android</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Monitor className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Web App</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo para móviles */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PosAI</h1>
            <p className="text-gray-600">Sistema Inteligente</p>
          </div>

          <div className="text-center mb-8 hidden lg:block">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PosAI</h1>
            <p className="text-gray-600 text-lg">Sistema Inteligente</p>
          </div>

          <div className="bg-transparent">
            <div className="p-0">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login" className="text-sm font-medium text-gray-700">
                    Email o Celular
                  </Label>
                  <div className="relative">
                    <Input
                      id="login"
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="admin@ferreai.com o +1234567890"
                      className="h-12 pl-12 pr-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {loginType === 'email' ? (
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : loginType === 'phone' ? (
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Contraseña
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="••••••••"
                      className="h-12 pl-12 pr-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Iniciando sesión...
                    </div>
                  ) : (
                    'INGRESAR'
                  )}
                </Button>
              </form>

              <div className="mt-8">
                <Link href="/register">
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-green-500 text-green-600 hover:bg-green-50 font-medium rounded-lg transition-colors duration-200"
                  >
                    CREAR CUENTA
                  </Button>
                </Link>
              </div>

              {/* OAUTH - DESHABILITADO TEMPORALMENTE
              Razón: Requiere que el usuario ya exista en BD
              TODO: Implementar auto-registro con OAuth cuando se decida el flujo
              
              <div className="mt-6">
                <p className="text-center text-gray-500 text-sm mb-4">Ingresar con</p>
                <div className="flex justify-center space-x-4">
                  <button 
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Solo Google disponible. Facebook y Apple próximamente.
                </p>
              </div>
              */}

              <div className="mt-6 text-center text-xs text-gray-500">
                <p>POS Solutions SA de CV</p>
                <Link href="/terminos-y-condiciones">
                  <button className="text-blue-600 hover:text-blue-700 underline">
                    Términos y condiciones
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage