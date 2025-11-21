/**
 * API para importación masiva de productos via CSV
 * Sistema completamente separado del módulo de productos existente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processBarcode } from '@/lib/barcode-generator';
import { getClassifier } from '@/lib/intelligent-classifier';
import { TextNormalizer } from '@/lib/text-normalizer';
import { CSVParser } from '@/lib/csv-parser';
import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface CSVProductRow {
  name: string;
  description?: string;
  cost: number;
  price?: number;
  stock: number;
  minStock: number;
  categoryId: string;
  barcode?: string;
  active: boolean;
}

interface ImportResult {
  success: boolean;
  processedRows: number;
  successfulImports: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  warnings: Array<{
    row: number;
    data: any;
    warning: string;
  }>;
  summary: {
    totalRows: number;
    processed: number;
    successful: number;
    failed: number;
  };
  intelligentInsights: {
    categoriesCreated: Array<{
      id: string;
      name: string;
      reason: string;
    }>;
    autoClassified: Array<{
      productName: string;
      category: string;
      confidence: number;
      strategy: string;
    }>;
    needsReview: Array<{
      productName: string;
      category: string;
      confidence: number;
      reason: string;
    }>;
    textNormalizations: Array<{
      field: 'name' | 'description';
      original: string;
      normalized: string;
      corrections: string[];
      confidence: number;
    }>;
    duplicatesHandled: Array<{
      productName: string;
      action: 'updated' | 'skipped';
      reason: string;
      stockAdded?: number;
    }>;
  };
}

// Función para obtener configuración de impuestos de la empresa
async function getCompanyTaxRate(): Promise<number> {
  try {
    const result = await pool.query(
      'SELECT tax_percentage FROM company_settings WHERE id = $1',
      ['company-settings-1']
    );
    const taxPercentage = result.rows[0]?.tax_percentage || 16;
    return parseFloat(taxPercentage) / 100; // Convertir porcentaje a decimal
  } catch (error) {
    console.error('Error obteniendo tasa de impuestos:', error);
    return 0.16; // 16% por defecto
  }
}

// Función para procesar un producto individual
async function processProductRow(
  row: CSVProductRow, 
  rowNumber: number, 
  classifier: any,
  insights: ImportResult['intelligentInsights']
): Promise<{ success: boolean; error?: string; warning?: string; productId?: string }> {
  try {
    // 📝 VALIDACIONES PREVIAS
    console.log(`🔄 Validando producto fila ${rowNumber}...`);
    
    // Validar que el nombre no esté vacío
    if (!row.name || row.name.trim() === '') {
      return {
        success: false,
        error: 'El nombre del producto es obligatorio'
      };
    }

    // 💰 VALIDACIÓN DE PRECIOS Y COSTOS
    let warnings: string[] = [];
    let finalCost = row.cost || 0;
    let finalPrice = row.price || (finalCost * 1.3); // 30% de margen por defecto

    // Validar costo
    if (!finalCost || finalCost <= 0) {
      warnings.push(`Costo no proporcionado o inválido - Se estableció en $0`);
      finalCost = 0;
    }

    // Validar precio
    if (!finalPrice || finalPrice <= 0) {
      if (finalCost > 0) {
        finalPrice = finalCost * 1.3; // 30% de margen por defecto
        warnings.push(`Precio calculado automáticamente con 30% de margen: $${finalPrice}`);
      } else {
        finalPrice = 0;
        warnings.push(`Precio establecido en $0 - No se proporcionó precio de venta válido`);
      }
    }
    // 📝 NORMALIZACIÓN DE TEXTO INTELIGENTE
    console.log(`🔄 Normalizando texto para fila ${rowNumber}...`);
    
    // Normalizar nombre del producto
    const nameNormalization = TextNormalizer.normalizeProductName(row.name || '');
    if (nameNormalization.corrections.length > 0) {
      console.log(`📝 Correcciones en nombre: ${nameNormalization.corrections.join(', ')}`);
      insights.textNormalizations.push({
        field: 'name',
        original: nameNormalization.originalText,
        normalized: nameNormalization.normalizedText,
        corrections: nameNormalization.corrections,
        confidence: nameNormalization.confidence
      });
    }
    
    // Normalizar descripción del producto
    const descriptionNormalization = TextNormalizer.normalizeProductDescription(row.description || '');
    if (descriptionNormalization.corrections.length > 0) {
      console.log(`📝 Correcciones en descripción: ${descriptionNormalization.corrections.join(', ')}`);
      insights.textNormalizations.push({
        field: 'description',
        original: descriptionNormalization.originalText,
        normalized: descriptionNormalization.normalizedText,
        corrections: descriptionNormalization.corrections,
        confidence: descriptionNormalization.confidence
      });
    }
    
    // Usar textos normalizados para el procesamiento
    const normalizedName = nameNormalization.normalizedText;
    const normalizedDescription = descriptionNormalization.normalizedText;

    // Validaciones básicas con texto normalizado
    if (!normalizedName || normalizedName.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }

    // Validaciones de stock
    if (row.stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    if (row.minStock < 0) {
      throw new Error('El stock mínimo no puede ser negativo');
    }

    // 🔍 VALIDACIÓN DE PRODUCTOS DUPLICADOS
    console.log(`🔍 Verificando duplicados para: "${normalizedName}"`);
    const duplicateCheckQuery = `
      SELECT id, name, cost, stock 
      FROM products 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      AND active = true
      LIMIT 1
    `;
    
    const duplicateResult = await pool.query(duplicateCheckQuery, [normalizedName]);
    
    if (duplicateResult.rows.length > 0) {
      const existingProduct = duplicateResult.rows[0];
      console.log(`⚠️ Producto duplicado encontrado: ${existingProduct.name} (ID: ${existingProduct.id})`);
      
      // Opción 1: Actualizar stock del producto existente
      const updateStockQuery = `
        UPDATE products 
        SET stock = stock + $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id
      `;
      
      await pool.query(updateStockQuery, [row.stock, existingProduct.id]);
      
      console.log(`📦 Stock actualizado para "${existingProduct.name}": +${row.stock} unidades`);
      
      // Registrar como actualización de stock
      insights.duplicatesHandled.push({
        productName: normalizedName,
        action: 'updated',
        reason: `Producto duplicado encontrado - stock actualizado`,
        stockAdded: row.stock
      });
      
      return {
        success: true,
        productId: existingProduct.id
      };
    }

    // 🧠 CLASIFICACIÓN INTELIGENTE DE CATEGORÍA (usando texto normalizado)
    console.log(`🏷️ Clasificando categoría para: "${normalizedName}"`);
    const classification = await classifier.classifyProduct({
      name: normalizedName,
      description: normalizedDescription,
      cost: row.cost,
      categoryId: row.categoryId
    });

    console.log(`📋 Resultado de clasificación:`, {
      categoryId: classification.categoryId,
      categoryName: classification.categoryName,
      confidence: classification.confidence,
      strategy: classification.strategy,
      isNewCategory: classification.isNewCategory
    });

    // Crear categoría si es nueva (con transacción)
    if (classification.isNewCategory) {
      console.log(`🆕 Creando nueva categoría: ${classification.categoryId} - ${classification.categoryName}`);
      
      // Usar transacción para asegurar consistencia
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Verificar nuevamente dentro de la transacción
        const existsInTx = await client.query(
          'SELECT id FROM categories WHERE id = $1',
          [classification.categoryId]
        );
        
        if (existsInTx.rows.length === 0) {
          // Crear la categoría dentro de la transacción
          await client.query(`
            INSERT INTO categories (id, name, description, active, created_at, updated_at)
            VALUES ($1, $2, $3, true, NOW(), NOW())
          `, [
            classification.categoryId,
            classification.categoryName,
            `Categoría generada automáticamente por el sistema de IA`
          ]);
          
          console.log(`✅ Categoría creada en transacción: ${classification.categoryId}`);
        }
        
        await client.query('COMMIT');
        
      } catch (txError) {
        await client.query('ROLLBACK');
        console.error(`❌ Error en transacción de categoría:`, txError);
        throw txError;
      } finally {
        client.release();
      }
      
      insights.categoriesCreated.push({
        id: classification.categoryId,
        name: classification.categoryName,
        reason: classification.reasoning
      });
    }

    // Verificar que la categoría existe antes de insertar el producto
    const categoryVerification = await pool.query(
      'SELECT id, name FROM categories WHERE id = $1',
      [classification.categoryId]
    );

    if (categoryVerification.rows.length === 0) {
      throw new Error(`La categoría ${classification.categoryId} no existe en la base de datos después de crearla`);
    }

    console.log(`✅ Categoría verificada: ${categoryVerification.rows[0].id} - ${categoryVerification.rows[0].name}`);

    // Registrar insights de clasificación
    if (classification.confidence >= 0.8) {
      insights.autoClassified.push({
        productName: row.name,
        category: classification.categoryName,
        confidence: classification.confidence,
        strategy: classification.strategy
      });
    } else if (classification.confidence < 0.6) {
      insights.needsReview.push({
        productName: row.name,
        category: classification.categoryName,
        confidence: classification.confidence,
        reason: `Baja confianza en clasificación: ${classification.reasoning}`
      });
    }

    // Procesar código de barras (generar si está vacío)
    const barcode = await processBarcode(row.barcode);

    // Calcular precio si usa precio automático (ya calculado arriba)
    // finalPrice ya está calculado con la nueva lógica

    // Insertar producto en la base de datos
    const insertQuery = `
      INSERT INTO products (
        id, name, description, cost, price, stock, min_stock, 
        category_id, barcode, featured, active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      normalizedName.trim(),
      normalizedDescription?.trim() || '',
      finalCost, // ← Usar costo validado
      finalPrice, // ← Usar precio validado/calculado
      row.stock,
      row.minStock,
      classification.categoryId, // ← Usar categoría clasificada inteligentemente
      barcode,
      false, // featured = false por defecto
      row.active
    ]);

    return {
      success: true,
      productId: result.rows[0].id,
      warning: warnings.length > 0 ? warnings.join('; ') : undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función principal para procesar el CSV
async function processCSVData(csvData: CSVProductRow[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    processedRows: 0,
    successfulImports: 0,
    errors: [],
    warnings: [],
    summary: {
      totalRows: csvData.length,
      processed: 0,
      successful: 0,
      failed: 0
    },
    intelligentInsights: {
      categoriesCreated: [],
      autoClassified: [],
      needsReview: [],
      textNormalizations: [],
      duplicatesHandled: []
    }
  };

  // Inicializar el clasificador inteligente
  const classifier = await getClassifier();

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNumber = i + 2; // +2 porque empezamos en fila 1 y la fila 1 son los headers

    result.processedRows++;

    const processResult = await processProductRow(row, rowNumber, classifier, result.intelligentInsights);

    if (processResult.success) {
      result.successfulImports++;
      
      // Agregar warning si existe
      if (processResult.warning) {
        result.warnings.push({
          row: rowNumber,
          data: row,
          warning: processResult.warning
        });
      }
    } else {
      result.errors.push({
        row: rowNumber,
        data: row,
        error: processResult.error || 'Error desconocido'
      });
    }
  }

  result.summary.processed = result.processedRows;
  result.summary.successful = result.successfulImports;
  result.summary.failed = result.errors.length;
  result.success = result.successfulImports > 0;

  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'ALMACEN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado para realizar importaciones' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos CSV' },
        { status: 400 }
      );
    }

    // Leer contenido del archivo
    const content = await file.text();
    
    // Parsear CSV con manejo correcto de comillas
    let parsedCSV;
    try {
      parsedCSV = CSVParser.parseCSV(content);
    } catch (parseError) {
      return NextResponse.json(
        { error: `Error parseando CSV: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}` },
        { status: 400 }
      );
    }

    const { headers, rows } = parsedCSV;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'El archivo debe contener al menos una fila de datos además del header' },
        { status: 400 }
      );
    }
    
    // Headers obligatorios (mínimos requeridos)
    const requiredHeaders = [
      'name', 'stock', 'minStock'
    ];
    
    // Headers opcionales
    const optionalHeaders = [
      'description', 'cost', 'price', 'categoryId', 'barcode', 'active'
    ];
    
    const allValidHeaders = [...requiredHeaders, ...optionalHeaders];

    // Validar que los headers obligatorios estén presentes
    const missingRequiredHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingRequiredHeaders.length > 0) {
      return NextResponse.json(
        { 
          error: `Headers obligatorios faltantes: ${missingRequiredHeaders.join(', ')}`,
          requiredHeaders,
          optionalHeaders,
          receivedHeaders: headers
        },
        { status: 400 }
      );
    }
    
    // Validar que no hay headers inválidos
    const invalidHeaders = headers.filter(h => !allValidHeaders.includes(h));
    if (invalidHeaders.length > 0) {
      console.warn(`⚠️ Headers no reconocidos (serán ignorados): ${invalidHeaders.join(', ')}`);
    }

    // Convertir filas a objetos
    const csvData: CSVProductRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const values = rows[i];
      
      // Validar que no hay demasiadas columnas
      if (values.length > headers.length) {
        return NextResponse.json(
          { error: `Fila ${i + 2}: Demasiadas columnas (${values.length} vs ${headers.length} esperadas)` },
          { status: 400 }
        );
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = index < values.length ? values[index] : '';
      });

      // Convertir tipos y aplicar valores por defecto
      const productRow: CSVProductRow = {
        name: row.name || '',
        description: row.description || '',
        cost: row.cost ? parseFloat(row.cost) : 0, // Costo por defecto 0 si no viene
        price: row.price ? parseFloat(row.price) : undefined, // Precio opcional
        stock: parseInt(row.stock) || 0,
        minStock: parseInt(row.minStock) || 0,
        categoryId: row.categoryId || '',
        barcode: row.barcode || '',
        active: row.active?.toLowerCase() !== 'false' // Por defecto true
      };

      csvData.push(productRow);
    }

    // Procesar datos
    const importResult = await processCSVData(csvData);

    return NextResponse.json(importResult);

  } catch (error) {
    console.error('Error en importación CSV:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
