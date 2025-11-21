-- Verificar el plan actual de tu empresa
SELECT 
  id,
  name,
  plan,
  status,
  subscription_expires_at
FROM companies
WHERE id = (
  SELECT company_id 
  FROM users 
  WHERE email = 'admin@ferreai.com' 
  LIMIT 1
);

-- Si el plan NO es 'PRO', actualizarlo:
UPDATE companies
SET plan = 'PRO'
WHERE id = (
  SELECT company_id 
  FROM users 
  WHERE email = 'admin@ferreai.com' 
  LIMIT 1
);

-- Verificar que se actualizó
SELECT 
  id,
  name,
  plan as plan_actual,
  status,
  subscription_expires_at
FROM companies
WHERE id = (
  SELECT company_id 
  FROM users 
  WHERE email = 'admin@ferreai.com' 
  LIMIT 1
);

-- También verificar la tabla de suscripciones
SELECT 
  s.id,
  s.plan_type,
  s.status,
  s.current_period_end,
  c.name as company_name,
  c.plan as company_plan
FROM subscriptions s
JOIN companies c ON s.company_id = c.id
WHERE c.id = (
  SELECT company_id 
  FROM users 
  WHERE email = 'admin@ferreai.com' 
  LIMIT 1
);
