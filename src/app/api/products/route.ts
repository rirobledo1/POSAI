// src/app/api/products/route.ts - MULTI-TENANT VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';
import { prisma } from '@/lib/prisma';
import { getCompanyIdFromSession, withCompanyFilter } from '@/lib/session-helpers';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 MULTI-TENANT: Obtener companyId de la sesión
    const companyId = await getCompanyIdFromSession();
    console.log(`🏢 Company ID: ${companyId}`);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || searchParams.get('categoryId') || '';
    const active = searchParams.get('active') === 'true';
    const hasStock = searchParams.get('hasStock') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    // Soportar tanto 'offset' directo como 'page'
    const offsetParam = searchParams.get('offset');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = offsetParam ? parseInt(offsetParam) : (page - 1) * limit;

    console.log(`🔍 API Products - Params: search="${search}", category="${category}", active=${active}, hasStock=${hasStock}, page=${page}, limit=${limit}`);

    // Query con filtro de companyId
    let query = `
      SELECT 
        id,
        name,
        description,
        price,
        cost,
        stock,
        min_stock,
        category_id,
        barcode,
        featured,
        active,
        image_url,
        thumbnail_url,
        has_image,
        created_at,
        updated_at,
        company_id
      FROM products
    `;
    
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // 🆕 CRITICAL: Filtrar por companyId SIEMPRE
    conditions.push(`company_id = $${paramIndex}`);
    values.push(companyId);
    paramIndex++;

    // Filter by stock based on parameters
    if (hasStock) {
      conditions.push('stock > 0');
    } else {
      conditions.push('stock >= 0');
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR barcode ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category && category !== 'all') {
      conditions.push(`category_id = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    console.log(`📝 Query: ${query}`);
    console.log(`📝 Values: ${JSON.stringify(values)}`);

    const result = await pool.query(query, values);
    console.log(`✅ Query executed successfully, rows: ${result.rows.length}`);

    // Transformar los datos
    const transformedProducts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price) || 0,
      cost: parseFloat(row.cost) || 0,
      stock: parseInt(row.stock) || 0,
      minStock: parseInt(row.min_stock) || 0,
      categoryId: row.category_id,
      barcode: row.barcode,
      featured: Boolean(row.featured),
      active: Boolean(row.active),
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
      hasImage: Boolean(row.has_image),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // Count query con filtro de companyId
    let countQuery = `SELECT COUNT(*) as total FROM products`;
    const countConditions = [];
    const countValues = [];
    let countParamIndex = 1;

    // 🆕 CRITICAL: Filtrar por companyId SIEMPRE
    countConditions.push(`company_id = $${countParamIndex}`);
    countValues.push(companyId);
    countParamIndex++;

    if (hasStock) {
      countConditions.push('stock > 0');
    } else {
      countConditions.push('stock >= 0');
    }

    if (search) {
      countConditions.push(`(name ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex} OR barcode ILIKE $${countParamIndex})`);
      countValues.push(`%${search}%`);
      countParamIndex++;
    }

    if (category && category !== 'all') {
      countConditions.push(`category_id = $${countParamIndex}`);
      countValues.push(category);
      countParamIndex++;
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    console.log(`📊 Total products for company: ${total}, returning: ${result.rows.length}`);

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        total,
        limit,
        offset,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      },
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

    // 🆕 MULTI-TENANT: Obtener companyId de la sesión
    const companyId = await getCompanyIdFromSession();

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      cost,
      stock, 
      minStock,
      categoryId,
      barcode,
      featured,
      active
    } = body;

    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, price, stock' },
        { status: 400 }
      );
    }

    // Generar barcode automático si no se proporciona
    let finalBarcode = barcode?.trim();
    if (!finalBarcode) {
      const timestamp = Date.now();
      const nameCode = name.trim().substring(0, 3).toUpperCase();
      finalBarcode = `${nameCode}${timestamp}`;
    }

    // 🆕 MULTI-TENANT: Crear producto con companyId
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 5,
        barcode: finalBarcode,
        featured: Boolean(featured),
        active: active !== undefined ? Boolean(active) : true,
        categoryId: categoryId || 'FERRET001', // ✅ Usar categoryId directamente
        companyId: companyId // ✅ Usar companyId directamente
      }
    });

    console.log(`✅ Product created for company: ${companyId}`);

    return NextResponse.json({
      message: 'Producto creado exitosamente',
      product: product
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('barcode')) {
      return NextResponse.json(
        { error: 'El código de barras ya existe. Por favor, usa uno diferente.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
