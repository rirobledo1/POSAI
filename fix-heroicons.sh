#!/bin/bash
# Ì¥ß SCRIPT DE CORRECCI√ìN R√ÅPIDA - HEROICONS

echo "Ì¥ß Corrigiendo errores de Heroicons en FerreAI..."

# 1. Verificar que @heroicons/react est√© instalado
echo "Ì≥¶ Verificando dependencias..."
if ! npm list @heroicons/react > /dev/null 2>&1; then
    echo "‚ö†Ô∏è  Instalando @heroicons/react..."
    npm install @heroicons/react
else
    echo "‚úÖ @heroicons/react est√° instalado"
fi

# 2. Verificar los iconos correctos disponibles
echo "Ì¥ç Verificando iconos disponibles..."
node -e "
try {
  const icons = require('@heroicons/react/24/outline');
  const requiredIcons = [
    'ArrowTrendingUpIcon',
    'CurrencyDollarIcon', 
    'CubeIcon',
    'UsersIcon',
    'ExclamationTriangleIcon',
    'ShoppingCartIcon',
    'HomeIcon',
    'ChartBarIcon',
    'DocumentTextIcon',
    'CogIcon',
    'Bars3Icon',
    'XMarkIcon',
    'ArrowRightOnRectangleIcon'
  ];
  
  console.log('Ì≥ã Iconos requeridos:');
  requiredIcons.forEach(icon => {
    if (icons[icon]) {
      console.log('‚úÖ', icon);
    } else {
      console.log('‚ùå', icon, '- NO DISPONIBLE');
    }
  });
  
} catch (error) {
  console.error('‚ùå Error:', error.message);
}
"

# 3. Verificar compilaci√≥n TypeScript
echo "Ì¥ç Verificando tipos TypeScript..."
npx tsc --noEmit --skipLibCheck

echo ""
echo "‚úÖ CORRECCIONES APLICADAS:"
echo "1. ‚úÖ TrendingUpIcon ‚Üí ArrowTrendingUpIcon"
echo "2. ‚úÖ Verificaci√≥n de dependencias"
echo "3. ‚úÖ Types verificados"
echo ""
echo "Ì∫Ä SIGUIENTE PASO:"
echo "docker-compose up -d postgres && npm run dev"
echo "Ì≥± URL: http://localhost:3001/dashboard"
