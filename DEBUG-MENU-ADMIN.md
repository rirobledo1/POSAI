# 🔍 DEBUG: Admin Planes no aparece en el menú

## ✅ CONFIRMACIÓN:
Usuario `admin@ferreai.com` (ID: cmgrao3790004twwoyfshswug) **SÍ es super admin** en la base de datos.

Ahora necesitamos diagnosticar por qué no aparece en el menú.

---

## 🚀 PASO 1: Página de Debug

Ve a esta URL en tu navegador:
```
http://localhost:3000/debug-super-admin
```

Esta página te mostrará:
1. ✅ Tu sesión actual
2. ✅ Si el API reconoce que eres super admin
3. ✅ Información de debug detallada

---

## 📋 PASO 2: Interpretar Resultados

### **CASO A: Si dice "✅ SÍ es Super Admin"**

Significa que el API funciona correctamente. El problema es que el menú no se actualiza.

**Solución:**
```bash
# 1. Cierra sesión en el navegador (importante!)
# 2. Detén el servidor:
Ctrl + C

# 3. Borra caché de Next.js:
rmdir /s /q .next

# 4. Reinicia el servidor:
npm run dev

# 5. Vuelve a iniciar sesión
# 6. Abre el menú lateral
```

---

### **CASO B: Si dice "❌ NO es Super Admin"**

Significa que hay un problema en la consulta.

**Solución:**
```bash
# 1. Ejecuta de nuevo:
agregar-super-admin-ferreai.bat

# 2. Verifica en PostgreSQL:
# Ejecuta: debug-super-admin.sql

# 3. Cierra sesión
# 4. Reinicia servidor
# 5. Vuelve a iniciar sesión
```

---

## 🔧 PASO 3: Solución Alternativa (Si nada funciona)

Si después de todo sigue sin aparecer, prueba esto:

### **Opción 1: Acceso directo por URL**
```
http://localhost:3000/admin/subscription-plans
```

Si puedes acceder por URL pero no aparece en el menú, es un problema de renderizado del menú.

### **Opción 2: Limpiar todo y empezar de nuevo**
```bash
# 1. Cierra sesión
# 2. Detén servidor (Ctrl+C)
# 3. Borra caché:
rmdir /s /q .next
rmdir /s /q node_modules\.cache

# 4. Reinstala dependencias:
npm install

# 5. Regenera Prisma:
npx prisma generate

# 6. Reinicia:
npm run dev

# 7. Inicia sesión
```

---

## 📞 INFORMACIÓN PARA DEBUG

Cuando vayas a `/debug-super-admin`, toma captura o copia:

1. **User ID de la sesión**
2. **Respuesta del API** (¿dice SÍ o NO?)
3. **Errores en la consola** (F12 → Console)

---

## ✅ CHECKLIST:

- [ ] Ejecuté `agregar-super-admin-ferreai.bat`
- [ ] Vi el mensaje: ✅ Usuario admin@ferreai.com ahora es SUPER ADMIN
- [ ] Fui a `http://localhost:3000/debug-super-admin`
- [ ] El API dice que ✅ SÍ soy super admin
- [ ] Cerré sesión completamente
- [ ] Detuve el servidor (Ctrl+C)
- [ ] Borré caché: `rmdir /s /q .next`
- [ ] Reinicié: `npm run dev`
- [ ] Volví a iniciar sesión
- [ ] Abrí el menú lateral
- [ ] Busqué "👑 Admin Planes" al final del menú

---

## 🎯 INSTRUCCIÓN RÁPIDA:

```bash
# Ejecuta AHORA:

# 1. Ve a esta URL:
http://localhost:3000/debug-super-admin

# 2. Verifica si dice "✅ SÍ es Super Admin"

# 3. Si dice SÍ, ejecuta:
# Cierra sesión → Ctrl+C → rmdir /s /q .next → npm run dev → Inicia sesión

# 4. Abre el menú y busca "👑 Admin Planes"
```

---

**Ve primero a la página de debug y cuéntame qué dice.** 🔍

http://localhost:3000/debug-super-admin
