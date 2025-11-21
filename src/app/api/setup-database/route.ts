import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Pool para conectar a postgres (base de datos por defecto)
const adminPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Conectar a la base por defecto
  user: 'postgres',
  password: 'admin123',
  max: 5,
});

// Pool para la base ferreai_dev (después de crearla)
const appPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ferreai_dev',
  user: 'postgres',
  password: 'admin123',
  max: 10,
});

export async function POST(request: NextRequest) {
  console.log('🚀 Setup API iniciado');
  
  try {
    // PASO 1: Crear base de datos si no existe
    console.log('🗄️ Verificando/creando base de datos ferreai_dev...');
    const adminClient = await adminPool.connect();
    
    try {
      // Verificar si existe la base de datos
      const dbCheck = await adminClient.query(
        "SELECT 1 FROM pg_database WHERE datname = 'ferreai_dev'"
      );
      
      if (dbCheck.rows.length === 0) {
        console.log('🔨 Creando base de datos ferreai_dev...');
        await adminClient.query('CREATE DATABASE ferreai_dev');
        console.log('✅ Base de datos ferreai_dev creada');
      } else {
        console.log('✅ Base de datos ferreai_dev ya existe');
      }
    } finally {
      adminClient.release();
    }

    // PASO 2: Conectar a la base ferreai_dev y crear tablas
    console.log('🔌 Conectando a ferreai_dev...');
    const client = await appPool.connect();
    
    try {
      await client.query('BEGIN');
      
      console.log('👥 Creando tabla users...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          email_verified TIMESTAMPTZ,
          image TEXT,
          role TEXT DEFAULT 'VENDEDOR',
          password_hash TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      console.log('📂 Creando tabla categories...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      console.log('📦 Creando tabla products...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          barcode TEXT,
          price DECIMAL(10,2) NOT NULL DEFAULT 0,
          cost DECIMAL(10,2) DEFAULT 0,
          stock INTEGER DEFAULT 0,
          min_stock INTEGER DEFAULT 5,
          category_id TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      console.log('👥 Creando tabla customers...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          rfc TEXT,
          credit_limit DECIMAL(10,2) DEFAULT 0,
          current_credit DECIMAL(10,2) DEFAULT 0,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      console.log('💰 Creando tabla sales...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          customer_id TEXT,
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax DECIMAL(10,2) DEFAULT 0,
          discount DECIMAL(10,2) DEFAULT 0,
          total DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_method TEXT NOT NULL DEFAULT 'EFECTIVO',
          status TEXT DEFAULT 'COMPLETADA',
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      console.log('🛒 Creando tabla sale_items...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id TEXT PRIMARY KEY,
          sale_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      console.log('📊 Insertando datos de prueba...');
      
      // Insertar categorías - CORREGIDO
      await client.query(`
        INSERT INTO categories (id, name, description, active, created_at, updated_at) VALUES
        ('cat-1', 'Herramientas Manuales', 'Martillos, destornilladores, llaves', true, NOW(), NOW()),
        ('cat-2', 'Tornillería', 'Tornillos, tuercas, clavos', true, NOW(), NOW()),
        ('cat-3', 'Pintura', 'Pinturas, brochas, solventes', true, NOW(), NOW()),
        ('cat-4', 'Eléctrico', 'Cables, contactos, interruptores', true, NOW(), NOW()),
        ('cat-5', 'Plomería', 'Tubos, llaves, conexiones', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Insertar productos - CORREGIDO
      await client.query(`
        INSERT INTO products (id, name, description, barcode, price, cost, stock, min_stock, category_id, active, created_at, updated_at) VALUES
        ('prod-1', 'Martillo Truper 16oz', 'Martillo de acero con mango de madera', '7501206612345', 85.50, 60.00, 25, 5, 'cat-1', true, NOW(), NOW()),
        ('prod-2', 'Destornillador Phillips #2', 'Destornillador cruz mediano', '7501206612346', 25.00, 18.00, 50, 10, 'cat-1', true, NOW(), NOW()),
        ('prod-3', 'Llave Inglesa 10"', 'Llave ajustable 10 pulgadas', '7501206612361', 120.00, 85.00, 15, 3, 'cat-1', true, NOW(), NOW()),
        ('prod-4', 'Tornillo Teja 2.5"', 'Tornillo autoperforante para lámina', '7501206612347', 1.50, 1.00, 500, 100, 'cat-2', true, NOW(), NOW()),
        ('prod-5', 'Pintura Blanca 1L', 'Pintura vinílica lavable', '7501206612348', 180.00, 140.00, 15, 3, 'cat-3', true, NOW(), NOW()),
        ('prod-6', 'Cable THW 12', 'Cable eléctrico calibre 12', '7501206612349', 12.50, 9.00, 200, 50, 'cat-4', true, NOW(), NOW()),
        ('prod-7', 'Llave Española 1/2"', 'Llave de paso de bronce', '7501206612350', 45.00, 32.00, 30, 5, 'cat-5', true, NOW(), NOW()),
        ('prod-8', 'Brocha 2"', 'Brocha de cerda natural', '7501206612352', 28.00, 20.00, 40, 8, 'cat-3', true, NOW(), NOW()),
        ('prod-9', 'Clavo 2.5" Caja', 'Caja de clavos 1 kg', '7501206612351', 35.00, 25.00, 80, 15, 'cat-2', true, NOW(), NOW()),
        ('prod-10', 'Contacto Doble', 'Contacto polarizado blanco', '7501206612365', 18.00, 13.00, 35, 8, 'cat-4', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Insertar clientes - CORREGIDO
      await client.query(`
        INSERT INTO customers (id, name, email, phone, credit_limit, current_debt, active, created_at, updated_at) VALUES
        ('cust-1', 'María González López', 'maria@email.com', '664-123-4567', 5000.00, 1200.00, true, NOW(), NOW()),
        ('cust-2', 'Juan Carlos Pérez', 'juan@email.com', '664-987-6543', 3000.00, 0.00, true, NOW(), NOW()),
        ('cust-3', 'Constructora del Norte SA', 'ventas@norte.com', '664-555-0123', 25000.00, 8500.00, true, NOW(), NOW()),
        ('cust-4', 'Pedro Ramírez', 'pedro@email.com', '664-111-2222', 2000.00, 500.00, true, NOW(), NOW()),
        ('cust-5', 'Ferretería La Esperanza', 'contacto@esperanza.com', '664-333-4444', 8000.00, 2100.00, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      // Insertar usuarios - CORREGIDO
      await client.query(`
        INSERT INTO users (id, name, email, role, password_hash, active, created_at, updated_at) VALUES
        ('admin-1', 'Administrador', 'admin@ferreai.com', 'ADMIN', '$2a$10$dummy.hash.for.admin123', true, NOW(), NOW()),
        ('vend-1', 'Vendedor Principal', 'vendedor@ferreai.com', 'VENDEDOR', '$2a$10$dummy.hash.for.admin123', true, NOW(), NOW()),
        ('alm-1', 'Encargado Almacén', 'almacen@ferreai.com', 'ALMACEN', '$2a$10$dummy.hash.for.admin123', true, NOW(), NOW()),
        ('read-1', 'Usuario Lectura', 'lectura@ferreai.com', 'SOLO_LECTURA', '$2a$10$dummy.hash.for.admin123', true, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `);

      await client.query('COMMIT');
      console.log('✅ Todas las tablas creadas y datos insertados');

      // Verificar datos
      const countResult = await client.query(`
        SELECT 
          'productos' as tabla, COUNT(*) as total FROM products
        UNION ALL
        SELECT 'categorías', COUNT(*) FROM categories
        UNION ALL
        SELECT 'clientes', COUNT(*) FROM customers
        UNION ALL
        SELECT 'usuarios', COUNT(*) FROM users
      `);

      console.log('📊 Conteos finales:', countResult.rows);

      return NextResponse.json({
        success: true,
        message: 'Base de datos y tablas creadas exitosamente',
        data: countResult.rows,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error en setup:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Setup API funcionando. Use POST para crear base de datos y tablas.',
    timestamp: new Date().toISOString()
  });
}