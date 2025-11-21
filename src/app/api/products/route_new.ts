// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeStats = searchParams.get('includeStats') === 'true';

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category,
        p.barcode,
        p.created_at,
        p.updated_at
    `;

    // Add statistics fields if requested
    if (includeStats) {
      query += `,
        COALESCE(sales_data.total_sold, 0) as total_sold,
        COALESCE(sales_data.total_revenue, 0) as total_revenue,
        COALESCE(sales_data.avg_sale_price, p.price) as avg_sale_price,
        CASE 
          WHEN COALESCE(sales_data.total_sold, 0) >= 50 THEN 'bestseller'
          WHEN (p.price - COALESCE(p.cost, 0)) / NULLIF(p.price, 0) >= 0.4 THEN 'high-margin'
          WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 'new'
          ELSE 'regular'
        END as product_type
      `;
    }

    query += `
      FROM products p
    `;

    // Add LEFT JOIN for statistics if requested
    if (includeStats) {
      query += `
        LEFT JOIN (
          SELECT 
            si.product_id,
            SUM(si.quantity) as total_sold,
            SUM(si.quantity * si.price) as total_revenue,
            AVG(si.price) as avg_sale_price
          FROM sale_items si
          JOIN sales s ON si.sale_id = s.id
          WHERE s.created_at >= NOW() - INTERVAL '90 days'
          GROUP BY si.product_id
        ) sales_data ON p.id = sales_data.product_id
      `;
    }

    // Build WHERE conditions
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category && category !== 'all') {
      conditions.push(`p.category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add ORDER BY - prioritize by statistics if available
    if (includeStats) {
      query += ` ORDER BY 
        CASE 
          WHEN COALESCE(sales_data.total_sold, 0) >= 50 THEN 1
          WHEN (p.price - COALESCE(p.cost, 0)) / NULLIF(p.price, 0) >= 0.4 THEN 2
          WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 3
          ELSE 4
        END,
        COALESCE(sales_data.total_sold, 0) DESC,
        p.name ASC
      `;
    } else {
      query += ` ORDER BY p.name ASC`;
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    console.log('Executing query:', query);
    console.log('With values:', values);

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
    `;

    const countConditions = [];
    const countValues = [];
    let countParamIndex = 1;

    if (search) {
      countConditions.push(`(p.name ILIKE $${countParamIndex} OR p.description ILIKE $${countParamIndex} OR p.barcode ILIKE $${countParamIndex})`);
      countValues.push(`%${search}%`);
      countParamIndex++;
    }

    if (category && category !== 'all') {
      countConditions.push(`p.category = $${countParamIndex}`);
      countValues.push(category);
      countParamIndex++;
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      products: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, price, stock, category, barcode, cost } = body;

    // Validate required fields
    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, price, stock' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO products (name, description, price, stock, category, barcode, cost, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const values = [name, description, price, stock, category, barcode, cost];
    const result = await pool.query(query, values);

    return NextResponse.json({
      message: 'Producto creado exitosamente',
      product: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    
    // Handle unique constraint violation (duplicate barcode)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'El código de barras ya existe' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
