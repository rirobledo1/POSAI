-- 🔍 SCRIPT PARA OBTENER IDs NECESARIOS PARA PRUEBAS
-- Ejecuta este script en tu base de datos PostgreSQL

-- ========================================
-- 1. OBTENER COMPANY ID
-- ========================================
SELECT 
  id as company_id,
  name as company_name,
  email
FROM companies 
LIMIT 1;

-- ========================================
-- 2. OBTENER BRANCH ID (de la misma empresa)
-- ========================================
SELECT 
  b.id as branch_id,
  b.name as branch_name,
  b.company_id
FROM branches b
WHERE b.is_active = true
LIMIT 1;

-- ========================================
-- 3. OBTENER CUSTOMER ID (de la misma empresa)
-- ========================================
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.email,
  c.phone,
  c.company_id
FROM customers c
WHERE c.active = true
LIMIT 1;

-- ========================================
-- 4. OBTENER PRODUCT IDs (de la misma empresa)
-- ========================================
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.price,
  p.stock,
  p.company_id
FROM products p
WHERE p.active = true AND p.stock > 0
LIMIT 5;

-- ========================================
-- 5. OBTENER USER ID (para el userId)
-- ========================================
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  u.company_id
FROM users u
WHERE u.is_active = true
LIMIT 1;

-- ========================================
-- 6. DATOS COMPLETOS PARA EL REQUEST
-- ========================================
-- Copia estos valores y reemplaza en el JSON del request
SELECT 
  c.id as company_id,
  b.id as branch_id,
  cust.id as customer_id,
  u.id as user_id,
  json_agg(
    json_build_object(
      'productId', p.id,
      'productName', p.name,
      'price', p.price,
      'stock', p.stock
    )
  ) as products
FROM companies c
LEFT JOIN branches b ON b.company_id = c.id AND b.is_active = true
LEFT JOIN customers cust ON cust.company_id = c.id AND cust.active = true
LEFT JOIN users u ON u.company_id = c.id AND u.is_active = true
LEFT JOIN products p ON p.company_id = c.id AND p.active = true AND p.stock > 0
GROUP BY c.id, b.id, cust.id, u.id
LIMIT 1;
