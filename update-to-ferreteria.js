const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateBusinessType() {
  try {
    console.log('🔧 Cambiando tipo de empresa a FERRETERIA...');
    
    const company = await prisma.company.update({
      where: { id: 'cmfhfqxej0000twp0plrqujqn' },
      data: {
        businessType: 'FERRETERIA'
      }
    });
    
    console.log('✅ Empresa actualizada:');
    console.log('🏢 Nombre:', company.name);
    console.log('🔧 Tipo de negocio:', company.businessType);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateBusinessType();