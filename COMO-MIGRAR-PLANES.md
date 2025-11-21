# ⚠️ ERROR RESUELTO - NUEVA MIGRACIÓN

## 🔴 EL PROBLEMA

El error que obtuviste:
```
ERROR: no existe la columna «monthly_price_mxn» en la relación «subscription_plans»
```

Significa que la tabla `subscription_plans` **YA EXISTE** pero con el schema viejo (columnas `monthly_price` y `annual_price` en lugar de `monthly_price_mxn`, etc.).

---

## ✅ LA SOLUCIÓN

He creado un **nuevo script de MIGRACIÓN** que:
1. Detecta las columnas existentes
2. Agrega las nuevas columnas sin romper nada
3. Migra los datos de las columnas viejas a las nuevas
4. Actualiza los planes con los nuevos precios

---

## 🚀 QUÉ HACER AHORA

### **EJECUTA ESTE NUEVO ARCHIVO:**

```bash
migrar-planes-nuevos.bat
```

Este script:
- ✅ Agrega las columnas `monthly_price_mxn`, `annual_price_mxn`, etc.
- ✅ Mantiene las columnas viejas (por si acaso)
- ✅ Migra los datos automáticamente
- ✅ Inserta/actualiza los 4 planes
- ✅ No rompe nada existente

---

## 📋 DESPUÉS DE EJECUTAR

Una vez que se complete sin errores:

### **PASO 1: Actualizar Prisma**
```bash
npx prisma db pull
npx prisma generate
```

### **PASO 2: Reiniciar servidor**
```bash
npm run dev
```

### **PASO 3: Verificar**
Ve a: http://localhost:3000/settings/subscription

Deberías ver los 4 planes con los nuevos precios.

---

## 🗂️ ARCHIVOS DISPONIBLES

| Archivo | Cuándo usarlo |
|---------|---------------|
| `actualizar-planes-nuevos.bat` | ❌ NO USAR - Solo si la tabla NO existe |
| `migrar-planes-nuevos.bat` | ✅ **USAR ESTE** - Migra tabla existente |

---

## 🔍 VERIFICACIÓN

Después de ejecutar `migrar-planes-nuevos.bat`, verifica que funcionó:

```sql
-- Ver las columnas de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Ver los planes
SELECT plan_code, monthly_price_mxn, annual_price_mxn 
FROM subscription_plans 
ORDER BY display_order;
```

Deberías ver:
- ✅ 4 planes (FREE, PRO, PRO_PLUS, ENTERPRISE)
- ✅ Columnas nuevas: `monthly_price_mxn`, `annual_price_mxn`, etc.
- ✅ Precios correctos

---

## ❓ SI SIGUE DANDO ERROR

Si el script `migrar-planes-nuevos.bat` falla:

1. **Copia el error completo**
2. **Pégalo aquí** 
3. Yo te ayudo a resolverlo

---

## 🎯 RESUMEN

**EJECUTA SOLO ESTO:**
```bash
migrar-planes-nuevos.bat
```

Luego:
```bash
npx prisma db pull
npx prisma generate
npm run dev
```

¡Y listo! 🎉
