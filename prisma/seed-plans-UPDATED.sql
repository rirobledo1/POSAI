-- ============================================
-- Script para poblar planes de suscripción
-- ✅ CORREGIDO: Incluye características de cotizaciones
-- ============================================
-- Ejecutar con: psql -d nombre_base_datos -f seed-plans.sql

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  plan_code VARCHAR(20) UNIQUE NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  annual_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  annual_discount_percent INTEGER NOT NULL DEFAULT 0,
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_users INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER,
  max_storage_mb INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  trial_days INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ====================================
-- 1. PLAN FREE (Plan Gratuito)
-- ====================================
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
    "api_acceso": false,
    "quotations_inperson": true,
    "quotations_online": false,
    "quotations_whatsapp": false
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
  description = EXCLUDED.description,
  updated_at = NOW();

-- ====================================
-- 2. PLAN PRO (Plan Profesional)
-- ✅ SIN cotizaciones online ni WhatsApp
-- ====================================
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
    "corte_caja": true,
    "quotations_inperson": true,
    "quotations_online": false,
    "quotations_whatsapp": false
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
  description = EXCLUDED.description,
  updated_at = NOW();

-- ====================================
-- 3. PLAN PRO PLUS
-- ✅ CON cotizaciones online y WhatsApp
-- ====================================
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
  'plan_pro_plus_001',
  'PRO_PLUS',
  'Plan Pro Plus',
  999.00,
  9990.00,
  17,
  10,
  25,
  50000,
  20000,
  '{
    "pos": true,
    "inventario": true,
    "ventas": true,
    "clientes": true,
    "reportes_basicos": true,
    "soporte": "prioritario",
    "multi_sucursal": true,
    "usuarios_ilimitados": false,
    "reportes_avanzados": true,
    "api_acceso": true,
    "integraciones": true,
    "transferencias_stock": true,
    "envios_domicilio": true,
    "cuentas_cobrar": true,
    "corte_caja": true,
    "quotations_inperson": true,
    "quotations_online": true,
    "quotations_whatsapp": true,
    "sales_whatsapp": true,
    "custom_branding": true
  }',
  14,
  3,
  true,
  false,
  'Plan avanzado con cotizaciones en línea y WhatsApp. Perfecto para negocios que necesitan automatización completa.',
  NOW(),
  NOW()
) ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  features = EXCLUDED.features,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ====================================
-- 4. PLAN ENTERPRISE (Plan Empresarial)
-- ✅ CON todas las características
-- ====================================
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
    "sla_garantizado": true,
    "quotations_inperson": true,
    "quotations_online": true,
    "quotations_whatsapp": true,
    "sales_whatsapp": true,
    "custom_branding": true,
    "white_label": true,
    "priority_support": true,
    "dedicated_support": true,
    "ai_sales_agents": true,
    "ai_anomaly_detection": true,
    "ai_theft_alerts": true,
    "ai_demand_prediction": true,
    "ai_smart_reports": true,
    "ai_inventory_optimization": true,
    "ai_price_suggestions": true
  }',
  30,
  4,
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
  description = EXCLUDED.description,
  updated_at = NOW();

-- ====================================
-- VERIFICACIÓN
-- ====================================
SELECT 
  plan_code AS "Plan",
  plan_name AS "Nombre",
  monthly_price AS "Precio Mensual",
  annual_price AS "Precio Anual",
  max_branches AS "Sucursales",
  max_users AS "Usuarios",
  features->>'quotations_online' AS "Cotiz. Online",
  features->>'quotations_whatsapp' AS "Cotiz. WhatsApp",
  is_active AS "Activo",
  is_popular AS "Popular"
FROM subscription_plans
ORDER BY display_order;

-- ====================================
-- RESULTADO ESPERADO:
-- ====================================
-- FREE:       quotations_online = false, quotations_whatsapp = false
-- PRO:        quotations_online = false, quotations_whatsapp = false  
-- PRO_PLUS:   quotations_online = true,  quotations_whatsapp = true
-- ENTERPRISE: quotations_online = true,  quotations_whatsapp = true
