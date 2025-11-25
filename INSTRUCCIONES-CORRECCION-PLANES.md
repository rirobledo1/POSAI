# 🔧 CORRECCIÓN: Planes de Suscripción - Cotizaciones Online y WhatsApp

**Fecha:** 22 de Noviembre de 2025
**Problema:** El Plan PRO muestra características de cotizaciones online y WhatsApp que solo deberían estar en PRO_PLUS y ENTERPRISE

---

## 📋 ARCHIVOS CREADOS/ACTUALIZADOS

1. ✅ `/prisma/seed-plans-UPDATED.sql` - Script SQL actualizado con características correctas
2. 📝 Este documento de instrucciones

---

## 🎯 SOLUCIÓN

El problema está en la base de datos. Los planes necesitan tener las características correctamente configuradas en el campo JSON `features`.

### **Estado ACTUAL (Incorrecto):**
```json
Plan PRO features: {
  // ... otras características ...
  // ❌ NO TIENE quotations_online
  // ❌ NO TIENE quotations_whatsapp  
}
```

### **Estado CORRECTO (Después de aplicar fix):**
```json
Plan FREE features: {
  "quotations_inperson": true,
  "quotations_online": false,    // ❌ No disponible
  "quotations_whatsapp": false   // ❌ No disponible
}

Plan PRO features: {
  "quotations_inperson": true,
  "quotations_online": false,    // ❌ No disponible  
  "quotations_whatsapp": false   // ❌ No disponible
}

Plan PRO_PLUS features: {
  "quotations_inperson": true,
  "quotations_online": true,     // ✅ Disponible
  "quotations_whatsapp": true    // ✅ Disponible
}

Plan ENTERPRISE features: {
  "quotations_inperson": true,
  "quotations_online": true,     // ✅ Disponible
  "quotations_whatsapp": true    // ✅ Disponible
}
```

---

## 🚀 PASOS PARA APLICAR LA CORRECCIÓN

### **OPCIÓN 1: Usando psql (Recomendado)**

```bash
# 1. Conectar a tu base de datos PostgreSQL
psql -U tu_usuario -d ferreai

# 2. Ejecutar el script actualizado
\i C:/Users/HTIJ/Desktop/ferreai/prisma/seed-plans-UPDATED.sql

# 3. Verificar los resultados
# El script mostrará una tabla con las características
```

### **OPCIÓN 2: Desde la aplicación (Si prefieres)**

```bash
# 1. Crear un endpoint temporal para ejecutar el seed
# (Necesitarías crear una ruta API que ejecute el SQL)

# O ejecutar el SQL manualmente en tu herramienta de base de datos favorita
# (DBeaver, pgAdmin, etc.)
```

### **OPCIÓN 3: Usando un cliente de PostgreSQL**

```bash
# En terminal/cmd
cd C:\Users\HTIJ\Desktop\ferreai\prisma

# Ejecutar con psql
psql postgresql://usuario:password@localhost:5432/ferreai -f seed-plans-UPDATED.sql
```

---

## 🔍 VERIFICACIÓN

Después de ejecutar el script, el mismo muestra una tabla de verificación:

```
 Plan    | Nombre            | Cotiz. Online | Cotiz. WhatsApp
---------+-------------------+---------------+-----------------
 FREE    | Plan Gratuito     | false         | false
 PRO     | Plan Profesional  | false         | false           ✅
 PRO_PLUS| Plan Pro Plus     | true          | true            ✅
 ENTERPRISE | Plan Empresarial | true       | true            ✅
```

---

## 🧪 CÓMO PROBAR

1. **Ejecutar el script SQL**
2. **Recargar la página de suscripciones:**
   ```
   http://localhost:3000/settings/subscription
   ```
3. **Verificar que:**
   - ❌ Plan FREE: NO muestra "En línea" ni "Por WhatsApp"
   - ❌ Plan PRO: NO muestra "En línea" ni "Por WhatsApp"
   - ✅ Plan PRO PLUS: SÍ muestra "En línea" y "Por WhatsApp"
   - ✅ Plan ENTERPRISE: SÍ muestra "En línea" y "Por WhatsApp"

---

## 📊 CARACTERÍSTICAS POR PLAN

### **Plan FREE (Gratuito)**
- ✅ Cotizaciones presenciales
- ❌ Cotizaciones en línea
- ❌ Cotizaciones WhatsApp

### **Plan PRO (Profesional) - $499/mes**
- ✅ Cotizaciones presenciales
- ❌ Cotizaciones en línea
- ❌ Cotizaciones WhatsApp

### **Plan PRO PLUS - $999/mes**
- ✅ Cotizaciones presenciales
- ✅ Cotizaciones en línea
- ✅ Cotizaciones WhatsApp
- ✅ Ventas por WhatsApp

### **Plan ENTERPRISE (Empresarial) - $1,499/mes**
- ✅ Cotizaciones presenciales
- ✅ Cotizaciones en línea
- ✅ Cotizaciones WhatsApp
- ✅ Todas las características de IA
- ✅ Soporte 24/7

---

## ⚠️ IMPORTANTE

**El componente PlanCard.tsx YA está leyendo correctamente los features.**

El problema NO está en el frontend, está en los datos de la base de datos.

Una vez que ejecutes el script SQL, la página de suscripciones mostrará automáticamente las características correctas.

---

## 🔄 SI YA TIENES DATOS EN LA TABLA

El script usa `ON CONFLICT ... DO UPDATE`, lo que significa que:
- Si el plan ya existe → Se actualizará
- Si el plan no existe → Se creará

**NO perderás datos existentes**, solo se actualizarán los features.

---

## 📝 CREDENCIALES DE BASE DE DATOS

Revisa tu archivo `.env` para obtener las credenciales:

```bash
DATABASE_URL="postgresql://usuario:password@localhost:5432/ferreai"
```

Extrae:
- Usuario: `usuario`
- Password: `password`
- Database: `ferreai`
- Host: `localhost`
- Port: `5432`

---

## ✅ CHECKLIST

- [ ] Ejecutar script SQL: `seed-plans-UPDATED.sql`
- [ ] Verificar que la tabla muestra los valores correctos
- [ ] Recargar página de suscripciones
- [ ] Verificar que Plan PRO NO muestra cotizaciones online/WhatsApp
- [ ] Verificar que Plan PRO_PLUS SÍ muestra cotizaciones online/WhatsApp
- [ ] Verificar que Plan ENTERPRISE SÍ muestra cotizaciones online/WhatsApp

---

## 🎯 RESULTADO FINAL

Después de aplicar esta corrección:

```
╔═══════════════════════════════════════════════════╗
║  ✅ Plan FREE: Solo cotizaciones presenciales     ║
║  ✅ Plan PRO: Solo cotizaciones presenciales      ║
║  ✅ Plan PRO_PLUS: Todas las cotizaciones         ║
║  ✅ Plan ENTERPRISE: Todas + IA                   ║
╚═══════════════════════════════════════════════════╝
```

---

**¿Necesitas ayuda para ejecutar el script?** Avísame y te guío paso a paso.
