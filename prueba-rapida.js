const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function pruebaRapida() {
    try {
        console.log('🧪 PRUEBA RÁPIDA: IVA Dinámico Real')
        console.log('===================================')
        
        // 1. Cambiar IVA a 8% en la BD
        console.log('1. Cambiando IVA a 8% en base de datos...')
        await prisma.$queryRaw`
            UPDATE company_settings 
            SET tax_percentage = 8.00, updated_at = NOW()
            WHERE id = 'company-settings-1'
        `
        
        // 2. Verificar que se guardó
        const config = await prisma.$queryRaw`
            SELECT company_name, tax_percentage, currency 
            FROM company_settings 
            WHERE id = 'company-settings-1'
        `
        
        console.log('2. Configuración actual en BD:', {
            empresa: config[0].company_name,
            iva: config[0].tax_percentage + '%',
            moneda: config[0].currency
        })
        
        console.log('\n🎯 INSTRUCCIONES PARA VERIFICAR:')
        console.log('=====================================')
        console.log('1. Abre el navegador en: http://localhost:3000')
        console.log('2. Haz login al sistema')
        console.log('3. Ve a "Configuración" → debe mostrar IVA al 8%')
        console.log('4. Ve a "POS" → debe mostrar "IVA (8%)" automáticamente')
        console.log('5. Haz una venta de $1000 → debe cobrar $80 de IVA')
        console.log('\n💡 Si todavía muestra 16%, recarga la página del navegador')
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

pruebaRapida()
