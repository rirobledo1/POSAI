-- Verificar precios de los planes
SELECT 
  plan_code,
  plan_name,
  monthly_price_mxn,
  annual_price_mxn,
  is_active
FROM subscription_plans
ORDER BY display_order;

-- Si los precios están en NULL, actualizarlos:
UPDATE subscription_plans
SET 
  monthly_price_mxn = 0,
  annual_price_mxn = 0
WHERE plan_code = 'FREE';

UPDATE subscription_plans
SET 
  monthly_price_mxn = 799,
  annual_price_mxn = 8068
WHERE plan_code = 'PRO';

UPDATE subscription_plans
SET 
  monthly_price_mxn = 1499,
  annual_price_mxn = 15110
WHERE plan_code = 'PRO_PLUS';

UPDATE subscription_plans
SET 
  monthly_price_mxn = 2999,
  annual_price_mxn = 30230
WHERE plan_code = 'ENTERPRISE';

-- Verificar que se actualizaron
SELECT 
  plan_code,
  plan_name,
  monthly_price_mxn,
  annual_price_mxn
FROM subscription_plans
ORDER BY display_order;
