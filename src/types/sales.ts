// src/types/sales.ts
export interface Sale {
  id: string; // Cambió de number a string
  folio: string;
  customerId?: string; // Cambió de number a string
  userId: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  paidAt?: Date;
  
  // Relaciones
  customer?: {
    id: string; // Cambió de number a string
    name: string;
    email?: string;
    phone?: string;
    rfc?: string;
  };
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  items: SaleItem[];
}

export interface SaleItem {
  id: string; // Cambió de number a string
  saleId: string; // Cambió de number a string
  productId: string; // Cambió de number a string
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  productName: string;
  productCode?: string;
  
  // Relación
  product: {
    id: string; // Cambió de number a string
    name: string;
    barcode?: string;
  };
}

export interface InventoryMovement {
  id: string; // Cambió de number a string
  productId: string; // Cambió de number a string
  type: MovementType;
  quantity: number;
  reference?: string;
  reason?: string;
  userId: string;
  createdAt: Date;
  
  // Relaciones
  product: {
    id: string; // Cambió de number a string
    name: string;
  };
  user: {
    id: string;
    name?: string;
  };
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO' | 'MIXTO';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type MovementType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

export interface SalesStats {
  totalSales: number;
  totalAmount: number;
  totalSubtotal: number;
  totalTax: number;
}

export interface SalesResponse {
  success: boolean;
  data: {
    sales: Sale[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: SalesStats;
  };
}

export interface SaleRequest {
  customerId?: string; // Cambió de number a string
  items: {
    productId: string; // Cambió de number a string
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  notes?: string;
}

export interface SaleProcessResponse {
  success: boolean;
  message: string;
  data: {
    sale: Sale;
    folio: string;
  };
}