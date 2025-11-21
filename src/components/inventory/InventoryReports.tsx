'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

interface InventoryReportsProps {
  isOpen: boolean
  onClose: () => void
}

export function InventoryReports({ isOpen, onClose }: InventoryReportsProps) {
  const [activeReport, setActiveReport] = useState<string>('overview')

  if (!isOpen) return null

  // Mock data for charts
  const stockByCategory = [
    { name: 'Herramientas', value: 45, products: 12 },
    { name: 'Eléctrico', value: 32, products: 8 },
    { name: 'Fijaciones', value: 28, products: 15 },
    { name: 'Plomería', value: 38, products: 10 },
    { name: 'Pinturas', value: 22, products: 6 }
  ]

  const lowStockProducts = [
    { name: 'Destornillador Phillips #2', current: 8, min: 15, category: 'Herramientas' },
    { name: 'Cable Eléctrico 12 AWG', current: 5, min: 20, category: 'Eléctrico' },
    { name: 'Tornillos Autorroscantes 3/4"', current: 0, min: 100, category: 'Fijaciones' },
    { name: 'Cinta Aislante Negra', current: 3, min: 25, category: 'Eléctrico' },
    { name: 'Llave Francesa 10"', current: 2, min: 8, category: 'Herramientas' }
  ]

  const movementHistory = [
    { date: '2024-01-16', entradas: 45, salidas: 32, balance: 13 },
    { date: '2024-01-15', entradas: 38, salidas: 41, balance: -3 },
    { date: '2024-01-14', entradas: 52, salidas: 35, balance: 17 },
    { date: '2024-01-13', entradas: 29, salidas: 48, balance: -19 },
    { date: '2024-01-12', entradas: 41, salidas: 33, balance: 8 },
    { date: '2024-01-11', entradas: 35, salidas: 39, balance: -4 },
    { date: '2024-01-10', entradas: 47, salidas: 42, balance: 5 }
  ]

  const topSuppliers = [
    { name: 'Ferretería Central', products: 125, value: 850000, lastOrder: '2024-01-15' },
    { name: 'ToolMax', products: 89, value: 620000, lastOrder: '2024-01-14' },
    { name: 'ElectroSuministros', products: 67, value: 480000, lastOrder: '2024-01-16' },
    { name: 'Fijaciones Pro', products: 156, value: 340000, lastOrder: '2024-01-13' },
    { name: 'Herramientas Industriales', products: 43, value: 720000, lastOrder: '2024-01-12' }
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const reports = [
    {
      id: 'overview',
      name: 'Resumen General',
      icon: ChartBarIcon,
      description: 'Vista general del inventario'
    },
    {
      id: 'low-stock',
      name: 'Stock Bajo',
      icon: ExclamationTriangleIcon,
      description: 'Productos que requieren reabastecimiento'
    },
    {
      id: 'movements',
      name: 'Movimientos',
      icon: TruckIcon,
      description: 'Historial de entradas y salidas'
    },
    {
      id: 'suppliers',
      name: 'Proveedores',
      icon: CurrencyDollarIcon,
      description: 'Análisis de proveedores'
    }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CubeIcon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Total Productos</p>
                <p className="text-lg font-semibold">2,847</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Stock Bajo</p>
                <p className="text-lg font-semibold">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="text-lg font-semibold">$1.2M</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Mov. Hoy</p>
                <p className="text-lg font-semibold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stockByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stockByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos Últimos 7 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={movementHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).getDate().toString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                <Bar dataKey="salidas" fill="#ef4444" name="Salidas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderLowStock = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Productos con Stock Bajo</h3>
        <Badge variant="secondary">{lowStockProducts.length} productos</Badge>
      </div>
      <div className="space-y-3">
        {lowStockProducts.map((product, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={product.current === 0 ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {product.current === 0 ? 'Sin Stock' : 'Stock Bajo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Actual: <span className="font-medium">{product.current}</span> / 
                    Mín: <span className="font-medium">{product.min}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderMovements = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="entradas" stroke="#10b981" name="Entradas" />
              <Line type="monotone" dataKey="salidas" stroke="#ef4444" name="Salidas" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Balance" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )

  const renderSuppliers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Proveedores Principales</h3>
        <Badge variant="secondary">{topSuppliers.length} proveedores</Badge>
      </div>
      <div className="space-y-3">
        {topSuppliers.map((supplier, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{supplier.name}</p>
                  <p className="text-sm text-gray-500">
                    {supplier.products} productos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ${supplier.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Último pedido: {supplier.lastOrder}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'overview':
        return renderOverview()
      case 'low-stock':
        return renderLowStock()
      case 'movements':
        return renderMovements()
      case 'suppliers':
        return renderSuppliers()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Reportes de Inventario
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                // Export functionality would go here
                console.log('Exporting report...')
              }}
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-2">
              {reports.map((report) => {
                const IconComponent = report.icon
                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeReport === report.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-sm">{report.name}</p>
                        <p className="text-xs text-gray-500">{report.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderActiveReport()}
          </div>
        </div>
      </div>
    </div>
  )
}
