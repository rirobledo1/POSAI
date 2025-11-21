-- Script para poblar planes de suscripción
-- Ejecutar en PostgreSQL con: \i seed-plans.sql

-- Limpiar planes existentes (opcional)
-- DELETE FROM subscription_plans;

-- 1. PLAN FREE (Plan Gratuito)
INSERT INTO subscription_plans (
  id,
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
  is_active,
  is_popular,
  description,
  created_at,
  updated_at
) VALUES (
  'plan_free_001',
  'FREE',
  'Plan Gratuito',
  0.00,
  0.00,
  0,
  1,
  3,
  100,
  500,
  '{
    "pos": true,
    "inventario": true,
    "ventas": true,
    "clientes": true,
    "reportes_basicos": true,
    "soporte": "email",
    "multi_sucursal": false,
    "usuarios_ilimitados": false,
    "reportes_avanzados": false,
    "api_acceso": false
  }',
  30,
  1,
  true,
  false,
  'Ideal para comenzar tu negocio. Incluye las funcionalidades básicas para operar tu punto de venta.',
  NOW(),
  NOW()
) ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 2. PLAN PRO (Plan Profesional)
INSERT INTO subscription_plans (
  id,
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
  is_active,
  is_popular,
  description,
  created_at,
  updated_at
) VALUES (
  'plan_pro_001',
  'PRO',
  'Plan Profesional',
  499.00,
  4990.00,
  17,
  5,
  10,
  10000,
  5000,
  '{
    "pos": true,
    "inventario": true,
    "ventas": true,
    "clientes": true,
    "reportes_basicos": true,
    "soporte": "chat_email",
    "multi_sucursal": true,
    "usuarios_ilimitados": false,
    "reportes_avanzados": true,
    "api_acceso": true,
    "integraciones": true,
    "transferencias_stock": true,
    "envios_domicilio": true,
    "cuentas_cobrar": true,
    "corte_caja": true
  }',
  14,
  2,
  true,
  true,
  'Perfecto para negocios en crecimiento. Incluye múltiples sucursales, reportes avanzados y soporte prioritario.',
  NOW(),
  NOW()
) ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 3. PLAN ENTERPRISE (Plan Empresarial)
INSERT INTO subscription_plans (
  id,
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
  is_active,
  is_popular,
  description,
  created_at,
  updated_at
) VALUES (
  'plan_enterprise_001',
  'ENTERPRISE',
  'Plan Empresarial',
  1499.00,
  14990.00,
  17,
  999,
  999,
  NULL,
  50000,
  '{
    "pos": true,
    "inventario": true,
    "ventas": true,
    "clientes": true,
    "reportes_basicos": true,
    "soporte": "24_7_telefono",
    "multi_sucursal": true,
    "usuarios_ilimitados": true,
    "reportes_avanzados": true,
    "api_acceso": true,
    "integraciones": true,
    "transferencias_stock": true,
    "envios_domicilio": true,
    "cuentas_cobrar": true,
    "corte_caja": true,
    "personalizacion": true,
    "capacitacion": true,
    "migracion_datos": true,
    "servidor_dedicado": true,
    "sla_garantizado": true
  }',
  14,
  3,
  true,
  false,
  'Para grandes empresas. Sucursales y usuarios ilimitados, soporte 24/7, personalización y servidor dedicado.',
  NOW(),
  NOW()
) ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  updated_at = NOW();

-- Verificar que se insertaron correctamente
SELECT 
  plan_code,
  plan_name,
  monthly_price,
  annual_price,
  max_branches,
  max_users,
  is_active,
  is_popular
FROM subscription_plans
ORDER BY display_order;
