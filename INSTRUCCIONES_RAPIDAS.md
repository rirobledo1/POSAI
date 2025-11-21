# 🚀 INSTRUCCIONES DE MIGRACIÓN MULTI-TENANT

## ⚡ INICIO RÁPIDO

### Opción 1: Automática (Recomendado)
```bash
# Doble clic en:
EJECUTAR-MIGRACION.bat

# Luego selecciona:
# A - EJECUTAR TODO AUTOMATICAMENTE
```

### Opción 2: Manual (Paso a Paso)
Ejecuta cada archivo .bat en orden:

```
1-backup.bat
2-primera-migracion.bat
3-migrar-datos.bat
4-verificar.bat
5-campos-obligatorios.bat
```

---

## 📋 ARCHIVOS CREADOS

### Scripts de Ejecución (.bat)
- `EJECUTAR-MIGRACION.bat` - Menú principal interactivo
- `1-backup.bat` - Crea backup de la base de datos
- `2-primera-migracion.bat` - Agrega columnas opcionales
- `3-migrar-datos.bat` - Asigna datos a compañía por defecto
- `4-verificar.bat` - Verifica que todo esté correcto
- `5-campos-obligatorios.bat` - Hace campos obligatorios

### Scripts de Node.js
- `scripts/migrate-to-multi-tenant.js` - Migra datos existentes
- `scripts/verify-multi-tenant.js` - Verifica la migración
- `scripts/make-fields-required.js` - Modifica el schema

### Documentación
- `GUIA_MIGRACION_MULTI_TENANT.md` - Guía completa detallada
- `INSTRUCCIONES_RAPIDAS.md` - Este archivo

---

## 🎯 ¿QUÉ HACE CADA PASO?

### Paso 1: Backup 💾
- Crea un respaldo completo de tu base de datos
- Archivo: `backup_ferreai_YYYYMMDD_HHMMSS.sql`
- **CRÍTICO**: No continúes sin este backup

### Paso 2: Primera Migración 🔧
- Agrega columna `company_id` a todas las tablas
- Columnas son **opcionales** (permiten NULL)
- Crea la tabla `companies`
- Agrega enums `Plan` y `CompanyStatus`

### Paso 3: Migrar Datos 📦
- Crea compañía "Mi Empresa"
- Asigna TODOS los registros a esta compañía
- Muestra resumen de cambios

### Paso 4: Verificar ✅
- Verifica que NO haya registros sin `company_id`
- Confirma que la migración fue exitosa
- Muestra estadísticas

### Paso 5: Campos Obligatorios 🔒
- Modifica el schema.prisma
- Cambia `String?` a `String`
- Hace los campos obligatorios permanentemente

---

## ⚠️ REQUISITOS PREVIOS

Antes de ejecutar, asegúrate de:

- [ ] Docker está corriendo
- [ ] Contenedor `ferreai_postgres` está activo
- [ ] No hay cambios sin guardar en Git
- [ ] Tienes Node.js instalado
- [ ] Has leído esta guía completa

**Verificar Docker:**
```bash
docker ps
# Debe mostrar: ferreai_postgres
```

---

## 🔥 EJECUCIÓN

### 1️⃣ Abre PowerShell o CMD en la carpeta del proyecto

```bash
cd C:\Users\HTIJ\Desktop\ferreai
```

### 2️⃣ Ejecuta el menú principal

```bash
EJECUTAR-MIGRACION.bat
```

### 3️⃣ Selecciona una opción

```
========================================
  MIGRACION A MULTI-TENANT - FERREAI
========================================

 Selecciona el paso a ejecutar:

 1. Paso 1: Crear Backup de la BD
 2. Paso 2: Primera Migracion (campos opcionales)
 3. Paso 3: Migrar Datos Existentes
 4. Paso 4: Verificar Migracion
 5. Paso 5: Hacer Campos Obligatorios

 A. EJECUTAR TODO AUTOMATICAMENTE (Pasos 1-4)

 0. Salir

========================================

Ingresa tu opcion: 
```

