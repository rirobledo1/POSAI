# ✅ SOLUCIÓN CORREGIDA - Plan PRO

## 🚨 Problema Identificado

El error era por **incompatibilidad de tipos**:
- `companies.id` es tipo **TEXT** (cuid: `cm2abc...`)
- Intentábamos crear `subscriptions.company_id` como **UUID**

## ✅ SOLUCIÓN (3 pasos - 2 minutos)

### 📝 Paso 1: Ejecutar SQL Corregido

**Ve a:** https://supabase.com/dashboard/project/vvvyxcigzqifnxdpagag/sql/new

**Copia y pega este SQL (corregido para TEXT):**

```sql
-- Crear tabla subscriptions con company_id tipo TEXT
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_type);

-- Trigger auto-update
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Crear suscripciones FREE para todas las empresas
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

-- Verificar
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

**Click RUN** ▶️

**Resultado esperado:**
```
empresa                 | plan | sucursales | usuarios | status
------------------------|------|------------|----------|--------
Ferretería El Tornillo  | PRO  | 5          | 10       | active
```

---

### 🔧 Paso 2: Regenerar Prisma

```bash
npx prisma generate
```

Deberías ver: `✔ Generated Prisma Client`

---

### 🔄 Paso 3: Reiniciar y Recargar

```bash
# Detener servidor: Ctrl + C
# Reiniciar:
npm run dev
```

**En el navegador:** F5 o Ctrl + R

---

## ✨ Verificación de Éxito

### En la UI:
**Ve a:** Settings → Gestión de Sucursales

**Deberías ver:**
- ✅ **"Sucursales: 1 de 5"**
- ✅ Badge **"Plan PRO"**
- ✅ Botón **"Crear Sucursal"** habilitado

---

## 🔍 Verificar en BD (Opcional)

```sql
-- Ver tipo de datos de companies.id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' AND column_name = 'id';

-- Debe mostrar: data_type = 'text'

-- Ver suscripción de El Tornillo
SELECT * FROM subscriptions 
WHERE company_id = (SELECT id FROM companies WHERE name = 'Ferretería El Tornillo');
```

---

## 📋 Diferencias Clave (Lo que se corrigió)

### ❌ Antes (Error):
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,              -- ❌ UUID
  company_id UUID REFERENCES...     -- ❌ UUID
  ...
);
```

### ✅ Ahora (Correcto):
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,              -- ✅ TEXT
  company_id TEXT REFERENCES...     -- ✅ TEXT
  ...
);
```

**¿Por qué?** Porque Prisma usa `@default(cuid())` que genera IDs tipo TEXT como `cm2abc123...`

---

## 🐛 Si aún hay error

### Error: "duplicate key value"
✅ La tabla ya existe, solo ejecuta:
```sql
DROP TABLE IF EXISTS subscriptions CASCADE;
```
Y vuelve a ejecutar el SQL completo.

### Error: "relation does not exist"
✅ Verifica que la tabla `companies` existe:
```sql
SELECT * FROM companies LIMIT 1;
```

---

## 📁 Archivos Actualizados

- ✅ `crear-tabla-subscriptions-FIXED.sql` - SQL corregido
- ✅ `prisma/schema.prisma` - Tipo de ID corregido (TEXT/cuid)

---

## 🎯 Siguiente Paso

Una vez que veas **"Sucursales: 1 de 5"**:
1. ✅ Prueba crear una nueva sucursal
2. ✅ Continúa con Fase 3: Inventario por Sucursal

---

**¿Funcionó?** Avísame para continuar! 🚀
