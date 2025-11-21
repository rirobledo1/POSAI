/**
 * Script para reorganizar categorías según la nueva estructura de ferretería
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  ssl: false,
});

// Nuevas categorías estándar de ferretería
const NEW_CATEGORIES = [
  {
    id: 'herramientas',
    name: 'Herramientas',
    description: 'Herramientas manuales y eléctricas, como destornilladores, taladros, sierras, y llaves. Esenciales para cualquier proyecto de bricolaje o construcción.',
    keywords: ['martillo', 'destornillador', 'taladro', 'sierra', 'llave', 'alicate', 'broca', 'nivel', 'cinta métrica', 'escuadra', 'lima', 'serrucho']
  },
  {
    id: 'materiales-construccion',
    name: 'Materiales de Construcción',
    description: 'Productos como cemento, ladrillos, madera, y paneles de yeso, utilizados en la construcción y renovación de espacios.',
    keywords: ['cemento', 'ladrillo', 'madera', 'yeso', 'varilla', 'alambre', 'malla', 'poste', 'concreto', 'block', 'grava', 'arena']
  },
  {
    id: 'cerrajeria-herrajes',
    name: 'Cerrajería y Herrajes',
    description: 'Cerraduras, bisagras, y otros elementos de seguridad y funcionalidad para puertas y ventanas.',
    keywords: ['cerradura', 'chapa', 'bisagra', 'candado', 'manija', 'pomo', 'picaporte', 'herraje', 'aldaba', 'pasador']
  },
  {
    id: 'pinturas-acabados',
    name: 'Pinturas y Acabados',
    description: 'Productos para pintar y dar acabado a superficies, incluyendo pinturas, selladores, y adhesivos.',
    keywords: ['pintura', 'barniz', 'esmalte', 'sellador', 'adhesivo', 'pegamento', 'brocha', 'rodillo', 'thinner', 'lija', 'masilla']
  },
  {
    id: 'articulos-limpieza',
    name: 'Artículos de Limpieza',
    description: 'Productos para la limpieza del hogar y la industria, como detergentes, escobas, y trapos.',
    keywords: ['detergente', 'escoba', 'trapo', 'limpiador', 'desinfectante', 'jabón', 'cepillo', 'aspiradora', 'trapeador']
  },
  {
    id: 'jardineria',
    name: 'Jardinería',
    description: 'Herramientas y suministros para el cuidado de jardines, como macetas, tierra, y fertilizantes.',
    keywords: ['maceta', 'tierra', 'fertilizante', 'semilla', 'pala', 'rastrillo', 'tijera', 'manguera', 'aspersor', 'abono', 'insecticida']
  },
  {
    id: 'electricidad-fontaneria',
    name: 'Electricidad y Fontanería',
    description: 'Materiales y herramientas para instalaciones eléctricas y de fontanería, incluyendo cables, interruptores, y tuberías.',
    keywords: ['cable', 'interruptor', 'contacto', 'foco', 'tubo', 'válvula', 'codo', 'reducción', 'breaker', 'socket', 'extensión']
  },
  {
    id: 'seguridad-proteccion',
    name: 'Seguridad y Protección',
    description: 'Equipos de protección personal y productos de seguridad industrial, como cascos, guantes, y gafas de seguridad.',
    keywords: ['casco', 'guante', 'gafa', 'protección', 'seguridad', 'chaleco', 'mascarilla', 'arnés', 'extintor', 'alarma']
  },
  {
    id: 'bricolaje',
    name: 'Bricolaje',
    description: 'Artículos para proyectos de bricolaje, que pueden incluir kits de herramientas y materiales específicos para manualidades.',
    keywords: ['kit', 'manualidad', 'hobby', 'decoración', 'artesanía', 'proyecto', 'creatividad', 'diy']
  },
  {
    id: 'quimicos-fumigacion',
    name: 'Químicos y Fumigación',
    description: 'Productos químicos para el control de plagas y mantenimiento del hogar.',
    keywords: ['fumigación', 'insecticida', 'raticida', 'químico', 'plaga', 'veneno', 'spray', 'control', 'plaguicida']
  },
  {
    id: 'otra-categoria',
    name: 'Otra Categoría',
    description: 'Productos que no entran en las categorías anteriores.',
    keywords: ['otro', 'varios', 'misceláneo', 'general', 'diverso']
  }
];

async function step1_CreateNewCategories() {
  console.log('🏗️ PASO 1: Creando nuevas categorías estándar...\n');

  for (const category of NEW_CATEGORIES) {
    try {
      await pool.query(`
        INSERT INTO categories (id, name, description, active, created_at, updated_at)
        VALUES ($1, $2, $3, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [category.id, category.name, category.description]);

      console.log(`✅ ${category.name}`);
    } catch (error) {
      console.error(`❌ Error creando categoría ${category.name}:`, error.message);
    }
  }

  console.log('\n✅ Categorías estándar creadas/actualizadas\n');
}

async function step2_AnalyzeCurrentProducts() {
  console.log('🔍 PASO 2: Analizando productos existentes...\n');

  const result = await pool.query(`
    SELECT 
      p.id,
      p.name,
      p.description,
      p.category_id,
      c.name as current_category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = true
    ORDER BY p.name
  `);

  console.log(`📊 Total productos a reclasificar: ${result.rows.length}\n`);
  return result.rows;
}

async function step3_ReclassifyProducts() {
  console.log('🔄 PASO 3: Reclasificando productos...\n');

  const products = await step2_AnalyzeCurrentProducts();
  let reclassified = 0;
  let unchanged = 0;

  for (const product of products) {
    const newCategoryId = classifyProduct(product);
    
    if (newCategoryId !== product.category_id) {
      await pool.query(
        'UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = $2',
        [newCategoryId, product.id]
      );

      const newCategory = NEW_CATEGORIES.find(c => c.id === newCategoryId);
      console.log(`🔄 "${product.name}" → ${newCategory.name}`);
      reclassified++;
    } else {
      unchanged++;
    }
  }

  console.log(`\n📊 Reclasificación completada:`);
  console.log(`   ✅ Productos reclasificados: ${reclassified}`);
  console.log(`   ➡️ Productos sin cambios: ${unchanged}\n`);
}

function classifyProduct(product) {
  const text = `${product.name} ${product.description || ''}`.toLowerCase();

  // Buscar en las palabras clave de cada categoría
  for (const category of NEW_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category.id;
      }
    }
  }

  // Si no encuentra coincidencia, asignar a "Otra Categoría"
  return 'otra-categoria';
}

async function step4_CleanupOldCategories() {
  console.log('🧹 PASO 4: Limpiando categorías obsoletas...\n');

  const validCategoryIds = NEW_CATEGORIES.map(c => c.id);

  // Obtener categorías que no están en la nueva lista
  const obsoleteResult = await pool.query(`
    SELECT id, name, 
           (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
    FROM categories c
    WHERE id NOT IN (${validCategoryIds.map((_, i) => `$${i + 1}`).join(', ')})
  `, validCategoryIds);

  console.log(`🗑️ Categorías obsoletas encontradas: ${obsoleteResult.rows.length}\n`);

  for (const category of obsoleteResult.rows) {
    if (category.product_count > 0) {
      console.log(`⚠️ ADVERTENCIA: "${category.name}" tiene ${category.product_count} productos. Moviendo a "Otra Categoría"...`);
      
      await pool.query(
        'UPDATE products SET category_id = $1, updated_at = NOW() WHERE category_id = $2',
        ['otra-categoria', category.id]
      );
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [category.id]);
    console.log(`🗑️ Categoría eliminada: ${category.name}`);
  }

  console.log('\n✅ Limpieza completada\n');
}

async function step5_GenerateReport() {
  console.log('📊 PASO 5: Generando reporte final...\n');

  const result = await pool.query(`
    SELECT 
      c.id,
      c.name,
      COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.active = true
    GROUP BY c.id, c.name
    ORDER BY product_count DESC, c.name
  `);

  console.log('📈 DISTRIBUCIÓN FINAL DE PRODUCTOS POR CATEGORÍA:\n');
  
  let totalProducts = 0;
  result.rows.forEach((category, index) => {
    console.log(`${index + 1}. ${category.name}: ${category.product_count} productos`);
    totalProducts += category.product_count;
  });

  console.log(`\n📊 TOTAL: ${totalProducts} productos en ${result.rows.length} categorías\n`);
}

async function main() {
  try {
    console.log('🚀 INICIANDO REORGANIZACIÓN COMPLETA DE CATEGORÍAS\n');
    console.log('=' .repeat(60) + '\n');

    await step1_CreateNewCategories();
    await step3_ReclassifyProducts();
    await step4_CleanupOldCategories();
    await step5_GenerateReport();

    console.log('🎉 ¡REORGANIZACIÓN COMPLETADA EXITOSAMENTE!\n');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Error durante la reorganización:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { NEW_CATEGORIES, classifyProduct };
