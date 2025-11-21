const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTestSales() {
  try {
    console.log('🔍 Verificando ventas en la base de datos...');

    // 1. Contar todas las ventas
    const totalSales = await prisma.sale.count();
    console.log(`📊 Total de ventas en BD: ${totalSales}`);

    // 2. Obtener todas las ventas con detalles
    const sales = await prisma.sale.findMany({
      include: {
        customer: {
          select: { name: true }
        },
        user: {
          select: { name: true }
        },
        saleItems: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 Ventas encontradas:');
    sales.forEach((sale, index) => {
      console.log(`\n${index + 1}. Venta ${sale.folio}:`);
      console.log(`   - Método: ${sale.paymentMethod}`);
      console.log(`   - Total: $${sale.total}`);
      console.log(`   - Cliente: ${sale.customer?.name || 'Sin cliente'}`);
      console.log(`   - Vendedor: ${sale.user.name}`);
      console.log(`   - Fecha: ${sale.createdAt}`);
      console.log(`   - Items: ${sale.saleItems.length}`);
      sale.saleItems.forEach(item => {
        console.log(`     * ${item.product.name} x${item.quantity} = $${item.total}`);
      });
    });

    // 3. Breakdown por método de pago
    const paymentBreakdown = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      _sum: { total: true },
      _count: true
    });

    console.log('\n💳 Breakdown por método de pago:');
    paymentBreakdown.forEach(method => {
      console.log(`- ${method.paymentMethod}: ${method._count} ventas, $${method._sum.total || 0}`);
    });

    // 4. Verificar deudas de clientes
    const customersWithDebt = await prisma.customer.findMany({
      where: {
        currentDebt: {
          gt: 0
        }
      },
      select: {
        name: true,
        currentDebt: true
      }
    });

    console.log('\n💰 Clientes con deuda:');
    customersWithDebt.forEach(customer => {
      console.log(`- ${customer.name}: $${customer.currentDebt}`);
    });

    // 5. Verificar qué devolvería la API del dashboard
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const salesFromApi = await prisma.sale.findMany({
      select: {
        total: true,
        paymentMethod: true,
        createdAt: true
      }
    });

    const totalFromApi = salesFromApi.reduce((sum, sale) => sum + Number(sale.total), 0);
    
    console.log('\n🌐 Datos que vería la API del dashboard:');
    console.log(`- Total ventas: ${salesFromApi.length}`);
    console.log(`- Monto total: $${totalFromApi}`);

    // Simular el query del dashboard
    const paymentMethodsQuery = await prisma.$queryRaw`
      SELECT 
        payment_method,
        COUNT(*)::int as count,
        SUM(total)::float as total_amount
      FROM sales 
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;

    console.log('\n📊 Query directo (como lo hace el dashboard):');
    console.log(paymentMethodsQuery);

  } catch (error) {
    console.error('❌ Error verificando ventas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestSales();
