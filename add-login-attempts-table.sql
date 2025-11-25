-- ==========================================
-- TABLA PARA RATE LIMITING DE LOGIN
-- ==========================================

-- Crear tabla para registrar intentos de login
CREATE TABLE IF NOT EXISTS login_attempts (
  id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier VARCHAR(255) NOT NULL, -- IP o email
  type VARCHAR(10) NOT NULL, -- 'ip' o 'email'
  success BOOLEAN NOT NULL DEFAULT false,
  user_id VARCHAR(30), -- Si login fue exitoso
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índices para búsquedas rápidas
  CONSTRAINT chk_type CHECK (type IN ('ip', 'email'))
);

-- Índices para optimizar queries de rate limiting
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier 
ON login_attempts(identifier);

CREATE INDEX IF NOT EXISTS idx_login_attempts_type 
ON login_attempts(type);

CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at 
ON login_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_type_success 
ON login_attempts(identifier, type, success);

-- Índice compuesto para query principal de rate limiting
CREATE INDEX IF NOT EXISTS idx_login_attempts_rate_limit 
ON login_attempts(identifier, type, success, attempted_at);

-- Comentarios
COMMENT ON TABLE login_attempts IS 'Registro de intentos de login para rate limiting y auditoría';
COMMENT ON COLUMN login_attempts.identifier IS 'IP address o email del usuario que intenta login';
COMMENT ON COLUMN login_attempts.type IS 'Tipo de identificador: ip o email';
COMMENT ON COLUMN login_attempts.success IS 'Si el intento de login fue exitoso';

-- Verificar tabla creada
\echo 'Tabla login_attempts creada exitosamente'

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'login_attempts'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'login_attempts'
ORDER BY indexname;
