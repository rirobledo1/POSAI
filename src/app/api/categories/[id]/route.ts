// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface Params {
  id: string;
}

// GET - Obtener una categoría específica
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const categoryId = params.id;

    const result = await pool.query(`
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
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.active, c.created_at, c.updated_at
    `, [categoryId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const category = {
      ...result.rows[0],
      productCount: parseInt(result.rows[0].product_count),
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    return NextResponse.json({
      success: true,
      category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (solo ADMIN y ALMACEN pueden editar categorías)
    if (!['ADMIN', 'ALMACEN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sin permisos para editar categorías' }, { status: 403 });
    }

    const categoryId = params.id;
    const body = await request.json();
    const { name, description, active } = body;

    // Validaciones
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      );
    }

    // Verificar si la categoría existe
    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Verificar duplicados de nombre (excluyendo la categoría actual)
    const duplicateCheck = await pool.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name.trim(), categoryId]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      );
    }

    // Actualizar la categoría
    const updateResult = await pool.query(`
      UPDATE categories 
      SET 
        name = $1,
        description = $2,
        active = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING 
        id, name, description, active, created_at, updated_at
    `, [name.trim(), description || null, active, categoryId]);

    const updatedCategory = {
      ...updateResult.rows[0],
      createdAt: updateResult.rows[0].created_at,
      updatedAt: updateResult.rows[0].updated_at
    };

    return NextResponse.json({
      success: true,
      category: updatedCategory,
      message: 'Categoría actualizada correctamente'
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (solo ADMIN puede eliminar categorías)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos para eliminar categorías' }, { status: 403 });
    }

    const categoryId = params.id;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Verificar si la categoría existe
    const categoryExists = await pool.query(
      'SELECT id, name FROM categories WHERE id = $1',
      [categoryId]
    );

    if (categoryExists.rows.length === 0) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const categoryName = categoryExists.rows[0].name;

    // Verificar si hay productos asociados
    const productsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [categoryId]
    );

    const productCount = parseInt(productsCheck.rows[0].count);

    if (productCount > 0 && !force) {
      // Hay productos asociados, no permitir eliminación
      return NextResponse.json(
        {
          error: 'No se puede eliminar la categoría porque tiene productos asociados',
          code: 'HAS_PRODUCTS',
          message: `La categoría "${categoryName}" no se puede eliminar porque tiene productos asociados.`,
          details: {
            productCount
          },
          suggestion: 'Puedes marcar la categoría como inactiva para que no aparezca en nuevos productos, pero conserve el historial existente.'
        },
        { status: 400 }
      );
    }

    if (force) {
      // Forzar desactivación en lugar de eliminación
      await pool.query(
        'UPDATE categories SET active = false, updated_at = NOW() WHERE id = $1',
        [categoryId]
      );

      return NextResponse.json({
        success: true,
        message: `Categoría "${categoryName}" marcada como inactiva correctamente`
      });
    } else {
      // Eliminar la categoría (solo si no tiene productos)
      await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);

      return NextResponse.json({
        success: true,
        message: `Categoría "${categoryName}" eliminada correctamente`
      });
    }

  } catch (error) {
    console.error('Error deleting category:', error);
    
    // Verificar si es un error de constraint de foreign key
    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar la categoría porque tiene referencias en el sistema',
          code: 'HAS_REFERENCES',
          suggestion: 'Intenta marcar la categoría como inactiva en lugar de eliminarla.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}