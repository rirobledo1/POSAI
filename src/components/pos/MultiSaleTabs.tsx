// src/components/pos/MultiSaleTabs.tsx
import React from 'react'
import { Plus, Save, BarChart3, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SaleTabButton from './SaleTabButton'
import { useMultiSales } from '@/hooks/useMultiSales'

interface MultiSaleTabsProps {
  className?: string
  onCashRegister?: () => void
}

export default function MultiSaleTabs({ className = '', onCashRegister }: MultiSaleTabsProps) {
  const {
    tabs,
    activeTabId,
    createNewTab,
    switchToTab,
    closeTab,
    renameTab,
    duplicateTab,
    saveManually,
    getStats,
    MAX_TABS
  } = useMultiSales()

  const stats = getStats()

  return (
    <div className={`bg-gray-50 border-b ${className}`}>
      {/* Barra de pestañas principal - SUPER COMPACTA CON ESPACIO PARA HAMBURGUESA */}
      <div className="flex items-center min-h-[36px]">
        {/* Espaciado para el botón hamburguesa */}
        <div className="w-16 flex-shrink-0"></div>
        
        {/* Pestañas de ventas */}
        <div className="flex-1 flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          {tabs.map(tab => (
            <SaleTabButton
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => switchToTab(tab.id)}
              onClose={() => closeTab(tab.id)}
              onRename={(newName) => renameTab(tab.id, newName)}
              onDuplicate={() => duplicateTab(tab.id)}
              canClose={tabs.length > 1}
            />
          ))}
          
          {/* Botón para nueva venta */}
          <div className="flex items-center px-1.5 py-0.5 border-r border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={createNewTab}
              disabled={!stats.canCreateNew}
              className={`
                h-6 px-2 gap-1 transition-all text-xs
                ${stats.canCreateNew 
                  ? 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600' 
                  : 'opacity-50'
                }
              `}
              title={
                stats.canCreateNew 
                  ? 'Crear nueva venta' 
                  : `Máximo ${MAX_TABS} ventas simultáneas`
              }
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Nueva Venta</span>
            </Button>
          </div>
        </div>

        {/* Panel de estadísticas y acciones - MÁS COMPACTO */}
        <div className="flex items-center gap-1.5 px-2 border-l border-gray-200">
          {/* Estadísticas rápidas - ICONOS SOLO */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <BarChart3 className="h-3 w-3" />
            <div className="flex gap-1.5">
              <div className="flex items-center gap-0.5">
                <span className="text-gray-500">V:</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.totalTabs}
                </Badge>
              </div>
              
              {stats.tabsWithItems > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-500">P:</span>
                  <Badge variant="default" className="text-xs bg-blue-500">
                    {stats.tabsWithItems}
                  </Badge>
                </div>
              )}
              
              {stats.totalItems > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-500">I:</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalItems}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Botón de Corte de Caja */}
          {onCashRegister && (
            <Button
              variant="default"
              size="sm"
              onClick={onCashRegister}
              className="h-6 px-2 gap-1 bg-green-600 hover:bg-green-700 text-white text-xs"
              title="Abrir corte de caja"
            >
              <DollarSign className="h-3 w-3" />
              <span>Caja</span>
            </Button>
          )}

          {/* Botón de guardado manual */}
          <Button
            variant="ghost"
            size="sm"
            onClick={saveManually}
            className="h-6 px-2 gap-1 hover:bg-blue-50 hover:text-blue-600 text-xs"
            title="Guardar todas las ventas manualmente"
          >
            <Save className="h-3 w-3" />
            <span className="hidden md:inline">Guardar</span>
          </Button>
        </div>
      </div>

      {/* Indicador de auto-guardado - SOLO CUANDO HAY MÚLTIPLES VENTAS */}
      {stats.totalTabs > 1 && (
        <div className="px-2 py-0 bg-blue-50 border-t border-blue-100">
          <div className="text-xs text-blue-600 truncate">
            <span className="font-medium">{tabs.find(t => t.id === activeTabId)?.name}</span>
          </div>
        </div>
      )}
    </div>
  )
}