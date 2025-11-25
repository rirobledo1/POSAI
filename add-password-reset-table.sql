-- ==========================================
-- AGREGAR TABLA PARA RESET DE CONTRASEÑAS
-- ==========================================

-- Crear tabla para tokens de reset de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- Verificar tabla creada
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'password_reset_tokens'
ORDER BY ordinal_position;

\echo ''
\echo '✅ Tabla password_reset_tokens creada exitosamente'
\echo ''

COMMENT ON TABLE password_reset_tokens IS 'Tokens para reseteo de contraseñas de usuarios';
