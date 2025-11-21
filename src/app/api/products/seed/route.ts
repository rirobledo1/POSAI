/**
 * Seed de productos de ferretería para testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const sampleProducts = [
  {
    name: 'Martillo Claw 16oz',
    description: 'Martillo de carpintero con mango de fibra de vidrio',
    price: 250.00,
    cost: 150.00,
    stock: 25,
    minStock: 5,
    barcode: '7501234567890',
    featured: true,
    active: true,
    unitOfMeasure: 'PIECE',
    unitQuantity: 1,
    isBulkSale: false
  },
  {
    name: 'Destornillador Phillips #2',
    description: 'Destornillador Phillips punta #2, mango ergonómico',
    price: 45.00,
    cost: 25.00,
    stock: 50,
    minStock: 10,
    barcode: '7501234567891',
    featured: true,
    active: true,
    unitOfMeasure: 'PIECE',
    unitQuantity: 1,
    isBulkSale: false
  },
  {
    name: 'Tornillos para Madera 2"',
    description: 'Tornillos autorroscantes para madera, cabeza phillips',
    price: 15.00,
    cost: 8.00,
    stock: 500,
    minStock: 100,
    barcode: '7501234567892',
    featured: true,
    active: true,
    unitOfMeasure: 'PACK',
    unitQuantity: 25,
    isBulkSale: true
  },
  {
    name: 'Pintura Blanca 1 Galón',
    description: 'Pintura látex blanca para interiores',
    price: 320.00,
    cost: 200.00,
    stock: 15,
    minStock: 3,
    barcode: '7501234567893',
    featured: true,
    active: true,
    unitOfMeasure: 'GALLON',
    unitQuantity: 1,
    isBulkSale: false
  },
  {
    name: 'Clavos 2 1/2"',
    description: 'Clavos comunes para construcción',
    price: 35.00,
    cost: 20.00,
    stock: 200,
    minStock: 50,
    barcode: '7501234567894',
    featured: true,
    active: true,
    unitOfMeasure: 'KG',
    unitQuantity: 1,
    isBulkSale: true
  },
  {
    name: 'Taladro Eléctrico 1/2"',
    description: 'Taladro eléctrico industrial 600W',
    price: 1250.00,
    cost: 850.00,
    stock: 8,
    minStock: 2,
    barcode: '7501234567895',
    featured: true,
    active: true,
    unitOfMeasure: 'PIECE',
    unitQuantity: 1,
    isBulkSale: false
  },
  {
    name: 'Cable Eléctrico 12 AWG',
    description: 'Cable eléctrico de cobre calibre 12',
    price: 25.00,
    cost: 15.00,
    stock: 300,
    minStock: 50,
    barcode: '7501234567896',
    featured: true,
    active: true,
    unitOfMeasure: 'METER',
    unitQuantity: 1,
    isBulkSale: true
  },
  {
    name: 'Lija Grano 120',
    description: 'Papel de lija grano 120 para madera',
    price: 8.00,
    cost: 4.00,
    stock: 100,
    minStock: 20,
    barcode: '7501234567897',
    featured: false,
    active: true,
    unitOfMeasure: 'SHEET',
    unitQuantity: 1,
    isBulkSale: false
  },
  {
    name: 'Pegamento Blanco 250ml',
    description: 'Pegamento blanco escolar para madera',
    price: 22.00,
    cost: 12.00,
    stock: 40,
    minStock: 10,
    barcode: '7501234567898',
    featured: false,
    active: true,
    unitOfMeasure: 'BOTTLE',
    unitQuantity: 250,
    isBulkSale: false
  },
  {
    name: 'Tubo PVC 1/2"',
    description: 'Tubo de PVC hidráulico 1/2 pulgada',
    price: 45.00,
    cost: 25.00,
    stock: 60,
    minStock: 15,
    barcode: '7501234567899',
    featured: false,
    active: true,
    unitOfMeasure: 'METER',
    unitQuantity: 6,
    isBulkSale: false
  }
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado - Solo ADMIN' }, { status: 401 });
    }

    console.log('🌱 Iniciando seed de productos...');

    // Verificar si ya hay productos
    const existingProducts = await prisma.product.count();
    
    if (existingProducts > 0) {
      return NextResponse.json({
        message: `Ya existen ${existingProducts} productos en la base de datos`,
        existing: existingProducts
      });
    }

    // Crear una categoría por defecto
    let category = await prisma.productCategory.findFirst({
      where: { name: 'General' }
    });

    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: 'General',
          description: 'Categoría general para productos de ferretería',
          active: true
        }
      });
    }

    // Crear los productos
    const createdProducts = [];
    for (const productData of sampleProducts) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          categoryId: category.id
        }
      });
      createdProducts.push(product);
    }

    console.log(`✅ Seed completado: ${createdProducts.length} productos creados`);

    return NextResponse.json({
      success: true,
      message: `${createdProducts.length} productos creados exitosamente`,
      products: createdProducts.length,
      category: category.name
    });

  } catch (error) {
    console.error('Error en seed de productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}