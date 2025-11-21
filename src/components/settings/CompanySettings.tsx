'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  BuildingOfficeIcon,
  PencilIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { getBusinessTypeInfo } from '@/lib/business-type-helpers'

// Tipos de empresa disponibles
const BUSINESS_TYPES = [
  { value: 'FERRETERIA', label: '🔧 Ferretería', description: 'Herramientas, tornillería, construcción' },
  { value: 'ABARROTES', label: '🛒 Abarrotes', description: 'Tienda de conveniencia, alimentos' },
  { value: 'PAPELERIA', label: '📝 Papelería', description: 'Útiles escolares, oficina' },
  { value: 'FARMACIA', label: '💊 Farmacia', description: 'Medicamentos, cuidado personal' },
  { value: 'RESTAURANTE', label: '🍽️ Restaurante', description: 'Comida, bebidas, servicios' },
  { value: 'ROPA', label: '👕 Ropa', description: 'Vestimenta, accesorios, moda' },
  { value: 'ELECTRONICA', label: '📱 Electrónicos', description: 'Dispositivos, tecnología' },
  { value: 'AUTOMOTRIZ', label: '🚗 Automotriz', description: 'Repuestos, accesorios de auto' },
  { value: 'BELLEZA', label: '💄 Belleza', description: 'Cosmética, cuidado personal' },
  { value: 'DEPORTES', label: '⚽ Deportes', description: 'Equipos deportivos, ropa deportiva' },
  { value: 'JUGUETERIA', label: '🧸 Juguetería', description: 'Juguetes, entretenimiento infantil' },
  { value: 'LIBRERIA', label: '📚 Librería', description: 'Libros, material educativo' },
  { value: 'GENERAL', label: '🏪 General', description: 'Productos diversos' }
];

interface CompanyData {
  name: string
  legalName: string
  rfc: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  website: string
  logo?: string
  taxRate: number
  currency: string
  timeZone: string
  businessType: string
}

