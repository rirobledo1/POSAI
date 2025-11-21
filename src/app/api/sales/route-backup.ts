// src/app/api/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Tipos para la API de ventas
interface SaleItemRequest {
  productId: string; // String porque Prisma genera IDs como string
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface SaleRequest {
  customerId?: string; // String porque Prisma genera IDs como string
  items: SaleItemRequest[];
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  notes?: string;
}

// Generar folio único para la venta
function generateSaleFolio(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6); // Últimos 6 dígitos del timestamp
  
  return `V${year}${month}${day}-${time}`;
}

// POST - Procesar nueva venta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos (ADMIN, VENDEDOR pueden procesar ventas)
    if (!['ADMIN', 'VENDEDOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Sin permisos para procesar ventas' },
        { status: 403 }
      );
    }

    const saleData: SaleRequest = await request.json();

    // Validaciones básicas
    if (!saleData.items || saleData.items.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe tener al menos un producto' },
        { status: 400 }
      );
    }

    if (saleData.total <= 0) {
      return NextResponse.json(
        { error: 'El total de la venta debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar stock disponible para todos los productos
    const stockValidation = await Promise.all(
      saleData.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId, active: true },
          select: { id: true, name: true, stock: true, price: true, barcode: true }
        });

        if (!product) {
          return { valid: false, error: `Producto con ID ${item.productId} no encontrado` };
        }

        if (product.stock < item.quantity) {
          return { 
            valid: false, 
            error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` 
          };
        }

        return { valid: true, product };
      })
    );

    // Verificar si algún producto no pasó la validación
    const invalidStock = stockValidation.find(v => !v.valid);
    if (invalidStock) {
      return NextResponse.json(
        { error: invalidStock.error },
        { status: 400 }
      );
    }

    // Verificar límite de crédito si es venta a crédito
    if (saleData.paymentMethod === 'CREDITO' && saleData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: saleData.customerId, active: true },
        select: { creditLimit: true, currentDebt: true, name: true } // Corregido
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Cliente no encontrado' },
          { status: 400 }
        );
      }

      const newCreditTotal = customer.currentDebt.toNumber() + saleData.total;
      if (newCreditTotal > customer.creditLimit.toNumber()) {
        return NextResponse.json(
          { 
            error: `Límite de crédito excedido para ${customer.name}. Límite: $${customer.creditLimit}, Actual: $${customer.currentDebt}, Nueva venta: $${saleData.total}` 
          },
          { status: 400 }
        );
      }
    }

    // Generar folio único
    const folio = generateSaleFolio();

    console.log('🔍 Datos de venta a procesar:', {
      folio,
      customerId: saleData.customerId,
      userId: session.user.id,
      paymentMethod: saleData.paymentMethod,
      itemsCount: saleData.items.length
    });

    // Verificar que el usuario existe
    console.log('🔍 session.user.id:', session.user.id, 'tipo:', typeof session.user.id);
    
    const user = await prisma.user.findUnique({
      where: { id: String(session.user.id) }, // Asegurar que sea string
      select: { id: true, name: true }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado:', session.user.id);
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 400 }
      );
    }

    console.log('✅ Usuario válido:', user.name);

    // Verificar cliente si se especifica
    if (saleData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: saleData.customerId, active: true }, // active existe en el esquema
        select: { id: true, name: true }
      });

      if (!customer) {
        console.error('❌ Cliente no encontrado:', saleData.customerId);
        return NextResponse.json(
          { error: 'Cliente especificado no encontrado' },
          { status: 400 }
        );
      }
      console.log('✅ Cliente válido:', customer.name);
    }

    // Procesar la venta en una transacción
    const result = await prisma.$transaction(async (tx) => {
      console.log('📦 Iniciando transacción de venta...');
      
      // 1. Crear la venta
      console.log('1️⃣ Creando registro de venta:', {
        folio,
        customerId: saleData.customerId || null,
        userId: user.id, // Usar el ID verificado del usuario
        paymentMethod: saleData.paymentMethod
      });
      
      const sale = await tx.sale.create({
        data: {
          folio,
          customerId: saleData.customerId || null,
          userId: user.id, // Usar el ID verificado del usuario
          subtotal: new Decimal(saleData.subtotal),
          tax: new Decimal(saleData.tax),
          total: new Decimal(saleData.total),
          paymentMethod: saleData.paymentMethod,
          notes: saleData.notes || null
        }
      });

      console.log('✅ Venta creada con ID:', sale.id);

      // 2. Crear los items de venta y actualizar stock
      console.log('2️⃣ Procesando', saleData.items.length, 'items de venta...');
      const saleItems = await Promise.all(
        saleData.items.map(async (item) => {
          const product = stockValidation.find(v => v.product?.id === item.productId)?.product!;
          
          // Crear item de venta
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice), // Prisma mapea unit_price automáticamente
              total: new Decimal(item.quantity * item.unitPrice)
            }
          });

          // Actualizar stock del producto
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });

          // Por ahora omitir el inventoryMovement hasta resolver el problema de tipos
          
          return saleItem;
        })
      );

      // 3. Actualizar crédito del cliente si es venta a crédito
      if (saleData.paymentMethod === 'CREDITO' && saleData.customerId) {
        await tx.customer.update({
          where: { id: saleData.customerId },
          data: {
            currentCredit: {
              increment: saleData.total
            }
          }
        });
      }

      return {
        sale,
        items: saleItems
      };
    });

    // Obtener la venta completa con relaciones para la respuesta
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.sale.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rfc: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Venta procesada exitosamente',
      data: {
        sale: completeSale,
        folio: result.sale.folio
      }
    });

  } catch (error) {
    console.error('Error procesando venta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener historial de ventas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentStatus = searchParams.get('paymentStatus');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Obtener ventas con paginación
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.sale.count({ where })
    ]);

    // Calcular estadísticas
    const stats = await prisma.sale.aggregate({
      where,
      _sum: {
        total: true,
        subtotal: true,
        tax: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sales,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalSales: stats._count.id,
          totalAmount: stats._sum.total || 0,
          totalSubtotal: stats._sum.subtotal || 0,
          totalTax: stats._sum.tax || 0
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}