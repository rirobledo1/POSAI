'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Store, Building2, Mail, Phone, Lock, User, ArrowLeft } from 'lucide-react'
import { useNotifications } from '@/components/ui/NotificationProvider'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { showSuccess, showError } = useNotifications()
  
  // Estados del formulario
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Datos de la compañía
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('GENERAL')
  
  // Datos del usuario
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Datos de la compañía
          companyName,
          businessType,
          // Datos del usuario
          userName,
          email,
          phone,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta')
      }
      
      showSuccess(
        '¡Cuenta creada exitosamente!',
        'Ya puedes iniciar sesión con tus credenciales'
      )
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (error: any) {
      console.error('Error en registro:', error)
      setError(error.message || 'Error al crear la cuenta')
      showError('Error en el registro', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/login"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio de sesión
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Título principal */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h1>
            <p className="text-gray-600">
              Comienza a gestionar tu negocio en minutos
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Sección 1: Datos de la Empresa */}
              <div>
                <div className="flex items-center mb-4">
                  <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Información de tu Empresa
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                      Nombre de la Empresa *
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Ferretería El Tornillo"
                      className="h-12 mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                      Tipo de Negocio *
                    </Label>
                    <select
                      id="businessType"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full h-12 mt-1 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="GENERAL">General</option>
                      <option value="FERRETERIA">Ferretería</option>
                      <option value="ABARROTES">Abarrotes</option>
                      <option value="PAPELERIA">Papelería</option>
                      <option value="FARMACIA">Farmacia</option>
                      <option value="RESTAURANTE">Restaurante</option>
                      <option value="ROPA">Ropa</option>
                      <option value="ELECTRONICA">Electrónica</option>
                      <option value="AUTOMOTRIZ">Automotriz</option>
                      <option value="BELLEZA">Belleza</option>
                      <option value="DEPORTES">Deportes</option>
                      <option value="JUGUETERIA">Juguetería</option>
                      <option value="LIBRERIA">Librería</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6"></div>

              {/* Sección 2: Datos del Usuario */}
              <div>
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tu Información Personal
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="userName" className="text-sm font-medium text-gray-700">
                      Nombre Completo *
                    </Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder="Juan Pérez"
                      className="h-12 mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="tu@email.com"
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Teléfono (opcional)
                    </Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading}
                        placeholder="+52 123 456 7890"
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Contraseña *
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="Mínimo 8 caracteres"
                        className="h-12 pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmar Contraseña *
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="Repite tu contraseña"
                        className="h-12 pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Submit */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando cuenta...
                    </div>
                  ) : (
                    'CREAR MI CUENTA GRATIS'
                  )}
                </Button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  Al crear una cuenta, aceptas nuestros{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                    Términos y Condiciones
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Ya tienes cuenta */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link 
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
