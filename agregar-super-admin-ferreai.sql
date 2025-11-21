-- =====================================================
-- VERIFICAR Y AGREGAR admin@ferreai.com COMO SUPER ADMIN
-- =====================================================

-- 1. Verificar si el usuario existe
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM users 
WHERE email = 'admin@ferreai.com';

-- 2. Verificar si ya es super admin
SELECT 
  u.id,
  u.name,
  u.email,
  sa.user_id,
  sa.permissions,
  sa.created_at
FROM users u
LEFT JOIN super_admins sa ON u.id = sa.user_id
WHERE u.email = 'admin@ferreai.com';

-- 3. Agregar como super admin
DO $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Buscar el ID del usuario
  SELECT id INTO v_user_id
  FROM users
  WHERE email = 'admin@ferreai.com';

  -- Verificar si se encontró
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario admin@ferreai.com no encontrado';
  END IF;

  -- Insertar o actualizar como super admin
  INSERT INTO super_admins (user_id, permissions)
  VALUES (
    v_user_id,
    '{
      "manage_plans": true,
      "view_all_companies": true,
      "system_settings": true,
      "manage_users": true,
      "view_analytics": true
    }'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

  RAISE NOTICE '✅ Usuario admin@ferreai.com (ID: %) ahora es SUPER ADMIN', v_user_id;
END $$;

-- 4. Verificar que se creó correctamente
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  sa.permissions,
  sa.created_at as super_admin_desde
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id
WHERE u.email = 'admin@ferreai.com';

-- 5. Ver todos los super admins actuales
SELECT 
  u.name,
  u.email,
  jsonb_pretty(sa.permissions) as permisos
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id
ORDER BY sa.created_at DESC;
