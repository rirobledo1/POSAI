# 🧹 GUÍA: Limpieza de Base de Datos

**Fecha:** 22 de Noviembre de 2025
**Propósito:** Limpiar la base de datos para empezar desde cero

---

## ⚠️ ADVERTENCIA IMPORTANTE

Este proceso **ELIMINARÁ TODOS LOS DATOS** de tu base de datos.

**Se eliminará:**
- ❌ Todas las empresas
- ❌ Todos los usuarios
- ❌ Todos los productos
- ❌ Todos los clientes
- ❌ Todas las ventas
- ❌ Todas las cotizaciones
- ❌ Todo el inventario
- ❌ **TODO**

**Se mantendrá:**
- ✅ Estructura de tablas (schema)
- ✅ Planes de suscripción (subscription_plans)
- ✅ Migraciones de Prisma

---

## 🔒 OPCIÓN 1: Limpieza Segura (CON BACKUP)

### Paso 1: Crear Backup

```bash
# Windows (usando pg_dump)
pg_dump -U postgres -d ferreai > backup_antes_de_limpiar.sql

# O desde pgAdmin:
# Click derecho en la base de datos → Backup
```

### Paso 2: Ejecutar Limpieza

```bash
node clean-database.js
```

### Paso 3: Confirmar

Cuando te pregunte, escribe **exactamente**:
```
SI ESTOY SEGURO
```

---

## 🚀 OPCIÓN 2: Limpieza Directa (SIN BACKUP)

**Solo si estás 100% seguro de que no necesitas los datos**

```bash
node clean-database.js
```

Y confirma con: `SI ESTOY SEGURO`

---

## 📋 QUÉ HACE EL SCRIPT

### Orden de eliminación (respeta dependencias):

1. ✅ Intentos de login
2. ✅ Logs de email y auditoría
3. ✅ Items de cotizaciones → Cotizaciones
4. ✅ Órdenes online → Clientes de tienda
5. ✅ Items de ventas → Pagos → Ventas
6. ✅ Movimientos de inventario
7. ✅ Transferencias de stock
8. ✅ Productos por sucursal
9. ✅ Imágenes de productos → Productos
10. ✅ Direcciones → Clientes
11. ✅ Cierres de caja
12. ✅ Categorías
13. ✅ Historial de pagos → Suscripciones
14. ✅ Sucursales
15. ✅ Sesiones → Cuentas OAuth → Super admins → Usuarios
16. ✅ Empresas
17. ✅ Configuraciones
18. ✅ Tokens de verificación

**Total:** ~29 operaciones de limpieza en orden correcto

---

## 🎯 DESPUÉS DE LIMPIAR

### Paso 1: Actualizar Planes de Suscripción

```bash
node fix-all-features.js
```

Esto asegura que los planes tengan las características correctas.

### Paso 2: Crear Primera Empresa

1. Ve a: `http://localhost:3000/register`
2. Crea tu empresa de prueba
3. Crea tu primer usuario admin

### Paso 3: Poblar Categorías (Opcional)

```bash
node seed-categories.js
```

### Paso 4: Poblar Productos de Prueba (Opcional)

```bash
node seed-products.js
```

---

## 🔄 SI NECESITAS RESTAURAR EL BACKUP

```bash
# Windows (PostgreSQL)
psql -U postgres -d ferreai < backup_antes_de_limpiar.sql

# O desde pgAdmin:
# Click derecho en la base de datos → Restore
# Selecciona tu archivo backup_antes_de_limpiar.sql
```

---

## 📊 SALIDA ESPERADA

```
🧹 LIMPIEZA DE BASE DE DATOS
================================================================================

📊 Registros actuales:
   • Empresas: 5
   • Usuarios: 12
   • Productos: 150
   • Clientes: 45
   • Ventas: 230
   • Cotizaciones: 18
   • Sucursales: 8
   • Categorías: 15
   • Intentos de login: 342

🔹 Iniciando limpieza en orden correcto...

✅ Intentos de login eliminados
✅ Logs de email eliminados
✅ Logs de auditoría eliminados
... (continúa con todas las tablas)

📊 Registros DESPUÉS de limpiar:
   • Empresas: 0
   • Usuarios: 0
   • Productos: 0
   • Clientes: 0
   • Ventas: 0
   • Cotizaciones: 0
   • Sucursales: 0
   • Categorías: 0
   • Intentos de login: 0

================================================================================
✅ ✨ Base de datos limpiada exitosamente!
================================================================================

📊 Resumen:
   • Registros eliminados: 830
   • Registros restantes: 0

⚠️  IMPORTANTE: La base de datos está vacía
ℹ️  📝 Planes de suscripción: SIN MODIFICAR (se mantienen)
ℹ️  🏗️  Estructura de tablas: INTACTA
ℹ️  🔧 Migraciones de Prisma: INTACTAS
```

---

## ❓ PREGUNTAS FRECUENTES

### **¿Se eliminarán los planes de suscripción?**
❌ No, los planes se mantienen en la tabla `subscription_plans`

### **¿Puedo cancelar la operación?**
✅ Sí, si no escribes exactamente "SI ESTOY SEGURO", no se elimina nada

### **¿Se puede deshacer?**
❌ No, una vez ejecutado no hay vuelta atrás (solo con backup)

### **¿Afecta la estructura de tablas?**
❌ No, solo elimina datos, no modifica el schema

### **¿Necesito ejecutar migraciones después?**
❌ No, la estructura se mantiene intacta

### **¿Qué pasa con las imágenes de productos?**
⚠️ Se eliminan los registros de la DB, pero los archivos físicos en disco se mantienen

---

## 🛡️ SEGURIDAD

**El script pide confirmación explícita:**
```
¿Estás seguro de que quieres limpiar la base de datos? 
(escribe "SI ESTOY SEGURO" para confirmar):
```

**Cualquier otra respuesta cancela la operación.**

---

## 📝 CHECKLIST ANTES DE EJECUTAR

- [ ] ¿Tengo un backup de la base de datos?
- [ ] ¿Realmente necesito empezar desde cero?
- [ ] ¿He guardado cualquier configuración importante?
- [ ] ¿Tengo las credenciales de acceso a la DB?
- [ ] ¿Sé cómo restaurar el backup si algo sale mal?

---

**Si todas las respuestas son ✅, entonces puedes proceder con:**

```bash
node clean-database.js
```

---

**Creado por:** Claude  
**Para:** RIGO  
**Propósito:** Empezar FerreAI desde cero de forma segura
