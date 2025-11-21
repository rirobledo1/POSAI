const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateCompanySettings() {
    try {
        console.log('🔍 Verificando configuración actual de la empresa...')
        
        // Obtener la configuración actual
        const current = await prisma.$queryRaw`
            SELECT id, company_name, rfc, tax_percentage, currency 
            FROM company_settings 
            LIMIT 1
        `
        
        console.log('📋 Configuración actual:', current[0])
        
        // Actualizar con valores por defecto si es necesario
        if (current[0]) {
            const id = current[0].id
            
            await prisma.$queryRaw`
                UPDATE company_settings 
                SET 
                    tax_percentage = COALESCE(tax_percentage, 16.00),
                    currency = COALESCE(currency, 'MXN'),
                    company_name = COALESCE(NULLIF(company_name, ''), 'Mi Empresa'),
                    rfc = COALESCE(NULLIF(rfc, ''), 'XAXX010101000'),
                    updated_at = NOW()
                WHERE id = ${id}
            `
            
            console.log('✅ Configuración actualizada')
            
            // Verificar actualización
            const updated = await prisma.$queryRaw`
                SELECT id, company_name, rfc, tax_percentage, currency, updated_at
                FROM company_settings 
                WHERE id = ${id}
            `
            
            console.log('🎯 Nueva configuración:', updated[0])
        }
        
        console.log('🎉 Verificación y actualización completadas')
        
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateCompanySettings()
