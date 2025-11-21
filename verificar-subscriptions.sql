-- =====================================================
-- VERIFICAR CONFIGURACIÓN DE SUBSCRIPTIONS
-- =====================================================

-- 1. Ver si existe la tabla subscriptions
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'subscriptions'
) as tabla_existe;

-- 2. Ver estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 3. Ver todas las suscripciones
SELECT 
  s.id,
  c.name as empresa,
  s.plan_type,
  s.max_branches,
  s.max_users,
  s.status,
  s.created_at
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
ORDER BY c.name;

-- 4. Ver específicamente El Tornillo
SELECT 
  c.name as empresa,
  c.plan as plan_company_table,
  c.max_branches as limit_company_table,
  s.plan_type as plan_subscriptions_table,
  s.max_branches as limit_subscriptions_table,
  s.status,
  COUNT(b.id) as sucursales_actuales
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id
LEFT JOIN branches b ON c.id = b.company_id
WHERE c.name = 'Ferretería El Tornillo'
GROUP BY c.name, c.plan, c.max_branches, s.plan_type, s.max_branches, s.status;

-- 5. Comparar companies vs subscriptions (para todas las empresas)
SELECT 
  c.name,
  c.plan as plan_companies,
  c.max_branches as limit_companies,
  s.plan_type as plan_subscriptions,
  s.max_branches as limit_subscriptions,
  CASE 
    WHEN s.max_branches != c.max_branches THEN '⚠️ DIFERENTE'
    ELSE '✅ OK'
  END as estado
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id;

-- 6. Contar sucursales por empresa
SELECT 
  c.name as empresa,
  COUNT(b.id) as sucursales_actuales,
  COALESCE(s.max_branches, c.max_branches, 1) as limite,
  COALESCE(s.plan_type, c.plan, 'FREE') as plan
FROM companies c
LEFT JOIN subscriptions s ON c.id = s.company_id
LEFT JOIN branches b ON c.id = b.company_id
GROUP BY c.name, s.max_branches, c.max_branches, s.plan_type, c.plan
ORDER BY c.name;
