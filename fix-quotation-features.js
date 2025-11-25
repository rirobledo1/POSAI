// Script para actualizar SOLO las características de cotizaciones
// SIN MODIFICAR PRECIOS NI OTRAS CONFIGURACIONES
// ================================================================
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔹 ${msg}${colors.reset}`)
}

async function actualizarSoloCaracteristicasCotizaciones() {
  console.log('\n' + '='.repeat(80))
  console.log('🔧 ACTUALIZACIÓN - Solo Características de Cotizaciones')
  console.log('='.repeat(80) + '\n')

  try {
    log.step('Conectando a base de datos...')
    await prisma.$connect()
    log.success('Conexión exitosa\n')

    // Verificar tabla
    log.step('Verificando tabla subscription_plans...')
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) FROM subscription_plans`
      log.success(`Tabla existe con ${count[0].count} registros\n`)
    } catch (error) {
      log.error('La tabla subscription_plans NO existe')
      throw new Error('Tabla no encontrada')
    }

    // Mostrar precios ACTUALES antes de modificar
    log.step('Leyendo precios actuales (NO se modificarán)...\n')
    const planesActuales = await prisma.$queryRaw`
      SELECT plan_code, plan_name, monthly_price_mxn, annual_price_mxn
      FROM subscription_plans
      ORDER BY display_order
    `

    console.log('📊 Precios ACTUALES (se mantendrán):')
    console.log('─'.repeat(80))
    planesActuales.forEach(p => {
      const monthly = Number(p.monthly_price_mxn).toFixed(2)
      const annual = Number(p.annual_price_mxn).toFixed(2)
      console.log(`   ${p.plan_code.padEnd(12)} - Mensual: $${monthly} MXN | Anual: $${annual} MXN`)
    })
    console.log('─'.repeat(80) + '\n')

    // SOLO actualizar las características de cotizaciones
    log.step('Actualizando SOLO características de cotizaciones...\n')

    // Plan FREE
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(features, '{}'::jsonb),
              '{quotations_inperson}', 'true'::jsonb
            ),
            '{quotations_online}', 'false'::jsonb
          ),
          '{quotations_whatsapp}', 'false'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'FREE'
    `
    log.success('FREE        - quotations_online: false, quotations_whatsapp: false')

    // Plan PRO - CORRECCIÓN
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(features, '{}'::jsonb),
              '{quotations_inperson}', 'true'::jsonb
            ),
            '{quotations_online}', 'false'::jsonb
          ),
          '{quotations_whatsapp}', 'false'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'PRO'
    `
    log.success('PRO         - quotations_online: false, quotations_whatsapp: false ✅ CORREGIDO')

    // Plan PRO_PLUS
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(features, '{}'::jsonb),
              '{quotations_inperson}', 'true'::jsonb
            ),
            '{quotations_online}', 'true'::jsonb
          ),
          '{quotations_whatsapp}', 'true'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'PRO_PLUS'
    `
    log.success('PRO_PLUS    - quotations_online: true,  quotations_whatsapp: true')

    // Plan ENTERPRISE
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(features, '{}'::jsonb),
              '{quotations_inperson}', 'true'::jsonb
            ),
            '{quotations_online}', 'true'::jsonb
          ),
          '{quotations_whatsapp}', 'true'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'ENTERPRISE'
    `
    log.success('ENTERPRISE  - quotations_online: true,  quotations_whatsapp: true')

    // Verificar resultados
    console.log('\n' + '─'.repeat(80))
    log.step('Verificando resultados finales...\n')

    const planesActualizados = await prisma.$queryRaw`
      SELECT 
        plan_code,
        plan_name,
        monthly_price_mxn,
        annual_price_mxn,
        features->>'quotations_online' as online,
        features->>'quotations_whatsapp' as whatsapp
      FROM subscription_plans
      ORDER BY display_order
    `

    console.log('📊 RESULTADO FINAL:')
    console.log('─'.repeat(80))
    console.log('| Plan         | Mensual   | Anual     | Online    | WhatsApp  |')
    console.log('|' + '─'.repeat(78) + '|')
    
    planesActualizados.forEach(p => {
      const monthly = `$${Number(p.monthly_price_mxn).toFixed(0)}`.padEnd(9)
      const annual = `$${Number(p.annual_price_mxn).toFixed(0)}`.padEnd(9)
      const online = p.online === 'true' ? '✅ Sí' : '❌ No'
      const whatsapp = p.whatsapp === 'true' ? '✅ Sí' : '❌ No'
      console.log(`| ${p.plan_code.padEnd(12)} | ${monthly} | ${annual} | ${online.padEnd(9)} | ${whatsapp.padEnd(9)} |`)
    })
    console.log('─'.repeat(80) + '\n')

    log.success('✨ ¡Actualización completada!')
    log.info('Solo se modificaron las características de cotizaciones')
    log.info('Los precios se mantuvieron EXACTAMENTE iguales\n')

    console.log('🎯 Siguiente paso:')
    console.log('   Recarga: http://localhost:3000/settings/subscription')
    console.log('   Verifica que Plan PRO NO muestra cotizaciones online/WhatsApp\n')

  } catch (error) {
    log.error('Error durante la actualización:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
actualizarSoloCaracteristicasCotizaciones()
