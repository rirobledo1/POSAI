'use client'

import { useState, useEffect } from 'react'
import { Building2, Plus, MapPin, Users, Package, TrendingUp, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useNotifications } from '@/components/ui/NotificationProvider'
import { CreateBranchModal } from './CreateBranchModal'
import { EditBranchModal } from './EditBranchModal'

interface Branch {
  id: string
  name: string
  code: string
  address: string
  city: string
  state: string
  phone?: string
  email?: string
  isMain: boolean
  isActive: boolean
  stats: {
    users: number
    sales: number
    products: number
  }
}

interface BranchLimits {
  current: number
  max: number
  canAddMore: boolean
  plan: string
}

export function BranchesManagement() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [limits, setLimits] = useState<BranchLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const { showSuccess, showError } = useNotifications()

  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/branches')
      if (!response.ok) throw new Error('Error al cargar sucursales')
      
      const data = await response.json()
      setBranches(data.branches)
      setLimits(data.limits)
    } catch (error) {
      console.error('Error:', error)
      showError('Error', 'No se pudieron cargar las sucursales')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (branchId: string, branchName: string) => {
    if (!confirm(`¿Estás seguro de que deseas desactivar la sucursal "${branchName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al desactivar')
      }

      showSuccess('¡Desactivada!', 'La sucursal se ha desactivado correctamente')
      loadBranches()
    } catch (error: any) {
      showError('Error', error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sucursales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Sucursales</h2>
          <p className="text-gray-600 mt-1">
            Administra las ubicaciones de tu negocio
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!limits?.canAddMore}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>

      {/* Límites del Plan */}
      {limits && (
        <Card className={limits.canAddMore ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className={`h-5 w-5 ${limits.canAddMore ? 'text-blue-600' : 'text-orange-600'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sucursales: {limits.current} de {limits.max}
                  </p>
                  <p className="text-xs text-gray-600">
                    Plan {limits.plan} {limits.canAddMore ? '✓' : '(límite alcanzado)'}
                  </p>
                </div>
              </div>
              {!limits.canAddMore && (
                <Button variant="outline" size="sm">
                  Actualizar Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className={branch.isMain ? 'border-blue-300 bg-blue-50/30' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{branch.name}</CardTitle>
                    {branch.isMain && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    {branch.code}
                  </CardDescription>
                </div>
                {!branch.isMain && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBranch(branch)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(branch.id, branch.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Ubicación */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-900">{branch.address}</p>
                  <p className="text-gray-500">{branch.city}, {branch.state}</p>
                </div>
              </div>

              {/* Contacto */}
              {(branch.phone || branch.email) && (
                <div className="text-sm space-y-1">
                  {branch.phone && (
                    <p className="text-gray-600">📞 {branch.phone}</p>
                  )}
                  {branch.email && (
                    <p className="text-gray-600">✉️ {branch.email}</p>
                  )}
                </div>
              )}

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900">
                      {branch.stats.users}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Usuarios</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900">
                      {branch.stats.products}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Productos</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900">
                      {branch.stats.sales}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ventas</p>
                </div>
              </div>

              {/* Estado */}
              {!branch.isActive && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Desactivada</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CreateBranchModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadBranches()
            setShowCreateModal(false)
          }}
        />
      )}

      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onSuccess={() => {
            loadBranches()
            setEditingBranch(null)
          }}
        />
      )}
    </div>
  )
}
