# 🚀 IMPLEMENTACIÓN DE COTIZACIONES - FASE 1

## ✅ **LO QUE YA HICIMOS**

1. ✅ Actualizamos el schema de Prisma con los modelos:
   - `Quotation` - Cotizaciones
   - `QuotationItem` - Productos de la cotización
   - `QuotationStatus` - Estados de la cotización

---

## 📋 **PRÓXIMOS PASOS**

### **PASO 1: Aplicar la migración de base de datos**

```bash
# 1. Generar la migración
npx prisma migrate dev --name add_quotations

# 2. Generar el cliente de Prisma
npx prisma generate
```

**Esto creará las tablas:**
- `quotations`
- `quotation_items`

---

### **PASO 2: Crear las rutas API**

Vamos a crear los siguientes endpoints:

#### **A. API para cotizaciones** (`/api/quotations`)
- `POST /api/quotations` - Crear cotización
- `GET /api/quotations` - Listar cotizaciones
- `GET /api/quotations/[id]` - Ver una cotización
- `PUT /api/quotations/[id]` - Actualizar cotización
- `DELETE /api/quotations/[id]` - Eliminar cotización

#### **B. API para envío** (`/api/quotations/[id]/send`)
- `POST /api/quotations/[id]/send` - Enviar por email/WhatsApp

#### **C. API para convertir a venta** (`/api/quotations/[id]/convert`)
- `POST /api/quotations/[id]/convert` - Convertir a venta

#### **D. API para generar PDF** (`/api/quotations/[id]/pdf`)
- `GET /api/quotations/[id]/pdf` - Generar PDF

---

### **PASO 3: Crear la interfaz de usuario**

#### **A. Pantalla principal** (`/app/cotizaciones/page.tsx`)
- Lista de cotizaciones
- Filtros (todas/enviadas/aceptadas/vencidas)
- Búsqueda
- Botón "Nueva Cotización"

#### **B. Formulario de cotización** (`/app/cotizaciones/nueva/page.tsx`)
- Seleccionar cliente
- Agregar productos
- Calcular totales
- Aplicar descuentos
- Establecer vigencia
- Agregar notas

#### **C. Ver cotización** (`/app/cotizaciones/[id]/page.tsx`)
- Ver detalles completos
- Opciones de envío (Email/WhatsApp)
- Convertir a venta
- Generar PDF
- Historial de envíos

---

### **PASO 4: Generador de PDF**

Crear `/src/lib/pdf/quotation.ts` para generar PDFs profesionales con:
- Logo de la empresa
- Información del cliente
- Lista de productos
- Totales y descuentos
- Vigencia
- Términos y condiciones

---

### **PASO 5: Integración con Email**

**REUTILIZAR tu sistema actual:**
- Usar `/src/lib/email/emailService.ts`
- Ya existe función `sendQuotation()` ✅
- Solo necesita ajustes menores

---

### **PASO 6: Integración con WhatsApp**

**SEGÚN EL PLAN:**

#### **Plan FREE:**
- ❌ No disponible

#### **Plan PRO:**
- ✅ Manual (abrir chat con mensaje pre-llenado)
- Usar método actual: `window.open('https://wa.me/...')`

#### **Plan PRO PLUS:**
- ✅ Automático con palabras clave
- Webhooks básicos para recibir solicitudes
- Respuestas automáticas simples

#### **Plan ENTERPRISE:**
- ✅ IA completa (N8N + OpenAI)
- Conversaciones inteligentes
- Cotizaciones automáticas

---

## 🏗️ **ARQUITECTURA DE ARCHIVOS**

```
ferreai/
├── prisma/
│   └── schema.prisma ✅ (Ya actualizado)
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── quotations/
│   │   │       ├── route.ts (Crear/Listar)
│   │   │       └── [id]/
│   │   │           ├── route.ts (Ver/Actualizar/Eliminar)
│   │   │           ├── send/route.ts (Enviar)
│   │   │           ├── convert/route.ts (Convertir a venta)
│   │   │           └── pdf/route.ts (Generar PDF)
│   │   │
│   │   └── cotizaciones/
│   │       ├── page.tsx (Lista de cotizaciones)
│   │       ├── nueva/page.tsx (Crear cotización)
│   │       └── [id]/page.tsx (Ver cotización)
│   │
│   ├── components/
│   │   └── quotations/
│   │       ├── QuotationList.tsx
│   │       ├── QuotationForm.tsx
│   │       ├── QuotationDetail.tsx
│   │       └── SendQuotationModal.tsx
│   │
│   ├── lib/
│   │   ├── pdf/
│   │   │   └── quotation.ts (Generar PDF)
│   │   │
│   │   ├── email/
│   │   │   └── emailService.ts ✅ (Ya existe)
│   │   │
│   │   └── whatsapp/
│   │       ├── basic.ts (Plan PRO)
│   │       ├── advanced.ts (Plan PRO PLUS)
│   │       └── ai.ts (Plan ENTERPRISE - Futuro)
│   │
│   └── types/
│       └── quotation.ts (Tipos TypeScript)
│
└── IMPLEMENTACION-COTIZACIONES-FASE1.md (Este archivo)
```

