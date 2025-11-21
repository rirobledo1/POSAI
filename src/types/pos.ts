// Interfaces para el sistema POS - Alineadas con el schema de Prisma

export enum UnitOfMeasure {
  PIECE = 'PIECE',     // Pieza/Unidad
  KG = 'KG',           // Kilogramo
  GRAM = 'GRAM',       // Gramo
  LITER = 'LITER',     // Litro
  ML = 'ML',           // Mililitro
  METER = 'METER',     // Metro
  CM = 'CM',           // Centímetro
  M2 = 'M2',           // Metro cuadrado
  M3 = 'M3',           // Metro cúbico
  PACK = 'PACK',       // Paquete
  BOX = 'BOX',         // Caja
  DOZEN = 'DOZEN',     // Docena
  PAIR = 'PAIR',       // Par
  SET = 'SET',         // Conjunto
  BOTTLE = 'BOTTLE',   // Botella
  CAN = 'CAN',         // Lata
  BAG = 'BAG',         // Bolsa
  ROLL = 'ROLL',       // Rollo
  SHEET = 'SHEET',     // Hoja
  GALLON = 'GALLON',   // Galón
  POUND = 'POUND',     // Libra
  OUNCE = 'OUNCE',     // Onza
  FOOT = 'FOOT',       // Pie
  INCH = 'INCH',       // Pulgada
  YARD = 'YARD',       // Yarda
  TON = 'TON',         // Tonelada
  OTHER = 'OTHER'      // Otra unidad personalizada
}

export enum DeliveryType {
  PICKUP = 'PICKUP',   // Recoger en tienda
  LOCAL = 'LOCAL',     // Entrega local (mismo municipio)
  FORANEO = 'FORANEO'  // Entrega foránea (otros municipios)
}

export enum DeliveryStatus {
  PENDING = 'PENDING',     // Pendiente
  PREPARING = 'PREPARING', // Preparando pedido
  IN_TRANSIT = 'IN_TRANSIT', // En camino
  DELIVERED = 'DELIVERED',   // Entregado
  FAILED = 'FAILED',         // Falló la entrega
  RETURNED = 'RETURNED'      // Devuelto
}

export interface Customer {
  id: string; // String ID como en Prisma
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rfc?: string;
  creditLimit: number; // Ahora en camelCase como Prisma
  currentDebt: number; // Ahora en camelCase como Prisma
  active: boolean;
  createdAt: Date; // Ahora en camelCase como Prisma
  updatedAt: Date; // Ahora en camelCase como Prisma
}

export interface Product {
  id: string; // String ID como en Prisma
  name: string;
  description?: string;
  barcode?: string;
  cost: number; // Requerido en Prisma
  price: number;
  stock: number;
  minStock: number; // Ahora en camelCase como Prisma
  categoryId: string; // Ahora en camelCase como Prisma
  featured?: boolean; // Campo para productos destacados
  profitMargin?: number; // Porcentaje de ganancia
  useAutomaticPricing?: boolean; // Si usa cálculo automático de precio
  active: boolean;
  unitOfMeasure: UnitOfMeasure; // Nueva: Unidad de medida
  unitQuantity: number; // Nueva: Cantidad por unidad (ej: 500ml, 2kg)
  isBulkSale: boolean; // Nueva: Si se vende a granel
  
  // 🆕 CAMPOS PARA IMÁGENES
  imageUrl?: string;
  thumbnailUrl?: string;
  hasImage?: boolean;
  imageFileName?: string;
  imageSize?: number;
  imageMimeType?: string;
  imageUploadedAt?: Date;
  images?: ProductImage[]; // Para múltiples imágenes
  
  createdAt: Date; // Ahora en camelCase como Prisma
  updatedAt: Date; // Ahora en camelCase como Prisma
}

export interface Category {
  id: string; // String ID como en Prisma
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date; // Ahora en camelCase como Prisma
  updatedAt: Date; // Ahora en camelCase como Prisma
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number; // Ahora en camelCase como Prisma
  subtotal: number;
}

export interface Sale {
  id: string; // String ID como en Prisma
  customerId?: string; // Ahora en camelCase como Prisma
  total: number;
  items: CartItem[];
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO'; // Valores del schema
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED'; // Valores del schema
  deliveryType: DeliveryType; // Nueva: Tipo de entrega
  createdAt: Date; // Ahora en camelCase como Prisma
  updatedAt: Date; // Ahora en camelCase como Prisma
}

export interface DeliveryAddress {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  deliveryNotes?: string;
  isVerified: boolean;
  deliveryZone?: DeliveryType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Delivery {
  id: string;
  saleId: string;
  deliveryAddressId: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryStatus: DeliveryStatus;
  driverId?: string;
  driverNotes?: string;
  customerNotes?: string;
  proofOfDelivery?: string;
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  trackingNumber?: string;
  distance?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO' | 'MIXTO';

// 🆕 INTERFACES PARA MANEJO DE IMÁGENES
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageUploadResponse {
  success: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  error?: string;
}

export interface BulkImageUploadRequest {
  images: File[];
  matchBy: 'name' | 'barcode';
  createThumbnails: boolean;
}

export interface ProductImageStats {
  totalProducts: number;
  productsWithImages: number;
  productsWithoutImages: number;
  percentageWithImages: number;
  storageUsed: number;
}