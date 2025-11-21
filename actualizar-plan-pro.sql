-- =====================================================
-- Actualizar Suscripción a Plan PRO
-- =====================================================
-- Este script actualiza la ferretería "El Tornillo" a plan PRO

-- 1. Actualizar la suscripción a PRO
UPDATE subscriptions
SET 
  plan_type = 'PRO',
  max_branches = 5,  -- Plan PRO permite 5 sucursales
  max_users = 10,    -- Plan PRO permite 10 usuarios
  updated_at = NOW()
WHERE company_id = (
  SELECT id FROM companies WHERE name = 'Ferretería El Tornillo'
);

-- 2. Verificar el cambio
SELECT 
  c.name as empresa,
  s.plan_type as plan,
  s.max_branches as max_sucursales,
  s.max_users as max_usuarios,
  s.status as estado,
  s.updated_at as actualizado
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
WHERE c.name = 'Ferretería El Tornillo';

-- 3. Ver sucursales actuales
SELECT 
  b.name as sucursal,
  b.is_main as principal,
  b.is_active as activa,
  c.name as empresa
FROM branches b
JOIN companies c ON b.company_id = c.id
WHERE c.name = 'Ferretería El Tornillo'
ORDER BY b.is_main DESC, b.name;
