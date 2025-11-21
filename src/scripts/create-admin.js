// Script para crear usuario administrador
// src/scripts/create-admin.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔍 Verificando si existe el usuario admin...')
    
    // Verificar si ya existe un usuario admin
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@ferreai.com' },
          { role: 'ADMIN' }
        ]
      }
    })

    if (existingAdmin) {
      console.log('✅ Usuario admin ya existe:', existingAdmin.email)
      console.log('👤 Datos del admin:')
      console.log(`   - ID: ${existingAdmin.id}`)
      console.log(`   - Nombre: ${existingAdmin.name}`)
      console.log(`   - Email: ${existingAdmin.email}`)
      console.log(`   - Rol: ${existingAdmin.role}`)
      console.log(`   - Activo: ${existingAdmin.isActive}`)
      return existingAdmin
    }

    console.log('🔧 Creando usuario administrador...')

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Crear el usuario admin
    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@ferreai.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Usuario administrador creado exitosamente:')
    console.log(`   - Email: ${adminUser.email}`)
    console.log(`   - Contraseña: admin123`)
    console.log(`   - Rol: ${adminUser.role}`)
    console.log('')
    console.log('🔑 Puedes hacer login con:')
    console.log('   Email: admin@ferreai.com')
    console.log('   Password: admin123')

    return adminUser

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function listAllUsers() {
  try {
    console.log('\n📋 Listando todos los usuarios...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (users.length === 0) {
      console.log('   No hay usuarios en la base de datos')
      return []
    }

    console.log(`   Total de usuarios: ${users.length}`)
    console.log('')
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name}`)
      console.log(`      Email: ${user.email}`)
      console.log(`      Rol: ${user.role}`)
      console.log(`      Activo: ${user.isActive}`)
      console.log(`      Creado: ${user.createdAt.toISOString().split('T')[0]}`)
      console.log('')
    })

    return users

  } catch (error) {
    console.error('❌ Error listando usuarios:', error)
    throw error
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando gestión de usuarios...\n')
  
  try {
    // Listar usuarios existentes
    await listAllUsers()
    
    // Crear o verificar admin
    await createAdminUser()
    
    console.log('\n✨ Proceso completado exitosamente!')
    
  } catch (error) {
    console.error('💥 Error en el proceso:', error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

module.exports = { createAdminUser, listAllUsers }