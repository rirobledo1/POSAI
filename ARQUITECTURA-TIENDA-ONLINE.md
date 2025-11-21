# 🛒 ARQUITECTURA: TIENDA EN LÍNEA + COTIZACIÓN PÚBLICA - FerreAI

## 📋 Resumen Ejecutivo

Crear una plataforma pública donde los clientes pueden:
1. **Ver catálogo de productos** de cualquier empresa
2. **Solicitar cotización** (sin pago)
3. **Comprar en línea** (con pago con tarjeta)
4. **Reutilizar el sistema de pago** existente (actualmente mock, preparado para Stripe real)

---

## 🏗️ Arquitectura Propuesta

### 1. URL Pública de la Tienda

**Opción A - Subdominio por empresa:**
```
https://ferreteria-demo.ferreai.com/tienda
```

**Opción B - Path por empresa (MÁS FÁCIL):**
```
https://ferreai.com/tienda/ferreteria-demo
https://ferreai.com/tienda/{company-slug}
```

**✅ Recomendado: Opción B** (más fácil de implementar sin configuración de DNS)

### 2. Estructura de Rutas

```
src/app/
  └── tienda/
      └── [slug]/
          ├── page.tsx              # Catálogo de productos
          ├── producto/
          │   └── [id]/
          │       └── page.tsx      # Detalle de producto
          ├── carrito/
          │   └── page.tsx          # Carrito de compras
          ├── checkout/
          │   └── page.tsx          # Proceso de compra/cotización
          └── confirmacion/
              └── [id]/
                  └── page.tsx      # Confirmación de pedido/cotización
```

### 3. Flujo de Usuario

#### FLUJO 1: SOLICITAR COTIZACIÓN
```
1. Cliente visita: /tienda/ferreteria-demo
2. Ve catálogo de productos
3. Agrega productos al carrito
4. Va a /tienda/ferreteria-demo/checkout
5. Selecciona "Solicitar Cotización"
6. Llena sus datos (nombre, email, teléfono)
7. Envía solicitud
8. Sistema crea Quotation con status DRAFT
9. Empresa recibe notificación
10. Empresa responde con cotización formal
```

#### FLUJO 2: COMPRAR EN LÍNEA
```
1. Cliente visita: /tienda/ferreteria-demo
2. Ve catálogo de productos
3. Agrega productos al carrito
4. Va a /tienda/ferreteria-demo/checkout
5. Selecciona "Comprar ahora"
6. Llena sus datos (nombre, email, teléfono, dirección)
7. Ingresa datos de tarjeta (usando PaymentForm.tsx)
8. Sistema procesa pago (mock o Stripe real)
9. Si pago exitoso: crea Sale automáticamente
10. Cliente recibe confirmación por email
11. Empresa ve la venta en su panel
```

---

## 🗄️ Modelo de Datos

### Nuevos Campos en Company
```prisma
model Company {
  // ... campos existentes
  
  // Configuración de tienda en línea
  onlineStoreEnabled    Boolean  @default(false) @map("online_store_enabled")
  onlineStoreUrl        String?  @map("online_store_url")  // URL personalizada opcional
  allowOnlineQuotes     Boolean  @default(true) @map("allow_online_quotes")
  allowOnlineSales      Boolean  @default(false) @map("allow_online_sales")
  onlinePaymentEnabled  Boolean  @default(false) @map("online_payment_enabled")
  
  // Stripe/Payment config
  stripePublishableKey  String?  @map("stripe_publishable_key")
  stripeSecretKey       String?  @map("stripe_secret_key")
  paymentMode           String   @default("mock") @map("payment_mode") // "mock" | "stripe_test" | "stripe_live"
}
```

