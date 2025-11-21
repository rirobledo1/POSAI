const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('🔍 Verificación rápida...');
    
    const count = await prisma.sale.count();
    console.log(`Ventas en BD: ${count}`);
    
    if (count > 0) {
      const sales = await prisma.sale.findMany({
        select: {
          folio: true,
          paymentMethod: true,
          total: true
        }
      });
      
      console.log('Ventas encontradas:');
      sales.forEach(sale => {
        console.log(`- ${sale.folio}: ${sale.paymentMethod} - $${sale.total}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
