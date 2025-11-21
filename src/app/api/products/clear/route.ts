import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    // Eliminar productos primero (debido a foreign keys)
    const deletedProducts = await prisma.product.deleteMany();
    
    // Eliminar categorías
    const deletedCategories = await prisma.categories.deleteMany();

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      deleted: {
        products: deletedProducts.count,
        categories: deletedCategories.count
      }
    });

  } catch (error) {
    console.error('Error al limpiar la base de datos:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor al limpiar la base de datos'
    }, { status: 500 });
  }
}