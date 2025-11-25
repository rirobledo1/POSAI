# 📦 GUÍA COMPLETA: Catálogos de Productos con Códigos de Barras

**Fecha:** 22 de Noviembre de 2025
**Para:** FerreAI
**Objetivo:** Obtener catálogos de productos con códigos de barras para poblar el sistema

---

## 🎯 OPCIONES DISPONIBLES (Ordenadas por Recomendación)

---

## 🥇 OPCIÓN 1: Base de Datos Acción Digital (RECOMENDADO PARA FERRETERÍAS)

### **URL:** https://site.acciondigital.com.mx/base_datos_ferreteria_codigo_barras/

### ✅ **Ventajas:**
- ✅ **+25,000 productos** de ferretería específicamente
- ✅ **~300 marcas** mexicanas (Truper, Urrea, Foset, Pretul, etc.)
- ✅ **Código de barras EAN-13** incluido
- ✅ Información completa: descripción, precio referencia, marca, SKU, unidad de medida
- ✅ **Base de datos estructurada** lista para importar
- ✅ Enfocado 100% en ferreterías mexicanas

### 💰 **Costo:**
- **Pago único** (llenar formulario para cotización)
- Sin suscripciones mensuales

### 📊 **Formato:**
- Probablemente Excel/CSV
- Datos: Código barras, Descripción, Marca, Precio, SKU, Unidad

### 🎯 **Mejor para:**
- Ferreterías
- Materiales de construcción
- Herramientas

### 📝 **Cómo obtenerlo:**
1. Visitar: https://site.acciondigital.com.mx/base_datos_ferreteria_codigo_barras/
2. Llenar formulario de compra
3. Recibir base de datos
4. Importar a FerreAI

---

## 🥈 OPCIÓN 2: Open Food Facts API (GRATIS - ALIMENTOS)

### **URL:** https://world.openfoodfacts.org/data

### ✅ **Ventajas:**
- ✅ **100% GRATUITO** y de código abierto
- ✅ **+1,000,000 productos** alimenticios globales
- ✅ **API REST** completa y bien documentada
- ✅ Código de barras EAN-13 y UPC
- ✅ Datos nutricionales completos
- ✅ Imágenes de productos
- ✅ Actualización constante por comunidad

### 📊 **Datos disponibles:**
- Código de barras (EAN-13, UPC)
- Nombre del producto
- Marca
- Categoría
- Ingredientes
- Información nutricional
- Imágenes
- País de origen

### 🔧 **API Endpoints:**

```javascript
// Obtener producto por código de barras
GET https://world.openfoodfacts.org/api/v2/product/7501055363032.json

// Buscar productos
GET https://world.openfoodfacts.org/cgi/search.pl?search_terms=galletas&json=1

// Productos de México específicamente
GET https://mx.openfoodfacts.org/api/v2/search?countries_tags=mexico
```

### 💻 **Ejemplo de uso en Node.js:**

```javascript
const axios = require('axios')

// Buscar producto por código de barras
async function buscarProducto(codigoBarras) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${codigoBarras}.json`
  const response = await axios.get(url)
  
  if (response.data.status === 1) {
    const product = response.data.product
    return {
      nombre: product.product_name,
      marca: product.brands,
      categoria: product.categories,
      codigoBarras: product.code,
      imagen: product.image_url,
      precio: null // No incluyen precios
    }
  }
  return null
}