export function CompanySettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    legalName: '',
    rfc: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    taxRate: 16,
    currency: 'MXN',
    timeZone: 'America/Mexico_City',
    businessType: 'GENERAL'
  })

  // Mock data
  const mockCompanyData: CompanyData = {
    name: 'Ferretería El Martillo',
    legalName: 'Ferretería El Martillo S.A. de C.V.',
    rfc: 'FEM123456789',
    address: 'Av. Revolución 123, Centro',
    city: 'Guadalajara',
    state: 'Jalisco',
    zipCode: '44100',
    phone: '+52 33 1234 5678',
    email: 'contacto@ferreteria-elmartillo.com',
    website: 'www.ferreteria-elmartillo.com',
    taxRate: 16,
    currency: 'MXN',
    timeZone: 'America/Mexico_City',
    businessType: 'FERRETERIA'
  }

  useEffect(() => {
    // Cargar configuración real de la empresa desde el API
    const loadCompanyData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/company')
        if (!response.ok) {
          throw new Error('Error al cargar configuración')
        }
        
        const data = await response.json()
        console.log('✅ Configuración cargada desde API:', data)
        
        // Mapear datos del API al formato del componente
        setCompanyData({
          name: data.name || '',
          legalName: data.name || '', // En la nueva API no hay businessName separado
          rfc: data.taxId || '',
          address: data.address || '',
          city: '', // La nueva API no tiene city separado
          state: '', // La nueva API no tiene state separado
          zipCode: '', // La nueva API no tiene zipCode separado
          phone: data.phone || '',
          email: data.email || '',
          website: '', // La nueva API no tiene website
          taxRate: data.taxRate || 16,
          currency: data.currency || 'MXN',
          timeZone: 'America/Mexico_City', // La nueva API no tiene timezone
          businessType: data.businessType || 'GENERAL'
        })
      } catch (error) {
        console.error('❌ Error cargando configuración:', error)
        // En caso de error, usar datos por defecto
        setCompanyData(mockCompanyData)
      } finally {
        setLoading(false)
      }
    }
    loadCompanyData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      console.log('💾 Guardando configuración:', companyData)
      
      // Mapear datos del componente al formato de la nueva API
      const apiData = {
        name: companyData.name,
        taxId: companyData.rfc,
        email: companyData.email,
        phone: companyData.phone,
        address: companyData.address,
        taxRate: companyData.taxRate,
        currency: companyData.currency,
        businessType: companyData.businessType
      }
      
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar configuración')
      }
      
      const result = await response.json()
      console.log('✅ Configuración guardada:', result)
      
      setIsEditing(false)
      alert('✅ Configuración de empresa actualizada correctamente. Los cambios se aplicarán en todo el sistema.')
    } catch (error) {
      console.error('❌ Error guardando configuración:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`❌ Error al guardar: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setCompanyData(mockCompanyData)
    setIsEditing(false)
  }

  const isFormValid = () => {
    return companyData.name && 
           companyData.rfc && 
           companyData.address && 
           companyData.phone && 
           companyData.email
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5" />
              Configuración de Empresa
            </CardTitle>
            <div className="flex items-center gap-2">
              {isFormValid() ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Incompleto
                </Badge>
              )}
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identidad de la Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Comercial *</Label>
                <Input
                  id="name"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rfc">RFC *</Label>
                <Input
                  id="rfc"
                  value={companyData.rfc}
                  onChange={(e) => setCompanyData({...companyData, rfc: e.target.value.toUpperCase()})}
                  disabled={!isEditing}
                  required
                  maxLength={13}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rfc">RFC *</Label>
                <Input
                  id="rfc"
                  value={companyData.rfc}
                  onChange={(e) => setCompanyData({...companyData, rfc: e.target.value.toUpperCase()})}
                  disabled={!isEditing}
                  required
                  maxLength={13}
                />
              </div>
              <div>
                <Label htmlFor="businessType">Tipo de Negocio *</Label>
                <select
                  id="businessType"
                  value={companyData.businessType}
                  onChange={(e) => setCompanyData({...companyData, businessType: e.target.value})}
                  disabled={!isEditing}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo">Logo de la Empresa</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isEditing}
                    className="flex items-center gap-2"
                  >
                    <PhotoIcon className="h-4 w-4" />
                    Subir Logo
                  </Button>
                  <span className="text-sm text-gray-500">
                    {companyData.logo ? 'Logo configurado' : 'Sin logo'}
                  </span>
                </div>
              </div>
              <div>
                {/* Descripción del tipo de negocio */}
                {companyData.businessType && (
                  <div className="mt-2">
                    <Label className="text-sm text-gray-600">Descripción del tipo de negocio</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      {BUSINESS_TYPES.find(t => t.value === companyData.businessType)?.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                disabled={!isEditing}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({...companyData, city: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={companyData.state}
                  onChange={(e) => setCompanyData({...companyData, state: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Código Postal</Label>
                <Input
                  id="zipCode"
                  value={companyData.zipCode}
                  onChange={(e) => setCompanyData({...companyData, zipCode: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({...companyData, phone: e.target.value})}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                type="url"
                value={companyData.website}
                onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                disabled={!isEditing}
                placeholder="https://www.ejemplo.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración del Negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="taxRate">Tasa de IVA (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={companyData.taxRate}
                  onChange={(e) => setCompanyData({...companyData, taxRate: parseFloat(e.target.value) || 0})}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  value={companyData.currency}
                  onChange={(e) => setCompanyData({...companyData, currency: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                >
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timeZone">Zona Horaria</Label>
                <select
                  id="timeZone"
                  value={companyData.timeZone}
                  onChange={(e) => setCompanyData({...companyData, timeZone: e.target.value})}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50"
                >
                  <option value="America/Mexico_City">Ciudad de México</option>
                  <option value="America/Cancun">Cancún</option>
                  <option value="America/Monterrey">Monterrey</option>
                  <option value="America/Tijuana">Tijuana</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {isEditing && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !isFormValid()}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
