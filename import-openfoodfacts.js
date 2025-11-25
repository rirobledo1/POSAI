// Script para importar productos desde Open Food Facts API
// =========================================================
// GRATIS - Base de datos de +1M productos alimenticios
// =========================================================

const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

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

// ============================================
// FUNCIONES DE API OPEN FOOD FACTS
// ============================================

async function buscarProductoPorCodigoBarras(codigoBarras) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${codigoBarras}.json`
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'FerreAI - POS System - contact@ferreai.com'
      }
    })

    if (response.data.status === 1) {
      const p = response.data.product
      return {
        nombre: p.product_name || p.product_name_es || 'Sin nombre',
        marca: p.brands || '',
        categoria: p.categories ? p.categories.split(',')[0] : 'Sin categoría',
        codigoBarras: p.code,
        descripcion: p.ingredients_text_es || p.ingredients_text || '',
        imagen: p.image_url || null,
        pais: p.countries_tags ? p.countries_tags[0] : ''
      }
    }
    return null
  } catch (error) {
    log.error(`Error buscando código ${codigoBarras}: ${error.message}`)
    return null
  }
}

async function buscarProductosMexico(categoria = 'snacks', limite = 50) {
  try {
    const url = 'https://mx.openfoodfacts.org/api/v2/search'
    const response = await axios.get(url, {
      params: {
        categories_tags: categoria,
        countries_tags: 'mexico',
        page_size: limite,
        fields: 'code,product_name,product_name_es,brands,categories,image_url,ingredients_text_es'
      },
      headers: {
        'User-Agent': 'FerreAI - POS System - contact@ferreai.com'
      }
    })

    return response.data.products.map(p => ({
      nombre: p.product_name_es || p.product_name || 'Sin nombre',
      marca: p.brands || '',
      categoria: p.categories ? p.categories.split(',')[0] : categoria,
      codigoBarras: p.code,
      descripcion: p.ingredients_text_es || '',
      imagen: p.image_url || null
    }))
  } catch (error) {
    log.error(`Error buscando productos: ${error.message}`)
    return []
  }
}

// ============================================
// IMPORTACIÓN A PRISMA
// ============================================

async function importarProducto(productoData, companyId, categoryId) {
  try {
    // Verificar si ya existe
    const existe = await prisma.product.findFirst({
      where: {
        barcode: productoData.codigoBarras,
        companyId: companyId
      }
    })

    if (existe) {
      log.warning(`Ya existe: ${productoData.nombre}`)
      return null
    }

    // Crear producto
    const producto = await prisma.product.create({
      data: {
        name: productoData.nombre.substring(0, 100), // Limitar longitud
        barcode: productoData.codigoBarras,
        description: productoData.descripcion ? productoData.descripcion.substring(0, 500) : null,
        price: 0, // Usuario deberá agregar precio
        cost: 0,  // Usuario deberá agregar costo
        stock: 0,
        categoryId: categoryId,
        companyId: companyId,
        imageUrl: productoData.imagen,
        active: true
      }
    })

    log.success(`Importado: ${producto.name}`)
    return producto
  } catch (error) {
    log.error(`Error importando ${productoData.nombre}: ${error.message}`)
    return null
  }
}

// ============================================
// SCRIPT PRINCIPAL
// ============================================

async function importarDesdeOpenFoodFacts() {
  console.log('\n' + '='.repeat(80))
  console.log('📦 IMPORTAR PRODUCTOS DESDE OPEN FOOD FACTS')
  console.log('='.repeat(80) + '\n')

  try {
    await prisma.$connect()
    log.success('Conectado a base de datos\n')

    // CONFIGURACIÓN - AJUSTA ESTOS VALORES
    const COMPANY_ID = 'TU_COMPANY_ID_AQUI'  // ⚠️ CAMBIAR
    const CATEGORY_ID = 'TU_CATEGORY_ID_AQUI' // ⚠️ CAMBIAR
    const CATEGORIA = 'snacks' // Opciones: snacks, beverages, dairy, breakfast-cereals, etc.
    const LIMITE = 50

    log.step(`Configuración:`)
    console.log(`   Company ID: ${COMPANY_ID}`)
    console.log(`   Category ID: ${CATEGORY_ID}`)
    console.log(`   Categoría a importar: ${CATEGORIA}`)
    console.log(`   Límite: ${LIMITE} productos\n`)

    // Validar configuración
    if (COMPANY_ID === 'TU_COMPANY_ID_AQUI') {
      log.error('⚠️  Debes configurar COMPANY_ID primero!')
      log.info('1. Ejecuta: node -e "const {PrismaClient} = require(\'@prisma/client\'); const p = new PrismaClient(); p.company.findMany().then(c => console.log(c))"')
      log.info('2. Copia el ID de tu empresa')
      log.info('3. Pégalo en COMPANY_ID dentro de este script\n')
      process.exit(1)
    }

    log.step('Buscando productos en Open Food Facts...\n')

    const productos = await buscarProductosMexico(CATEGORIA, LIMITE)
    
    if (productos.length === 0) {
      log.warning('No se encontraron productos')
      return
    }

    log.success(`Encontrados ${productos.length} productos\n`)
    log.step('Iniciando importación...\n')

    let importados = 0
    let errores = 0
    let duplicados = 0

    for (const prod of productos) {
      const resultado = await importarProducto(prod, COMPANY_ID, CATEGORY_ID)
      
      if (resultado) {
        importados++
      } else if (resultado === null) {
        duplicados++
      } else {
        errores++
      }
      
      // Esperar un poco para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n' + '='.repeat(80))
    log.success('✨ Importación completada!')
    console.log('='.repeat(80))
    console.log(`\n📊 Resumen:`)
    console.log(`   • Productos encontrados: ${productos.length}`)
    console.log(`   • Importados exitosamente: ${importados}`)
    console.log(`   • Duplicados (ya existían): ${duplicados}`)
    console.log(`   • Errores: ${errores}`)
    console.log()

    log.info('💡 Próximos pasos:')
    console.log('   1. Ve a tu sistema y revisa los productos importados')
    console.log('   2. Asigna precios a cada producto')
    console.log('   3. Ajusta el stock inicial')
    console.log('   4. Ejecuta este script con otras categorías\n')

    log.warning('⚠️  Nota: Los productos importados tienen precio $0')
    log.warning('   Deberás configurar los precios manualmente\n')

  } catch (error) {
    log.error('Error durante la importación:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// ============================================
// FUNCIÓN DE AYUDA - Buscar un solo código
// ============================================

async function buscarUnCodigo(codigo) {
  console.log(`\n🔍 Buscando código: ${codigo}...\n`)
  
  const producto = await buscarProductoPorCodigoBarras(codigo)
  
  if (producto) {
    console.log('✅ Producto encontrado:')
    console.log(JSON.stringify(producto, null, 2))
  } else {
    console.log('❌ Producto no encontrado en Open Food Facts')
  }
}

// ============================================
// EJECUCIÓN
// ============================================

// Detectar modo de ejecución
const args = process.argv.slice(2)

if (args[0] === 'buscar' && args[1]) {
  // Modo búsqueda: node import-openfoodfacts.js buscar 7501055363032
  buscarUnCodigo(args[1])
} else if (args[0] === 'importar') {
  // Modo importación: node import-openfoodfacts.js importar
  importarDesdeOpenFoodFacts()
} else {
  console.log(`
📦 IMPORTADOR DE PRODUCTOS - OPEN FOOD FACTS

Uso:

1. Buscar un producto por código de barras:
   node import-openfoodfacts.js buscar 7501055363032

2. Importar productos de una categoría:
   node import-openfoodfacts.js importar

Categorías disponibles:
  • snacks (botanas)
  • beverages (bebidas)
  • dairy (lácteos)
  • breakfast-cereals (cereales)
  • chocolates
  • cookies (galletas)
  • candies (dulces)
  • frozen-foods (congelados)

⚠️  IMPORTANTE: Antes de importar, configura COMPANY_ID y CATEGORY_ID
    dentro del script (líneas 114-115)
  `)
}