// Buscar productos de México
async function buscarProductosMexico(categoria, pagina = 1) {
  const url = `https://mx.openfoodfacts.org/api/v2/search`
  const response = await axios.get(url, {
    params: {
      categories_tags: categoria,
      countries_tags: 'mexico',
      page: pagina,
      page_size: 100,
      fields: 'code,product_name,brands,categories,image_url'
    }
  })
  
  return response.data.products
}
```

### 🎯 **Mejor para:**
- Abarrotes
- Supermercados
- Tiendas de conveniencia
- Farmacias (algunos productos)

### ⚠️ **Limitaciones:**
- ❌ NO incluye precios
- ❌ Enfocado principalmente en alimentos
- ❌ Requiere integración técnica

---

## 🥉 OPCIÓN 3: Catálogos de Distribuidores Mayoristas (PARCIALMENTE GRATIS)

### **A) Truper - Catálogo 2025**

**URL:** https://www.truper.com/CatVigente/
**Productos:** +14,000 herramientas y materiales
**Formato:** PDF descargable

**Marcas incluidas:**
- Truper
- Pretul
- Foset
- Volteck
- Hermex
- Klintek
- Fiero

**Ventajas:**
- ✅ Gratis en PDF
- ✅ Actualizado semanalmente
- ✅ Precios de distribuidor disponibles

**Desventajas:**
- ❌ NO incluye códigos de barras directamente
- ❌ Formato PDF (difícil de automatizar)
- ❌ Necesitarías extraer datos manualmente o con OCR

---

### **B) Kladi.mx - Catálogo Truper en Excel**

**URL:** https://www.kladi.mx/descargable

**Ventajas:**
- ✅ Todo el catálogo Truper en **Excel/XLSX**
- ✅ Incluye: claves, descripciones, **códigos de barras**
- ✅ Fácil de importar

**Cómo usarlo:**
1. Descargar Excel de Kladi.mx
2. Convertir a CSV
3. Importar a FerreAI con script

---

### **C) Urrea - Catálogo**

**URL:** https://urrea.com/
**Productos:** +100 años de historia, catálogo extenso
**Formato:** PDF

**Ventajas:**
- ✅ Marca 100% mexicana
- ✅ Herramientas de alta calidad
- ✅ Reconocimiento nacional

**Desventajas:**
- ❌ Catálogo en PDF
- ❌ No incluye códigos de barras públicamente

---

## 🔧 OPCIÓN 4: APIs Comerciales

### **A) GS1 México - Base de Datos Oficial**

**URL:** https://www.gs1mexico.org/

**Descripción:**
- Organismo oficial de códigos de barras en México
- Prefijo 750 para productos mexicanos
- Base de datos de productos registrados

**Ventajas:**
- ✅ Fuente oficial de códigos de barras
- ✅ Validación de códigos

**Desventajas:**
- ❌ No ofrecen API pública
- ❌ Requiere membresía
- ❌ Enfocado en asignación, no en catálogo

---

### **B) Barcode Lookup APIs (Internacionales)**

**APIs disponibles:**

1. **UPCitemdb.com**
   - URL: https://www.upcitemdb.com/api
   - Gratis hasta 100 requests/día
   - Base de datos global

2. **Barcodelookup.com**
   - URL: https://www.barcodelookup.com/api
   - $20 USD/mes plan básico
   - 500 requests/mes

3. **Searchupc.com**
   - API gratuita limitada
   - Base de datos de productos globales

**Ejemplo de uso:**

```javascript
// UPCitemdb API
const axios = require('axios')

async function buscarPorCodigoBarras(ean) {
  const url = `https://api.upcitemdb.com/prod/trial/lookup`
  const response = await axios.get(url, {
    params: { upc: ean }
  })
  
  return response.data.items[0]
}
```

---

## 📋 OPCIÓN 5: Web Scraping (Avanzado)

### **Sitios para scraping:**

**Ferreterías Online:**
- Truper.com
- HomeDepot.com.mx
- Sodimac.com.mx
- Ferremexico.com
- Fyttsago.com

**Supermercados:**
- Walmart.com.mx
- Soriana.com
- Chedraui.com

### ⚠️ **Consideraciones Legales:**
- Revisar Terms of Service
- Respetar robots.txt
- No saturar servidores
- Uso solo para propósitos legítimos

### 💻 **Ejemplo básico con Puppeteer:**

```javascript
const puppeteer = require('puppeteer')

async function scrapearProductos(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  await page.goto(url)
  
  const productos = await page.evaluate(() => {
    const items = []
    document.querySelectorAll('.producto').forEach(prod => {
      items.push({
        nombre: prod.querySelector('.nombre').textContent,
        precio: prod.querySelector('.precio').textContent,
        sku: prod.querySelector('.sku').textContent
      })
    })
    return items
  })
  
  await browser.close()
  return productos
}
```

---

## 🎯 RECOMENDACIÓN POR TIPO DE NEGOCIO

### **FERRETERÍAS:**
1. 🥇 **Acción Digital** - Base de datos específica de ferretería (25K productos)
2. 🥈 **Kladi.mx** - Catálogo Truper en Excel con códigos
3. 🥉 **Integración manual** - Catálogos PDF de Truper/Urrea

### **ABARROTES/SUPERMERCADOS:**
1. 🥇 **Open Food Facts API** - Gratuito, +1M productos
2. 🥈 **UPCitemdb API** - Gratuito limitado
3. 🥉 **Web scraping** de Walmart/Soriana

### **PAPELERÍAS:**
- Combinación de Open Food Facts + catálogos de distribuidores
- Web scraping de Office Depot, OfficeMax

### **FARMACIAS:**
- Open Food Facts (productos OTC)
- Catálogos de distribuidores farmacéuticos

---

## 💡 PLAN DE ACCIÓN RECOMENDADO PARA FerreAI

### **Fase 1: Ferreterías (AHORA)**

```bash
# Paso 1: Contactar Acción Digital
1. Llenar formulario en: https://site.acciondigital.com.mx/base_datos_ferreteria_codigo_barras/
2. Negociar precio (probablemente $3,000-$8,000 MXN pago único)
3. Obtener base de datos en Excel/CSV

