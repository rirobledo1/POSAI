// Tipos para el sistema de cotizaciones

export enum QuotationStatus {
  DRAFT = 'DRAFT',           // Borrador - No enviada
  SENT = 'SENT',             // Enviada al cliente
  VIEWED = 'VIEWED',         // Cliente la vio
  ACCEPTED = 'ACCEPTED',     // Cliente aceptó
  REJECTED = 'REJECTED',     // Cliente rechazó
  EXPIRED = 'EXPIRED',       // Venció la vigencia
  CONVERTED = 'CONVERTED',   // Convertida a venta
  CANCELLED = 'CANCELLED'    // Cancelada por el vendedor
}

export interface QuotationItem {
  id?: string
  productId: string
  productName: string
  description?: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  sortOrder?: number
}

export interface Quotation {
  id: string
  quotationNumber: string
  customerId: string
  companyId: string
  branchId?: string
  userId: string
  
  // Items y totales
  items?: QuotationItem[]
  subtotal: number
  discount: number
  discountPercent: number
  tax: number
  total: number
  
  // Validez y estado
  validUntil: Date | string
  status: QuotationStatus
  
  // Notas
  notes?: string
  termsConditions?: string
  
  // Información de envío
  sentVia: string[]
  sentAt?: Date | string
  emailSentAt?: Date | string
  whatsappSentAt?: Date | string
  
  // Seguimiento
  viewedAt?: Date | string
  viewCount: number
  
  // Conversión
  convertedToSaleId?: string
  convertedAt?: Date | string
  
  // Auditoría
  createdAt: Date | string
  updatedAt: Date | string
  
  // Relaciones populadas (opcional)
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
    rfc?: string
  }
  createdBy?: {
    id: string
    name: string
    email: string
  }
  company?: {
    id: string
    name: string
    rfc?: string
  }
}

export interface CreateQuotationInput {
  customerId: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
    discount?: number
  }[]
  discountPercent?: number
  notes?: string
  termsConditions?: string
  validityDays?: number  // Días de validez (default: 7)
}

export interface UpdateQuotationInput {
  customerId?: string
  items?: {
    productId: string
    quantity: number
    unitPrice: number
    discount?: number
  }[]
  discountPercent?: number
  notes?: string
  termsConditions?: string
  validUntil?: Date | string
  status?: QuotationStatus
}

export interface QuotationFilters {
  status?: QuotationStatus | QuotationStatus[]
  customerId?: string
  branchId?: string
  userId?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  search?: string
}

export interface SendQuotationInput {
  via: 'email' | 'whatsapp' | 'both'
  customMessage?: string
}

export interface QuotationStats {
  total: number
  draft: number
  sent: number
  viewed: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  cancelled: number
  totalValue: number
  averageValue: number
  conversionRate: number
}
