-- =====================================================
-- SISTEMA DE PLANES CON NUEVOS PRECIOS Y CARACTERÍSTICAS
-- =====================================================

-- 1. Crear tabla de configuración de planes (editable por super admin)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Identificador del plan
  plan_code VARCHAR(20) NOT NULL UNIQUE, -- 'FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE'
  plan_name VARCHAR(50) NOT NULL,
  
  -- Precios en MXN
  monthly_price_mxn DECIMAL(10, 2) NOT NULL DEFAULT 0,
  annual_price_mxn DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Precios en USD (para referencia/stripe)
  monthly_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
  annual_price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Descuento anual
  annual_discount_percent INTEGER DEFAULT 16, -- 16% descuento anual
  
  -- Límites
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 2,
  max_products INTEGER, -- NULL = ilimitado
  max_storage_mb INTEGER, -- NULL = ilimitado
  
  -- Características específicas (JSON)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Visualización
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false, -- Badge "Más Popular"
  description TEXT,
  
  -- Trial
  trial_days INTEGER DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_order ON subscription_plans(display_order);

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

-- 4. Insertar los 4 planes con los nuevos precios y características
INSERT INTO subscription_plans (
  plan_code, 
  plan_name, 
  monthly_price_mxn, 
  annual_price_mxn,
  monthly_price_usd,
  annual_price_usd,
  annual_discount_percent,
  max_branches, 
  max_users, 
  max_products,
  max_storage_mb,
  features,
  display_order,
  is_popular,
  is_active,
  description,
  trial_days
) VALUES 
-- PLAN FREE
(
  'FREE',
  'Plan Gratuito',
  0.00,
  0.00,
  0.00,
  0.00,
  0,
  1, -- 1 sucursal
  2, -- 2 usuarios
  NULL, -- productos ilimitados
  100, -- 100 MB de almacenamiento
  '{
    "inventory": true,
    "sales": true,
    "basic_reports": true,
    "quotations_basic": false,
    "quotations_online": false,
    "quotations_whatsapp": false,
    "quotations_inperson": false,
    "sales_whatsapp": false,
    "ai_sales_agents": false,
    "ai_anomaly_detection": false,
    "ai_theft_alerts": false,
    "ai_demand_prediction": false,
    "ai_smart_reports": false,
    "priority_support": false,
    "custom_branding": false,
    "api_access": false,
    "advanced_analytics": false
  }'::jsonb,
  1,
  false,
  true,
  'Perfecto para comenzar y probar el sistema',
  14 -- 14 días de prueba
),

-- PLAN PRO
(
  'PRO',
  'Plan Profesional',
  799.00, -- $799 MXN/mes
  8068.32, -- $799 * 12 * 0.84 (16% descuento)
  40.00, -- ~$40 USD/mes
  403.20, -- ~$40 * 12 * 0.84
  16,
  5, -- 5 sucursales
  999999, -- usuarios ilimitados
  NULL, -- productos ilimitados
  5120, -- 5 GB de almacenamiento
  '{
    "inventory": true,
    "sales": true,
    "basic_reports": true,
    "advanced_reports": true,
    "quotations_basic": true,
    "quotations_online": true,
    "quotations_whatsapp": true,
    "quotations_inperson": true,
    "sales_whatsapp": false,
    "ai_sales_agents": false,
    "ai_anomaly_detection": false,
    "ai_theft_alerts": false,
    "ai_demand_prediction": false,
    "ai_smart_reports": false,
    "priority_support": false,
    "custom_branding": false,
    "api_access": false,
    "advanced_analytics": true,
    "transfers": true,
    "multi_currency": true
  }'::jsonb,
  2,
  true, -- Plan más popular
  true,
  'Incluye cotizaciones completas (en línea, presencial y WhatsApp)',
  14
),

-- PLAN PRO PLUS
(
  'PRO_PLUS',
  'Plan Pro Plus',
  1499.00, -- $1,499 MXN/mes
  15109.92, -- $1,499 * 12 * 0.84
  75.00, -- ~$75 USD/mes
  756.00, -- ~$75 * 12 * 0.84
  16,
  10, -- 10 sucursales
  999999, -- usuarios ilimitados
  NULL, -- productos ilimitados
  20480, -- 20 GB de almacenamiento
  '{
    "inventory": true,
    "sales": true,
    "basic_reports": true,
    "advanced_reports": true,
    "quotations_basic": true,
    "quotations_online": true,
    "quotations_whatsapp": true,
    "quotations_inperson": true,
    "sales_whatsapp": true,
    "ai_sales_agents": true,
    "ai_anomaly_detection": false,
    "ai_theft_alerts": false,
    "ai_demand_prediction": false,
    "ai_smart_reports": true,
    "priority_support": true,
    "custom_branding": false,
    "api_access": true,
    "advanced_analytics": true,
    "transfers": true,
    "multi_currency": true,
    "automated_notifications": true,
    "custom_workflows": true
  }'::jsonb,
  3,
  false,
  true,
  'Ventas por WhatsApp + Agentes IA para ventas automatizadas',
  14
),

