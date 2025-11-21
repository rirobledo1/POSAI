/**
 * 🔧 Script para hacer campos companyId obligatorios
 * 
 * Este script modifica el schema.prisma para cambiar todos los
 * companyId de opcionales (String?) a obligatorios (String)
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

console.log('🔧 Modificando schema.prisma para hacer companyId obligatorios...\n');

try {
  // Leer el archivo
  let content = fs.readFileSync(schemaPath, 'utf8');

  // Contador de cambios
  let changeCount = 0;

  // Buscar y reemplazar todos los companyId opcionales
  const patterns = [
    {
      // Patrón 1: companyId con espacios
      from: /companyId\s+String\?\s+@map\("company_id"\)/g,
      to: 'companyId String    @map("company_id")'
    },
    {
      // Patrón 2: company relación
      from: /company\s+Company\?\s+@relation/g,
      to: 'company   Company   @relation'
    },
    {
      // Patrón 3: Remover comentarios temporales
      from: /\/\/ 🆕 MULTI-TENANT \(temporal opcional para migración\)/g,
      to: '// 🆕 MULTI-TENANT'
    }
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern.from);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(pattern.from, pattern.to);
    }
  });

  // Guardar el archivo modificado
  fs.writeFileSync(schemaPath, content, 'utf8');

  console.log(`✅ Schema modificado exitosamente!`);
  console.log(`   📝 ${changeCount} cambios realizados\n`);
  console.log('📋 Cambios aplicados:');
  console.log('   - companyId String? → companyId String');
  console.log('   - company Company? → company Company');
  console.log('   - Comentarios actualizados\n');
  console.log('⚠️  SIGUIENTE PASO:');
  console.log('   Ejecuta: npx prisma migrate dev --name make_company_id_required\n');

} catch (error) {
  console.error('❌ Error al modificar el schema:', error);
  process.exit(1);
}
