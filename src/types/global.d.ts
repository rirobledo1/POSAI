export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'VENDEDOR' | 'ALMACEN' | 'SOLO_LECTURA'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  stock: number
  minStock: number
  categoryId: string
  category?: string
  barcode?: string
  featured?: boolean // Campo para productos destacados
  profitMargin?: number // Porcentaje de ganancia
  useAutomaticPricing?: boolean // Si usa cálculo automático de precio
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  creditLimit: number
  currentDebt: number
  active: boolean
  createdAt?: string
  updatedAt?: string
  lastPurchase?: string
  totalPurchases?: number
}

export interface Sale {
  id: string
  customerId?: string
  userId: string
  total: number
  subtotal: number
  tax: number
  discount: number
  status: 'completed' | 'pending' | 'cancelled'
  paymentMethod: 'cash' | 'card' | 'credit' | 'transfer'
  items: SaleItem[]
  createdAt: string
}

export interface SaleItem {
  id: string
  productId: string
  quantity: number
  price: number
  subtotal: number
}

export interface DashboardMetrics {
  totalSales: number
  totalProducts: number
  totalCustomers: number
  lowStockAlerts: number
  salesGrowth: number
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
}
