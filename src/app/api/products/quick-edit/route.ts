import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Límites para vendedores (podrían venir de configuración de empresa)
const VENDOR_LIMITS = {
  maxPriceIncrease: 0.20, // 20% máximo de aumento
  maxPriceDecrease: 0.10, // 10% máximo de descuento
  maxStockAdjustment: 50,  // ±50 unidades máximo
  canChangeCost: false,    // No pueden cambiar costo
  requiresApproval: true   // Cambios requieren aprobación
};

interface QuickEditData {
  id?: string;
  name: string;
  price: number;
  unitCost?: number;
  stock: number;
  barcode?: string;
  category?: string;
  description?: string;
  minStock?: number;
  userRole: 'ADMIN' | 'VENDEDOR';
  isNewProduct: boolean;
  requiresApproval?: boolean;
}

function validateVendorChanges(
  originalProduct: any,
  newData: QuickEditData,
  userRole: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (userRole !== 'VENDEDOR') {
    return { isValid: true, errors: [] };
  }

  if (!originalProduct && !newData.isNewProduct) {
    errors.push('Producto original no encontrado');
    return { isValid: false, errors };
  }

  // Para productos existentes, validar límites
  if (originalProduct && !newData.isNewProduct) {
    // Validar precio
    const originalPrice = originalProduct.price.toNumber();
    const priceIncrease = (newData.price - originalPrice) / originalPrice;
    const priceDecrease = (originalPrice - newData.price) / originalPrice;

    if (priceIncrease > VENDOR_LIMITS.maxPriceIncrease) {
      errors.push(`El aumento de precio (${(priceIncrease * 100).toFixed(1)}%) excede el límite permitido (${VENDOR_LIMITS.maxPriceIncrease * 100}%)`);
    }
    
    if (priceDecrease > VENDOR_LIMITS.maxPriceDecrease) {
      errors.push(`El descuento (${(priceDecrease * 100).toFixed(1)}%) excede el límite permitido (${VENDOR_LIMITS.maxPriceDecrease * 100}%)`);
    }

    // Validar stock
    const stockChange = Math.abs(newData.stock - originalProduct.stock);
    if (stockChange > VENDOR_LIMITS.maxStockAdjustment) {
      errors.push(`El ajuste de stock (${stockChange} unidades) excede el límite permitido (±${VENDOR_LIMITS.maxStockAdjustment} unidades)`);
    }

    // Validar costo (vendedores no pueden cambiar)
    if (newData.unitCost && !VENDOR_LIMITS.canChangeCost) {
      const originalCost = originalProduct.cost?.toNumber() || 0;
      if (Math.abs(newData.unitCost - originalCost) > 0.01) {
        errors.push('Los vendedores no pueden modificar el costo del producto');
      }
    }
  }

  // Para productos nuevos, validaciones básicas
  if (newData.isNewProduct) {
    if (!newData.name || newData.name.trim().length < 3) {
      errors.push('El nombre del producto debe tener al menos 3 caracteres');
    }
    
    if (newData.price <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }
    
    if (newData.stock < 0) {
      errors.push('El stock no puede ser negativo');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data: QuickEditData = await request.json();
    console.log('📝 Procesando edición rápida:', data);

    // Verificar usuario y rol
    const user = await prisma.user.findUnique({
      where: { id: String(session.user.id) },
      select: { id: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 400 }
      );
    }

    // Verificar que el rol del usuario coincida con el enviado
    if (user.role !== data.userRole) {
      return NextResponse.json(
        { error: 'Rol de usuario no coincide' },
        { status: 403 }
      );
    }

    let originalProduct = null;

    // Si es edición, obtener producto original
    if (!data.isNewProduct && data.id) {
      originalProduct = await prisma.product.findUnique({
        where: { id: data.id }
      });

      if (!originalProduct) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        );
      }
    }

    // Validar cambios según el rol
    const validation = validateVendorChanges(originalProduct, data, user.role);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Cambios no permitidos',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    let result;

    if (data.isNewProduct) {
      // Crear nuevo producto
      console.log('➕ Creando nuevo producto...');
      
      // Generar código de barras si no se proporciona
      let barcode = data.barcode;
      if (!barcode) {
        const timestamp = Date.now().toString();
        barcode = `PRD${timestamp.slice(-10)}`;
      }

      // Verificar que el código de barras no exista
      if (barcode) {
        const existingProduct = await prisma.product.findFirst({
          where: { barcode }
        });
        
        if (existingProduct) {
          return NextResponse.json(
            { error: 'El código de barras ya existe' },
            { status: 400 }
          );
        }
      }

      // Buscar o crear categoría si se proporciona
      let categoryId = null;
      if (data.category && data.category.trim()) {
        const categoryName = data.category.trim();
        
        // Buscar categoría existente
        let category = await prisma.categories.findFirst({
          where: { 
            name: {
              equals: categoryName,
              mode: 'insensitive'
            }
          }
        });

        // Si no existe, crear nueva categoría
        if (!category) {
          category = await prisma.categories.create({
            data: {
              id: `cat_${Date.now()}`,
              name: categoryName,
              description: `Categoría creada automáticamente`,
              active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }
        
        categoryId = category.id;
      } else {
        // Categoría por defecto
        let defaultCategory = await prisma.categories.findFirst({
          where: { name: 'General' }
        });

        if (!defaultCategory) {
          defaultCategory = await prisma.categories.create({
            data: {
              id: 'cat_general',
              name: 'General',
              description: 'Categoría general para productos',
              active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }
        
        categoryId = defaultCategory.id;
      }

      result = await prisma.product.create({
        data: {
          name: data.name.trim(),
          price: new Decimal(data.price),
          cost: new Decimal(data.unitCost || 0),
          stock: data.stock,
          barcode: barcode,
          categoryId: categoryId,
          description: data.description?.trim() || null,
          minStock: data.minStock || 5,
          active: true,
          // Si es vendedor y requiere aprobación, marcarlo como pendiente
          ...(data.userRole === 'VENDEDOR' && VENDOR_LIMITS.requiresApproval && {
            active: false // Requiere aprobación
          })
        }
      });

      console.log('✅ Producto creado:', result.id);

    } else {
      // Editar producto existente
      console.log('✏️ Editando producto existente...');
      
      if (!originalProduct) {
        throw new Error('Producto original no encontrado');
      }
      
      const updateData: any = {
        name: data.name.trim(),
        price: new Decimal(data.price),
        stock: data.stock,
        minStock: data.minStock || originalProduct.minStock,
        updatedAt: new Date()
      };

      // Solo admins o si el vendedor puede cambiar costo
      if (data.userRole === 'ADMIN' || VENDOR_LIMITS.canChangeCost) {
        if (data.unitCost !== undefined) {
          updateData.cost = new Decimal(data.unitCost);
        }
      }

      // Campos opcionales
      if (data.barcode !== undefined) updateData.barcode = data.barcode.trim() || '';
      if (data.description !== undefined) updateData.description = data.description.trim() || null;

      // Manejar categoría si se proporciona
      if (data.category && data.category.trim()) {
        const categoryName = data.category.trim();
        
        // Buscar categoría existente
        let category = await prisma.categories.findFirst({
          where: { 
            name: {
              equals: categoryName,
              mode: 'insensitive'
            }
          }
        });

        // Si no existe, crear nueva categoría
        if (!category) {
          category = await prisma.categories.create({
            data: {
              id: `cat_${Date.now()}`,
              name: categoryName,
              description: `Categoría creada automáticamente`,
              active: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
        }
        
        updateData.categoryId = category.id;
      }

      result = await prisma.product.update({
        where: { id: data.id },
        data: updateData
      });

      console.log('✅ Producto actualizado:', result.id);
    }

    // Calcular margen de ganancia
    const margin = result.cost.toNumber() > 0 
      ? ((result.price.toNumber() - result.cost.toNumber()) / result.cost.toNumber()) * 100 
      : 0;

    // Obtener el nombre de la categoría para la respuesta
    const categoryInfo = await prisma.categories.findUnique({
      where: { id: result.categoryId },
      select: { name: true }
    });

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      product: {
        id: result.id,
        name: result.name,
        price: result.price.toNumber(),
        unitCost: result.cost.toNumber(),
        stock: result.stock,
        barcode: result.barcode,
        category: categoryInfo?.name || null,
        description: result.description,
        minStock: result.minStock,
        profitMargin: Math.round(margin),
        isActive: result.active
      },
      message: data.isNewProduct 
        ? `Producto ${data.userRole === 'VENDEDOR' && VENDOR_LIMITS.requiresApproval ? 'creado y enviado para aprobación' : 'creado exitosamente'}`
        : 'Producto actualizado exitosamente',
      requiresApproval: data.userRole === 'VENDEDOR' && VENDOR_LIMITS.requiresApproval && !result.active
    });

  } catch (error) {
    console.error('❌ Error en edición rápida:', error);
    
    // Errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese código de barras' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener límites de vendedor (opcional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      vendorLimits: VENDOR_LIMITS,
      message: 'Límites de vendedor obtenidos exitosamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo límites:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}