# Paso 2: Crear script de importación
2. Crear: /scripts/import-accion-digital.js
3. Mapear campos: código_barras -> barcode, descripcion -> name, etc.
4. Importar a tabla products
```

### **Fase 2: Abarrotes (SIGUIENTE)**

```bash
# Integración con Open Food Facts
1. Crear servicio: /src/lib/openfoodfacts.ts
2. Endpoint API: /api/products/search-barcode
3. Auto-completar productos al escanear código
```

### **Fase 3: Otros Rubros (FUTURO)**

```bash
# Según demanda de usuarios:
- Papelerías: Scraping Office Depot
- Farmacias: API especializada
- Ropa: Catálogos de marcas
```

---

## 📝 SCRIPT DE IMPORTACIÓN (EJEMPLO)

```javascript
// /scripts/import-catalog.js
const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const csv = require('csv-parser')

const prisma = new PrismaClient()

async function importarCatalogo(archivo, companyId) {
  const productos = []
  
  // Leer CSV
  fs.createReadStream(archivo)
    .pipe(csv())
    .on('data', (row) => {
      productos.push({
        name: row.descripcion || row.nombre,
        barcode: row.codigo_barras || row.ean,
        price: parseFloat(row.precio || 0),
        cost: parseFloat(row.costo || row.precio * 0.7),
        stock: 0,
        description: row.descripcion_larga,
        categoryId: 'default-category-id',
        companyId: companyId,
        active: true
      })
    })
    .on('end', async () => {
      console.log(`Importando ${productos.length} productos...`)
      
      for (const prod of productos) {
        try {
          await prisma.product.create({ data: prod })
          console.log(`✅ ${prod.name}`)
        } catch (error) {
          console.log(`❌ Error: ${prod.name}`)
        }
      }
      
      console.log('✨ Importación completada!')
    })
}

// Ejecutar
importarCatalogo('./catalogo-ferreteria.csv', 'company-id-here')
```

---

## 💰 ANÁLISIS DE COSTOS

| Opción | Costo Inicial | Costo Mensual | Productos | Mejor para |
|--------|---------------|---------------|-----------|------------|
| **Acción Digital** | $3K-8K MXN | $0 | 25,000 | Ferreterías |
| **Open Food Facts** | $0 | $0 | 1,000,000+ | Abarrotes |
| **Kladi.mx** | $0 | $0 | 14,000 | Ferreterías |
| **UPCitemdb** | $0 | $0 (limitado) | Global | Uso ligero |
| **Barcodelookup** | $0 | $20 USD | Global | Uso moderado |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Decidir tipo de negocio objetivo
- [ ] Contactar proveedor de catálogo
- [ ] Obtener base de datos
- [ ] Crear script de importación
- [ ] Mapear campos correctamente
- [ ] Probar con muestra pequeña
- [ ] Importar catálogo completo
- [ ] Validar códigos de barras
- [ ] Configurar actualización periódica

---

## 🎯 MI RECOMENDACIÓN PERSONAL PARA TI

**Para FerreAI, empezaría con:**

### **Hoy:**
1. ✅ Contactar **Acción Digital** para ferreterías
2. ✅ Integrar **Open Food Facts API** para abarrotes
3. ✅ Crear función de búsqueda por código de barras

### **Esta semana:**
1. Script de importación automática
2. Endpoint `/api/products/import-catalog`
3. UI para importar catálogos desde Excel

### **Este mes:**
1. Integración con APIs en tiempo real
2. Auto-completar productos al escanear
3. Actualización automática de precios

---

**¿Quieres que te ayude a implementar alguna de estas opciones?** 🚀
