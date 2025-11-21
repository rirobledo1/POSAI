// 📦 INVENTORY CHART OPTIMIZADO
// src/components/dashboard/charts/InventoryChart.tsx

'use client'

import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface InventoryChartProps {
  data: any[]
  loading: boolean
}

const InventoryChart = memo(({ data, loading }: InventoryChartProps) => {
  // 🎯 Formatter de tooltip memoizado
  const formatTooltip = useMemo(() => 
    (value: any, name: string) => {
      const labels = {
        'total': 'Total',
        'bajo_stock': 'Stock Bajo'
      }
      return [value, labels[name as keyof typeof labels] || name]
    }, []
  )

  // 🎯 Datos procesados y validados
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }
    
    return data.map(item => ({
      categoria: item.categoria || 'Sin categoría',
      total: Math.max(0, item.total || 0),
      bajo_stock: Math.max(0, item.bajo_stock || 0)
    }))
  }, [data])

  if (loading) {
    return (
      <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando gráfico de inventario...</div>
      </div>
    )
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📦</div>
          <p>No hay datos de inventario disponibles</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="categoria" 
          stroke="#666"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip 
          formatter={formatTooltip}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Bar 
          dataKey="total" 
          fill="#3B82F6" 
          name="Total"
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="bajo_stock" 
          fill="#EF4444" 
          name="Stock Bajo"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
})

InventoryChart.displayName = 'InventoryChart'

export default InventoryChart