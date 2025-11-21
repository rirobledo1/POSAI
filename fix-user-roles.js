// fix-user-roles.js - Corregir los roles de los usuarios
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserRoles() {
  console.log('🔧 Corrigiendo roles de usuarios...\n')

  try {
    // Actualizar roles correctos
    const updates = [
      { email: 'admin@ferreai.com', role: 'ADMIN', name: 'Administrador' },
      { email: 'vendedor@ferreai.com', role: 'VENDEDOR', name: 'Vendedor Principal' },
      { email: 'almacen@ferreai.com', role: 'ALMACEN', name: 'Encargado Almacén' },
      { email: 'lectura@ferreai.com', role: 'SOLO_LECTURA', name: 'Usuario Lectura' }
    ]

    for (const update of updates) {
      const result = await prisma.user.updateMany({
        where: { email: update.email },
        data: { 
          role: update.role,
          name: update.name
        }
      })
      
      if (result.count > 0) {
        console.log(`✅ ${update.email} → ${update.role}`)
      } else {
        console.log(`⚠️  No se encontró usuario: ${update.email}`)
      }
    }

    // Verificar los cambios
    console.log('\n👥 Roles actualizados:')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - ROL: ${user.role}`)
    })

    console.log('\n✅ Roles corregidos correctamente!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserRoles()
