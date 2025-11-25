# 🔐 Configuración de Google OAuth - FerreAI

## Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Clic en el menú desplegable de proyectos (arriba izquierda)
3. Clic en "Nuevo Proyecto"
4. Nombre: `FerreAI`
5. Clic en "Crear"

## Paso 2: Habilitar Google+ API

1. En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google+ API"
3. Clic en "HABILITAR"

## Paso 3: Crear Credenciales OAuth 2.0

1. Ve a "APIs y servicios" > "Credenciales"
2. Clic en "+ CREAR CREDENCIALES"
3. Selecciona "ID de cliente de OAuth"
4. Si te pide configurar pantalla de consentimiento:
   - Clic en "CONFIGURAR PANTALLA DE CONSENTIMIENTO"
   - Selecciona "Externa" > Crear
   - Información de la app:
     - Nombre: `FerreAI`
     - Email de asistencia: tu email
     - Logo: (opcional)
   - Dominios autorizados: (dejar vacío por ahora)
   - Información de contacto: tu email
   - Clic en "GUARDAR Y CONTINUAR"
   - Alcances: Clic en "GUARDAR Y CONTINUAR" (sin agregar ninguno)
   - Usuarios de prueba: Agrega tu email
   - Clic en "GUARDAR Y CONTINUAR"
   
5. Volver a "Credenciales" > "+ CREAR CREDENCIALES" > "ID de cliente de OAuth"
6. Tipo de aplicación: "Aplicación web"
7. Nombre: `FerreAI Web`
8. Orígenes de JavaScript autorizados:
   ```
   http://localhost:3000
   https://ferreai.com
   https://www.ferreai.com
   ```
9. URIs de redireccionamiento autorizados:
   ```
   http://localhost:3000/api/auth/callback/google
   https://ferreai.com/api/auth/callback/google
   https://www.ferreai.com/api/auth/callback/google
   ```
10. Clic en "CREAR"
11. **IMPORTANTE**: Copiar el Client ID y Client Secret

## Paso 4: Agregar Credenciales a .env

Abre tu archivo `.env` y agrega:

```env
# OAuth Google
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
```

**Ejemplo real**:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUv
```

## Paso 5: Instalar Dependencia

```bash
# Ya debería estar instalado con next-auth, pero por si acaso:
npm install next-auth
```

## Paso 6: Verificar Archivos

Los siguientes archivos ya fueron creados:
- ✅ `/lib/auth.ts` - Actualizado con Google provider
- ✅ `/app/login/page.tsx` - Botón de Google actualizado

## Paso 7: Reiniciar Servidor

```bash
# Detener servidor (Ctrl+C)
# Iniciar de nuevo
npm run dev
```

## Paso 8: Probar

1. Abre http://localhost:3000/login
2. Clic en botón de Google (el icono multicolor)
3. Selecciona tu cuenta Google
4. Autoriza permisos
5. Deberías ser redirigido al dashboard

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solución**: Verifica que la URI de callback en Google Console sea exactamente:
```
http://localhost:3000/api/auth/callback/google
```

### Error: "Access blocked: This app's request is invalid"
**Solución**: La pantalla de consentimiento no está configurada o falta agregar tu email como usuario de prueba

### Error: "User not found" después de login
**Solución**: El usuario no existe en la base de datos. Necesitas crear cuenta primero con email/password, luego vincular Google

## ⚠️ IMPORTANTE - Flujo de Registro

Por seguridad, Google OAuth solo permite LOGIN, no registro automático.

**Flujo recomendado**:
1. Usuario se registra con email/password
2. Usuario hace login con email/password O con Google
3. Si hace login con Google y el email coincide, funciona

**Si quieres permitir registro con Google**:
Necesitas modificar `/lib/auth.ts` en el callback `signIn`

## 📋 Checklist

- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google+ API
- [ ] Crear credenciales OAuth 2.0
- [ ] Configurar pantalla de consentimiento
- [ ] Agregar URIs de redirección
- [ ] Copiar Client ID y Secret
- [ ] Agregar a `.env`
- [ ] Reiniciar servidor
- [ ] Probar login con Google
- [ ] Verificar redirección correcta

## 🎯 URLs Útiles

- Google Cloud Console: https://console.cloud.google.com/
- Documentación OAuth: https://developers.google.com/identity/protocols/oauth2
- NextAuth Docs: https://next-auth.js.org/providers/google

---

**Tiempo estimado**: 15-20 minutos  
**Dificultad**: Baja  
**Costo**: Gratis
