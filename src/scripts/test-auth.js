// Script para verificar la autenticación
// src/scripts/test-auth.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuthentication() {
  try {
    console.log('🔐 Probando autenticación...\n')

    // 1. Verificar que el usuario admin existe
    console.log('1. Verificando usuario admin...')
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ferreai.com' }
    })

    if (!adminUser) {
      console.log('❌ Usuario admin no encontrado')
      return false
    }

    console.log('✅ Usuario admin encontrado:')
    console.log(`   - ID: ${adminUser.id}`)
    console.log(`   - Nombre: ${adminUser.name}`)
    console.log(`   - Email: ${adminUser.email}`)
    console.log(`   - Rol: ${adminUser.role}`)
    console.log(`   - Activo: ${adminUser.isActive}`)

    // 2. Verificar que la contraseña es correcta
    console.log('\n2. Verificando contraseña...')
    const passwordMatch = await bcrypt.compare('admin123', adminUser.password)
    
    if (passwordMatch) {
      console.log('✅ Contraseña correcta')
    } else {
      console.log('❌ Contraseña incorrecta')
      return false
    }

    // 3. Verificar estructura de la base de datos
    console.log('\n3. Verificando estructura de la base de datos...')
    
    const tableStats = await Promise.all([
      prisma.user.count(),
      prisma.sale.count(),
      prisma.product.count(),
      prisma.customer.count()
    ])

    console.log('✅ Estadísticas de la base de datos:')
    console.log(`   - Usuarios: ${tableStats[0]}`)
    console.log(`   - Ventas: ${tableStats[1]}`)
    console.log(`   - Productos: ${tableStats[2]}`)
    console.log(`   - Clientes: ${tableStats[3]}`)

    console.log('\n🎉 Autenticación configurada correctamente!')
    console.log('\n📝 Credenciales de acceso:')
    console.log('   Email: admin@ferreai.com')
    console.log('   Password: admin123')
    console.log('   URL: http://localhost:3000/login')

    return true

  } catch (error) {
    console.error('❌ Error en verificación:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Función para crear usuarios de prueba adicionales
async function createTestUsers() {
  try {
    console.log('\n👥 Creando usuarios de prueba...')

    const testUsers = [
      {
        name: 'Vendedor Demo',
        email: 'vendedor@ferreai.com', 
        password: 'vendedor123',
        role: 'VENDEDOR'
      },
      {
        name: 'Almacenista Demo',
        email: 'almacen@ferreai.com',
        password: 'almacen123', 
        role: 'ALMACEN'
      }
    ]

    for (const userData of testUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`⚠️  Usuario ${userData.email} ya existe`)
        continue
      }

      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      const newUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          isActive: true
        }
      })

      console.log(`✅ Usuario creado: ${newUser.email} (${newUser.role})`)
    }

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error)
  }
}

async function main() {
  console.log('🧪 Verificación de autenticación y usuarios\n')
  
  const authWorking = await testAuthentication()
  
  if (authWorking) {
    await createTestUsers()
    
    console.log('\n✨ Verificación completada!')
    console.log('\n🚀 Ahora puedes:')
    console.log('   1. Ir a http://localhost:3000/login')
    console.log('   2. Usar admin@ferreai.com / admin123')
    console.log('   3. Probar la funcionalidad de cancelación de ventas')
  } else {
    console.log('\n💥 Hay problemas con la autenticación')
  }
}

if (require.main === module) {
  main()
}

module.exports = { testAuthentication, createTestUsers }