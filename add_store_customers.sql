-- =============================================
-- MIGRACIÓN: Agregar sistema de clientes de tienda en línea
-- Fecha: 2024-11-18
-- =============================================

-- 1. Crear tabla de clientes de tienda en línea
CREATE TABLE IF NOT EXISTS store_customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT NOT NULL,
    password TEXT,  -- null = compró como invitado
    name TEXT NOT NULL,
    phone TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expiry TIMESTAMP,
    last_login_at TIMESTAMP,
    company_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Un email único por tienda
    CONSTRAINT store_customers_email_company_unique UNIQUE (email, company_id),
    
    -- Relación con companies
    CONSTRAINT store_customers_company_fk FOREIGN KEY (company_id) 
        REFERENCES companies(id) ON DELETE CASCADE
);

-- Índices para store_customers
CREATE INDEX IF NOT EXISTS idx_store_customers_company ON store_customers(company_id);
CREATE INDEX IF NOT EXISTS idx_store_customers_email ON store_customers(email);

-- 2. Crear tabla de direcciones de clientes
CREATE TABLE IF NOT EXISTS store_customer_addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_customer_id TEXT NOT NULL,
    label TEXT,  -- "Casa", "Oficina", etc.
    name TEXT NOT NULL,  -- Nombre de quien recibe
    phone TEXT NOT NULL,  -- Teléfono de contacto
    street TEXT NOT NULL,  -- Calle y número
    colony TEXT,  -- Colonia
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'México',
    "references" TEXT,  -- Referencias adicionales
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Relación con store_customers
    CONSTRAINT store_customer_addresses_customer_fk FOREIGN KEY (store_customer_id) 
        REFERENCES store_customers(id) ON DELETE CASCADE
);

-- Índice para store_customer_addresses
CREATE INDEX IF NOT EXISTS idx_store_customer_addresses_customer ON store_customer_addresses(store_customer_id);

-- 3. Agregar campo store_customer_id a online_orders
ALTER TABLE online_orders 
ADD COLUMN IF NOT EXISTS store_customer_id TEXT;

-- Agregar foreign key
ALTER TABLE online_orders 
ADD CONSTRAINT online_orders_store_customer_fk 
FOREIGN KEY (store_customer_id) REFERENCES store_customers(id);

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_online_orders_store_customer ON online_orders(store_customer_id);

-- =============================================
-- VERIFICACIÓN
-- =============================================
-- Ejecuta esto para verificar que todo se creó correctamente:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('store_customers', 'store_customer_addresses');

-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'online_orders' AND column_name = 'store_customer_id';
