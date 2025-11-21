import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TextNormalizer } from '@/lib/text-normalizer'
import { generateCSVForBusinessType } from '@/lib/business-categories'
import Papa from 'papaparse'

interface ImportResult {
  total: number;
  success: number;
  errors: number;
  skipped: number;
  warnings: number;
  details: Array<{
    row: number;
    message?: string;
    error?: string;
    warning?: string;
    data: any;
  }>;
  normalizations: Array<{
    field: 'name' | 'description';
    original: string;
    normalized: string;
    corrections: string[];
    confidence: number;
  }>;
  duplicatesHandled: Array<{
    categoryName: string;
    action: 'skipped' | 'merged';
    reason: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Solo ADMIN puede importar categorías
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden importar categorías' },
        { status: 403 }
      )
    }

    // 🔥 CRÍTICO: Obtener companyId de la sesión
    const companyId = session.user.companyId
    if (!companyId) {
      return NextResponse.json(
        { error: 'No se encontró información de la empresa' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const useDefault = formData.get('useDefault') === 'true'

    let csvContent: string

    if (useDefault) {
      // Obtener el tipo de empresa de la configuración
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      })
      const businessType = company?.businessType || 'GENERAL'
      
      // Generar CSV basado en el tipo de empresa
      csvContent = generateCSVForBusinessType(businessType)
    } else {
      // Usar archivo subido por el usuario
      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó archivo CSV' },
          { status: 400 }
        )
      }

      if (!file.name.endsWith('.csv')) {
        return NextResponse.json(
          { error: 'El archivo debe ser de tipo CSV' },
          { status: 400 }
        )
      }

      csvContent = await file.text()
    }

    // Parsear CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim()
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Error al parsear el archivo CSV',
          details: parseResult.errors 
        },
        { status: 400 }
      )
    }

    const rows = parseResult.data as any[]
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'El archivo CSV está vacío' },
        { status: 400 }
      )
    }

    // Validar que tenga las columnas requeridas
    const requiredColumns = ['name'] // Solo name es obligatorio ahora
    const csvColumns = Object.keys(rows[0])
    const missingColumns = requiredColumns.filter(col => !csvColumns.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { 
          error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`,
          required: requiredColumns,
          found: csvColumns
        },
        { status: 400 }
      )
    }

    // Función para generar ID automático
    const generateCategoryId = async (name: string, tx: any): Promise<string> => {
      // Generar ID basado en el nombre (primeras letras + número)
      const baseId = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6)
        .padEnd(3, '0')
      
      let counter = 1
      let candidateId = `${baseId}${counter.toString().padStart(3, '0')}`
      
      // Verificar que el ID no exista (en la misma empresa)
      while (await tx.categories.findFirst({ where: { id: candidateId, companyId: session?.user?.companyId } })) {
        counter++
        candidateId = `${baseId}${counter.toString().padStart(3, '0')}`
        
        // Evitar bucle infinito
        if (counter > 999) {
          candidateId = `CAT${Date.now().toString().slice(-6)}`
          break
        }
      }
      
      return candidateId
    }

    // Procesar e insertar categorías
    const results: ImportResult = {
      total: 0,
      success: 0,
      errors: 0,
      skipped: 0,
      warnings: 0,
      details: [],
      normalizations: [],
      duplicatesHandled: []
    }

    const transaction = await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        results.total++
        
        try {
          // Validar datos requeridos
          if (!row.name) {
            results.errors++
            results.details.push({
              row: results.total,
              error: 'El nombre es un campo requerido',
              data: row
            })
            continue
          }

          // Normalizar nombre de categoría
          const nameNormalization = TextNormalizer.normalizeCategoryName(row.name.toString())
          const normalizedName = nameNormalization.normalizedText

          if (nameNormalization.corrections.length > 0) {
            results.normalizations.push({
              field: 'name',
              original: nameNormalization.originalText,
              normalized: normalizedName,
              corrections: nameNormalization.corrections,
              confidence: nameNormalization.confidence
            })
          }

          // Normalizar descripción si existe
          let normalizedDescription = null
          if (row.description) {
            const descriptionNormalization = TextNormalizer.normalizeCategoryDescription(row.description.toString())
            normalizedDescription = descriptionNormalization.normalizedText

            if (descriptionNormalization.corrections.length > 0) {
              results.normalizations.push({
                field: 'description',
                original: descriptionNormalization.originalText,
                normalized: normalizedDescription,
                corrections: descriptionNormalization.corrections,
                confidence: descriptionNormalization.confidence
              })
            }
          }

          // Validar que el nombre normalizado no esté vacío
          if (!normalizedName || normalizedName.trim() === '') {
            results.errors++
            results.details.push({
              row: results.total,
              error: 'El nombre de categoría no puede estar vacío después de la normalización',
              data: row
            })
            continue
          }

          // Generar ID si no existe
          let categoryId = row.id?.toString().trim()
          if (!categoryId) {
            categoryId = await generateCategoryId(normalizedName, tx)
          }

          // Verificar duplicados por ID, nombre original y nombre normalizado (solo en la misma empresa)
          const existingCategory = await tx.categories.findFirst({
            where: {
              companyId: companyId, // 🔥 Filtrar por empresa
              OR: [
                { id: categoryId },
                { name: row.name.toString().trim() },
                { name: normalizedName }
              ]
            }
          })

          if (existingCategory) {
            results.skipped++
            results.duplicatesHandled.push({
              categoryName: normalizedName,
              action: 'skipped',
              reason: `Ya existe categoría similar: "${existingCategory.name}" (ID: ${existingCategory.id})`
            })
            results.details.push({
              row: results.total,
              warning: `Categoría duplicada omitida: "${existingCategory.name}" ya existe`,
              data: row
            })
            continue
          }

          // Insertar categoría
          await tx.categories.create({
            data: {
              id: categoryId,
              name: normalizedName,
              description: normalizedDescription,
              active: row.active === 'true' || row.active === true || row.active === '1' || row.active === undefined,
              companyId: companyId, // 🔥 CRÍTICO: Agregar companyId
              created_at: new Date(), // ✅ snake_case
              updated_at: new Date()  // ✅ snake_case
            }
          })

          results.success++
          results.details.push({
            row: results.total,
            message: 'Categoría creada exitosamente',
            data: { 
              id: categoryId, 
              name: normalizedName,
              originalName: row.name,
              generatedId: !row.id ? true : false,
              normalized: nameNormalization.corrections.length > 0
            }
          })

        } catch (error: any) {
          results.errors++
          results.details.push({
            row: results.total,
            error: error.message || 'Error desconocido',
            data: row
          })
        }
      }

      return results
    })

    return NextResponse.json({
      message: 'Importación completada',
      results: transaction
    })

  } catch (error: any) {
    console.error('Error en importación de categorías:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}