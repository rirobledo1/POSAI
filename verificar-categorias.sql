-- Verificar categorías creadas
SELECT id, name, created_at 
FROM "Category" 
ORDER BY created_at DESC;

-- Contar productos por categoría
SELECT c.name as categoria, COUNT(p.id) as total_productos
FROM "Category" c
LEFT JOIN "Product" p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY total_productos DESC;

-- Productos importados
SELECT p.name, p.description, c.name as categoria
FROM "Product" p
JOIN "Category" c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;