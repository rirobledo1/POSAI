import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
    try {
        console.log('🔍 Verificando conexión a la base de datos...')
        
        // Probar conexión básica
        await prisma.$connect()
        console.log('✅ Conexión establecida')
        
        // Verificar si existe la tabla company_settings
        try {
            const result = await prisma.$queryRaw`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'company_settings'
            `
            console.log('🏢 Tabla company_settings:', result)
        } catch (error) {
            console.log('❌ Error verificando company_settings:', error.message)
        }
        
        // Listar todas las tablas disponibles
        try {
            const tables = await prisma.$queryRaw`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `
            console.log('📋 Tablas disponibles:', tables)
        } catch (error) {
            console.log('❌ Error listando tablas:', error.message)
        }
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

verifyDatabase()
