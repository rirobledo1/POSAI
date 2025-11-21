# 👑 PANEL DE ADMINISTRACIÓN - CONFIGURACIÓN

## 🎯 LO QUE SE CREÓ

### **1. API Endpoint** ✅
- `GET /api/admin/subscription-plans` - Obtener todos los planes
- `PUT /api/admin/subscription-plans` - Actualizar un plan
- ✅ Protegido: Solo super admins pueden acceder

### **2. Página de Administración** ✅
- Ruta: `/admin/subscription-plans`
- Funcionalidad:
  - ✅ Ver todos los planes en una tabla
  - ✅ Estadísticas rápidas (total, activos, popular)
  - ✅ Botón "Editar" por cada plan
  - ⏳ Modal de edición (próximo paso)

### **3. Archivos SQL** ✅
- `convertir-super-admin.sql` - Script para hacerte super admin
- `convertir-super-admin.bat` - Ejecuta el SQL fácilmente

---

## 🚀 CÓMO HACERTE SUPER ADMIN

### **PASO 1: Editar el archivo SQL**

1. Abre: `convertir-super-admin.sql`
2. Busca la línea:
   ```sql
   v_email TEXT := 'TU_EMAIL@ejemplo.com'; -- ⚠️ CAMBIA ESTO
   ```
3. Reemplaza `TU_EMAIL@ejemplo.com` con tu email real
   - Ejemplo: `'juan@ejemplo.com'`
4. Guarda el archivo

---

### **PASO 2: Ejecutar el script**

```bash
convertir-super-admin.bat
```

Verás algo como:
```
✅ Usuario juan@ejemplo.com (abc123) ahora es SUPER ADMIN
```

---

### **PASO 3: Reiniciar sesión**

1. **Cierra sesión** en el sistema
2. **Inicia sesión** nuevamente
3. Ahora verás la opción "Admin" en el menú

---

## 📋 ACCEDER AL PANEL

Una vez que seas super admin:

### **Opción 1: Desde el menú**
- Abre el menú lateral
- Verás una nueva opción: **"👑 Admin Planes"**
- Haz clic para acceder

### **Opción 2: URL directa**
```
http://localhost:3000/admin/subscription-plans
```

---

## 🎨 QUÉ VERÁS EN EL PANEL

### **Estadísticas en la parte superior:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Total Planes│  │Planes Activos│  │Plan Popular │  │Precio + Alto│
│      4      │  │      4       │  │     PRO     │  │  $2,999 MXN │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### **Tabla de Planes:**
| Plan | Precio Mensual | Precio Anual | Límites | Estado | Acciones |
|------|---------------|--------------|---------|--------|----------|
| Plan Gratuito ⚡ | $0 MXN | $0 MXN | 1 sucursal, 2 usuarios | ✓ Activo | [Editar] |
| Plan Profesional | $799 MXN | $8,068 MXN | 5 sucursales, ∞ usuarios | ✓ Activo | [Editar] |
| Plan Pro Plus | $1,499 MXN | $15,110 MXN | 10 sucursales, ∞ usuarios | ✓ Activo | [Editar] |
| Plan Enterprise | $2,999 MXN | $30,230 MXN | ∞ sucursales, ∞ usuarios | ✓ Activo | [Editar] |

---

## 🔐 SEGURIDAD

- ✅ Solo usuarios en la tabla `super_admins` pueden acceder
- ✅ Verificación en el servidor (no se puede burlar desde el cliente)
- ✅ Si intentas acceder sin permisos → Error 403

---

## ⏭️ PRÓXIMO PASO

**Crear el formulario de edición** para que puedas:
- 📝 Cambiar precios (MXN y USD)
- 🎯 Activar/desactivar características
- ⚙️ Modificar límites (sucursales, usuarios)
- 🏷️ Cambiar descuentos y días de prueba
- ⭐ Marcar como "Popular"

---

## ✅ RESUMEN RÁPIDO

```bash
# 1. Edita el SQL con tu email
# 2. Ejecuta:
convertir-super-admin.bat

# 3. Cierra sesión y vuelve a iniciar
# 4. Ve a:
http://localhost:3000/admin/subscription-plans
```

---

## 📞 VERIFICACIÓN

Para verificar que eres super admin:

```sql
SELECT u.name, u.email, sa.permissions
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id
WHERE u.email = 'TU_EMAIL@ejemplo.com';
```

Deberías ver tus permisos.

---

**¿Listo para continuar? Los siguientes pasos son:**
1. ✅ Hacerte super admin (ejecuta el .bat)
2. ✅ Acceder al panel
3. ⏳ Crear el modal de edición (siguiente)

¡Cuéntame cuando hayas ejecutado el script! 🚀
