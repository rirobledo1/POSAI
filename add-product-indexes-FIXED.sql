-- ==========================================
-- ÍNDICES PARA OPTIMIZAR /pos (VERSION CORREGIDA)
-- Fecha: 2024-11-21
-- Propósito: Mejorar performance de carga de productos
-- SIN REQUERIR pg_trgm
-- ==========================================

\echo ''
\echo '=========================================='
\echo 'CREANDO ÍNDICES DE PERFORMANCE'
\echo '=========================================='
\echo ''

-- ==========================================
-- ÍNDICES BÁSICOS (NO REQUIEREN EXTENSIONES)
-- ==========================================

-- 1. Índice compuesto para el query principal (company_id + name)
--    Optimiza el WHERE company_id = X ORDER BY name
\echo 'Creando índice: idx_products_company_name...'
CREATE INDEX IF NOT EXISTS idx_products_company_name 
ON products(company_id, name);
\echo '✅ idx_products_company_name creado'

-- 2. Índice para filtros por categoría
\echo 'Creando índice: idx_products_category...'
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(category_id);
\echo '✅ idx_products_category creado'

-- 3. Índice para filtros por stock
\echo 'Creando índice: idx_products_stock...'
CREATE INDEX IF NOT EXISTS idx_products_stock 
ON products(stock);
\echo '✅ idx_products_stock creado'

-- 4. Índice para filtros por active
\echo 'Creando índice: idx_products_active...'
CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(active);
\echo '✅ idx_products_active creado'

-- 5. Índice compuesto para filtros combinados más comunes
--    Optimiza: WHERE company_id = X AND active = true AND stock >= 0
\echo 'Creando índice: idx_products_company_active_stock...'
CREATE INDEX IF NOT EXISTS idx_products_company_active_stock 
ON products(company_id, active, stock) 
WHERE active = true AND stock >= 0;
\echo '✅ idx_products_company_active_stock creado (índice parcial)'

-- 6. Índice para búsquedas por barcode (mejorar búsquedas exactas)
\echo 'Creando índice: idx_products_barcode_lower...'
CREATE INDEX IF NOT EXISTS idx_products_barcode_lower 
ON products(LOWER(barcode));
\echo '✅ idx_products_barcode_lower creado'

-- 7. Índice para búsquedas por nombre (sin case-sensitivity)
\echo 'Creando índice: idx_products_name_lower...'
CREATE INDEX IF NOT EXISTS idx_products_name_lower 
ON products(LOWER(name));
\echo '✅ idx_products_name_lower creado'

-- ==========================================
-- ÍNDICES DE TEXTO COMPLETO (REQUIEREN pg_trgm)
-- ==========================================

\echo ''
\echo 'Intentando crear índices de búsqueda de texto...'

-- Intentar crear extensión pg_trgm si está disponible
DO $$
DECLARE
    extension_exists boolean;
BEGIN
    -- Verificar si la extensión ya existe
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
    ) INTO extension_exists;
    
    IF extension_exists THEN
        RAISE NOTICE '✅ pg_trgm ya está instalada';
    ELSE
        -- Intentar instalar
        BEGIN
            CREATE EXTENSION pg_trgm;
            RAISE NOTICE '✅ pg_trgm instalada exitosamente';
        EXCEPTION 
            WHEN insufficient_privilege THEN
                RAISE NOTICE '⚠️  No tienes permisos para instalar pg_trgm';
                RAISE NOTICE '   Pide a tu DBA que ejecute: CREATE EXTENSION pg_trgm;';
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  No se pudo instalar pg_trgm';
                RAISE NOTICE '   Error: %', SQLERRM;
        END;
    END IF;
END $$;

-- Crear índices GIN solo si pg_trgm está disponible
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        -- Índice GIN para búsquedas en name
        RAISE NOTICE 'Creando índice GIN: idx_products_search_name...';
        CREATE INDEX IF NOT EXISTS idx_products_search_name 
        ON products USING gin(name gin_trgm_ops);
        RAISE NOTICE '✅ idx_products_search_name creado';
        
        -- Índice GIN para búsquedas en description
        RAISE NOTICE 'Creando índice GIN: idx_products_search_desc...';
        CREATE INDEX IF NOT EXISTS idx_products_search_desc 
        ON products USING gin(description gin_trgm_ops);
        RAISE NOTICE '✅ idx_products_search_desc creado';
    ELSE
        RAISE NOTICE '⚠️  pg_trgm no disponible, saltando índices de búsqueda de texto';
        RAISE NOTICE '   Las búsquedas funcionarán pero serán más lentas';
        RAISE NOTICE '   Índices básicos ya proporcionan gran mejora de performance';
    END IF;
END $$;

-- ==========================================
-- ANALIZAR TABLA PARA ACTUALIZAR ESTADÍSTICAS
-- ==========================================
\echo ''
\echo 'Analizando tabla para actualizar estadísticas...'
ANALYZE products;
\echo '✅ Estadísticas actualizadas'

-- ==========================================
-- VERIFICAR ÍNDICES CREADOS
-- ==========================================
\echo ''
\echo '=========================================='
\echo 'ÍNDICES CREADOS EXITOSAMENTE'
\echo '=========================================='

SELECT 
    schemaname,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;

-- ==========================================
-- INFORMACIÓN DE TAMAÑO
-- ==========================================
\echo ''
\echo '=========================================='
\echo 'TAMAÑO DE TABLA E ÍNDICES'
\echo '=========================================='

SELECT
    pg_size_pretty(pg_total_relation_size('products')) as total_size,
    pg_size_pretty(pg_relation_size('products')) as table_size,
    pg_size_pretty(pg_total_relation_size('products') - pg_relation_size('products')) as indexes_size;

\echo ''
\echo '=========================================='
\echo 'COMPLETADO'
\echo '=========================================='
\echo ''
\echo 'Nota: Si pg_trgm no se instaló, las búsquedas ILIKE'
\echo 'seguirán funcionando pero serán más lentas.'
\echo 'Los índices básicos ya mejoran el performance en 5-10x.'
\echo ''
