# 🔐 OAuth - Guía Completa para FerreAI

**Fecha**: 21 de noviembre de 2024  
**Estado**: DESHABILITADO TEMPORALMENTE  
**Razón**: Decidir flujo de auto-registro

---

## 📊 Situación Actual

### Problema
Los botones de OAuth (Google, Facebook, Apple) están **OCULTOS** porque:
- ❌ Solo funcionan si el usuario **YA EXISTE** en la base de datos
- ❌ Si un cliente nuevo intenta hacer login con Google → Error
- ❌ Mala experiencia de usuario para un SaaS público

### Lo que está configurado
✅ GoogleProvider instalado en `auth.ts`  
✅ Callback de seguridad (rechaza usuarios nuevos)  
✅ Botones comentados en `login/page.tsx`

---

## 🎯 Opciones para el Futuro

### Opción A: Auto-Registro con OAuth (RECOMENDADO) ⭐

**Perfecto para**: SaaS donde cualquiera puede registrarse

**Flujo**:
```
1. Cliente hace clic "Login con Google"
2. Google autentica → juan@ferreteria.com
3. Sistema NO encuentra email en BD
4. Sistema AUTOMÁTICAMENTE:
   ✅ Crea nueva Company: "Ferretería de Juan"
   ✅ Crea User: juan@ferreteria.com (ROL: ADMIN)
   ✅ Asigna Plan: FREE
   ✅ Crea Branch principal
   ✅ Inicia sesión automáticamente
5. Cliente puede empezar a usar el sistema inmediatamente
```

**Ventajas**:
- ✅ Experiencia de usuario excelente
- ✅ Menos fricción = más conversiones
- ✅ Igual que Shopify, Stripe, Notion
- ✅ Cliente empieza en plan FREE
- ✅ Puede upgradear después

**Desventajas**:
- ⚠️ Cualquiera puede registrarse (spam potencial)
- ⚠️ Menos control inicial

---

### Opción B: Registro Manual + OAuth para Login

**Perfecto para**: Sistemas con validación manual

**Flujo**:
```
1. Cliente se registra manualmente primero
2. Verifica email
3. DESPUÉS puede usar Google para login
```

**Ventajas**:
- ✅ Control total de quién se registra
- ✅ Puedes validar clientes
- ✅ Mejor para B2B privado

**Desventajas**:
- ❌ Dos pasos (registro + OAuth)
- ❌ Confuso para usuarios
- ❌ Menor conversión

---

## 🚀 Implementación Recomendada: Opción A

### Paso 1: Modificar Callback en `auth.ts`

Actualizar el callback `signIn` para crear usuario automáticamente:

```typescript
// En src/lib/auth.ts, callback signIn

async signIn({ user, account, profile }) {
  if (account?.provider === 'google') {
    const { prisma } = await import('@/lib/prisma')
    
    try {
      // Buscar usuario existente
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
        include: { company: true }
      })
      
      // Si usuario existe → Login normal
      if (existingUser) {
        if (!existingUser.isActive) {
          console.log(`⚠️ Usuario inactivo: ${user.email}`)
          return false
        }
        console.log(`✅ Login con Google: ${user.email}`)
        return true
      }
      
      // ✨ USUARIO NUEVO → AUTO-REGISTRO
      console.log(`🆕 Nuevo usuario via Google: ${user.email}`)
      
      // Generar nombre de compañía del email
      const emailUsername = user.email!.split('@')[0]
      const companyName = `Empresa de ${user.name || emailUsername}`
      const companySlug = `${emailUsername}-${Date.now()}`
      
      // 🔥 CREAR TODO EN UNA TRANSACCIÓN
      await prisma.$transaction(async (tx) => {
        // 1. Crear Company
        const company = await tx.company.create({
          data: {
            name: companyName,
            slug: companySlug,
            businessType: 'GENERAL',
            email: user.email!,
            plan: 'FREE', // Plan inicial
            status: 'TRIAL', // Trial de 14 días
            maxBranches: 1,
            maxUsers: 3,
            maxProducts: 100,
            subscriptionExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 días
          }
        })
        
        // 2. Crear Branch principal
        const branch = await tx.branch.create({
          data: {
            name: 'Sucursal Principal',
            code: 'MAIN',
            address: '',
            city: '',
            state: '',
            isMain: true,
            isActive: true,
            companyId: company.id
          }
        })
        
        // 3. Crear Usuario (ADMIN) - SIN PASSWORD
        await tx.user.create({
          data: {
            name: user.name || emailUsername,
            email: user.email!,
            password: null, // No tiene password (solo OAuth)
            role: 'ADMIN',
            isActive: true,
            companyId: company.id,
            branchId: branch.id
          }
        })
        
        // 4. Crear categoría por default
        await tx.categories.create({
          data: {
            id: `${company.slug}-CAT001`,
            name: 'General',
            description: 'Categoría general',
            active: true,
            companyId: company.id
          }
        })
      })
      
      console.log(`✅ Usuario auto-registrado: ${user.email}`)
      console.log(`🏢 Compañía creada: ${companyName}`)
      
      return true // ✅ Permitir login
      
    } catch (error) {
      console.error('❌ Error en auto-registro OAuth:', error)
      return false
    }
  }
  
  return true // Permitir otros providers
}
```

### Paso 2: Descomentar Botones OAuth

En `src/app/login/page.tsx`, quitar los comentarios `{/* */}` de la sección OAuth:

