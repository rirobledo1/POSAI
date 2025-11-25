-- ==========================================
-- IMPLEMENTAR RATE LIMITING - LOGIN ATTEMPTS
-- ==========================================
-- Propósito: Proteger contra ataques de fuerza bruta
-- Límite: 5 intentos fallidos por 15 minutos
-- ==========================================

-- Crear tabla para registrar intentos de login
CREATE TABLE IF NOT EXISTS login_attempts (
  id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier VARCHAR(255) NOT NULL,  -- IP o email
  type VARCHAR(10) NOT NULL,         -- 'ip' o 'email'
  success BOOLEAN NOT NULL DEFAULT FALSE,
  user_id VARCHAR(30),               -- ID del usuario si login exitoso
  user_agent TEXT,                   -- Información del navegador
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para mejorar performance
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidos
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier 
ON login_attempts(identifier);

CREATE INDEX IF NOT EXISTS idx_login_attempts_type 
ON login_attempts(type);

CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at 
ON login_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_success 
ON login_attempts(success);

-- Índice compuesto para la query principal del rate limiter
CREATE INDEX IF NOT EXISTS idx_login_attempts_rate_limit 
ON login_attempts(identifier, type, success, attempted_at);

-- Verificar tabla creada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'login_attempts'
ORDER BY ordinal_position;

-- Ver estadísticas
SELECT 
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN success = true THEN 1 END) as successful,
    COUNT(CASE WHEN success = false THEN 1 END) as failed,
    COUNT(DISTINCT identifier) as unique_identifiers
FROM login_attempts;

COMMENT ON TABLE login_attempts IS 'Registro de intentos de login para rate limiting (protección contra fuerza bruta)';
COMMENT ON COLUMN login_attempts.identifier IS 'IP address o email del usuario';
COMMENT ON COLUMN login_attempts.type IS 'Tipo de identificador: ip o email';
COMMENT ON COLUMN login_attempts.success IS 'Si el intento fue exitoso o fallido';
