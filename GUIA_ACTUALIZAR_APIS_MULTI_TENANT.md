# 🔒 GUÍA: ACTUALIZAR APIs PARA MULTI-TENANT

## ⚠️ REGLA DE ORO

**NUNCA** hacer una consulta sin filtrar por `companyId` cuando trabajes con datos de usuarios.

---

## 📋 PATRÓN GENERAL

### 1. Importar el helper

```typescript
import { getCompanyIdFromSession, withCompanyFilter } from '@/lib/session-helpers';
```

### 2. Obtener companyId al inicio

```typescript
export async function GET(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 Obtener companyId
    const companyId = await getCompanyIdFromSession();
    
    // ... resto del código
  } catch (error) {
    // ...
  }
}
```

### 3. Filtrar SIEMPRE por companyId

#### **Opción A: Con Prisma**

```typescript
// ❌ ANTES (INSEGURO)
const products = await prisma.product.findMany({
  where: { active: true }
});

// ✅ AHORA (SEGURO)
const products = await prisma.product.findMany({
  where: { 
    companyId,  // ← CRÍTICO
    active: true 
  }
});
```

#### **Opción B: Con SQL directo**

```typescript
// ❌ ANTES (INSEGURO)
const query = `
  SELECT * FROM products 
  WHERE active = true
`;

// ✅ AHORA (SEGURO)
const query = `
  SELECT * FROM products 
  WHERE company_id = $1  
  AND active = true
`;
const result = await pool.query(query, [companyId]);
```

#### **Opción C: Con helper**

```typescript
// ✅ Usar helper para crear filtros automáticos
const where = await withCompanyFilter({ active: true });
// Resultado: { companyId: "xxx", active: true }

const products = await prisma.product.findMany({ where });
```

### 4. Al CREAR registros, agregar companyId

```typescript
// ❌ ANTES (INSEGURO)
const product = await prisma.product.create({
  data: { name, price }
});

// ✅ AHORA (SEGURO)
const product = await prisma.product.create({
  data: { 
    name, 
    price,
    companyId  // ← CRÍTICO
  }
});
```

### 5. Al ACTUALIZAR, verificar ownership

```typescript
// ❌ ANTES (INSEGURO)
const product = await prisma.product.update({
  where: { id: productId },
  data: { name }
});

// ✅ AHORA (SEGURO)
const product = await prisma.product.update({
  where: { 
    id: productId,
    companyId  // ← CRÍTICO
  },
  data: { name }
});
```

### 6. Al ELIMINAR, verificar ownership

```typescript
// ❌ ANTES (INSEGURO)
await prisma.product.delete({
  where: { id: productId }
});

// ✅ AHORA (SEGURO)
await prisma.product.delete({
  where: { 
    id: productId,
    companyId  // ← CRÍTICO
  }
});
```

---

## 📁 LISTA DE APIs A ACTUALIZAR

### ✅ Ya actualizadas:
- [x] `/api/products` (GET, POST)

### ❌ Pendientes de actualizar:

#### **Alta Prioridad:**
- [ ] `/api/products/[id]` (GET, PUT, DELETE)
- [ ] `/api/customers` (GET, POST)
- [ ] `/api/customers/[id]` (GET, PUT, DELETE)
- [ ] `/api/sales` (GET, POST)
- [ ] `/api/sales/[id]` (GET, PUT, DELETE)
- [ ] `/api/dashboard` (GET - estadísticas)

#### **Media Prioridad:**
- [ ] `/api/categories` (GET, POST)
- [ ] `/api/inventory` (GET, POST)
- [ ] `/api/reports/*` (Todos los reportes)

#### **Baja Prioridad:**
- [ ] `/api/settings` (GET, PUT)
- [ ] `/api/users` (GET - listar usuarios de la compañía)

---

## 🔍 CÓMO ENCONTRAR APIs SIN PROTECCIÓN

Busca en tu código:

```bash
# Buscar consultas sin companyId
grep -r "prisma\\..*\\.findMany" --include="*.ts" --include="*.tsx"
grep -r "prisma\\..*\\.findFirst" --include="*.ts" --include="*.tsx"

# O en Windows con PowerShell:
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "prisma\\..*\\.findMany"
```

---

## ⚠️ ERRORES COMUNES

### Error 1: Olvidar filtrar en GET

```typescript
// ❌ MAL - Devuelve productos de TODAS las compañías
const products = await prisma.product.findMany();

// ✅ BIEN
const products = await prisma.product.findMany({
  where: { companyId }
});
```

### Error 2: No agregar companyId al crear

```typescript
// ❌ MAL - Producto sin compañía
const product = await prisma.product.create({
  data: { name: "Producto" }
});

// ✅ BIEN
const product = await prisma.product.create({
  data: { 
    name: "Producto",
    companyId
  }
});
```

### Error 3: Actualizar sin verificar ownership

```typescript
// ❌ MAL - Puede actualizar productos de otras compañías
const product = await prisma.product.update({
  where: { id: productId },
  data: { name }
});

// ✅ BIEN
const product = await prisma.product.update({
  where: { 
    id: productId,
    companyId  // Verifica que pertenezca a la compañía
  },
  data: { name }
});
```

---

## 🧪 TESTS DE SEGURIDAD

Para cada API, verificar:

1. **Test 1:** Usuario de Compañía A no puede ver datos de Compañía B
2. **Test 2:** Usuario de Compañía A no puede crear datos en Compañía B
3. **Test 3:** Usuario de Compañía A no puede modificar datos de Compañía B
4. **Test 4:** Usuario de Compañía A no puede eliminar datos de Compañía B

---

## 📝 CHECKLIST POR API

Para cada archivo de API, verificar:

- [ ] Importa `getCompanyIdFromSession`
- [ ] Obtiene `companyId` al inicio
- [ ] GET filtra por `companyId`
- [ ] POST agrega `companyId`
- [ ] PUT verifica `companyId`
- [ ] DELETE verifica `companyId`
- [ ] Tests de seguridad pasados

---

## 🚀 SIGUIENTE PASO

Una vez actualizadas todas las APIs críticas, continuar con:
- **Fase 4:** Gestión de usuarios
- **Fase 5:** Planes y facturación
- **Fase 6:** UI/UX

---

**¿Necesitas ayuda para actualizar una API específica?** 
Comparte el código y te ayudo a aplicar el patrón correctamente.