### Nuevo Modelo: OnlineOrder
```prisma
model OnlineOrder {
  id                String      @id @default(cuid())
  orderNumber       String      @unique @map("order_number")
  companyId         String      @map("company_id")
  
  // Tipo de orden
  type              OrderType   // QUOTE | SALE
  status            OrderStatus @default(PENDING)
  
  // Información del cliente
  customerName      String      @map("customer_name")
  customerEmail     String      @map("customer_email")
  customerPhone     String      @map("customer_phone")
  customerAddress   String?     @map("customer_address")
  
  // Items y totales
  items             Json        // Array de productos
  subtotal          Decimal     @db.Decimal(10, 2)
  tax               Decimal     @db.Decimal(10, 2)
  total             Decimal     @db.Decimal(10, 2)
  
  // Información de pago (si es venta)
  paymentMethod     String?     @map("payment_method")
  paymentStatus     String?     @default("pending") @map("payment_status")
  transactionId     String?     @map("transaction_id")
  cardLast4         String?     @map("card_last4")
  cardBrand         String?     @map("card_brand")
  
  // Referencias
  quotationId       String?     @unique @map("quotation_id")
  saleId            String?     @unique @map("sale_id")
  
  // Auditoría
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")
  
  // Relaciones
  company           Company     @relation(fields: [companyId], references: [id])
  quotation         Quotation?  @relation(fields: [quotationId], references: [id])
  sale              Sale?       @relation(fields: [saleId], references: [id])
  
  @@index([companyId])
  @@index([type])
  @@index([status])
  @@map("online_orders")
}

enum OrderType {
  QUOTE
  SALE
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

---

## 🧩 Componentes Principales

### 1. Carrito de Compras (Cliente)
```typescript
// src/components/tienda/ShoppingCart.tsx

interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  imageUrl?: string
}

interface ShoppingCartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCheckout: () => void
}
```

### 2. Proceso de Checkout
```typescript
// src/components/tienda/CheckoutFlow.tsx

interface CheckoutFlowProps {
  companySlug: string
  cartItems: CartItem[]
  allowQuotes: boolean
  allowSales: boolean
  paymentEnabled: boolean
}

// Dos modos:
// - QUOTE: Solo captura datos del cliente
// - SALE: Captura datos + procesa pago
```

### 3. Integración de Pago (Reutilizable)
```typescript
// src/components/payments/PaymentProcessor.tsx

interface PaymentProcessorProps {
  amount: number
  companyId: string
  mode: 'mock' | 'stripe_test' | 'stripe_live'
  onSuccess: (transaction: PaymentResult) => void
  onError: (error: Error) => void
}