-- PLAN ENTERPRISE
(
  'ENTERPRISE',
  'Plan Enterprise',
  2999.00, -- $2,999 MXN/mes
  30229.92, -- $2,999 * 12 * 0.84
  150.00, -- ~$150 USD/mes
  1512.00, -- ~$150 * 12 * 0.84
  16,
  999999, -- sucursales ilimitadas
  999999, -- usuarios ilimitados
  NULL, -- productos ilimitados
  NULL, -- almacenamiento ilimitado
  '{
    "inventory": true,
    "sales": true,
    "basic_reports": true,
    "advanced_reports": true,
    "quotations_basic": true,
    "quotations_online": true,
    "quotations_whatsapp": true,
    "quotations_inperson": true,
    "sales_whatsapp": true,
    "ai_sales_agents": true,
    "ai_anomaly_detection": true,
    "ai_theft_alerts": true,
    "ai_demand_prediction": true,
    "ai_smart_reports": true,
    "ai_inventory_optimization": true,
    "ai_price_suggestions": true,
    "priority_support": true,
    "dedicated_support": true,
    "custom_branding": true,
    "white_label": true,
    "api_access": true,
    "advanced_analytics": true,
    "transfers": true,
    "multi_currency": true,
    "automated_notifications": true,
    "custom_workflows": true,
    "sla_guarantee": true,
    "custom_integrations": true,
    "onboarding_support": true
  }'::jsonb,
  4,
  false,
  true,
  'IA completa: Detección de anomalías, alertas de robos, predicción de demanda y más',
  30 -- 30 días de prueba
)
ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  monthly_price_mxn = EXCLUDED.monthly_price_mxn,
  annual_price_mxn = EXCLUDED.annual_price_mxn,
  monthly_price_usd = EXCLUDED.monthly_price_usd,
  annual_price_usd = EXCLUDED.annual_price_usd,
  annual_discount_percent = EXCLUDED.annual_discount_percent,
  max_branches = EXCLUDED.max_branches,
  max_users = EXCLUDED.max_users,
  max_products = EXCLUDED.max_products,
  max_storage_mb = EXCLUDED.max_storage_mb,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_popular = EXCLUDED.is_popular,
  description = EXCLUDED.description,
  trial_days = EXCLUDED.trial_days,
  updated_at = NOW();

-- 5. Crear tabla para usuarios super admin (para gestionar planes)
CREATE TABLE IF NOT EXISTS super_admins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{"manage_plans": true, "view_all_companies": true, "system_settings": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_super_admins_user ON super_admins(user_id);

-- 6. Trigger para super_admins updated_at
CREATE OR REPLACE FUNCTION update_super_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_super_admins_updated_at ON super_admins;
CREATE TRIGGER trigger_update_super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_super_admins_updated_at();

-- 7. Actualizar la tabla subscriptions para soportar el nuevo plan PRO_PLUS
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_type_check 
CHECK (plan_type IN ('FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE'));

-- 8. Añadir columna billing_period a subscriptions si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN billing_period VARCHAR(10) DEFAULT 'monthly' 
    CHECK (billing_period IN ('monthly', 'annual'));
  END IF;
END $$;

-- 9. Verificar planes creados
SELECT 
  plan_code,
  plan_name,
  monthly_price_mxn,
  annual_price_mxn,
  max_branches,
  max_users,
  is_popular,
  display_order,
  description
FROM subscription_plans
ORDER BY display_order;

-- 10. Ver features de cada plan (en formato legible)
SELECT 
  plan_code,
  plan_name,
  jsonb_pretty(features) as caracteristicas
FROM subscription_plans
ORDER BY display_order;

-- 11. Verificar empresas y sus suscripciones actuales
SELECT 
  c.name as empresa,
  s.plan_type as plan_actual,
  s.billing_period as periodo_facturacion,
  s.max_branches as sucursales_permitidas,
  COUNT(DISTINCT b.id) as sucursales_usadas,
  s.status as estado,
  s.current_period_end as proxima_facturacion
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id
LEFT JOIN branches b ON c.id = b.company_id
GROUP BY c.id, c.name, s.plan_type, s.billing_period, s.max_branches, s.status, s.current_period_end
ORDER BY c.name;
