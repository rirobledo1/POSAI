# 🚀 GUÍA DE MIGRACIÓN A MULTI-TENANT

## ⚠️ IMPORTANTE: Leer antes de ejecutar

Esta guía te llevará paso a paso para migrar tu sistema actual a un modelo SaaS Multi-Tenant.

---

## 📋 PASOS A SEGUIR (EN ORDEN)

### ✅ PASO 1: Backup de la Base de Datos (CRÍTICO)

Antes de hacer CUALQUIER cambio, haz un backup completo de tu base de datos:

```bash
# Para PostgreSQL
pg_dump -U tu_usuario -d nombre_base_datos > backup_antes_migracion.sql

# O si usas Docker
docker exec tu_contenedor_postgres pg_dump -U postgres nombre_base_datos > backup_antes_migracion.sql
```

**🚨 NO CONTINÚES SIN HACER EL BACKUP**

---

### ✅ PASO 2: Crear la Primera Migración (Campos Opcionales)

Esta migración agregará las columnas `company_id` como opcionales (nullable):

```bash
npx prisma migrate dev --name add_multi_tenant_fields_optional
```

**Qué hace este paso:**
- Crea columnas `company_id` en todas las tablas
- Las columnas permiten valores NULL temporalmente
- Agrega las relaciones con la tabla Company
- Crea los enums Plan y CompanyStatus

---

### ✅ PASO 3: Ejecutar el Script de Migración de Datos

Este script creará la compañía por defecto y asignará todos los registros existentes a ella:

```bash
node scripts/migrate-to-multi-tenant.js
```

**Qué hace este paso:**
- Crea una compañía llamada "Mi Empresa"
- Asigna TODOS los registros existentes a esa compañía
- Muestra un resumen de los cambios

**Salida esperada:**
```
🚀 Iniciando migración a Multi-Tenant...

📋 PASO 1: Verificando compañías existentes...
📋 PASO 2: Creando compañía por defecto...
✅ Compañía creada con ID: default-company-xxxxx

📋 PASO 3: Contando registros existentes...
   👥 Usuarios: X
   📦 Productos: X
   🧑‍💼 Clientes: X
   💰 Ventas: X
   ...

📋 PASO 4: Asignando registros a la compañía por defecto...
   ✅ Usuarios actualizados
   ✅ Productos actualizados
   ...

✨ ¡Migración completada exitosamente!
```

---

### ✅ PASO 4: Hacer los Campos Obligatorios

Ahora que todos los registros tienen un `company_id`, vamos a hacer los campos obligatorios.

**4.1. Modificar el schema.prisma**

Cambiar TODOS los `companyId String?` a `companyId String` (quitar el `?`):

Buscar en el archivo `prisma/schema.prisma`:

```prisma
// ANTES (opcional):
companyId String?   @map("company_id")
company   Company?  @relation(...)

// DESPUÉS (obligatorio):
companyId String    @map("company_id")
company   Company   @relation(...)
```

Esto hay que hacerlo en:
- [ ] User
- [ ] Product
- [ ] Customer
- [ ] Sale
- [ ] InventoryMovement
- [ ] categories
- [ ] DeliveryAddress

**4.2. Crear la segunda migración:**

```bash
npx prisma migrate dev --name make_company_id_required
```

---

### ✅ PASO 5: Verificar la Migración

Ejecuta este script para verificar que todo esté correcto:

```bash
node scripts/verify-multi-tenant.js
```

(Este script lo crearemos a continuación)

---

## 🔍 VERIFICACIÓN MANUAL

Puedes verificar manualmente en la base de datos:

```sql
-- Verificar que NO haya registros sin companyId
SELECT COUNT(*) FROM users WHERE company_id IS NULL;
SELECT COUNT(*) FROM products WHERE company_id IS NULL;
SELECT COUNT(*) FROM customers WHERE company_id IS NULL;
SELECT COUNT(*) FROM sales WHERE company_id IS NULL;

-- Verificar la compañía creada
SELECT * FROM companies;

-- Verificar que los usuarios estén asociados
SELECT u.name, u.email, c.name as company_name 
FROM users u 
JOIN companies c ON u.company_id = c.id;
```

---

## ⚠️ PROBLEMAS COMUNES

### Error: "Null value in required field"

**Causa:** Hay registros que no tienen `company_id` asignado.

**Solución:**
```bash
# Volver a ejecutar el script de migración de datos
node scripts/migrate-to-multi-tenant.js
```

### Error: "Foreign key constraint violation"

**Causa:** Intentaste hacer los campos obligatorios antes de llenar los datos.

**Solución:** Seguir el orden exacto de los pasos.

---

## 🎉 SIGUIENTE FASE

Una vez completada esta Fase 1, continuaremos con:

- **Fase 2:** Modificar autenticación (NextAuth)
- **Fase 3:** Aislamiento de datos (Middleware)
- **Fase 4:** Gestión de usuarios
- **Fase 5:** Planes y facturación
- **Fase 6:** UI/UX
- **Fase 7:** Testing y Launch

---

## 📞 ¿NECESITAS AYUDA?

Si encuentras algún error durante la migración:

1. **NO PÁNICO** - Tienes el backup
2. Copia el mensaje de error completo
3. Revisa qué paso estabas ejecutando
4. Consulta la sección "Problemas Comunes"

---

## ✅ CHECKLIST

Antes de continuar a la Fase 2, verifica:

- [ ] Backup creado
- [ ] Primera migración ejecutada (campos opcionales)
- [ ] Script de datos ejecutado exitosamente
- [ ] Todos los registros tienen company_id
- [ ] Segunda migración ejecutada (campos obligatorios)
- [ ] Verificación manual realizada
- [ ] Sistema funciona correctamente

---

**¡Buena suerte con la migración!** 🚀
