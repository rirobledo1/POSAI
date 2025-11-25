# 📊 ANÁLISIS: Cotizaciones Online y WhatsApp - Restricciones por Plan

**Fecha:** 22 de Noviembre de 2025
**Analista:** Claude
**Solicitud:** Verificar que cotizaciones Online y WhatsApp estén solo en PRO_PLUS y ENTERPRISE

---

## 🎯 CONFIGURACIÓN CORRECTA (plan-features.ts)

```typescript
PLAN_FEATURES = {
  FREE: {
    quotationOnline: false,    ❌
    quotationWhatsApp: false,  ❌
  },
  PRO: {
    quotationOnline: false,    ❌  
    quotationWhatsApp: false,  ❌
  },
  PRO_PLUS: {
    quotationOnline: true,     ✅
    quotationWhatsApp: true,   ✅
  },
  ENTERPRISE: {
    quotationOnline: true,     ✅
    quotationWhatsApp: true,   ✅
  }
}
```

**Conclusión:** La configuración de features está CORRECTA ✅

---

## ❌ PROBLEMAS ENCONTRADOS

### 🔴 PROBLEMA 1: Ruta WhatsApp - Plan Incorrecto

**Archivo:** `/src/app/api/quotations/[id]/send-whatsapp/route.ts`

**Código Actual (INCORRECTO):**
```typescript
const allowedPlans = ['PRO', 'ENTERPRISE']  // ❌ MALO
if (!allowedPlans.includes(companyPlan)) {
  return error
}
```

**Problema:**
- Permite al plan **PRO** enviar WhatsApp
- Según `plan-features.ts`, PRO tiene `quotationWhatsApp: false`

**Código Correcto:**
```typescript
const allowedPlans = ['PRO_PLUS', 'ENTERPRISE']  // ✅ CORRECTO
```

**Impacto:**
- 🔴 ALTA - Usuarios de plan PRO pueden usar WhatsApp GRATIS
- 🔴 Pérdida de ingresos potenciales
- 🔴 No respeta el modelo de negocio

---

### 🔴 PROBLEMA 2: Ruta Email - Validación Insuficiente

**Archivo:** `/src/app/api/quotations/[id]/send-email/route.ts`

**Código Actual (INCORRECTO):**
```typescript
if (companyPlan === 'FREE') {  // ❌ Solo valida FREE
  return error
}
// Cualquier plan que NO sea FREE puede enviar
```

**Problema:**
- Solo bloquea el plan FREE
- Permite a **PRO** enviar cotizaciones online
- Según `plan-features.ts`, PRO tiene `quotationOnline: false`

**Código Correcto:**
```typescript
const allowedPlans = ['PRO_PLUS', 'ENTERPRISE']
if (!allowedPlans.includes(companyPlan)) {
  return NextResponse.json({
    error: 'Tu plan no incluye envío de cotizaciones por email',
    upgrade: true,
    requiredPlan: 'PRO_PLUS',
    currentPlan: companyPlan
  }, { status: 403 })
}
```

**Impacto:**
- 🔴 ALTA - Usuarios de plan PRO pueden usar cotizaciones online GRATIS
- 🔴 Pérdida de ingresos potenciales
- 🔴 No respeta el modelo de negocio

---

### 🟡 PROBLEMA 3: Frontend Sin Validación

**Archivos:**
- `/src/app/cotizaciones/[id]/page.tsx`
- `/src/app/cotizaciones/page.tsx`

**Problema:**
- No se usa el hook `usePlanFeatures()`
- No se validan permisos antes de mostrar botones
- Usuarios ven botones que no pueden usar

**Impacto:**
- 🟡 MEDIA - Mala experiencia de usuario
- 🟡 Usuarios intentan acciones y reciben error 403
- 🟡 Confusión sobre qué incluye su plan

