# 🎯 SOLUCIÓN COMPLETA: Plan PRO para El Tornillo

## 🚨 Problema
El sistema muestra **"Sucursales: 1 de 1"** aunque cambiaste a PRO porque:
1. ❌ La tabla `subscriptions` no existe en la BD
2. ❌ Prisma no tiene el modelo `Subscription`

---

## ✅ SOLUCIÓN RÁPIDA (3 pasos - 2 minutos)

### Paso 1: Crear tabla en Supabase

1. Ve a: https://supabase.com/dashboard/project/vvvyxcigzqifnxdpagag/sql/new

2. Pega este SQL completo y dale **RUN** ▶️:

```sql
-- Crear tabla subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 3,
  max_products INTEGER,
  max_storage_mb INTEGER,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_type);

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Crear suscripción para todas las empresas
INSERT INTO subscriptions (company_id, plan_type, max_branches, max_users, status)
SELECT id, 'FREE', 1, 3, 'active'
FROM companies
ON CONFLICT (company_id) DO NOTHING;

-- Actualizar El Tornillo a PRO
UPDATE subscriptions
SET 
  plan_type = 'PRO',
  max_branches = 5,
  max_users = 10,
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month'
WHERE company_id = (SELECT id FROM companies WHERE name = 'Ferretería El Tornillo');

-- Verificar resultado
SELECT 
  c.name as empresa,
  s.plan_type as plan,
  s.max_branches as sucursales,
  s.max_users as usuarios,
  s.status
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
ORDER BY c.name;
```

✅ Si ves el resultado con **"PRO | 5 | 10"**, ¡perfecto!

---

### Paso 2: Regenerar Prisma Client

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
npx prisma generate
```

Deberías ver:
```
✔ Generated Prisma Client
```

---

### Paso 3: Reiniciar servidor y recargar

1. **Detén el servidor** (Ctrl + C en la terminal donde corre)
2. **Reinicia**: `npm run dev`
3. **Recarga la página**: F5 o Ctrl + R
4. **Verifica**: Settings → Gestión de Sucursales

Ahora deberías ver:
- ✨ **"Sucursales: 1 de 5"**
- ✨ Badge **"Plan PRO"**
- ✨ Botón **"Crear Sucursal"** habilitado

---

## 🤖 SOLUCIÓN AUTOMÁTICA (Opcional)

Si prefieres script automático, ejecuta:

```bash
setup-subscriptions-completo.bat
```

Esto hace:
1. ✅ Crea tabla subscriptions
2. ✅ Regenera Prisma
3. ✅ Actualiza a PRO

---

## 📋 ¿Qué se actualizó?

### 1. Base de Datos (Supabase)
```
Nueva tabla: subscriptions
├── id (UUID)
├── company_id (FK → companies)
├── plan_type (FREE/PRO/ENTERPRISE)
├── max_branches (límite de sucursales)
├── max_users (límite de usuarios)
└── status (active/inactive/cancelled)
```

### 2. Prisma Schema (`schema.prisma`)
```prisma
model Subscription {
  id           String   @id @default(uuid())
  companyId    String   @unique
  planType     SubscriptionPlan
  maxBranches  Int
  maxUsers     Int
  ...
}

enum SubscriptionPlan {
  FREE
  PRO
  ENTERPRISE
}
```

### 3. Cambios para El Tornillo
```
Antes:
├── Plan: FREE
├── Sucursales: 1
└── Usuarios: 3

