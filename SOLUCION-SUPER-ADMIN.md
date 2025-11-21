# 🔧 SOLUCIÓN RÁPIDA - admin@ferreai.com

## ⚡ EJECUTA ESTO AHORA:

```bash
agregar-super-admin-ferreai.bat
```

Este script:
- ✅ Verifica que el usuario `admin@ferreai.com` existe
- ✅ Lo agrega a la tabla `super_admins`
- ✅ Le asigna todos los permisos

---

## 📋 DESPUÉS DE EJECUTAR:

### **PASO 1: Cierra sesión**
- En el navegador, cierra sesión del sistema

### **PASO 2: Reinicia el servidor**
```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo:
npm run dev
```

### **PASO 3: Inicia sesión nuevamente**
- Email: `admin@ferreai.com`
- Contraseña: tu contraseña

### **PASO 4: Abre el menú lateral**
- Clic en el botón hamburguesa (☰)
- **Verás al final:** "👑 Admin Planes"

---

## ✅ VERIFICACIÓN RÁPIDA:

Si quieres verificar en PostgreSQL que funcionó:

```sql
SELECT u.name, u.email 
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id
WHERE u.email = 'admin@ferreai.com';
```

Deberías ver tu usuario.

---

## 🎯 RESUMEN:

```bash
# 1. Ejecuta:
agregar-super-admin-ferreai.bat

# 2. Cierra sesión en el navegador

# 3. Reinicia servidor:
npm run dev

# 4. Inicia sesión de nuevo

# 5. Abre el menú → Verás "👑 Admin Planes"
```

---

**¡Ejecuta el .bat y luego sigue los 4 pasos!** 🚀
