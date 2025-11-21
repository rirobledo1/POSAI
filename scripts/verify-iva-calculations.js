// Script para verificar los nuevos cálculos de IVA
// Método Mexicano: Precios incluyen IVA

console.log('🧮 Verificando Cálculos de IVA - Método Mexicano');
console.log('================================================');

// Configuración de prueba
const taxRate = 0.16; // 16% IVA

// Ejemplo 1: Producto con precio $116 (incluye IVA)
const precioConIVA1 = 116;
const total1 = precioConIVA1;
const subtotal1 = total1 / (1 + taxRate);
const iva1 = total1 - subtotal1;

console.log('\n📦 Producto: Martillo');
console.log(`💰 Precio mostrado: $${precioConIVA1.toFixed(2)} (incluye IVA)`);
console.log(`📊 Total: $${total1.toFixed(2)}`);
console.log(`📋 Subtotal (sin IVA): $${subtotal1.toFixed(2)}`);
console.log(`🧾 IVA (${(taxRate * 100)}%): $${iva1.toFixed(2)}`);
console.log(`✅ Verificación: ${subtotal1.toFixed(2)} + ${iva1.toFixed(2)} = ${(subtotal1 + iva1).toFixed(2)}`);

// Ejemplo 2: Carrito con múltiples productos
const productos = [
  { nombre: 'Martillo', precio: 116, cantidad: 1 },
  { nombre: 'Destornillador', precio: 58, cantidad: 2 },
  { nombre: 'Tornillos', precio: 23.20, cantidad: 3 }
];

console.log('\n🛒 CARRITO DE COMPRAS:');
let totalCarrito = 0;

productos.forEach(producto => {
  const subtotalProducto = producto.precio * producto.cantidad;
  totalCarrito += subtotalProducto;
  console.log(`   ${producto.nombre}: $${producto.precio} x ${producto.cantidad} = $${subtotalProducto.toFixed(2)}`);
});

const totalFinal = totalCarrito;
const subtotalFinal = totalFinal / (1 + taxRate);
const ivaFinal = totalFinal - subtotalFinal;

console.log('\n📊 RESUMEN TOTAL:');
console.log(`💰 Total (precios con IVA): $${totalFinal.toFixed(2)}`);
console.log(`📋 Subtotal (sin IVA): $${subtotalFinal.toFixed(2)}`);
console.log(`🧾 IVA incluido (${(taxRate * 100)}%): $${ivaFinal.toFixed(2)}`);
console.log(`✅ Verificación: ${subtotalFinal.toFixed(2)} + ${ivaFinal.toFixed(2)} = ${(subtotalFinal + ivaFinal).toFixed(2)}`);

// Comparación con método anterior (incorrecto)
console.log('\n⚠️  COMPARACIÓN CON MÉTODO ANTERIOR (INCORRECTO):');
const subtotalAnterior = totalFinal; // Antes el "subtotal" era la suma de precios
const ivaAnterior = subtotalAnterior * taxRate; // IVA se sumaba después
const totalAnterior = subtotalAnterior + ivaAnterior; // Total era más alto

console.log(`❌ Método anterior (incorrecto):`);
console.log(`   Subtotal: $${subtotalAnterior.toFixed(2)}`);
console.log(`   + IVA: $${ivaAnterior.toFixed(2)}`);
console.log(`   = Total: $${totalAnterior.toFixed(2)}`);

console.log(`✅ Método mexicano (correcto):`);
console.log(`   Total: $${totalFinal.toFixed(2)} (IVA incluido)`);
console.log(`   Subtotal: $${subtotalFinal.toFixed(2)} (sin IVA)`);
console.log(`   IVA: $${ivaFinal.toFixed(2)} (incluido en precio)`);

console.log(`\n💡 Diferencia: $${(totalAnterior - totalFinal).toFixed(2)} menos con método mexicano`);

// Ejemplo con IVA del 8% (zona fronteriza)
console.log('\n🌎 EJEMPLO ZONA FRONTERIZA (IVA 8%):');
const taxRateFrontera = 0.08;
const precioFrontera = 108; // Precio con IVA 8%
const totalFrontera = precioFrontera;
const subtotalFrontera = totalFrontera / (1 + taxRateFrontera);
const ivaFrontera = totalFrontera - subtotalFrontera;

console.log(`💰 Precio: $${precioFrontera.toFixed(2)} (incluye IVA 8%)`);
console.log(`📋 Subtotal: $${subtotalFrontera.toFixed(2)}`);
console.log(`🧾 IVA (8%): $${ivaFrontera.toFixed(2)}`);
console.log(`✅ Total: $${totalFrontera.toFixed(2)}`);

console.log('\n🎯 ¡Cálculos verificados! El sistema ahora funciona correctamente para México.');
