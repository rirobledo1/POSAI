-- ==========================================
-- INSTALAR pg_trgm COMO SUPERUSUARIO
-- ==========================================
-- Ejecutar este script solo si tienes acceso
-- como superusuario (usuario postgres)
-- ==========================================

\echo ''
\echo '=========================================='
\echo 'INSTALANDO EXTENSIÓN pg_trgm'
\echo '=========================================='
\echo ''

-- Verificar si ya está instalada
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        RAISE NOTICE '✅ pg_trgm ya está instalada';
    ELSE
        RAISE NOTICE 'Instalando pg_trgm...';
    END IF;
END $$;

-- Instalar la extensión
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\echo ''
\echo '=========================================='
\echo 'VERIFICANDO INSTALACIÓN'
\echo '=========================================='

-- Verificar que se instaló correctamente
SELECT 
    extname as "Extensión",
    extversion as "Versión",
    extrelocatable as "Reubicable"
FROM pg_extension 
WHERE extname = 'pg_trgm';

-- Verificar operadores disponibles
\echo ''
\echo 'Operadores de pg_trgm disponibles:'
SELECT 
    oprname as "Operador",
    oprleft::regtype as "Tipo Izq",
    oprright::regtype as "Tipo Der"
FROM pg_operator
WHERE oprname IN ('<%', '%>', '<<->', '<<<->', '<->', '~', '%')
    AND oprnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
LIMIT 10;

\echo ''
\echo '=========================================='
\echo 'COMPLETADO'
\echo '=========================================='
\echo ''
\echo 'pg_trgm instalada exitosamente.'
\echo 'Ahora puedes ejecutar: add-product-indexes-FIXED.bat'
\echo ''
