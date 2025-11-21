// Script directo para actualizar contraseña usando SQL
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function updateAdminPasswordDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('🔌 Conectado a PostgreSQL')

    // Generar el hash de la contraseña
    const newPasswordHash = await bcrypt.hash('admin123', 12)
    console.log('🔑 Hash generado:', newPasswordHash.substring(0, 25) + '...')

    // Verificar usuario actual
    const currentUser = await client.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      ['admin@ferreai.com']
    )

    if (currentUser.rows.length === 0) {
      console.log('❌ Usuario admin@ferreai.com no encontrado')
      return
    }

    console.log('✅ Usuario encontrado:', currentUser.rows[0])

    // Actualizar la contraseña
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, name, email, role',
      [newPasswordHash, 'admin@ferreai.com']
    )

    console.log('✅ Contraseña actualizada exitosamente!')
    console.log('👤 Usuario:', result.rows[0])

    // Verificar que el hash funciona
    const isValid = await bcrypt.compare('admin123', newPasswordHash)
    console.log('🔐 Verificación:', isValid ? '✅ Hash correcto' : '❌ Hash incorrecto')

    console.log('\n🎯 Ahora puedes hacer login con:')
    console.log('📧 Email: admin@ferreai.com')
    console.log('🔑 Contraseña: admin123')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

updateAdminPasswordDirect()