**Solución:**
```typescript
import { usePlanFeatures } from '@/hooks/usePlanFeatures'

export default function QuotationDetailPage() {
  const { canQuoteOnline, canQuoteWhatsApp, plan } = usePlanFeatures()
  
  return (
    <>
      {/* Solo mostrar si el plan lo permite */}
      {canQuoteOnline && (
        <Button onClick={handleSendEmail}>
          <Mail /> Enviar por Email
        </Button>
      )}
      
      {canQuoteWhatsApp && (
        <Button onClick={handleSendWhatsApp}>
          <MessageCircle /> Enviar por WhatsApp
        </Button>
      )}
      
      {/* Mostrar upgrade si no tiene el feature */}
      {!canQuoteOnline && (
        <Button variant="outline" onClick={handleUpgrade}>
          <Lock /> Actualizar a PRO_PLUS
        </Button>
      )}
    </>
  )
}
```

---

## 📋 RESUMEN DE HALLAZGOS

| Componente | Estado | Severidad | Permite Plan Incorrecto |
|------------|--------|-----------|-------------------------|
| **Configuración Features** | ✅ CORRECTO | - | N/A |
| **Ruta WhatsApp API** | ❌ INCORRECTO | 🔴 ALTA | PRO (debería ser PRO_PLUS+) |
| **Ruta Email API** | ❌ INCORRECTO | 🔴 ALTA | PRO (debería ser PRO_PLUS+) |
| **Frontend (UI)** | ⚠️ SIN VALIDACIÓN | 🟡 MEDIA | Muestra a todos |

---

## 🎯 ESTADO ACTUAL vs ESPERADO

### Estado ACTUAL (❌ Incorrecto):
```
Plan FREE:       ❌ Online  ❌ WhatsApp  ✅ (correcto)
Plan PRO:        ✅ Online  ✅ WhatsApp  ❌ (INCORRECTO - debería ser todo ❌)
Plan PRO_PLUS:   ✅ Online  ✅ WhatsApp  ✅ (correcto)
Plan ENTERPRISE: ✅ Online  ✅ WhatsApp  ✅ (correcto)
```

### Estado ESPERADO (✅ Correcto):
```
Plan FREE:       ❌ Online  ❌ WhatsApp  
Plan PRO:        ❌ Online  ❌ WhatsApp  
Plan PRO_PLUS:   ✅ Online  ✅ WhatsApp  
Plan ENTERPRISE: ✅ Online  ✅ WhatsApp  
```

---

## 💰 IMPACTO ECONÓMICO

**Problema:**
- Usuarios de plan PRO obtienen features de PRO_PLUS sin pagar

**Estimación de pérdida:**
- Si PRO cuesta $500/mes y PRO_PLUS cuesta $1,000/mes
- Diferencia: $500/mes por cliente
- Si 10 clientes usan PRO con features de PRO_PLUS:
  - **Pérdida mensual: $5,000 MXN**
  - **Pérdida anual: $60,000 MXN**

---

## 🔧 SOLUCIÓN RECOMENDADA

### Prioridad 1 - Backend (URGENTE):
1. Corregir `send-whatsapp/route.ts` → Cambiar a `['PRO_PLUS', 'ENTERPRISE']`
2. Corregir `send-email/route.ts` → Cambiar validación completa

### Prioridad 2 - Frontend (IMPORTANTE):
3. Agregar validación en `/cotizaciones/[id]/page.tsx`
4. Mostrar/ocultar botones según plan
5. Agregar mensajes de upgrade

### Prioridad 3 - Testing (CRÍTICO):
6. Probar con usuario FREE → Debe bloquear
7. Probar con usuario PRO → Debe bloquear
8. Probar con usuario PRO_PLUS → Debe permitir
9. Probar con usuario ENTERPRISE → Debe permitir

---

## 📝 CONCLUSIÓN

**Estado:** ❌ **NO IMPLEMENTADO CORRECTAMENTE**

**Problemas encontrados:**
- ✅ Configuración de features: CORRECTA
- ❌ Validación WhatsApp: INCORRECTA (permite PRO)
- ❌ Validación Email: INCORRECTA (permite PRO)
- ⚠️ Frontend: SIN VALIDACIÓN

**Recomendación:**
🚨 **CORREGIR INMEDIATAMENTE** - Hay pérdida de ingresos activa

**Siguiente paso:**
¿Quieres que implemente las correcciones ahora?
