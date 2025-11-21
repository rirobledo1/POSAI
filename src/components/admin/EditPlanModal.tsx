'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotifications } from '@/components/ui/NotificationProvider'
import { 
  XMarkIcon,
  CheckIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ServerIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface Plan {
  id: string
  planCode: string
  planName: string
  description: string
  monthlyPriceMxn: number
  annualPriceMxn: number
  monthlyPriceUsd: number
  annualPriceUsd: number
  annualDiscountPercent: number
  maxBranches: number
  maxUsers: number
  maxProducts: number | null
  maxStorageMb: number | null
  features: any
  trialDays: number
  displayOrder: number
  isActive: boolean
  isPopular: boolean
}

interface EditPlanModalProps {
  plan: Plan
  onClose: () => void
  onSave: () => void
}

type TabType = 'precios' | 'limites' | 'caracteristicas' | 'config'

export function EditPlanModal({ plan, onClose, onSave }: EditPlanModalProps) {
  const { showSuccess, showError } = useNotifications()
  const [activeTab, setActiveTab] = useState<TabType>('precios')
  const [saving, setSaving] = useState(false)
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    planName: plan.planName,
    description: plan.description,
    monthlyPriceMxn: plan.monthlyPriceMxn,
    annualPriceMxn: plan.annualPriceMxn,
    monthlyPriceUsd: plan.monthlyPriceUsd,
    annualPriceUsd: plan.annualPriceUsd,
    annualDiscountPercent: plan.annualDiscountPercent,
    maxBranches: plan.maxBranches,
    maxUsers: plan.maxUsers,
    maxProducts: plan.maxProducts,
    maxStorageMb: plan.maxStorageMb,
    trialDays: plan.trialDays,
    displayOrder: plan.displayOrder,
    isActive: plan.isActive,
    isPopular: plan.isPopular,
    features: plan.features
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/subscription-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          ...formData
        })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el plan')
      }

      showSuccess('¡Éxito!', `Plan ${formData.planName} actualizado correctamente`)
      onSave()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      showError('Error', 'No se pudo actualizar el plan')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'precios' as TabType, name: 'Precios', icon: CurrencyDollarIcon },
    { id: 'limites' as TabType, name: 'Límites', icon: UserGroupIcon },
    { id: 'caracteristicas' as TabType, name: 'Características', icon: SparklesIcon },
    { id: 'config' as TabType, name: 'Configuración', icon: Cog6ToothIcon }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Editar Plan: {formData.planName}
              {formData.isPopular && (
                <Badge className="bg-blue-600 text-white">⚡ Popular</Badge>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Código: {plan.planCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenido */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Tab: Precios */}
          {activeTab === 'precios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Precios MXN */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                    Precios en MXN
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Mensual (MXN)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyPriceMxn}
                      onChange={(e) => setFormData({ ...formData, monthlyPriceMxn: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Anual (MXN)
                    </label>
                    <input
                      type="number"
                      value={formData.annualPriceMxn}
                      onChange={(e) => setFormData({ ...formData, annualPriceMxn: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Precios USD */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
                    Precios en USD
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Mensual (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyPriceUsd}
                      onChange={(e) => setFormData({ ...formData, monthlyPriceUsd: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Anual (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.annualPriceUsd}
                      onChange={(e) => setFormData({ ...formData, annualPriceUsd: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento Anual (%)
                </label>
                <input
                  type="number"
                  value={formData.annualDiscountPercent}
                  onChange={(e) => setFormData({ ...formData, annualDiscountPercent: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje de descuento para el pago anual
                </p>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Vista Previa</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Mensual:</p>
                    <p className="font-bold text-lg">${formData.monthlyPriceMxn.toLocaleString()} MXN</p>
                    <p className="text-xs text-gray-500">${formData.monthlyPriceUsd.toLocaleString()} USD</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Anual:</p>
                    <p className="font-bold text-lg">${formData.annualPriceMxn.toLocaleString()} MXN</p>
                    <p className="text-xs text-gray-500">${formData.annualPriceUsd.toLocaleString()} USD</p>
                    {formData.annualDiscountPercent > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        {formData.annualDiscountPercent}% descuento
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Límites */}
          {activeTab === 'limites' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <BuildingOfficeIcon className="h-5 w-5" />
                    Máximo de Sucursales
                  </label>
                  <input
                    type="number"
                    value={formData.maxBranches}
                    onChange={(e) => setFormData({ ...formData, maxBranches: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usa 999999 para ilimitado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5" />
                    Máximo de Usuarios
                  </label>
                  <input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usa 999999 para ilimitado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Máximo de Productos
                  </label>
                  <input
                    type="number"
                    value={formData.maxProducts || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      maxProducts: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Ilimitado (dejar vacío)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ServerIcon className="h-5 w-5" />
                    Almacenamiento (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.maxStorageMb || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      maxStorageMb: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="Ilimitado (dejar vacío)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.maxStorageMb && formData.maxStorageMb >= 1024 
                      ? `${(formData.maxStorageMb / 1024).toFixed(1)} GB`
                      : formData.maxStorageMb 
                        ? `${formData.maxStorageMb} MB`
                        : 'Ilimitado'
                    }
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Resumen de Límites</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                    <span>{formData.maxBranches >= 999999 ? '∞' : formData.maxBranches} sucursales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-500" />
                    <span>{formData.maxUsers >= 999999 ? '∞' : formData.maxUsers} usuarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-gray-500" />
                    <span>{formData.maxProducts ? `${formData.maxProducts} productos` : '∞ productos'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ServerIcon className="h-4 w-4 text-gray-500" />
                    <span>
                      {formData.maxStorageMb 
                        ? formData.maxStorageMb >= 1024 
                          ? `${(formData.maxStorageMb / 1024).toFixed(1)} GB`
                          : `${formData.maxStorageMb} MB`
                        : '∞ almacenamiento'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Características - Simplificado para ahora */}
          {activeTab === 'caracteristicas' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> La edición de características individuales se implementará en una futura actualización.
                  Por ahora, las características se mantienen según la configuración inicial del plan.
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Características Actuales</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(formData.features, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tab: Configuración */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Plan
                </label>
                <input
                  type="text"
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Días de Prueba
                  </label>
                  <input
                    type="number"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Plan Activo</span>
                    <p className="text-xs text-gray-500">Los usuarios pueden suscribirse a este plan</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Marcar como "Más Popular"</span>
                    <p className="text-xs text-gray-500">Se mostrará con un badge especial</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
