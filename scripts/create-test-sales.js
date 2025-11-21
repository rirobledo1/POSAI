const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSale() {
  try {
    console.log('🛍️ Creando venta de prueba...');

    // 1. Obtener usuario admin
    const user = await prisma.user.findFirst({
      where: { email: 'admin@ferreai.com' }
    });
    
    if (!user) {
      console.log('❌ No se encontró el usuario admin');
      return;
    }
    
    console.log(`👤 Usuario encontrado: ${user.name} (${user.email})`);

    // 2. Obtener un cliente
    const customer = await prisma.customer.findFirst({
      where: { active: true }
    });
    
    if (!customer) {
      console.log('❌ No se encontraron clientes activos');
      return;
    }
    
    console.log(`👤 Cliente encontrado: ${customer.name}`);

    // 3. Obtener productos disponibles
    const products = await prisma.product.findMany({
      where: { 
        active: true,
        stock: { gt: 0 }
      },
      take: 3
    });
    
    if (products.length === 0) {
      console.log('❌ No se encontraron productos con stock');
      return;
    }
    
    console.log(`📦 Productos encontrados: ${products.length}`);
    products.forEach(p => console.log(`  - ${p.name}: $${p.price} (Stock: ${p.stock})`));

    // 4. Crear la venta con CREDITO
    const saleData = {
      folio: `TEST-${Date.now()}`,
      customerId: customer.id,
      userId: user.id,
      paymentMethod: 'CREDITO',
      subtotal: 100.00,
      tax: 16.00,
      total: 116.00,
      status: 'COMPLETED',
      notes: 'Venta de prueba - método CREDITO'
    };

    const sale = await prisma.sale.create({
      data: saleData
    });
    
    console.log(`✅ Venta creada: ${sale.folio} - Total: $${sale.total}`);

    // 5. Agregar items de la venta
    const saleItem = await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: products[0].id,
        quantity: 1,
        unitPrice: products[0].price,
        total: products[0].price
      }
    });
    
    console.log(`📦 Item agregado: ${products[0].name} x1`);

    // 6. Actualizar deuda del cliente (para ventas a crédito)
    if (sale.paymentMethod === 'CREDITO') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          currentDebt: {
            increment: sale.total
          }
        }
      });
      console.log(`💳 Deuda del cliente actualizada: +$${sale.total}`);
    }

    // 7. Crear segunda venta con EFECTIVO
    const saleData2 = {
      folio: `TEST-${Date.now() + 1}`,
      customerId: null, // Venta sin cliente
      userId: user.id,
      paymentMethod: 'EFECTIVO',
      subtotal: 50.00,
      tax: 8.00,
      total: 58.00,
      paidAmount: 60.00,
      changeAmount: 2.00,
      status: 'COMPLETED',
      notes: 'Venta de prueba - método EFECTIVO'
    };

    const sale2 = await prisma.sale.create({
      data: saleData2
    });
    
    console.log(`✅ Segunda venta creada: ${sale2.folio} - Total: $${sale2.total}`);

    const saleItem2 = await prisma.saleItem.create({
      data: {
        saleId: sale2.id,
        productId: products[1].id,
        quantity: 1,
        unitPrice: products[1].price,
        total: products[1].price
      }
    });
    
    console.log(`📦 Item agregado: ${products[1].name} x1`);

    // 8. Crear tercera venta con TARJETA
    const saleData3 = {
      folio: `TEST-${Date.now() + 2}`,
      customerId: null,
      userId: user.id,
      paymentMethod: 'TARJETA',
      subtotal: 75.00,
      tax: 12.00,
      total: 87.00,
      status: 'COMPLETED',
      notes: 'Venta de prueba - método TARJETA'
    };

    const sale3 = await prisma.sale.create({
      data: saleData3
    });
    
    console.log(`✅ Tercera venta creada: ${sale3.folio} - Total: $${sale3.total}`);

    const saleItem3 = await prisma.saleItem.create({
      data: {
        saleId: sale3.id,
        productId: products[2] ? products[2].id : products[0].id,
        quantity: 1,
        unitPrice: products[2] ? products[2].price : products[0].price,
        total: products[2] ? products[2].price : products[0].price
      }
    });
    
    console.log(`📦 Item agregado: ${products[2] ? products[2].name : products[0].name} x1`);

    // 9. Verificar totales
    const totalSales = await prisma.sale.count();
    const totalAmount = await prisma.sale.aggregate({
      _sum: { total: true }
    });
    
    console.log('\n📊 Resumen de ventas creadas:');
    console.log(`- Total de ventas: ${totalSales}`);
    console.log(`- Monto total: $${totalAmount._sum.total || 0}`);
    
    // 10. Mostrar breakdown por método de pago
    const paymentBreakdown = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      _sum: { total: true },
      _count: true
    });
    
    console.log('\n💳 Breakdown por método de pago:');
    paymentBreakdown.forEach(method => {
      console.log(`- ${method.paymentMethod}: ${method._count} ventas, $${method._sum.total || 0}`);
    });

  } catch (error) {
    console.error('❌ Error creando venta de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSale();
