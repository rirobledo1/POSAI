# 🚀 INSTALACIÓN RÁPIDA - Copiar y Pegar

## Opción 1: Supabase SQL Editor (MÁS FÁCIL)

1. Ve a: https://supabase.com/dashboard/project/vvvyxcigzqifnxdpagag/sql/new

2. Copia y pega ESTE SQL COMPLETO:

```sql
-- =====================================================
-- SISTEMA DE SUSCRIPCIONES Y PLANES
-- =====================================================

-- 1. Tabla de configuración de planes
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plan_code VARCHAR(20) NOT NULL UNIQUE,
  plan_name VARCHAR(50) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2) NOT NULL,
  annual_discount_percent INTEGER DEFAULT 0,
  max_branches INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_products INTEGER,
  max_storage_mb INTEGER,
  features JSONB,
  trial_days INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- 2. Trigger
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- 3. Insertar planes (SICARX style)
INSERT INTO subscription_plans (
  plan_code, plan_name, monthly_price, annual_price, annual_discount_percent,
  max_branches, max_users, max_products, max_storage_mb, features,
  trial_days, display_order, is_popular, description
) VALUES 
('FREE', 'Plan Gratuito', 0.00, 0.00, 0, 1, 3, 100, 100,
 '{"transfers": false, "api": false, "support": "email", "reports": "basic"}'::jsonb,
 30, 1, false, 'Perfecto para empezar tu negocio'),
('PRO', 'Plan Profesional', 399.00, 3999.00, 16, 5, 10, 1000, 1000,
 '{"transfers": true, "api": false, "support": "priority", "reports": "advanced", "multi_branch": true}'::jsonb,
 0, 2, true, 'Para negocios en crecimiento con múltiples ubicaciones'),
('ENTERPRISE', 'Plan Empresarial', 1299.00, 12999.00, 16, 999999, 999999, 999999, 999999,
 '{"transfers": true, "api": true, "support": "24/7", "reports": "custom", "multi_branch": true, "custom_features": true, "dedicated_support": true}'::jsonb,
 0, 3, false, 'Solución completa para empresas grandes')
ON CONFLICT (plan_code) DO NOTHING;

-- 4. Actualizar subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly';

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

UPDATE subscriptions
SET 
  trial_ends_at = created_at + INTERVAL '30 days',
  billing_period = 'monthly'
WHERE plan_type = 'FREE' AND trial_ends_at IS NULL;

-- 5. Tabla de pagos
CREATE TABLE IF NOT EXISTS payment_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  billing_period VARCHAR(20) NOT NULL,
  plan_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20) DEFAULT 'card',
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  stripe_payment_intent_id VARCHAR(255),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_company ON payment_history(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- 6. VERIFICAR
SELECT plan_code, plan_name, monthly_price, annual_price, max_branches, max_users, is_popular
FROM subscription_plans ORDER BY display_order;
```

3. Click **RUN** ▶️

---

## Opción 2: PowerShell Manual

```powershell
# 1. Ejecutar SQL
# (Copia el SQL de arriba y pégalo en Supabase)

# 2. Limpiar cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 3. Regenerar Prisma
npx prisma generate

# 4. Reiniciar servidor
npm run dev
```

---

## ✅ Verificación

Después de ejecutar, deberías ver en Supabase:

```
plan_code | plan_name           | monthly_price | annual_price
----------|---------------------|---------------|-------------
FREE      | Plan Gratuito       | 0.00          | 0.00
PRO       | Plan Profesional    | 399.00        | 3999.00
ENTERPRISE| Plan Empresarial    | 1299.00       | 12999.00
```

---

**¿Ejecutaste el SQL en Supabase?** Avísame cuando esté listo! 🚀
