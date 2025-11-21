-- =====================================================
-- CREAR TABLA SUBSCRIPTIONS (CORREGIDO PARA TEXT ID)
-- =====================================================

-- 1. Crear la tabla subscriptions con company_id tipo TEXT
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id TEXT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'FREE' CHECK (plan_type IN ('FREE', 'PRO', 'ENTERPRISE')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  
  -- Límites del plan
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 3,
  max_products INTEGER,
  max_storage_mb INTEGER,
  
  -- Fechas de facturación
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  
  -- Stripe/Pagos
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_type);

-- 3. Crear trigger para updated_at
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

-- 4. Insertar suscripciones para todas las empresas existentes
INSERT INTO subscriptions (company_id, plan_type, max_branches, max_users, status)
SELECT 
  id,
  'FREE',
  1,
  3,
  'active'
FROM companies
ON CONFLICT (company_id) DO NOTHING;

-- 5. Actualizar Ferretería El Tornillo a PRO
UPDATE subscriptions
SET 
  plan_type = 'PRO',
  max_branches = 5,
  max_users = 10,
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE company_id = (
  SELECT id FROM companies WHERE name = 'Ferretería El Tornillo'
);

-- 6. Verificar el resultado
SELECT 
  c.name as empresa,
  s.plan_type as plan,
  s.max_branches as max_sucursales,
  s.max_users as max_usuarios,
  s.status as estado,
  s.created_at as creado,
  s.updated_at as actualizado
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
ORDER BY c.name;

-- 7. Ver estadísticas por plan
SELECT 
  plan_type,
  COUNT(*) as total_empresas,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activas
FROM subscriptions
GROUP BY plan_type
ORDER BY plan_type;

-- 8. Verificar sucursales de El Tornillo
SELECT 
  c.name as empresa,
  COUNT(b.id) as total_sucursales,
  s.max_branches as limite_sucursales,
  s.plan_type as plan
FROM companies c
LEFT JOIN branches b ON c.id = b.company_id
LEFT JOIN subscriptions s ON c.id = s.company_id
WHERE c.name = 'Ferretería El Tornillo'
GROUP BY c.name, s.max_branches, s.plan_type;
