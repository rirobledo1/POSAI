import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acceso denegado. Solo los administradores pueden eliminar productos duplicados.' 
        },
        { status: 403 }
      );
    }

    console.log(`🔍 Administrador ${session.user.name} iniciando eliminación de duplicados...`);
    
    // Obtener todos los productos activos usando SQL directo
    const allProducts = await prisma.$queryRaw`
      SELECT id, name, stock, created_at as "createdAt"
      FROM products 
      WHERE active = true 
      ORDER BY created_at DESC
    ` as Array<{
      id: string;
      name: string;
      stock: number;
      createdAt: Date;
    }>;
    
    console.log(`📊 Total de productos encontrados: ${allProducts.length}`);
    
    // Agrupar por nombre normalizado
    const productGroups: Record<string, typeof allProducts> = {};
    
    allProducts.forEach(product => {
      const normalizedName = product.name.toLowerCase().trim();
      if (!productGroups[normalizedName]) {
        productGroups[normalizedName] = [];
      }
      productGroups[normalizedName].push(product);
    });
    
    // Encontrar duplicados
    const duplicateGroups: Array<{
      normalizedName: string;
      products: typeof allProducts;
      count: number;
    }> = [];
    
    Object.entries(productGroups).forEach(([normalizedName, products]) => {
      if (products.length > 1) {
        duplicateGroups.push({
          normalizedName,
          products,
          count: products.length
        });
      }
    });
    
    if (duplicateGroups.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron productos duplicados',
        duplicatesFound: 0,
        duplicatesRemoved: 0
      });
    }
    
    console.log(`📊 Encontrados ${duplicateGroups.length} grupos de productos duplicados`);
    
    let totalDeactivated = 0;
    const consolidationResults = [];
    
    // Procesar cada grupo de duplicados
    for (const group of duplicateGroups) {
      const sortedProducts = group.products.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const keepProduct = sortedProducts[0]; // Mantener el más reciente
      const deactivateProducts = sortedProducts.slice(1); // Marcar como inactivos el resto
      const totalStock = sortedProducts.reduce((sum, p) => sum + p.stock, 0);
      
      console.log(`📦 Procesando: "${keepProduct.name}"`);
      
      // 1. Actualizar el stock del producto que se mantiene
      await prisma.product.update({
        where: { id: keepProduct.id },
        data: { 
          stock: totalStock,
          updatedAt: new Date()
        }
      });
      
      console.log(`   ✅ Stock consolidado: ${totalStock} unidades`);
      
      // 2. Transferir referencias de ventas y marcar como inactivos
      for (const deactivateProduct of deactivateProducts) {
        // Transferir referencias en sale_items
        await prisma.saleItem.updateMany({
          where: { productId: deactivateProduct.id },
          data: { productId: keepProduct.id }
        });
        
        // Marcar como inactivo y renombrar usando SQL directo
        await prisma.$executeRaw`
          UPDATE products 
          SET active = false, 
              name = ${deactivateProduct.name + ' [DUPLICADO-INACTIVO-' + Date.now() + ']'},
              updated_at = NOW()
          WHERE id = ${deactivateProduct.id}
        `;
      }
      
      totalDeactivated += deactivateProducts.length;
      console.log(`   🗑️  Marcados como inactivos ${deactivateProducts.length} productos duplicados`);
      
      consolidationResults.push({
        productName: keepProduct.name,
        keptId: keepProduct.id,
        deactivatedIds: deactivateProducts.map(p => p.id),
        consolidatedStock: totalStock,
        deactivatedCount: deactivateProducts.length
      });
    }
    
    // Verificar resultado final usando SQL directo
    const finalProductsResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM products WHERE active = true
    ` as Array<{ count: bigint }>;
    
    const finalProductCount = Number(finalProductsResult[0].count);
    
    console.log('✅ Proceso completado exitosamente!');
    console.log(`📊 Total de productos activos: ${finalProductCount}`);

    // Log de auditoría detallado
    console.log(`🔐 AUDIT LOG - User: ${session.user.name} (${session.user.id})`);
    console.log(`🔐 Action: REMOVE_DUPLICATES`);
    console.log(`🔐 Results: ${duplicateGroups.length} groups, ${totalDeactivated} deactivated`);
    
    return NextResponse.json({
      success: true,
      message: 'Productos duplicados procesados exitosamente',
      duplicateGroupsFound: duplicateGroups.length,
      totalProductsDeactivated: totalDeactivated,
      finalProductCount: finalProductCount,
      consolidationResults
    });
    
  } catch (error) {
    console.error('❌ Error eliminando duplicados:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
