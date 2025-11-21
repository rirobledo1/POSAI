-- =====================================================
-- MIGRACIÓN DE PLANES - VERSIÓN CORREGIDA (ID FIX)
-- =====================================================

-- 1. Verificar y corregir la columna ID
DO $$ 
BEGIN
  -- Verificar si la columna id tiene default
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'id' 
    AND column_default IS NOT NULL
  ) THEN
    -- Configurar el default para ID
    ALTER TABLE subscription_plans 
    ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    
    RAISE NOTICE 'Default de ID configurado correctamente';
  END IF;
END $$;

-- 2. Agregar nuevas columnas si no existen
DO $$ 
BEGIN
  -- Columnas de precios MXN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'monthly_price_mxn') THEN
    ALTER TABLE subscription_plans ADD COLUMN monthly_price_mxn DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Columna monthly_price_mxn agregada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'annual_price_mxn') THEN
    ALTER TABLE subscription_plans ADD COLUMN annual_price_mxn DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Columna annual_price_mxn agregada';
  END IF;

  -- Columnas de precios USD
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'monthly_price_usd') THEN
    ALTER TABLE subscription_plans ADD COLUMN monthly_price_usd DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Columna monthly_price_usd agregada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'annual_price_usd') THEN
    ALTER TABLE subscription_plans ADD COLUMN annual_price_usd DECIMAL(10, 2) DEFAULT 0;
    RAISE NOTICE 'Columna annual_price_usd agregada';
  END IF;

  -- Cambiar features a JSONB si no lo es
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'features' 
    AND data_type = 'json'
  ) THEN
    ALTER TABLE subscription_plans ALTER COLUMN features TYPE JSONB USING features::jsonb;
    RAISE NOTICE 'Columna features cambiada a JSONB';
  END IF;

  -- Asegurar que features no sea NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' 
    AND column_name = 'features' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE subscription_plans ALTER COLUMN features SET DEFAULT '{}'::jsonb;
    UPDATE subscription_plans SET features = '{}'::jsonb WHERE features IS NULL;
    ALTER TABLE subscription_plans ALTER COLUMN features SET NOT NULL;
    RAISE NOTICE 'Columna features configurada como NOT NULL';
  END IF;
END $$;

-- 3. Migrar datos de columnas viejas a nuevas (si existen)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_plans' AND column_name = 'monthly_price') THEN
    UPDATE subscription_plans 
    SET 
      monthly_price_mxn = COALESCE(monthly_price, 0),
      annual_price_mxn = COALESCE(annual_price, 0),
      monthly_price_usd = ROUND(COALESCE(monthly_price, 0) / 20, 2),
      annual_price_usd = ROUND(COALESCE(annual_price, 0) / 20, 2)
    WHERE monthly_price_mxn = 0 OR monthly_price_mxn IS NULL;
    
    RAISE NOTICE 'Datos migrados de columnas viejas';
  END IF;
END $$;

-- 4. Crear índice para display_order si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'subscription_plans' 
    AND indexname = 'idx_subscription_plans_order'
  ) THEN
    CREATE INDEX idx_subscription_plans_order ON subscription_plans(display_order);
    RAISE NOTICE 'Índice idx_subscription_plans_order creado';
  END IF;
END $$;

-- 5. Crear tabla super_admins si no existe
CREATE TABLE IF NOT EXISTS super_admins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{"manage_plans": true, "view_all_companies": true, "system_settings": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_super_admins_user ON super_admins(user_id);

-- 6. Trigger para super_admins
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

-- 7. Actualizar constraint de plan_type en subscriptions
DO $$
BEGIN
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
  ALTER TABLE subscriptions 
  ADD CONSTRAINT subscriptions_plan_type_check 
  CHECK (plan_type IN ('FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE'));
  
  RAISE NOTICE 'Constraint de plan_type actualizado';
END $$;

-- 8. Añadir billing_period si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN billing_period VARCHAR(10) DEFAULT 'monthly' 
    CHECK (billing_period IN ('monthly', 'annual'));
    
    RAISE NOTICE 'Columna billing_period agregada';
  END IF;
END $$;

-- 9. ELIMINAR planes existentes para reinsertar con IDs correctos
DELETE FROM subscription_plans WHERE plan_code IN ('FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE');

-- 10. INSERTAR los 4 planes (ahora el ID se generará automáticamente)
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
  1,
  2,
  NULL,
  100,
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
  14
),

-- PLAN PRO
(
  'PRO',
  'Plan Profesional',
  799.00,
  8068.32,
  40.00,
  403.20,
  16,
  5,
  999999,
  NULL,
  5120,
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
  true,
  true,
  'Incluye cotizaciones completas (en línea, presencial y WhatsApp)',
  14
),

-- PLAN PRO PLUS
(
  'PRO_PLUS',
  'Plan Pro Plus',
  1499.00,
  15109.92,
  75.00,
  756.00,
  16,
  10,
  999999,
  NULL,
  20480,
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
  2999.00,
  30229.92,
  150.00,
  1512.00,
  16,
  999999,
  999999,
  NULL,
  NULL,
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
  30
);

-- 11. Verificar que se insertaron correctamente
SELECT 
  plan_code,
  plan_name,
  monthly_price_mxn,
  annual_price_mxn,
  max_branches,
  max_users,
  is_popular,
  display_order
FROM subscription_plans
ORDER BY display_order;

-- 12. Mostrar características
SELECT 
  plan_code,
  plan_name,
  jsonb_pretty(features) as caracteristicas
FROM subscription_plans
ORDER BY display_order;

-- 13. Resumen final
SELECT 
  '✅ MIGRACIÓN COMPLETADA' as status,
  COUNT(*) as total_planes
FROM subscription_plans;
