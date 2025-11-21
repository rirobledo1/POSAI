// src/app/api/products/[id]/route.ts - MULTI-TENANT
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';
import { getCompanyIdFromSession } from '@/lib/session-helpers';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ferreai_dev',
  user: 'postgres',
  password: 'admin123',
  max: 10,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['ADMIN', 'ALMACEN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession();

    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      description, 
      barcode, 
      price, 
      cost, 
      stock, 
      minStock, 
      categoryId, 
      active,
      featured
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, categoryId' },
        { status: 400 }
      );
    }

    if (!price) {
      return NextResponse.json(
        { error: 'Campo requerido: price' },
        { status: 400 }
      );
    }

    // Generar barcode automático si no se proporciona
    let finalBarcode = barcode;
    if (!finalBarcode || finalBarcode.trim() === '') {
      finalBarcode = `BC-${Date.now()}-${id.slice(-6)}`;
    }

    // 🆕 CRITICAL: Actualizar solo si pertenece a la compañía
    const query = `
      UPDATE products SET 
        name = $1,
        description = $2,
        barcode = $3,
        price = $4,
        cost = $5,
        stock = $6,
        min_stock = $7,
        category_id = $8,
        active = $9,
        featured = $10,
        updated_at = NOW()
      WHERE id = $11 AND company_id = $12
      RETURNING id, name, description, barcode, price, cost, stock, min_stock, 
                category_id, active, featured,
                image_url, thumbnail_url, has_image, created_at, updated_at
    `;

    const result = await pool.query(query, [
      name, 
      description, 
      finalBarcode, 
      parseFloat(price || 0), 
      parseFloat(cost || 0),
      parseInt(stock || 0), 
      parseInt(minStock || 5),
      categoryId, 
      active !== undefined ? active : true,
      featured || false,
      id,
      companyId  // ← CRÍTICO: Verificar ownership
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado o no pertenece a tu empresa' },
        { status: 404 }
      );
    }

    const product = result.rows[0];

    console.log(`✅ Product updated for company ${companyId}`);

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        barcode: product.barcode,
        price: parseFloat(product.price),
        cost: parseFloat(product.cost),
        stock: parseInt(product.stock),
        minStock: parseInt(product.min_stock),
        categoryId: product.category_id,
        active: product.active,
        featured: product.featured,
        imageUrl: product.image_url,
        thumbnailUrl: product.thumbnail_url,
        hasImage: Boolean(product.has_image),
        createdAt: product.created_at,
        updatedAt: product.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🆕 MULTI-TENANT: Obtener companyId
    const companyId = await getCompanyIdFromSession();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get('force') === 'true';

    // 🆕 CRITICAL: Verificar producto pertenece a la compañía
    const productCheck = await pool.query(
      'SELECT name, active FROM products WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );

    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado o no pertenece a tu empresa' },
        { status: 404 }
      );
    }

    const product = productCheck.rows[0];

    if (!product.active) {
      return NextResponse.json(
        { error: 'El producto ya está eliminado (inactivo)' },
        { status: 400 }
      );
    }

    if (!forceDelete) {
      // 🆕 CRITICAL: Verificar ventas solo de la compañía
      const salesCheck = await pool.query(`
        SELECT COUNT(*) as sale_count,
               MIN(s.created_at) as first_sale,
               MAX(s.created_at) as last_sale
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id AND s.company_id = $2
        WHERE si.product_id = $1
      `, [id, companyId]);

      const salesData = salesCheck.rows[0];
      const hasSales = parseInt(salesData.sale_count) > 0;

      // 🆕 CRITICAL: Verificar movimientos solo de la compañía
      const movementsCheck = await pool.query(`
        SELECT COUNT(*) as movement_count
        FROM inventory_movements
        WHERE product_id = $1 AND company_id = $2
      `, [id, companyId]);

      const hasMovements = parseInt(movementsCheck.rows[0].movement_count) > 0;

      if (hasSales || hasMovements) {
        const details = {
          productName: product.name,
          hasSales,
          hasMovements,
          salesCount: parseInt(salesData.sale_count),
          firstSale: salesData.first_sale,
          lastSale: salesData.last_sale,
          movementCount: parseInt(movementsCheck.rows[0].movement_count)
        };

        return NextResponse.json({
          error: 'No se puede eliminar el producto',
          code: 'HAS_REFERENCES',
          message: `El producto "${product.name}" tiene referencias en el sistema`,
          details,
          suggestion: 'El producto se marcará como inactivo para preservar el historial'
        }, { status: 409 });
      }
    }

    // 🆕 CRITICAL: Soft delete solo si pertenece a la compañía
    const query = `
      UPDATE products SET 
        active = false,
        updated_at = NOW()
      WHERE id = $1 AND company_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, companyId]);

    console.log(`✅ Product deleted for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: forceDelete 
        ? 'Producto marcado como inactivo correctamente'
        : 'Producto eliminado correctamente',
      details: {
        productName: product.name,
        wasForced: forceDelete
      }
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
