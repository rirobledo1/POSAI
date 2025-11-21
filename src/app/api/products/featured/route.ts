// src/app/api/products/featured/route.ts
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
    const limit = parseInt(searchParams.get('limit') || '50'); // Límite por defecto para productos destacados
    const includeStock = searchParams.get('includeStock') !== 'false';

    console.log(`🌟 API Featured Products - Params: limit=${limit}, includeStock=${includeStock}`);

    // Query optimizada para productos destacados activos
    let query = `
      SELECT 
        id,
        name,
        description,
        price,
        stock,
        category_id,
        barcode,
        featured,
        active,
        created_at,
        updated_at
      FROM products
      WHERE featured = true AND active = true
    `;
    
    const conditions = [];
    const values = [];

    // Filtrar productos con stock si se requiere
    if (includeStock) {
      conditions.push('stock > 0');
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Ordenar por nombre para consistencia
    query += ` ORDER BY name ASC LIMIT $${values.length + 1}`;
    values.push(limit);

    console.log(`📝 Featured Query: ${query}`);
    console.log(`📝 Values: ${JSON.stringify(values)}`);

    const result = await pool.query(query, values);
    console.log(`✅ Featured query executed successfully, rows: ${result.rows.length}`);

    // Transformar datos para mantener compatibilidad con el formato existente
    const featuredProducts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      stock: row.stock,
      categoryId: row.category_id,
      barcode: row.barcode,
      featured: row.featured,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      products: featuredProducts,
      count: featuredProducts.length,
      isFeatured: true
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al obtener productos destacados' 
      },
      { status: 500 }
    );
  }
}

// Endpoint para marcar/desmarcar productos como destacados (solo ADMIN)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado - Solo administradores' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, featured } = body;

    if (!productId || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Campos requeridos: productId (string), featured (boolean)' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE products 
      SET featured = $1, updated_at = NOW() 
      WHERE id = $2 AND active = true
      RETURNING id, name, featured
    `;

    const result = await pool.query(query, [featured, productId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado o inactivo' },
        { status: 404 }
      );
    }

    const updatedProduct = result.rows[0];
    console.log(`🌟 Product featured status updated: ${updatedProduct.name} -> ${featured}`);

    return NextResponse.json({
      success: true,
      message: `Producto ${featured ? 'marcado como destacado' : 'removido de destacados'}`,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        featured: updatedProduct.featured
      }
    });

  } catch (error) {
    console.error('Error updating featured status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al actualizar producto destacado' 
      },
      { status: 500 }
    );
  }
}