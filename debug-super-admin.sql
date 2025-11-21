-- =====================================================
-- DEBUG: Verificar configuración de super admin
-- =====================================================

-- 1. Ver el usuario admin@ferreai.com
SELECT 
  'USUARIO' as tipo,
  u.id,
  u.name,
  u.email,
  u.role,
  u.active as activo,
  u.created_at
FROM users u
WHERE u.email = 'admin@ferreai.com';

-- 2. Ver si está en super_admins
SELECT 
  'SUPER ADMIN' as tipo,
  sa.id,
  sa.user_id,
  sa.permissions,
  sa.created_at,
  sa.updated_at
FROM super_admins sa
WHERE sa.user_id = 'cmgrao3790004twwoyfshswug';

-- 3. Ver la relación completa
SELECT 
  'RELACION COMPLETA' as tipo,
  u.id as user_id,
  u.name,
  u.email,
  u.role,
  sa.id as super_admin_id,
  sa.permissions,
  CASE 
    WHEN sa.user_id IS NOT NULL THEN '✅ ES SUPER ADMIN'
    ELSE '❌ NO ES SUPER ADMIN'
  END as estado
FROM users u
LEFT JOIN super_admins sa ON u.id = sa.user_id
WHERE u.email = 'admin@ferreai.com';

-- 4. Ver todos los super admins
SELECT 
  'TODOS LOS SUPER ADMINS' as tipo,
  u.name,
  u.email,
  sa.created_at as super_admin_desde
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id
ORDER BY sa.created_at DESC;
