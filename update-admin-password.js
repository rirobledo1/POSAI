// Script para actualizar la contraseña del admin
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateAdminPassword() {
  console.log('🔧 Actualizando contraseña del admin@ferreai.com...')

  try {
    // Verificar que existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@ferreai.com' }
    })

    if (!existingUser) {
      console.log('❌ El usuario admin@ferreai.com NO existe')
      return
    }

    console.log('✅ Usuario encontrado:', existingUser.name)
    console.log('🔍 Hash actual:', existingUser.password.substring(0, 20) + '...')

    // Generar nuevo hash para la contraseña "admin123"
    const newPasswordHash = await bcrypt.hash('admin123', 12)
    console.log('🔑 Nuevo hash generado:', newPasswordHash.substring(0, 20) + '...')

    // Actualizar la contraseña
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@ferreai.com' },
      data: {
        password: newPasswordHash
      }
    })

    console.log('✅ Contraseña actualizada exitosamente!')

    // Verificar que el hash funciona
    const isValid = await bcrypt.compare('admin123', newPasswordHash)
    console.log('🔐 Verificación del hash:', isValid ? '✅ CORRECTO' : '❌ ERROR')

    console.log('\n🎯 Credenciales para login:')
    console.log('📧 Email: admin@ferreai.com')
    console.log('🔑 Contraseña: admin123')
    console.log('👤 Nombre:', updatedUser.name)
    console.log('🎖️ Rol:', updatedUser.role)

  } catch (error) {
    console.error('❌ Error actualizando contraseña:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminPassword()
