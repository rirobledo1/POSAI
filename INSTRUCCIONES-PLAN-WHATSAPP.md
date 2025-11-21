# 🔧 Verificación y Actualización de Planes de FerreAI

## 📋 Problema Resuelto

Corregimos el bug que impedía enviar cotizaciones por WhatsApp en el Plan PRO. 

**Cambios realizados:**
- ✅ Eliminamos la referencia a 'PRO_PLUS' que no existe en el enum de planes
- ✅ Confirmamos que Plan PRO puede enviar por WhatsApp (modo manual)
- ✅ Plan ENTERPRISE puede enviar automáticamente vía WhatsApp Business API

## 🔍 Paso 1: Verificar Plan Actual

Ejecuta este comando para ver el plan de todas tus empresas:

```bash
npm run check:plan
```

Esto mostrará:
- Nombre de la empresa
- Plan actual (FREE, BASIC, PRO, ENTERPRISE)
- Estado de la suscripción
- Número de usuarios, sucursales y productos
- Fecha de expiración

**Ejemplo de salida:**
```
✅ Se encontraron 1 empresa(s):

1. 🏢 Ferretería Demo
   ID: cm3abc123def
   Slug: ferreteria-demo
   📦 Plan: FREE
   ⚡ Estado: ACTIVE
   👥 Usuarios: 3
   🏪 Sucursales: 1
   📦 Productos: 25
   🗓️  Creada: 15/11/2025

💡 Nota:
   - Plan FREE/BASIC: ❌ No puede enviar cotizaciones por WhatsApp
   - Plan PRO: ✅ Envío MANUAL por WhatsApp (abre WhatsApp Web)
   - Plan ENTERPRISE: ✅ Envío AUTOMÁTICO por WhatsApp Business API
```

## 🚀 Paso 2: Actualizar a Plan PRO (si es necesario)

Si tu empresa tiene plan FREE o BASIC y necesitas enviar cotizaciones por WhatsApp:

```bash
npm run update:plan <slug-de-tu-empresa>
```

**Ejemplo:**
```bash
npm run update:plan ferreteria-demo
```

Esto actualizará:
- ✅ Plan: PRO
- ✅ Estado: ACTIVE
- ✅ Límites del Plan PRO:
  - Max Sucursales: 5
  - Max Usuarios: 15
  - Max Productos: 5,000
- ✅ Vigencia: 1 año desde hoy

## 📱 Funcionalidad de WhatsApp por Plan

### Plan FREE / BASIC
- ❌ **No puede enviar cotizaciones por WhatsApp**
- Mensaje de error: "Tu plan no incluye envío de cotizaciones por WhatsApp"

### Plan PRO
- ✅ **Envío MANUAL por WhatsApp**
- Al hacer clic en "Enviar por WhatsApp":
  1. Se genera un mensaje prellenado con los datos de la cotización
  2. Se abre WhatsApp Web o la aplicación de WhatsApp
  3. El usuario solo presiona "Enviar"
- **Ventaja:** No requiere configuración de API
- **Limitación:** Requiere que el usuario tenga WhatsApp abierto

### Plan ENTERPRISE
- ✅ **Envío AUTOMÁTICO vía WhatsApp Business API**
- El sistema envía automáticamente sin intervención del usuario
- Incluye adjuntar el PDF de la cotización
- **Requiere configuración:**
  - `WHATSAPP_BUSINESS_PHONE_ID` en .env
  - `WHATSAPP_ACCESS_TOKEN` en .env

## 🧪 Prueba el Envío por WhatsApp

Una vez que tu empresa tenga Plan PRO o superior:

1. Ve a la sección de **Cotizaciones**
2. Crea o abre una cotización
3. Haz clic en **"Enviar por WhatsApp"**
4. Si estás en Plan PRO:
   - Se abrirá WhatsApp con el mensaje prellenado
   - Solo presiona "Enviar"
5. Si estás en Plan ENTERPRISE (y configuraste la API):
   - El mensaje se envía automáticamente
   - Recibirás confirmación en pantalla

## 🛠️ Troubleshooting

### Problema: Sigue diciendo que mi plan no incluye WhatsApp

**Solución:**
1. Verifica el plan actual: `npm run check:plan`
2. Si no es PRO o ENTERPRISE, actualiza: `npm run update:plan <slug>`
3. Cierra sesión y vuelve a iniciar en FerreAI
4. Intenta enviar la cotización nuevamente

### Problema: No sé cuál es el slug de mi empresa

**Solución:**
Ejecuta: `npm run check:plan`

Esto mostrará todas las empresas con sus slugs

### Problema: Error al ejecutar los scripts

**Solución:**
Instala tsx si no lo tienes:
```bash
npm install -D tsx
```

Luego ejecuta nuevamente el comando

## 📝 Notas Técnicas

### Archivos Modificados
- `src/app/api/quotations/[id]/send-whatsapp/route.ts` - Corregida validación de planes

### Scripts Creados
- `scripts/check-company-plan.ts` - Verificar planes
- `scripts/update-company-plan.ts` - Actualizar a PRO

### Nuevos Comandos npm
- `npm run check:plan` - Ver planes de todas las empresas
- `npm run update:plan <slug>` - Actualizar empresa a Plan PRO

## 💡 Recomendaciones

1. **Para desarrollo/testing:** Usa Plan PRO con envío manual
2. **Para producción con muchos clientes:** Configura Plan ENTERPRISE con WhatsApp Business API
3. **Verifica regularmente:** Ejecuta `npm run check:plan` para monitorear el estado de las suscripciones

---

**✅ ¡Listo!** Ahora tu sistema FerreAI puede enviar cotizaciones por WhatsApp según el plan de cada empresa.
