# 🎨 FRONTEND DE COTIZACIONES - ARCHIVOS RESTANTES

## ✅ YA CREADOS:
1. ✅ `src/hooks/useQuotations.ts` - Hook personalizado
2. ✅ `src/app/cotizaciones/page.tsx` - Página principal (lista)

---

## 📋 ARCHIVOS QUE FALTAN POR CREAR

### **1. Formulario de Nueva Cotización**
**Archivo:** `src/app/cotizaciones/nueva/page.tsx`

**Funcionalidades:**
- Selector de cliente (autocompletado)
- Tabla para agregar productos
- Cálculo automático de subtotal, descuento, IVA, total
- Notas y términos
- Botón de guardar como borrador
- Botón de guardar y enviar

**Nota:** Este archivo es muy grande (~500 líneas). ¿Quieres que lo cree ahora o primero probamos la lista?

---

### **2. Vista de Detalles**
**Archivo:** `src/app/cotizaciones/[id]/page.tsx`

**Funcionalidades:**
- Ver todos los detalles de la cotización
- Historial de envíos (email, WhatsApp)
- Botones de acción: Enviar, Descargar PDF, Convertir a venta
- Vista previa del PDF

---

### **3. Componentes Auxiliares (Opcional)**

#### **Modal de Envío por Email**
**Archivo:** `src/components/quotations/SendEmailModal.tsx`
- Input para email personalizado
- Preview del mensaje
- Botón de enviar

#### **Modal de Envío por WhatsApp**
**Archivo:** `src/components/quotations/SendWhatsAppModal.tsx`
- Input para teléfono personalizado
- Preview del mensaje
- Botón de enviar

#### **Modal de Conversión a Venta**
**Archivo:** `src/components/quotations/ConvertToSaleModal.tsx`
- Confirmación
- Selector de método de pago
- Validación de inventario

---

## 🚀 RECOMENDACIÓN

**OPCIÓN 1: Probar primero** (Recomendado)
1. Probar la página de listado que ya creamos
2. Ver que funcione la API
3. Luego crear el formulario de nueva cotización

**OPCIÓN 2: Crear todo ahora**
- Creo todos los archivos restantes
- Puede tomar varios mensajes por el tamaño

---

## 🎯 PARA PROBAR LO QUE YA TENEMOS:

1. **Iniciar el servidor:**
```bash
npm run dev
```

2. **Ir a:** `http://localhost:3000/cotizaciones`

3. **Crear una cotización de prueba con Postman:**
```json
POST http://localhost:3000/api/quotations
{
  "customerId": "tu_customer_id",
  "companyId": "tu_company_id",
  "branchId": "tu_branch_id",
  "items": [
    {
      "productId": "tu_product_id",
      "description": "Martillo",
      "quantity": 2,
      "price": 150.00
    }
  ],
  "notes": "Cliente preferencial",
  "paymentTerms": "Contado",
  "deliveryTime": "Inmediato"
}
```

4. **Refrescar la página** y deberías ver la cotización

---

## ❓ ¿QUÉ PREFIERES?

**A)** Probamos primero lo que ya tenemos y luego continuamos
**B)** Continúo creando todos los archivos restantes ahora
**C)** Solo creas el formulario de nueva cotización
**D)** Agregas cotizaciones al menú de navegación primero

Dime qué opción prefieres y continúo. 🚀
