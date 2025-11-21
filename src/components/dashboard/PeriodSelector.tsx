// 🗓️ COMPONENTE SELECTOR DE PERÍODOS SIMPLIFICADO
// src/components/dashboard/PeriodSelector.tsx

'use client'

import React, { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export type PeriodType = 'current_month' | 'current_year' | 'last_12_months' | 'last_30_days' | 'all_time'

export interface PeriodOption {
  value: PeriodType
  label: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'gray'
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  {
    value: 'current_month',
    label: 'Este Mes',
    description: 'Ventas del mes actual',
    color: 'blue'
  },
  {
    value: 'current_year',
    label: 'Este Año',
    description: 'Ventas del año actual',
    color: 'green'
  },
  {
    value: 'last_12_months',
    label: 'Últimos 12 Meses',
    description: 'Últimos 12 meses completos',
    color: 'purple'
  },
  {
    value: 'last_30_days',
    label: 'Últimos 30 Días',
    description: 'Últimos 30 días naturales',
    color: 'orange'
  },
  {
    value: 'all_time',
    label: 'Todo el Tiempo',
    description: 'Todas las ventas históricas',
    color: 'gray'
  }
]

interface PeriodSelectorProps {
  selectedPeriod: PeriodType
  onPeriodChange: (period: PeriodType) => void
  loading?: boolean
  className?: string
}

export const PeriodSelector = memo(({ 
  selectedPeriod, 
  onPeriodChange, 
  loading = false,
  className = ''
}: PeriodSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const currentOption = PERIOD_OPTIONS.find(option => option.value === selectedPeriod) || PERIOD_OPTIONS[0]

  const getBadgeVariant = (color: string) => {
    switch (color) {
      case 'blue': return 'default'
      case 'green': return 'success' 
      case 'purple': return 'secondary'
      case 'orange': return 'warning'
      case 'gray': return 'outline'
      default: return 'default'
    }
  }

  const formatDateRange = (period: PeriodType): string => {
    const now = new Date()
    
    switch (period) {
      case 'current_month':
        return `${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
      case 'current_year':
        return `Año ${now.getFullYear()}`
      case 'last_12_months':
        const year_ago = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        return `${year_ago.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} - ${now.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
      case 'last_30_days':
        const month_ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return `${month_ago.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
      case 'all_time':
        return 'Desde el inicio'
      default:
        return ''
    }
  }

  const handleOptionClick = (period: PeriodType) => {
    onPeriodChange(period)
    setIsOpen(false)
  }

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Período:</span>
      </div>
      
      <div className="relative">
        <Button 
          variant="outline" 
          disabled={loading}
          className="justify-between min-w-[200px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Badge variant={getBadgeVariant(currentOption.color)}>
              {currentOption.label}
            </Badge>
          </div>
          <ChevronDownIcon className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-[280px] bg-white rounded-md border border-gray-200 shadow-lg z-50">
            <div className="py-1">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedPeriod === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getBadgeVariant(option.color)}
                          className="text-xs"
                        >
                          {option.label}
                        </Badge>
                        {selectedPeriod === option.value && (
                          <span className="text-xs text-blue-600 font-medium">✓ Seleccionado</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {option.description}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Overlay para cerrar el dropdown */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        {formatDateRange(selectedPeriod)}
      </div>
    </div>
  )
})

PeriodSelector.displayName = 'PeriodSelector'

export default PeriodSelector