### 4️⃣ Para ejecución automática

Selecciona **A** y confirma con **S**

El proceso ejecutará:
1. ✅ Backup
2. ✅ Primera Migración
3. ✅ Migración de Datos
4. ✅ Verificación

### 5️⃣ Ejecuta el Paso 5 manualmente

Después de que los pasos 1-4 terminen exitosamente:

```bash
# Desde el menú, selecciona:
5

# O ejecuta directamente:
5-campos-obligatorios.bat
```

---

## 📊 SALIDA ESPERADA

### ✅ Éxito en Paso 3
```
🚀 Iniciando migración a Multi-Tenant...

📋 PASO 1: Verificando compañías existentes...
📋 PASO 2: Creando compañía por defecto...
✅ Compañía creada con ID: default-company-1234567890

📋 PASO 3: Contando registros existentes...
   👥 Usuarios: 5
   📦 Productos: 120
   🧑‍💼 Clientes: 45
   💰 Ventas: 89
   📂 Categorías: 15
   📊 Movimientos de inventario: 210
   📍 Direcciones de entrega: 12

📋 PASO 4: Asignando registros a la compañía por defecto...
   Actualizando usuarios...
   ✅ Usuarios actualizados
   Actualizando productos...
   ✅ Productos actualizados
   ...

✨ ¡Migración completada exitosamente!
```

### ✅ Éxito en Paso 4
```
🔍 Iniciando verificación del sistema Multi-Tenant...

✓ Verificando compañías...
   ✅ 1 compañía(s) encontrada(s)
      - Mi Empresa (mi-empresa) - Plan: FREE

✓ Verificando usuarios...
   ✅ Todos los usuarios (5) tienen compañía asignada

✓ Verificando productos...
   ✅ Todos los productos (120) tienen compañía asignada

...

============================================================
✅ VERIFICACIÓN EXITOSA

🎉 ¡El sistema Multi-Tenant está correctamente configurado!
```

---

## 🚨 PROBLEMAS COMUNES

### Error: "Docker no está corriendo"
```bash
# Inicia Docker Desktop
# Espera a que esté completamente iniciado
# Intenta de nuevo
```

### Error: "Puerto 5432 en uso"
```bash
# Verifica que no haya otro PostgreSQL corriendo
netstat -ano | findstr :5432
```

### Error: "Cannot find module"
```bash
# Instala las dependencias
npm install
```

### Error en verificación (hay registros sin company_id)
```bash
# Ejecuta nuevamente el paso 3
3-migrar-datos.bat
```

---

## 🎉 DESPUÉS DE COMPLETAR

Una vez completada la Fase 1, tendrás:

✅ Base de datos con estructura Multi-Tenant
✅ Todos los datos asignados a una compañía
✅ Campos `company_id` en todas las tablas
✅ Sistema listo para la Fase 2

### Próxima Fase: Autenticación 🔐

La Fase 2 incluirá:
- Modificar NextAuth para incluir `companyId` en sesión
- Crear página de registro
- Agregar campos de compañía al login
- Callbacks actualizados

---

## 📞 SOPORTE

Si encuentras algún error:

1. **NO BORRES NADA**
2. Copia el mensaje de error completo
3. Revisa la sección "Problemas Comunes"
4. Si persiste, contacta con el mensaje de error

---

## ✅ CHECKLIST FINAL

Antes de considerar la Fase 1 completa:

- [ ] Backup creado exitosamente
- [ ] Primera migración ejecutada sin errores
- [ ] Script de datos ejecutado con éxito
- [ ] Verificación pasada sin errores
- [ ] Campos ahora son obligatorios (String, no String?)
- [ ] Sistema funciona correctamente
- [ ] Puedes acceder a la aplicación sin problemas

---

**¡Estás listo para comenzar! 🚀**

Ejecuta: `EJECUTAR-MIGRACION.bat`
