-- =====================================================
-- SISTEMA DE SUSCRIPCIONES Y PLANES
-- =====================================================

-- 1. Tabla de configuración de planes (editable por super admin)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Identificador del plan
  plan_code VARCHAR(20) NOT NULL UNIQUE, -- 'FREE', 'PRO', 'ENTERPRISE'
  plan_name VARCHAR(50) NOT NULL,
  
  -- Precios
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2) NOT NULL,
  annual_discount_percent INTEGER DEFAULT 0, -- Porcentaje de descuento anual
  
  -- Límites
  max_branches INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_products INTEGER,
  max_storage_mb INTEGER,
  
  -- Características (JSON)
  features JSONB, -- {"transfers": true, "api": false, "support": "email"}
  
  -- Trial
  trial_days INTEGER DEFAULT 0,
  
  -- Visualización
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false, -- Badge "Más Popular"
  
  -- Metadatos
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- 3. Trigger para updated_at
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

-- 4. Insertar planes iniciales (basados en SICARX)
INSERT INTO subscription_plans (
  plan_code,
  plan_name,
  monthly_price,
  annual_price,
  annual_discount_percent,
  max_branches,
  max_users,
  max_products,
  max_storage_mb,
  features,
  trial_days,
  display_order,
  is_popular,
  description
) VALUES 
(
  'FREE',
  'Plan Gratuito',
  0.00,
  0.00,
  0,
  1,
  3,
  100,
  100,
  '{"transfers": false, "api": false, "support": "email", "reports": "basic"}'::jsonb,
  30, -- 30 días de prueba
  1,
  false,
  'Perfecto para empezar tu negocio'
),
(
  'PRO',
  'Plan Profesional',
  399.00,
  3999.00,
  16, -- 16% de descuento = ahorra $788
  5,
  10,
  1000,
  1000,
  '{"transfers": true, "api": false, "support": "priority", "reports": "advanced", "multi_branch": true}'::jsonb,
  0,
  2,
  true, -- Más popular
  'Para negocios en crecimiento con múltiples ubicaciones'
),
(
  'ENTERPRISE',
  'Plan Empresarial',
  1299.00,
  12999.00,
  16,
  999999, -- Ilimitado (representado como número grande)
  999999,
  999999,
  999999,
  '{"transfers": true, "api": true, "support": "24/7", "reports": "custom", "multi_branch": true, "custom_features": true, "dedicated_support": true}'::jsonb,
  0,
  3,
  false,
  'Solución completa para empresas grandes'
)
ON CONFLICT (plan_code) DO NOTHING;

-- 5. Actualizar tabla subscriptions con billing_period
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20) DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual'));

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 6. Calcular trial_ends_at para suscripciones FREE existentes
UPDATE subscriptions
SET 
  trial_ends_at = created_at + INTERVAL '30 days',
  billing_period = 'monthly'
WHERE plan_type = 'FREE' AND trial_ends_at IS NULL;

-- 7. Tabla de historial de pagos (para tracking)
CREATE TABLE IF NOT EXISTS payment_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Información del pago
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  billing_period VARCHAR(20) NOT NULL,
  plan_code VARCHAR(20) NOT NULL,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Método de pago (dummy por ahora)
  payment_method VARCHAR(20) DEFAULT 'card',
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  
  -- Stripe (futuro)
  stripe_payment_intent_id VARCHAR(255),
  
  -- Metadatos
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_company ON payment_history(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- 8. Verificar todo
SELECT 
  plan_code,
  plan_name,
  monthly_price,
  annual_price,
  max_branches,
  max_users,
  is_popular
FROM subscription_plans
ORDER BY display_order;

-- 9. Ver suscripciones actuales
SELECT 
  c.name as empresa,
  s.plan_type,
  s.billing_period,
  s.max_branches,
  s.trial_ends_at,
  CASE 
    WHEN s.trial_ends_at > NOW() THEN CONCAT('Trial: ', EXTRACT(DAY FROM (s.trial_ends_at - NOW())), ' días restantes')
    WHEN s.trial_ends_at <= NOW() THEN 'Trial expirado'
    ELSE 'Sin trial'
  END as trial_status
FROM subscriptions s
JOIN companies c ON s.company_id = c.id;
