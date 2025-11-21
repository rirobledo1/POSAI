// Simulador del endpoint de categorías para debug
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123'
});

async function simularEndpointCategorias() {
  try {
    console.log('🔍 Simulando GET /api/categories?page=1&limit=20\n');
    
    // La misma query que usa el API
    const mainQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.active,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true
      WHERE 1=1
      GROUP BY c.id, c.name, c.description, c.active, c.created_at, c.updated_at
      ORDER BY c.name ASC
      LIMIT 20 OFFSET 0
    `;
    
    const result = await pool.query(mainQuery);
    
    console.log('📊 Respuesta simulada del API:');
    console.log(JSON.stringify({
      success: true,
      categories: result.rows,
      pagination: {
        page: 1,
        limit: 20,
        total: result.rows.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    }, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

simularEndpointCategorias();
