const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Categorías de herramientas para ferretería
const categories = [
  {
    id: 'cat_herramientas_manuales',
    name: 'Herramientas Manuales',
    description: 'Martillos, destornilladores, llaves, alicates, cinceles y herramientas básicas de mano'
  },
  {
    id: 'cat_herramientas_electricas',
    name: 'Herramientas Eléctricas',
    description: 'Taladros, sierras eléctricas, amoladoras, lijadoras y herramientas con motor'
  },
  {
    id: 'cat_ferreteria_general',
    name: 'Ferretería General',
    description: 'Tornillos, tuercas, arandelas, clavos, grapas y elementos de fijación'
  },
  {
    id: 'cat_plomeria',
    name: 'Plomería',
    description: 'Tubos, codos, llaves de paso, grifos, conexiones y accesorios de fontanería'
  },
  {
    id: 'cat_electricidad',
    name: 'Electricidad',
    description: 'Cables, interruptores, enchufes, cajas de distribución y material eléctrico'
  },
  {
    id: 'cat_pintura',
    name: 'Pintura y Acabados',
    description: 'Pinturas, barnices, brochas, rodillos, lijas y materiales para pintura'
  },
  {
    id: 'cat_construccion',
    name: 'Construcción',
    description: 'Cemento, arena, grava, ladrillos, blocks y materiales de construcción'
  },
  {
    id: 'cat_jardineria',
    name: 'Jardinería',
    description: 'Herramientas de jardín, mangueras, aspersores, macetas y accesorios'
  },
  {
    id: 'cat_seguridad',
    name: 'Seguridad Industrial',
    description: 'Cascos, guantes, gafas, mascarillas y equipo de protección personal'
  },
  {
    id: 'cat_automotriz',
    name: 'Automotriz',
    description: 'Herramientas para auto, aceites, filtros, bujías y accesorios vehiculares'
  },
  {
    id: 'cat_medicion',
    name: 'Medición',
    description: 'Metros, niveles, escuadras, calibradores y instrumentos de medición'
  },
  {
    id: 'cat_adhesivos',
    name: 'Adhesivos y Selladores',
    description: 'Pegamentos, silicones, cintas adhesivas, selladores y productos químicos'
  }
]

async function insertCategories() {
  try {
    console.log('📦 Insertando categorías de herramientas...')
    
    let insertedCount = 0
    
    for (const category of categories) {
      try {
        await prisma.categories.create({
          data: {
            id: category.id,
            name: category.name,
            description: category.description,
            active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
        console.log(`✅ Insertada: ${category.name}`)
        insertedCount++
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Ya existe: ${category.name}`)
        } else {
          console.error(`❌ Error insertando ${category.name}:`, error.message)
        }
      }
    }
    
    const totalCategories = await prisma.categories.count()
    
    console.log(`\n📊 Resumen:`)
    console.log(`- Categorías insertadas: ${insertedCount}`)
    console.log(`- Total de categorías en BD: ${totalCategories}`)
    console.log(`✨ Proceso completado`)
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  insertCategories()
}

module.exports = { categories, insertCategories }