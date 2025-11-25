// Script para actualizar SOLO las características de cotizaciones
// Y DESHABILITAR características NO implementadas
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

async function actualizarCaracteristicas() {
  console.log('\n' + '='.repeat(80))
  console.log('🔧 ACTUALIZACIÓN DE CARACTERÍSTICAS - Basado en implementación real')
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
    log.step('Leyendo configuración actual...\n')
    const planesActuales = await prisma.$queryRaw`
      SELECT plan_code, plan_name, monthly_price_mxn, annual_price_mxn
      FROM subscription_plans
      ORDER BY display_order
    `

    console.log('📊 Precios ACTUALES (NO se modificarán):')
    console.log('─'.repeat(80))
    planesActuales.forEach(p => {
      const monthly = Number(p.monthly_price_mxn).toFixed(2)
      const annual = Number(p.annual_price_mxn).toFixed(2)
      console.log(`   ${p.plan_code.padEnd(12)} - Mensual: $${monthly} | Anual: $${annual}`)
    })
    console.log('─'.repeat(80) + '\n')

    // ACTUALIZAR CARACTERÍSTICAS
    log.step('Actualizando características según implementación real...\n')

    // ============================================
    // Plan FREE
    // ============================================
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(features, '{}'::jsonb),
                  '{quotations_inperson}', 'true'::jsonb
                ),
                '{quotations_online}', 'false'::jsonb
              ),
              '{quotations_whatsapp}', 'false'::jsonb
            ),
            '{transfers}', 'false'::jsonb
          ),
          '{multi_currency}', 'false'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'FREE'
    `
    log.success('FREE        - Cotizaciones: Solo presencial | Transferencias: ❌ | Multi-moneda: ❌')

    // ============================================
    // Plan PRO - SIN cotizaciones online/WhatsApp
    // ============================================
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(features, '{}'::jsonb),
                  '{quotations_inperson}', 'true'::jsonb
                ),
                '{quotations_online}', 'false'::jsonb
              ),
              '{quotations_whatsapp}', 'false'::jsonb
            ),
            '{transfers}', 'false'::jsonb
          ),
          '{multi_currency}', 'false'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'PRO'
    `
    log.success('PRO         - Cotizaciones: Solo presencial | Transferencias: ❌ | Multi-moneda: ❌ ✅ CORREGIDO')

    // ============================================
    // Plan PRO_PLUS - CON cotizaciones, SIN transferencias/multi-moneda
    // ============================================
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(features, '{}'::jsonb),
                  '{quotations_inperson}', 'true'::jsonb
                ),
                '{quotations_online}', 'true'::jsonb
              ),
              '{quotations_whatsapp}', 'true'::jsonb
            ),
            '{transfers}', 'false'::jsonb
          ),
          '{multi_currency}', 'false'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'PRO_PLUS'
    `
    log.success('PRO_PLUS    - Cotizaciones: Todas ✅ | Transferencias: ❌ | Multi-moneda: ❌ ✅ CORREGIDO')

    // ============================================
    // Plan ENTERPRISE - CON cotizaciones, SIN transferencias/multi-moneda
    // ============================================
    await prisma.$executeRaw`
      UPDATE subscription_plans
      SET 
        features = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  COALESCE(features, '{}'::jsonb),
                  '{quotations_inperson}', 'true'::jsonb
                ),
                '{quotations_online}', 'true'::jsonb
              ),
              '{quotations_whatsapp}', 'true'::jsonb
            ),
            '{transfers}', 'false'::jsonb
          ),
          '{multi_currency}', 'false'::jsonb
        ),
        updated_at = NOW()
      WHERE plan_code = 'ENTERPRISE'
    `
    log.success('ENTERPRISE  - Cotizaciones: Todas ✅ | Transferencias: ❌ | Multi-moneda: ❌ ✅ CORREGIDO')

    // Verificar resultados
    console.log('\n' + '─'.repeat(80))
    log.step('Verificando resultados finales...\n')

    const planesActualizados = await prisma.$queryRaw`
      SELECT 
        plan_code,
        plan_name,
        monthly_price_mxn,
        features->>'quotations_online' as online,
        features->>'quotations_whatsapp' as whatsapp,
        features->>'transfers' as transfers,
        features->>'multi_currency' as multi_currency
      FROM subscription_plans
      ORDER BY display_order
    `

    console.log('📊 RESULTADO FINAL:')
    console.log('─'.repeat(80))
    console.log('| Plan      | Online | WhatsApp | Transferencias | Multi-moneda |')
    console.log('|' + '─'.repeat(78) + '|')
    
    planesActualizados.forEach(p => {
      const online = p.online === 'true' ? '✅' : '❌'
      const whatsapp = p.whatsapp === 'true' ? '✅' : '❌'
      const transfers = p.transfers === 'true' ? '✅' : '❌'
      const multiCurrency = p.multi_currency === 'true' ? '✅' : '❌'
      
      console.log(`| ${p.plan_code.padEnd(9)} | ${online.padEnd(6)} | ${whatsapp.padEnd(8)} | ${transfers.padEnd(14)} | ${multiCurrency.padEnd(12)} |`)
    })
    console.log('─'.repeat(80) + '\n')

    log.success('✨ ¡Actualización completada!')
    log.info('Características actualizadas según lo realmente implementado')
    log.info('Los precios se mantuvieron EXACTAMENTE iguales\n')

    console.log('📝 Cambios realizados:')
    console.log('   ✅ Cotizaciones online/WhatsApp: Solo PRO_PLUS y ENTERPRISE')
    console.log('   ❌ Transferencias: Deshabilitadas (NO implementadas)')
    console.log('   ❌ Multi-moneda: Deshabilitadas (NO implementadas)\n')

    console.log('📄 Ver análisis completo en: ANALISIS-TRANSFERENCIAS-MULTIMONEDA.md\n')

    console.log('🎯 Siguiente paso:')
    console.log('   Recarga: http://localhost:3000/settings/subscription')
    console.log('   Verifica que solo aparezcan características implementadas\n')

  } catch (error) {
    log.error('Error durante la actualización:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
actualizarCaracteristicas()
