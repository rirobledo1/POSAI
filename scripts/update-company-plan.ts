// Script para actualizar el plan de una empresa a PRO
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCompanyToPro() {
  try {
    // Obtener el slug o ID de la empresa (ajusta según tu empresa)
    const companySlug = process.argv[2] // Pasar como argumento: npm run update-plan mi-empresa

    if (!companySlug) {
      console.log('❌ Debes proporcionar el slug de la empresa')
      console.log('Uso: npx tsx scripts/update-company-plan.ts <slug-empresa>')
      console.log('\nEjemplo: npx tsx scripts/update-company-plan.ts ferreteria-demo')
      return
    }

    console.log(`🔍 Buscando empresa con slug: ${companySlug}...\n`)

    const company = await prisma.company.findUnique({
      where: { slug: companySlug }
    })

    if (!company) {
      console.log('❌ Empresa no encontrada')
      console.log('\n📋 Empresas disponibles:')
      
      const allCompanies = await prisma.company.findMany({
        select: {
          name: true,
          slug: true,
          plan: true
        }
      })
      
      allCompanies.forEach((c) => {
        console.log(`   - ${c.name} (slug: ${c.slug}) - Plan actual: ${c.plan}`)
      })
      
      return
    }

    console.log(`✅ Empresa encontrada: ${company.name}`)
    console.log(`   Plan actual: ${company.plan}`)
    console.log(`   Estado: ${company.status}\n`)

    if (company.plan === 'PRO') {
      console.log('ℹ️  La empresa ya tiene el plan PRO')
      return
    }

    console.log(`🔄 Actualizando plan de ${company.plan} a PRO...\n`)

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: {
        plan: 'PRO',
        status: 'ACTIVE',
        // Configurar límites del plan PRO
        maxBranches: 5,
        maxUsers: 15,
        maxProducts: 5000,
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
      }
    })

    console.log('✅ Plan actualizado exitosamente!')
    console.log(`   Plan nuevo: ${updatedCompany.plan}`)
    console.log(`   Estado: ${updatedCompany.status}`)
    console.log(`   Límites:`)
    console.log(`      - Sucursales: ${updatedCompany.maxBranches}`)
    console.log(`      - Usuarios: ${updatedCompany.maxUsers}`)
    console.log(`      - Productos: ${updatedCompany.maxProducts}`)
    
    if (updatedCompany.subscriptionExpiresAt) {
      console.log(`   Expira: ${updatedCompany.subscriptionExpiresAt.toLocaleDateString('es-MX')}`)
    }

    console.log('\n✅ Ahora puedes enviar cotizaciones por WhatsApp (modo manual)')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCompanyToPro()
