// seed-products.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProducts() {
  try {
    console.log('🌱 Creando productos de ferretería...\n')

    // Primero verificamos si tenemos categorías
    let category = await prisma.categories.findFirst({
      where: { name: 'Herramientas' }
    })

    if (!category) {
      console.log('📁 Creando categoría de Herramientas...')
      category = await prisma.categories.create({
        data: {
          id: `cat-${Date.now()}`,
          name: 'Herramientas',
          description: 'Herramientas y accesorios para construcción y reparación',
          active: true,
          updated_at: new Date()
        }
      })
    }

    const productos = [
      { name: 'Martillo de Garra 16oz', price: 125.00, stock: 25 },
      { name: 'Destornillador Phillips #2', price: 35.50, stock: 50 },
      { name: 'Destornillador Plano 6mm', price: 32.00, stock: 45 },
      { name: 'Alicate Universal 8"', price: 89.99, stock: 30 },
      { name: 'Llave Inglesa 10"', price: 156.75, stock: 20 },
      { name: 'Taladro Eléctrico 600W', price: 1250.00, stock: 8 },
      { name: 'Broca para Concreto 8mm', price: 45.00, stock: 100 },
      { name: 'Broca para Metal 6mm', price: 38.50, stock: 75 },
      { name: 'Sierra Manual 24"', price: 198.00, stock: 15 },
      { name: 'Nivel de Burbuja 60cm', price: 245.00, stock: 12 },
      { name: 'Cinta Métrica 5m', price: 65.00, stock: 40 },
      { name: 'Escalera Plegable 3 Pasos', price: 850.00, stock: 5 },
      { name: 'Pinzas de Presión 8"', price: 95.50, stock: 25 },
      { name: 'Llaves Combinadas Set 8-19mm', price: 320.00, stock: 18 },
      { name: 'Tornillos Autorroscantes 1" (100pz)', price: 75.00, stock: 200 },
      { name: 'Tornillos para Madera 2" (50pz)', price: 85.00, stock: 150 },
      { name: 'Clavos Galvanizados 2" (1kg)', price: 45.00, stock: 80 },
      { name: 'Candado de Latón 40mm', price: 125.00, stock: 35 },
      { name: 'Cerradura para Puerta', price: 280.00, stock: 22 },
      { name: 'Bisagras de Acero 3" (Par)', price: 55.00, stock: 60 },
      { name: 'Cable Eléctrico 12AWG (m)', price: 18.50, stock: 500 },
      { name: 'Interruptor Sencillo', price: 32.00, stock: 85 },
      { name: 'Contacto Doble con Tierra', price: 48.00, stock: 70 },
      { name: 'Foco LED 9W Luz Blanca', price: 85.00, stock: 120 },
      { name: 'Extension Eléctrica 5m', price: 145.00, stock: 28 },
      { name: 'Tubo PVC 4" (3m)', price: 185.00, stock: 25 },
      { name: 'Codo PVC 4" x 90°', price: 45.00, stock: 150 },
      { name: 'Pegamento PVC 250ml', price: 65.00, stock: 40 },
      { name: 'Llave de Paso 1/2"', price: 125.00, stock: 30 },
      { name: 'Manguera de Jardín 1/2" (15m)', price: 285.00, stock: 18 },
      { name: 'Spray Lubricante WD-40', price: 95.00, stock: 45 },
      { name: 'Silicón Transparente 300ml', price: 78.00, stock: 55 },
      { name: 'Pintura Vinílica Blanca 1L', price: 165.00, stock: 35 },
      { name: 'Brocha 2" Cerda Natural', price: 85.00, stock: 40 },
      { name: 'Rodillo para Pintura 9"', price: 125.00, stock: 30 },
      { name: 'Lija de Agua #220 (hoja)', price: 12.00, stock: 200 },
      { name: 'Disco de Corte 4.5" Metal', price: 35.00, stock: 100 },
      { name: 'Esmeriladora Angular 4.5"', price: 985.00, stock: 6 },
      { name: 'Gafas de Seguridad', price: 65.00, stock: 50 },
      { name: 'Guantes de Carnaza (Par)', price: 45.00, stock: 80 },
      { name: 'Casco de Seguridad', price: 155.00, stock: 25 },
      { name: 'Mascarilla N95 (10pz)', price: 125.00, stock: 60 },
      { name: 'Cinta Aislante Negra', price: 25.00, stock: 100 },
      { name: 'Amarres Plásticos 15cm (100pz)', price: 35.00, stock: 75 },
      { name: 'Prensa Tipo C 4"', price: 185.00, stock: 20 },
      { name: 'Lima Plana 8" Bastarda', price: 65.00, stock: 35 },
      { name: 'Segueta con Marco', price: 95.00, stock: 25 },
      { name: 'Hojas de Segueta (10pz)', price: 45.00, stock: 60 },
      { name: 'Escuadra de Carpintero 12"', price: 125.00, stock: 18 },
      { name: 'Formón 1/2" Mango Madera', price: 85.00, stock: 30 }
    ]

    console.log(`🔄 Creando ${productos.length} productos...`)

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i]
      const productId = `prod-${Date.now()}-${i}`
      
      try {
        await prisma.products.create({
          data: {
            id: productId,
            name: producto.name,
            description: `${producto.name} - Producto de ferretería de alta calidad`,
            barcode: `BC-${Date.now()}-${i}`,
            price: producto.price,
            cost: producto.price * 0.6, // 40% de margen
            stock: producto.stock,
            minStock: 5,
            categoryId: category.id,
            active: true
          }
        })
        
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Creados ${i + 1} productos...`)
        }
      } catch (error) {
        console.error(`❌ Error creando producto ${producto.name}:`, error.message)
      }
    }

    // Verificar totales
    const totalProducts = await prisma.products.count()
    const activeProducts = await prisma.products.count({ where: { active: true } })
    const productsWithStock = await prisma.products.count({ 
      where: { 
        active: true,
        stock: { gt: 0 }
      }
    })

    console.log('\n📊 Resumen:')
    console.log(`   Total productos: ${totalProducts}`)
    console.log(`   Productos activos: ${activeProducts}`)
    console.log(`   Productos con stock: ${productsWithStock}`)
    
    console.log('\n🎉 ¡Productos creados exitosamente!')
    console.log('✅ Ahora el POS debería mostrar todos los productos disponibles')

  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProducts()
