// Script para actualizar planes con características correctas de cotizaciones
// =======================================================================
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

// Configuración de planes con características correctas
const PLANES_CORRECTOS = [
  {
    id: 'plan_free_001',
    planCode: 'FREE',
    planName: 'Plan Gratuito',
    monthlyPriceMxn: 0,
    annualPriceMxn: 0,
    annualDiscountPercent: 0,
    maxBranches: 1,
    maxUsers: 3,
    maxProducts: 100,
    maxStorageMb: 500,
    features: {
      pos: true,
      inventario: true,
      ventas: true,
      clientes: true,
      reportes_basicos: true,
      soporte: 'email',
      quotations_inperson: true,
      quotations_online: false,  // ❌
      quotations_whatsapp: false // ❌
    },
    trialDays: 30,
    displayOrder: 1,
    isPopular: false,
    description: 'Ideal para comenzar tu negocio. Incluye las funcionalidades básicas para operar tu punto de venta.'
  },
  {
    id: 'plan_pro_001',
    planCode: 'PRO',
    planName: 'Plan Profesional',
    monthlyPriceMxn: 499,
    annualPriceMxn: 4990,
    annualDiscountPercent: 17,
    maxBranches: 5,
    maxUsers: 10,
    maxProducts: 10000,
    maxStorageMb: 5000,
    features: {
      pos: true,
      inventario: true,
      ventas: true,
      clientes: true,
      reportes_basicos: true,
      reportes_avanzados: true,
      soporte: 'chat_email',
      multi_sucursal: true,
      api_acceso: true,
      integraciones: true,
      transferencias_stock: true,
      envios_domicilio: true,
      cuentas_cobrar: true,
      corte_caja: true,
      quotations_inperson: true,
      quotations_online: false,  // ❌ CORREGIDO
      quotations_whatsapp: false // ❌ CORREGIDO
    },
    trialDays: 14,
    displayOrder: 2,
    isPopular: true,
    description: 'Perfecto para negocios en crecimiento. Incluye múltiples sucursales, reportes avanzados y soporte prioritario.'
  },
  {
    id: 'plan_pro_plus_001',
    planCode: 'PRO_PLUS',
    planName: 'Plan Pro Plus',
    monthlyPriceMxn: 999,
    annualPriceMxn: 9990,
    annualDiscountPercent: 17,
    maxBranches: 10,
    maxUsers: 25,
    maxProducts: 50000,
    maxStorageMb: 20000,
    features: {
      pos: true,
      inventario: true,
      ventas: true,
      clientes: true,
      reportes_basicos: true,
      reportes_avanzados: true,
      soporte: 'prioritario',
      multi_sucursal: true,
      api_acceso: true,
      integraciones: true,
      transferencias_stock: true,
      envios_domicilio: true,
      cuentas_cobrar: true,
      corte_caja: true,
      quotations_inperson: true,
      quotations_online: true,  // ✅ DISPONIBLE
      quotations_whatsapp: true, // ✅ DISPONIBLE
      sales_whatsapp: true,
      custom_branding: true
    },
    trialDays: 14,
    displayOrder: 3,
    isPopular: false,
    description: 'Plan avanzado con cotizaciones en línea y WhatsApp. Perfecto para negocios que necesitan automatización completa.'
  },
  {
    id: 'plan_enterprise_001',
    planCode: 'ENTERPRISE',
    planName: 'Plan Empresarial',
    monthlyPriceMxn: 1499,
    annualPriceMxn: 14990,
    annualDiscountPercent: 17,
    maxBranches: 999,
    maxUsers: 999,
    maxProducts: null,
    maxStorageMb: 50000,
    features: {
      pos: true,
      inventario: true,
      ventas: true,
      clientes: true,
      reportes_basicos: true,
      reportes_avanzados: true,
      soporte: '24_7_telefono',
      multi_sucursal: true,
      usuarios_ilimitados: true,
      api_acceso: true,
      integraciones: true,
      transferencias_stock: true,
      envios_domicilio: true,
      cuentas_cobrar: true,
      corte_caja: true,
      personalizacion: true,
      capacitacion: true,
      migracion_datos: true,
      servidor_dedicado: true,
      sla_garantizado: true,
      quotations_inperson: true,
      quotations_online: true,  // ✅ DISPONIBLE
      quotations_whatsapp: true, // ✅ DISPONIBLE
      sales_whatsapp: true,
      custom_branding: true,
      white_label: true,
      priority_support: true,
      dedicated_support: true,
      ai_sales_agents: true,
      ai_anomaly_detection: true,
      ai_theft_alerts: true,
      ai_demand_prediction: true,
      ai_smart_reports: true,
      ai_inventory_optimization: true,
      ai_price_suggestions: true
    },
    trialDays: 30,
    displayOrder: 4,
    isPopular: false,
    description: 'Para grandes empresas. Sucursales y usuarios ilimitados, soporte 24/7, personalización y servidor dedicado.'
  }
]