```typescript
// ANTES (comentado):
{/* OAUTH - DESHABILITADO TEMPORALMENTE
  ...código...
*/}

// DESPUÉS (activo):
<div className="mt-6">
  <p className="text-center text-gray-500 text-sm mb-4">
    O inicia sesión con
  </p>
  <div className="flex justify-center space-x-4">
    <button 
      type="button"
      onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
    >
      {/* SVG de Google */}
    </button>
  </div>
  <p className="text-center text-xs text-gray-500 mt-3">
    Login rápido con Google
  </p>
</div>
```

### Paso 3: Configurar Credenciales Google

1. Ve a https://console.cloud.google.com/
2. Crea proyecto "FerreAI"
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega URLs autorizadas:
   - `http://localhost:3000`
   - `http://localhost:3000/api/auth/callback/google`
6. Copia Client ID y Secret al `.env`:

```env
GOOGLE_CLIENT_ID="tu_client_id_aqui"
GOOGLE_CLIENT_SECRET="tu_client_secret_aqui"
```

### Paso 4: Reiniciar Servidor

```bash
npm run dev
```

---

## 🧪 Testing del Flujo

### Test 1: Usuario Nuevo
```
1. Ve a http://localhost:3000/login
2. Click en botón Google
3. Inicia sesión con Google (email que NO existe en BD)
4. ✅ Debería crear automáticamente:
   - Company
   - Branch
   - User (tú como ADMIN)
   - Categoría default
5. ✅ Redirige a /dashboard
6. ✅ Puedes usar el sistema completo
```

### Test 2: Usuario Existente
```
1. Registra un usuario manualmente primero
2. Ve a login y usa Google con el MISMO email
3. ✅ Debería hacer login normalmente
4. ✅ NO crea nueva Company (usa la existente)
```

### Test 3: Usuario Inactivo
```
1. Desactiva un usuario en BD (isActive = false)
2. Intenta login con Google usando ese email
3. ✅ Debería rechazar el login
```

---

## 📊 Comparación de Flujos

| Aspecto | Auto-Registro | Registro Manual |
|---------|---------------|-----------------|
| **UX** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐ Regular |
| **Conversión** | ⭐⭐⭐⭐⭐ Alta | ⭐⭐ Baja |
| **Control** | ⭐⭐⭐ Medio | ⭐⭐⭐⭐⭐ Total |
| **Seguridad** | ⭐⭐⭐⭐ Buena | ⭐⭐⭐⭐⭐ Excelente |
| **Fricción** | ⭐⭐⭐⭐⭐ Mínima | ⭐⭐ Alta |
| **Mejor para** | SaaS B2C | B2B Privado |

---

## 🔒 Consideraciones de Seguridad

### Con Auto-Registro

**Protecciones incluidas**:
- ✅ Solo emails verificados por Google
- ✅ Plan FREE con límites (100 productos, 1 sucursal)
- ✅ Trial de 14 días
- ✅ Rate limiting (ver archivo `RATE-LIMITING.md`)
- ✅ No se puede crear múltiples cuentas con mismo email

**Riesgos**:
- ⚠️ Usuarios bot/spam pueden registrarse
- ⚠️ Costo de almacenamiento para cuentas inactivas

**Mitigaciones**:
```typescript
// Agregar en el callback:

// 1. Límite de registros por IP
// 2. Verificación de email adicional
// 3. CAPTCHA en registro
// 4. Eliminar cuentas inactivas después de 30 días
// 5. Bloquear dominios de email temporales
```

---

## 💰 Modelo de Negocio

### Funnel de Conversión Esperado

```
1000 visitantes web
  ↓ 40% registran con Google (400)
  ↓ 20% activan cuenta (80)
  ↓ 10% usan >1 semana (8)
  ↓ 30% pagan plan PRO (2-3 clientes pagos)
```

### Con Auto-Registro OAuth:
- ✅ Más registros (menos fricción)
- ✅ Conversión más rápida
- ✅ Menor abandono

### Sin OAuth / Registro Manual:
- ❌ Menos registros (más fricción)
- ❌ Mayor abandono
- ❌ Más soporte necesario

---

## 🎯 Recomendación Final

### Para FerreAI (SaaS para ferreterías):

**IMPLEMENTAR AUTO-REGISTRO CON OAUTH** ⭐

**Razones**:
1. Competencia usa OAuth (todos los SaaS modernos)
2. Clientes esperan login rápido
3. Plan FREE limita riesgo
4. Más conversiones = más clientes potenciales
5. Puedes agregar validación después

**Timeline sugerido**:
- Semana 1: Implementar auto-registro básico
- Semana 2: Testing completo
- Semana 3: Agregar rate limiting
- Semana 4: Monitorear métricas
- Semana 5+: Optimizar según datos

---

## 📝 Checklist de Implementación

- [ ] Modificar callback en `auth.ts`
- [ ] Agregar lógica de auto-registro
- [ ] Crear transacción para Company + User + Branch
- [ ] Descomentar botones OAuth en `login/page.tsx`
- [ ] Configurar Google Cloud Console
- [ ] Agregar credenciales a `.env`
- [ ] Testing con usuarios nuevos
- [ ] Testing con usuarios existentes
- [ ] Agregar rate limiting
- [ ] Monitorear registros spam
- [ ] Configurar limpieza de cuentas inactivas

---

## 📚 Referencias

- [NextAuth OAuth Docs](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 RFC](https://oauth.net/2/)

---

**Estado**: PENDIENTE DE DECISIÓN  
**Próximos pasos**: RIGO decide cuándo implementar  
**Estimado de tiempo**: 2-3 horas de desarrollo + testing
