-- =====================================================
-- CONVERTIR USUARIO EN SUPER ADMIN
-- =====================================================

-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_EMAIL@ejemplo.com' con tu email real
-- 2. Ejecuta este script en PostgreSQL

-- Ver todos los usuarios disponibles (para encontrar tu email)
SELECT id, name, email, role 
FROM users 
ORDER BY created_at DESC;

-- ⚠️ CAMBIA ESTE EMAIL POR EL TUYO ⚠️
DO $$
DECLARE
  v_user_id TEXT;
  v_email TEXT := 'TU_EMAIL@ejemplo.com'; -- ⚠️ CAMBIA ESTO
BEGIN
  -- Buscar el ID del usuario por email
  SELECT id INTO v_user_id
  FROM users
  WHERE email = v_email;

  -- Verificar si se encontró el usuario
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado. Verifica el email.', v_email;
  END IF;

  -- Insertar como super admin
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

  -- Confirmar
  RAISE NOTICE '✅ Usuario % (%)) ahora es SUPER ADMIN', v_email, v_user_id;
END $$;

-- Verificar que se creó correctamente
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  sa.permissions,
  sa.created_at as super_admin_desde
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id
ORDER BY sa.created_at DESC;

-- Ver permisos en formato legible
SELECT 
  u.name,
  u.email,
  jsonb_pretty(sa.permissions) as permisos
FROM users u
INNER JOIN super_admins sa ON u.id = sa.user_id;