async function actualizarPlanes() {
  console.log('\n' + '='.repeat(80))
  console.log('🔧 ACTUALIZACIÓN DE PLANES - Corrección de Cotizaciones')
  console.log('='.repeat(80) + '\n')

  try {
    log.step('Verificando conexión a base de datos...')
    await prisma.$connect()
    log.success('Conexión exitosa\n')

    // Verificar si existe la tabla
    log.step('Verificando si existe la tabla subscription_plans...')
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) FROM subscription_plans`
      log.success(`Tabla existe con ${count[0].count} registros\n`)
    } catch (error) {
      log.error('La tabla subscription_plans NO existe')
      log.warning('Necesitas ejecutar el script SQL primero:')
      log.info('  psql -d ferreai -f prisma/seed-plans-UPDATED.sql\n')
      throw new Error('Tabla no encontrada')
    }

    log.step('Actualizando planes con características correctas...\n')

    for (const plan of PLANES_CORRECTOS) {
      try {
        await prisma.$executeRaw`
          INSERT INTO subscription_plans (
            id, plan_code, plan_name, monthly_price_mxn, annual_price_mxn,
            annual_discount_percent, max_branches, max_users, max_products,
            max_storage_mb, features, trial_days, display_order, is_active,
            is_popular, description, created_at, updated_at
          ) VALUES (
            ${plan.id}, ${plan.planCode}, ${plan.planName},
            ${plan.monthlyPriceMxn}, ${plan.annualPriceMxn},
            ${plan.annualDiscountPercent}, ${plan.maxBranches},
            ${plan.maxUsers}, ${plan.maxProducts}, ${plan.maxStorageMb},
            ${JSON.stringify(plan.features)}::jsonb, ${plan.trialDays},
            ${plan.displayOrder}, true, ${plan.isPopular}, ${plan.description},
            NOW(), NOW()
          )
          ON CONFLICT (plan_code) DO UPDATE SET
            plan_name = EXCLUDED.plan_name,
            monthly_price_mxn = EXCLUDED.monthly_price_mxn,
            annual_price_mxn = EXCLUDED.annual_price_mxn,
            features = EXCLUDED.features,
            description = EXCLUDED.description,
            updated_at = NOW()
        `
        
        const online = plan.features.quotations_online ? '✅' : '❌'
        const whatsapp = plan.features.quotations_whatsapp ? '✅' : '❌'
        
        log.success(`${plan.planCode.padEnd(12)} - Online: ${online}  WhatsApp: ${whatsapp}`)
      } catch (error) {
        log.error(`Error actualizando ${plan.planCode}: ${error.message}`)
      }
    }

    // Verificar resultados
    console.log('\n' + '─'.repeat(80))
    log.step('Verificando resultados...\n')

    const planes = await prisma.$queryRaw`
      SELECT 
        plan_code,
        plan_name,
        features->>'quotations_online' as online,
        features->>'quotations_whatsapp' as whatsapp
      FROM subscription_plans
      ORDER BY display_order
    `

    console.log('📊 Estado actual de los planes:')
    console.log('─'.repeat(80))
    console.log('| Plan         | Nombre            | Online    | WhatsApp  |')
    console.log('|' + '─'.repeat(78) + '|')
    
    planes.forEach(p => {
      const online = p.online === 'true' ? '✅ Sí' : '❌ No'
      const whatsapp = p.whatsapp === 'true' ? '✅ Sí' : '❌ No'
      console.log(`| ${p.plan_code.padEnd(12)} | ${p.plan_name.padEnd(17)} | ${online.padEnd(9)} | ${whatsapp.padEnd(9)} |`)
    })
    console.log('─'.repeat(80) + '\n')

    log.success('✨ ¡Actualización completada exitosamente!')
    console.log('\n🎯 Siguiente paso:')
    console.log('   Recarga la página: http://localhost:3000/settings/subscription')
    console.log('   Y verifica que el Plan PRO NO muestra cotizaciones online/WhatsApp\n')

  } catch (error) {
    log.error('Error durante la actualización:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar
actualizarPlanes()
