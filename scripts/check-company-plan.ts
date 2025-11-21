// Script para verificar el plan de la empresa
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCompanyPlan() {
  try {
    console.log('🔍 Verificando planes de empresas...\n')

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            branches: true,
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (companies.length === 0) {
      console.log('❌ No se encontraron empresas')
      return
    }

    console.log(`✅ Se encontraron ${companies.length} empresa(s):\n`)
    console.log('─'.repeat(100))

    companies.forEach((company, index) => {
      console.log(`\n${index + 1}. 🏢 ${company.name}`)
      console.log(`   ID: ${company.id}`)
      console.log(`   Slug: ${company.slug}`)
      console.log(`   📦 Plan: ${company.plan}`)
      console.log(`   ⚡ Estado: ${company.status}`)
      
      if (company.subscriptionExpiresAt) {
        const isExpired = new Date(company.subscriptionExpiresAt) < new Date()
        console.log(`   📅 Suscripción expira: ${company.subscriptionExpiresAt.toLocaleDateString('es-MX')} ${isExpired ? '❌ EXPIRADA' : '✅ ACTIVA'}`)
      } else {
        console.log(`   📅 Sin fecha de expiración`)
      }
      
      console.log(`   👥 Usuarios: ${company._count.users}`)
      console.log(`   🏪 Sucursales: ${company._count.branches}`)
      console.log(`   📦 Productos: ${company._count.products}`)
      console.log(`   🗓️  Creada: ${company.createdAt.toLocaleDateString('es-MX')}`)
    })

    console.log('\n' + '─'.repeat(100))
    console.log('\n📋 Resumen de planes:')
    
    const planSummary = companies.reduce((acc, company) => {
      acc[company.plan] = (acc[company.plan] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(planSummary).forEach(([plan, count]) => {
      console.log(`   ${plan}: ${count} empresa(s)`)
    })

    console.log('\n💡 Nota:')
    console.log('   - Plan FREE/BASIC: ❌ No puede enviar cotizaciones por WhatsApp')
    console.log('   - Plan PRO: ✅ Envío MANUAL por WhatsApp (abre WhatsApp Web)')
    console.log('   - Plan ENTERPRISE: ✅ Envío AUTOMÁTICO por WhatsApp Business API')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCompanyPlan()