---

## 🎯 **ORDEN DE IMPLEMENTACIÓN RECOMENDADO**

### **Semana 1:**
1. ✅ Migración de base de datos
2. ✅ Tipos TypeScript
3. ✅ API de cotizaciones básica (CRUD)
4. ✅ Pantalla de lista de cotizaciones

### **Semana 2:**
5. ✅ Formulario de crear cotización
6. ✅ Generador de PDF
7. ✅ Vista detallada de cotización

### **Semana 3:**
8. ✅ Integración con Email
9. ✅ Integración con WhatsApp (básico)
10. ✅ Convertir a venta
11. ✅ Testing y ajustes

---

## 📊 **FUNCIONALIDADES POR PLAN**

### **PLAN FREE ($0/mes)**
```
✅ Crear cotizaciones en pantalla
✅ Ver lista de cotizaciones
✅ Generar PDF
✅ Imprimir
✅ Descargar PDF
❌ No envío por email
❌ No envío por WhatsApp
```

### **PLAN PRO ($799/mes)**
```
✅ Todo lo de FREE
✅ Enviar por Email (automático)
✅ WhatsApp manual (abrir chat)
✅ Historial de envíos
✅ Plantillas de email
```

### **PLAN PRO PLUS ($1,499/mes)**
```
✅ Todo lo de PRO
✅ WhatsApp automático (palabras clave)
✅ Recibir solicitudes por WhatsApp
✅ Respuestas automáticas básicas
✅ Plantillas de WhatsApp
✅ Webhooks
```

### **PLAN ENTERPRISE ($2,999/mes)**
```
✅ Todo lo de PRO PLUS
✅ WhatsApp + IA (N8N + OpenAI)
✅ Conversaciones inteligentes
✅ Cotizaciones automáticas por IA
✅ Análisis de demanda
✅ Predicciones y sugerencias
```

---

## 🔧 **VALIDACIONES POR PLAN**

### **Middleware de permisos**

```typescript
// src/middleware/quotationPermissions.ts

export function canSendEmailQuotation(plan: Plan): boolean {
  return ['PRO', 'PRO_PLUS', 'ENTERPRISE'].includes(plan)
}

export function canSendWhatsAppManual(plan: Plan): boolean {
  return ['PRO', 'PRO_PLUS', 'ENTERPRISE'].includes(plan)
}

export function canSendWhatsAppAuto(plan: Plan): boolean {
  return ['PRO_PLUS', 'ENTERPRISE'].includes(plan)
}

export function canUseWhatsAppAI(plan: Plan): boolean {
  return plan === 'ENTERPRISE'
}
```

---

## 💾 **MIGRACIÓN ACTUAL**

**Estado:** ✅ Listo para aplicar

**Archivos modificados:**
- `prisma/schema.prisma`

**Modelos agregados:**
- `Quotation` (cotizaciones)
- `QuotationItem` (productos)
- `QuotationStatus` (enum de estados)

**Relaciones agregadas:**
- `Customer.quotations`
- `Company.quotations`
- `Branch.quotations`
- `User.quotationsCreated`
- `Product.quotationItems`

---

## ✅ **CHECKLIST COMPLETO**

### **Base de Datos:**
- [x] Modelo Quotation creado
- [x] Modelo QuotationItem creado
- [x] Enum QuotationStatus creado
- [x] Relaciones agregadas
- [ ] Migración aplicada (`npx prisma migrate dev`)
- [ ] Cliente Prisma generado (`npx prisma generate`)

### **Backend:**
- [ ] API de cotizaciones (CRUD)
- [ ] API de envío (email/WhatsApp)
- [ ] API de conversión a venta
- [ ] API de generación de PDF
- [ ] Validaciones de permisos por plan

### **Frontend:**
- [ ] Página de lista de cotizaciones
- [ ] Formulario de nueva cotización
- [ ] Vista detallada de cotización
- [ ] Modal de envío
- [ ] Integración con navegación

### **Servicios:**
- [ ] Generador de PDF
- [ ] Servicio de email (adaptar existente)
- [ ] Servicio de WhatsApp básico
- [ ] Servicio de WhatsApp avanzado (PRO PLUS)

### **Testing:**
- [ ] Crear cotización
- [ ] Enviar por email
- [ ] Enviar por WhatsApp
- [ ] Convertir a venta
- [ ] Validar permisos por plan

---

## 🚀 **¿LISTO PARA CONTINUAR?**

El siguiente paso es ejecutar la migración de base de datos:

```bash
npx prisma migrate dev --name add_quotations
```

**¿Ejecutamos este comando ahora?**
