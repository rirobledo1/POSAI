// 📊 SALES CHART OPTIMIZADO
// src/components/dashboard/charts/SalesChart.tsx

'use client'

import { memo, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SalesChartProps {
  data: any[]
  loading: boolean
}

const SalesChart = memo(({ data, loading }: SalesChartProps) => {
  // 🎯 Memoización de formatters para evitar recreación
  const formatXAxis = useMemo(() => 
    (value: string) => {
      try {
        return format(new Date(value), 'dd/MM')
      } catch {
        return value
      }
    }, []
  )

  const formatTooltipLabel = useMemo(() => 
    (value: string) => {
      try {
        return format(new Date(value), 'dd MMMM yyyy', { locale: es })
      } catch {
        return value
      }
    }, []
  )

  const formatTooltip = useMemo(() => 
    (value: any, name: string) => [
      name === 'ventas' ? `$${value.toLocaleString()}` : value,
      name === 'ventas' ? 'Ventas' : 'Productos Vendidos'
    ], []
  )

  // 🎯 Datos procesados memoizados
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }
    
    return data.map(item => ({
      ...item,
      date: item.date || new Date().toISOString().split('T')[0]
    }))
  }, [data])

  if (loading) {
    return (
      <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando gráfico de ventas...</div>
      </div>
    )
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No hay datos de ventas disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatXAxis}
          stroke="#666"
          fontSize={12}
        />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip 
          labelFormatter={formatTooltipLabel}
          formatter={formatTooltip}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="ventas" 
          stroke="#3B82F6" 
          strokeWidth={3}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
})

SalesChart.displayName = 'SalesChart'

export default SalesChart