Después:
├── Plan: PRO ✨
├── Sucursales: 5 ✨
└── Usuarios: 10 ✨
```

---

## 🔍 Verificar que funcionó

### En Supabase SQL:
```sql
SELECT 
  c.name,
  s.plan_type,
  s.max_branches,
  s.max_users,
  s.status
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
WHERE c.name = 'Ferretería El Tornillo';
```

Resultado esperado:
```
name                    | plan_type | max_branches | max_users | status
------------------------|-----------|--------------|-----------|--------
Ferretería El Tornillo  | PRO       | 5            | 10        | active
```

### En la UI:
1. **Header superior derecho** → Ver selector de sucursal
2. **Settings → Gestión de Sucursales**:
   - Texto: "Sucursales: 1 de 5"
   - Badge: "Plan PRO"
   - Botón "Crear Sucursal" habilitado
3. **Crear nueva sucursal** → Debería funcionar sin error

---

## 📊 Comparación de Planes

| Característica    | FREE  | PRO   | ENTERPRISE |
|-------------------|-------|-------|------------|
| **Sucursales**    | 1     | 5     | ∞          |
| **Usuarios**      | 3     | 10    | ∞          |
| **Productos**     | 100   | 1,000 | ∞          |
| **Almacenamiento**| 100MB | 1GB   | ∞          |
| **Soporte**       | Email | Chat  | Dedicado   |
| **Precio/mes**    | $0    | $29   | $99        |

---

## 🐛 Troubleshooting

### Error: "relation subscriptions already exists"
✅ **Esto es normal** - la tabla ya existe. Solo ejecuta:
```sql
UPDATE subscriptions
SET plan_type = 'PRO', max_branches = 5, max_users = 10
WHERE company_id = (SELECT id FROM companies WHERE name = 'Ferretería El Tornillo');
```

---

### Aún muestra "1 de 1"
Checklist de verificación:

1. ✅ **BD actualizada**:
   ```sql
   SELECT max_branches FROM subscriptions 
   WHERE company_id = (SELECT id FROM companies WHERE name = 'Ferretería El Tornillo');
   ```
   Debe devolver: **5**

2. ✅ **Prisma regenerado**:
   ```bash
   npx prisma generate
   ```

3. ✅ **Servidor reiniciado**:
   - Ctrl + C (detener)
   - `npm run dev` (reiniciar)

4. ✅ **Página recargada**:
   - Hard refresh: `Ctrl + Shift + R`
   - O cierra y abre nueva ventana

5. ✅ **Cache limpiado**:
   - F12 → Console
   - `localStorage.clear()`
   - Recargar

---

### Error en consola del navegador
Abre DevTools (F12) y busca:
- ❌ Errores rojos relacionados con subscriptions
- ❌ Errores de tipos TypeScript
- ✅ Si hay errores, comparte el mensaje

---

### El hook useBranchStore no carga límites
Verifica el archivo:
```typescript
// src/hooks/useBranchStore.ts
// Debe tener esta línea:
const { data: subscription } = useSWR(...)
```

Si no existe, avísame para actualizar el hook.

---

## 📝 Archivos Creados

Los scripts que creamos:

1. **`crear-tabla-subscriptions.sql`** - SQL completo para BD
2. **`crear-tabla-subscriptions.bat`** - Ejecutar SQL desde Windows
3. **`setup-subscriptions-completo.bat`** - Todo automático
4. **`CREAR-SUBSCRIPTIONS.md`** - Guía detallada
5. **`SOLUCION-PLAN-PRO.md`** - Esta guía (resumen completo)

---

## 🎯 Próximos Pasos

Una vez que veas **"Sucursales: 1 de 5"**:

1. ✨ Prueba crear una nueva sucursal
2. ✨ Asigna productos a cada sucursal
3. ✨ Continúa con **Fase 3: Inventario por Sucursal**

---

## 💡 Notas Importantes

- ⚡ La tabla `subscriptions` es **independiente** de `companies.plan`
- 🔄 La UI lee los límites desde `subscriptions`, no desde `companies`
- 🔐 Cada empresa tiene **UNA** suscripción (relación 1:1)
- 📊 Los límites se validan en el backend y frontend
- 💾 La selección de sucursal persiste en localStorage

---

## ✅ Checklist Final

Antes de continuar, verifica que TODO esté ✅:

- [ ] Tabla `subscriptions` existe en Supabase
- [ ] El Tornillo tiene plan PRO en la tabla
- [ ] Prisma Client regenerado
- [ ] Servidor reiniciado
- [ ] Página recargada
- [ ] UI muestra "1 de 5"
- [ ] Badge dice "Plan PRO"
- [ ] Botón crear habilitado

**Si todos están ✅, ¡estás listo para continuar con Fase 3!** 🚀

---

¿Necesitas ayuda con algún paso? ¡Avísame! 💪
