import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
    try {
        console.log('🔍 Verificando base de datos desde API...')
        
        // Verificar conexión
        await prisma.$connect()
        
        // Verificar tabla company_settings
        const companySettingsColumns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'company_settings'
        `
        
        // Listar todas las tablas
        const allTables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `
        
        // Intentar obtener configuración de empresa
        let companySettings = null
        let companySettingsError = null
        try {
            // Usar query raw para evitar errores de modelo
            companySettings = await prisma.$queryRaw`SELECT * FROM company_settings LIMIT 1`
        } catch (error) {
            companySettingsError = error instanceof Error ? error.message : 'Error desconocido'
            console.log('Error obteniendo company_settings:', companySettingsError)
        }
        
        await prisma.$disconnect()
        
        return NextResponse.json({
            success: true,
            tables: allTables,
            companySettingsColumns,
            companySettings,
            companySettingsError,
            message: 'Verificación completa'
        })
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.log('Error en verificación:', errorMessage)
        return NextResponse.json({
            success: false,
            error: errorMessage,
            message: 'Error en verificación de BD'
        }, { status: 500 })
    }
}
