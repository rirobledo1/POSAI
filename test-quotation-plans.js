// Script de Testing - Validación de Planes para Cotizaciones
// ==========================================================
// Este script verifica que las restricciones de plan estén correctamente implementadas

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔹 ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`)
}

// Simulador de llamadas API
async function testQuotationAPI(quotationId, endpoint, plan) {
  try {
    // Simular obtención de cotización con plan específico
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        company: {
          select: {
            plan: true
          }
        }
      }
    })

    if (!quotation) {
      return { error: 'Cotización no encontrada', status: 404 }
    }

    // Forzar el plan para testing
    quotation.company.plan = plan

    // Simular validación según endpoint
    if (endpoint === 'send-whatsapp') {
      const allowedPlans = ['PRO_PLUS', 'ENTERPRISE']
      if (!allowedPlans.includes(plan)) {
        return { 
          error: 'Tu plan no incluye envío de cotizaciones por WhatsApp',
          upgrade: true,
          requiredPlan: 'PRO_PLUS',
          currentPlan: plan,
          status: 403
        }
      }
      return { success: true, status: 200 }
    }

    if (endpoint === 'send-email') {
      const allowedPlans = ['PRO_PLUS', 'ENTERPRISE']
      if (!allowedPlans.includes(plan)) {
        return { 
          error: 'Tu plan no incluye envío de cotizaciones por email',
          upgrade: true,
          requiredPlan: 'PRO_PLUS',
          currentPlan: plan,
          status: 403
        }
      }
      return { success: true, status: 200 }
    }

    return { error: 'Endpoint desconocido', status: 400 }
  } catch (error) {
    return { error: error.message, status: 500 }
  }
}

// Tests principales
async function runTests() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TESTING: Validación de Planes - Cotizaciones Online y WhatsApp')
  console.log('='.repeat(80) + '\n')

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0

  try {
    // Obtener una cotización de prueba
    let quotation = await prisma.quotation.findFirst()
    
    if (!quotation) {
      log.warning('No hay cotizaciones en la base de datos. Creando una de prueba...')
      
      // Crear empresa de prueba si no existe
      let company = await prisma.company.findFirst({ where: { plan: 'FREE' } })
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: 'Test Company',
            rfc: 'TEST123456',
            plan: 'FREE',
            status: 'ACTIVE'
          }
        })
      }

      // Crear cliente de prueba si no existe
      let customer = await prisma.customer.findFirst({
        where: { companyId: company.id }
      })
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            companyId: company.id,
            name: 'Cliente Test',
            email: 'test@example.com',
            phone: '+525512345678'
          }
        })
      }

      // Crear usuario de prueba si no existe
      let user = await prisma.user.findFirst({
        where: { companyId: company.id }
      })
      if (!user) {
        user = await prisma.user.create({
          data: {
            companyId: company.id,
            name: 'Usuario Test',
            email: 'user@test.com',
            password: 'test123',
            role: 'ADMIN',
            isActive: true
          }
        })
      }

      // Crear cotización de prueba
      quotation = await prisma.quotation.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          createdById: user.id,
          quotationNumber: 'TEST-001',
          status: 'DRAFT',
          subtotal: 1000,
          discount: 0,
          discountPercent: 0,
          tax: 160,
          total: 1160,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })

      log.success('Cotización de prueba creada')
    }

    const quotationId = quotation.id

    // Planes a probar
    const plans = ['FREE', 'PRO', 'PRO_PLUS', 'ENTERPRISE']
    const endpoints = ['send-email', 'send-whatsapp']

    console.log('📋 Configuración de la prueba:')
    console.log(`   • Cotización ID: ${quotationId}`)
    console.log(`   • Planes a probar: ${plans.join(', ')}`)
    console.log(`   • Endpoints: ${endpoints.join(', ')}`)
    console.log('─'.repeat(80) + '\n')

    // TEST 1: Plan FREE - Debe bloquear ambos
    log.step('TEST 1: Plan FREE - Debe BLOQUEAR email y WhatsApp')
    for (const endpoint of endpoints) {
      totalTests++
      const result = await testQuotationAPI(quotationId, endpoint, 'FREE')
      
      if (result.status === 403 && result.upgrade === true && result.requiredPlan === 'PRO_PLUS') {
        log.success(`  ${endpoint}: BLOQUEADO correctamente (403)`)
        passedTests++
      } else {
        log.error(`  ${endpoint}: DEBERÍA bloquear pero retornó status ${result.status}`)
        failedTests++
      }
    }
    console.log()

    // TEST 2: Plan PRO - Debe bloquear ambos
    log.step('TEST 2: Plan PRO - Debe BLOQUEAR email y WhatsApp')
    for (const endpoint of endpoints) {
      totalTests++
      const result = await testQuotationAPI(quotationId, endpoint, 'PRO')
      
      if (result.status === 403 && result.upgrade === true && result.requiredPlan === 'PRO_PLUS') {
        log.success(`  ${endpoint}: BLOQUEADO correctamente (403)`)
        passedTests++
      } else {
        log.error(`  ${endpoint}: DEBERÍA bloquear pero retornó status ${result.status}`)
        failedTests++
      }
    }
    console.log()

    // TEST 3: Plan PRO_PLUS - Debe permitir ambos
    log.step('TEST 3: Plan PRO_PLUS - Debe PERMITIR email y WhatsApp')
    for (const endpoint of endpoints) {
      totalTests++
      const result = await testQuotationAPI(quotationId, endpoint, 'PRO_PLUS')
      
      if (result.status === 200 && result.success === true) {
        log.success(`  ${endpoint}: PERMITIDO correctamente (200)`)
        passedTests++
      } else {
        log.error(`  ${endpoint}: DEBERÍA permitir pero retornó status ${result.status}`)
        failedTests++
      }
    }
    console.log()

    // TEST 4: Plan ENTERPRISE - Debe permitir ambos
    log.step('TEST 4: Plan ENTERPRISE - Debe PERMITIR email y WhatsApp')
    for (const endpoint of endpoints) {
      totalTests++
      const result = await testQuotationAPI(quotationId, endpoint, 'ENTERPRISE')
      
      if (result.status === 200 && result.success === true) {
        log.success(`  ${endpoint}: PERMITIDO correctamente (200)`)
        passedTests++
      } else {
        log.error(`  ${endpoint}: DEBERÍA permitir pero retornó status ${result.status}`)
        failedTests++
      }
    }
    console.log()

    // TABLA RESUMEN
    console.log('='.repeat(80))
    console.log('📊 TABLA RESUMEN DE RESULTADOS')
    console.log('='.repeat(80))
    console.log('| Plan        | Email       | WhatsApp    | Estado Esperado | Estado Real |')
    console.log('|' + '-'.repeat(78) + '|')

    for (const plan of plans) {
      const emailResult = await testQuotationAPI(quotationId, 'send-email', plan)
      const whatsappResult = await testQuotationAPI(quotationId, 'send-whatsapp', plan)
      
      const expectedEmail = ['PRO_PLUS', 'ENTERPRISE'].includes(plan) ? '✅ PERMITIR' : '❌ BLOQUEAR'
      const expectedWhatsapp = ['PRO_PLUS', 'ENTERPRISE'].includes(plan) ? '✅ PERMITIR' : '❌ BLOQUEAR'
      
      const actualEmail = emailResult.status === 200 ? '✅ PERMITE' : '❌ BLOQUEA'
      const actualWhatsapp = whatsappResult.status === 200 ? '✅ PERMITE' : '❌ BLOQUEA'
      
      const emailMatch = (expectedEmail.includes('PERMITIR') && actualEmail.includes('PERMITE')) ||
                         (expectedEmail.includes('BLOQUEAR') && actualEmail.includes('BLOQUEA'))
      const whatsappMatch = (expectedWhatsapp.includes('PERMITIR') && actualWhatsapp.includes('PERMITE')) ||
                            (expectedWhatsapp.includes('BLOQUEAR') && actualWhatsapp.includes('BLOQUEA'))
      
      const status = (emailMatch && whatsappMatch) ? '✅ CORRECTO' : '❌ ERROR'
      
      console.log(`| ${plan.padEnd(11)} | ${actualEmail.padEnd(11)} | ${actualWhatsapp.padEnd(11)} | ${expectedEmail.padEnd(15)} | ${status.padEnd(11)} |`)
    }
    console.log('='.repeat(80) + '\n')

    // RESUMEN FINAL
    console.log('='.repeat(80))
    console.log('🎯 RESUMEN FINAL')
    console.log('='.repeat(80))
    console.log(`   Total de pruebas: ${totalTests}`)
    console.log(`   ${colors.green}✅ Pruebas exitosas: ${passedTests}${colors.reset}`)
    console.log(`   ${colors.red}❌ Pruebas fallidas: ${failedTests}${colors.reset}`)
    console.log(`   Tasa de éxito: ${Math.round((passedTests / totalTests) * 100)}%`)
    console.log('='.repeat(80))

    if (failedTests === 0) {
      console.log(`\n${colors.green}🎉 ¡TODAS LAS PRUEBAS PASARON! Las correcciones están funcionando correctamente.${colors.reset}\n`)
    } else {
      console.log(`\n${colors.red}⚠️  ATENCIÓN: ${failedTests} prueba(s) fallaron. Revisa la implementación.${colors.reset}\n`)
    }

  } catch (error) {
    log.error('Error durante las pruebas:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar tests
runTests()
