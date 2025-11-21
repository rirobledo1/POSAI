// src/app/api/categories/route.ts - MULTI-TENANT
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';
import { getCompanyIdFromSession } from '@/lib/session-helpers';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession();

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // 🆕 CRITICAL: Query con filtro de companyId
    let countQuery = `
      SELECT COUNT(*) as total
      FROM categories c
      WHERE c.company_id = $1
    `;
    
    let mainQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.active,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.active = true AND p.company_id = $1
      WHERE c.company_id = $1
    `;

    const params: any[] = [companyId];
    let paramIndex = 2;

    // Aplicar filtros
    if (search) {
      const searchCondition = ` AND (LOWER(c.name) LIKE LOWER($${paramIndex}) OR LOWER(c.description) LIKE LOWER($${paramIndex}))`;
      countQuery += searchCondition;
      mainQuery += searchCondition;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (active !== null && active !== '') {
      const activeCondition = ` AND c.active = $${paramIndex}`;
      countQuery += activeCondition;
      mainQuery += activeCondition;
      params.push(active === 'true');
      paramIndex++;
    }

    mainQuery += ` GROUP BY c.id, c.name, c.description, c.active, c.created_at, c.updated_at`;
    
    const validSortFields = ['name', 'description', 'active', 'created_at', 'updated_at', 'product_count'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    const finalSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    
    if (finalSortBy === 'product_count') {
      mainQuery += ` ORDER BY product_count ${finalSortOrder}, c.name ASC`;
    } else {
      mainQuery += ` ORDER BY c.${finalSortBy} ${finalSortOrder}`;
    }

    mainQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const mainQueryParams = [...params, limit, offset];
    const countQueryParams = [...params];

    const [countResult, categoriesResult] = await Promise.all([
      pool.query(countQuery, countQueryParams),
      pool.query(mainQuery, mainQueryParams)
    ]);

    const totalCategories = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCategories / limit);
    
    const categories = categoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      active: row.active,
      productCount: parseInt(row.product_count) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log(`✅ Categories fetched for company ${companyId}: ${categories.length}`);

    return NextResponse.json({ 
      success: true, 
      categories,
      pagination: {
        page: page,
        limit: limit,
        total: totalCategories,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        active,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder
      }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva categoría
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession();

    // Verificar permisos
    if (!['ADMIN', 'ALMACEN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos para crear categorías' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, active = true } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // 🆕 CRITICAL: Verificar duplicados solo en la compañía
    const duplicateCheck = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND company_id = $2',
      [name.trim(), companyId]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre en tu empresa' },
        { status: 400 }
      );
    }

    // Generar ID único
    const categoryId = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // 🆕 CRITICAL: Verificar ID solo en la compañía
    const idCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND company_id = $2',
      [categoryId, companyId]
    );

    let finalCategoryId = categoryId;
    if (idCheck.rows.length > 0) {
      const timestamp = Date.now().toString().slice(-6);
      finalCategoryId = `${categoryId}-${timestamp}`;
    }

    // 🆕 CRITICAL: Crear categoría con companyId
    const createResult = await pool.query(`
      INSERT INTO categories (id, name, description, active, company_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, description, active, created_at, updated_at
    `, [finalCategoryId, name.trim(), description || null, active, companyId]);

    const newCategory = {
      ...createResult.rows[0],
      productCount: 0,
      createdAt: createResult.rows[0].created_at,
      updatedAt: createResult.rows[0].updated_at
    };

    console.log(`✅ Category created for company ${companyId}`);

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: 'Categoría creada correctamente'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