// Usa PaymentForm.tsx existente
// Cambia entre mock y Stripe según configuración
```

---

## 🔐 Sistema de Permisos por Plan

### Características por Plan

| Característica | FREE | BASIC | PRO | ENTERPRISE |
|----------------|------|-------|-----|------------|
| Tienda online (solo cotizar) | ✅ | ✅ | ✅ | ✅ |
| Venta en línea con pago | ❌ | ❌ | ✅ | ✅ |
| Integración Stripe | ❌ | ❌ | ✅ | ✅ |
| URL personalizada | ❌ | ❌ | ❌ | ✅ |
| Comisión por venta | - | - | 3% | 2% |

---

## 📡 API Endpoints Necesarios

### 1. Catálogo Público
```typescript
GET /api/tienda/[slug]/productos
- Lista productos activos de la empresa
- Sin autenticación
- Filtra por featured, categoría, etc.
```

### 2. Configuración de Tienda
```typescript
GET /api/tienda/[slug]/config
- Información pública de la empresa
- Logo, nombre, colores
- Configuración: allowQuotes, allowSales, paymentEnabled
```

### 3. Crear Orden (Cotización o Venta)
```typescript
POST /api/tienda/[slug]/orders
Body: {
  type: "QUOTE" | "SALE",
  customer: { name, email, phone, address },
  items: [...],
  payment?: { cardData, ... }
}
```

### 4. Procesar Pago
```typescript
POST /api/payments/process
Body: {
  companyId: string,
  amount: number,
  orderId: string,
  paymentData: {...}
}
- Usa mock o Stripe según configuración
- Retorna transactionId
```

---

## 🎨 Diseño de UI

### Paleta de Colores (Personalizable por Empresa)
- Cada empresa puede configurar sus colores primarios
- Fallback a colores de FerreAI

### Layout de Tienda
```
┌────────────────────────────────────┐
│  Logo Empresa  │  🛒 Carrito (3)   │
├────────────────────────────────────┤
│                                    │
│  [Buscar productos...]             │
│                                    │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐         │
│  │ P │ │ P │ │ P │ │ P │         │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │         │
│  └───┘ └───┘ └───┘ └───┘         │
│                                    │
│  [Ver más productos]               │
│                                    │
└────────────────────────────────────┘
```

---

## 🚀 Plan de Implementación

### FASE 1: Fundamentos (1-2 días)
- [x] ~~Crear estructura de carpetas~~ (tienda/[slug])
- [ ] Crear modelo OnlineOrder
- [ ] Migración de base de datos
- [ ] API: GET /api/tienda/[slug]/productos
- [ ] API: GET /api/tienda/[slug]/config

### FASE 2: Catálogo Público (1 día)
- [ ] Página de catálogo (tienda/[slug]/page.tsx)
- [ ] Grid de productos
- [ ] Búsqueda/filtros básicos
- [ ] Componente de producto individual

### FASE 3: Carrito de Compras (1 día)
- [ ] Estado global de carrito (Zustand)
- [ ] Componente ShoppingCart
- [ ] Agregar/quitar productos
- [ ] Persistencia en localStorage
- [ ] Página de carrito (/carrito)

### FASE 4: Checkout - Solo Cotización (1 día)
- [ ] Página de checkout
- [ ] Formulario de datos del cliente
- [ ] Modo QUOTE (sin pago)
- [ ] API: POST /api/tienda/[slug]/orders (tipo QUOTE)
- [ ] Crear Quotation automáticamente
- [ ] Enviar email de confirmación

### FASE 5: Checkout - Venta en Línea (1-2 días)
- [ ] Integrar PaymentForm.tsx en checkout
- [ ] Modo SALE (con pago)
- [ ] API: POST /api/payments/process (mock)
- [ ] Crear Sale automáticamente si pago exitoso
- [ ] Página de confirmación
- [ ] Enviar email de confirmación con recibo

### FASE 6: Panel de Admin (1 día)
- [ ] Configuración de tienda en Settings
- [ ] Habilitar/deshabilitar tienda
- [ ] Configurar allowQuotes / allowSales
- [ ] Ver órdenes online
- [ ] Convertir cotización online a venta

### FASE 7: Integración Stripe Real (1 día)
- [ ] Configuración de Stripe keys
- [ ] Cambiar de mock a Stripe test
- [ ] Webhook de Stripe para confirmar pagos
- [ ] Manejo de errores de pago
- [ ] Testing con tarjetas de prueba

### FASE 8: Pulido y Optimización (1 día)
- [ ] SEO básico
- [ ] Open Graph tags
- [ ] Performance optimization
- [ ] Responsive design
- [ ] Testing completo

---

## 💡 Ventajas del Diseño

✅ **Reutilización de código:** Usa PaymentForm existente
✅ **Escalable:** Fácil agregar más métodos de pago
✅ **Flexible:** Mock → Stripe test → Stripe live sin cambios en UI
✅ **Multi-tenant:** Cada empresa tiene su tienda independiente
✅ **Doble propósito:** Cotizar O vender en la misma plataforma
✅ **Sin autenticación:** Los clientes no necesitan cuenta

---

## 🔒 Consideraciones de Seguridad

1. **Rate limiting** en APIs públicas
2. **Validación de stock** antes de procesar
3. **Webhook signatures** de Stripe
4. **HTTPS obligatorio** para pagos
5. **PCI compliance** (Stripe lo maneja)
6. **Sanitización de inputs** del cliente

---

## 📊 Métricas y Analytics

Trackear:
- Visitas al catálogo
- Productos más vistos
- Tasa de conversión (visita → cotización)
- Tasa de conversión (visita → venta)
- Carrito abandonado
- Ticket promedio

---

## 🎯 Próximos Pasos

**¿Quieres que empiece con FASE 1?**

Puedo crear:
1. La migración de base de datos (modelo OnlineOrder)
2. Los primeros endpoints de API
3. La estructura básica de carpetas

**O prefieres que primero creemos un prototipo visual** del catálogo para que veas cómo se vería?

¿Con cuál empezamos RIGO?
