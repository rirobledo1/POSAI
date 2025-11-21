// src/app/api/products/images/bulk-upload/route.ts - Upload masivo de imágenes
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processImage, saveImageToLocal, validateImageFile, getImageUrl, generateImageFilename } from '@/lib/image-utils';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

interface BulkUploadResult {
  success: boolean;
  productId: string;
  productName: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (ADMIN, ALMACEN pueden subir imágenes)
    if (!['ADMIN', 'ALMACEN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'No tienes permisos para subir imágenes de productos' 
      }, { status: 403 });
    }

    const formData = await request.formData();
    const matchBy = (formData.get('matchBy') as string) || 'name'; // 'name' or 'barcode'
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json({ 
        error: 'Se requiere al menos una imagen' 
      }, { status: 400 });
    }

    console.log(`🔄 Iniciando upload masivo de ${images.length} imágenes, matching por: ${matchBy}`);

    const results: BulkUploadResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Obtener todos los productos activos para hacer matching
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        barcode: true,
        hasImage: true
      }
    });

    console.log(`📦 Productos disponibles para matching: ${products.length}`);

    // Procesar cada imagen
    for (const file of images) {
      try {
        // Validar archivo
        const validation = validateImageFile(file);
        if (!validation.valid) {
          results.push({
            success: false,
            productId: '',
            productName: file.name,
            error: validation.error
          });
          errorCount++;
          continue;
        }

        // Intentar hacer match con producto
        const fileName = file.name;
        const fileBaseName = path.basename(fileName, path.extname(fileName));
        
        let matchedProduct = null;

        if (matchBy === 'barcode') {
          // Buscar por código de barras en el nombre del archivo
          matchedProduct = products.find(p => 
            p.barcode && fileBaseName.includes(p.barcode)
          );
        } else {
          // Buscar por nombre (más flexible)
          // Normalizar nombres para comparación
          const normalizeText = (text: string) => 
            text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

          const normalizedFileName = normalizeText(fileBaseName);
          
          matchedProduct = products.find(p => {
            const normalizedProductName = normalizeText(p.name);
            // Verificar si el nombre del producto está contenido en el nombre del archivo
            // o viceversa (para mayor flexibilidad)
            return normalizedFileName.includes(normalizedProductName) ||
                   normalizedProductName.includes(normalizedFileName);
          });
        }

        if (!matchedProduct) {
          results.push({
            success: false,
            productId: '',
            productName: fileName,
            error: `No se encontró producto que coincida con "${fileBaseName}" usando ${matchBy}`
          });
          errorCount++;
          continue;
        }

        // Verificar si el producto ya tiene imagen
        if (matchedProduct.hasImage) {
          results.push({
            success: false,
            productId: matchedProduct.id,
            productName: matchedProduct.name,
            error: 'El producto ya tiene una imagen asignada'
          });
          errorCount++;
          continue;
        }

        // Procesar y guardar imagen
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = generateImageFilename(matchedProduct.name, matchedProduct.barcode);
        const processedImages = await processImage(buffer, filename, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 85,
          createThumbnail: true,
          thumbnailSize: 200
        });

        // Guardar imágenes
        await saveImageToLocal(processedImages.main, UPLOAD_DIR);
        
        let thumbnailPath: string | undefined;
        if (processedImages.thumbnail) {
          thumbnailPath = await saveImageToLocal(processedImages.thumbnail, UPLOAD_DIR);
        }

        // Generar URLs públicas
        const imageUrl = getImageUrl(processedImages.main.filename);
        const thumbnailUrl = processedImages.thumbnail ? getImageUrl(processedImages.thumbnail.filename) : undefined;

        // Actualizar producto en base de datos
        await prisma.product.update({
          where: { id: matchedProduct.id },
          data: {
            imageUrl,
            thumbnailUrl,
            hasImage: true,
            imageFileName: processedImages.main.filename,
            imageSize: processedImages.main.size,
            imageMimeType: processedImages.main.mimeType,
            imageUploadedAt: new Date()
          }
        });

        results.push({
          success: true,
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          imageUrl,
          thumbnailUrl
        });

        successCount++;

      } catch (error) {
        console.error(`Error procesando imagen ${file.name}:`, error);
        results.push({
          success: false,
          productId: '',
          productName: file.name,
          error: `Error al procesar: ${error instanceof Error ? error.message : 'Error desconocido'}`
        });
        errorCount++;
      }
    }

    // Log de auditoría para el proceso masivo
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BULK_PRODUCT_IMAGE_UPLOAD',
        entityType: 'Product',
        details: {
          totalImages: images.length,
          successCount,
          errorCount,
          matchBy,
          results: results.slice(0, 10) // Solo primeros 10 resultados para evitar logs muy grandes
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Proceso completado: ${successCount} exitosas, ${errorCount} errores`,
      data: {
        totalProcessed: images.length,
        successCount,
        errorCount,
        results
      }
    });

  } catch (error) {
    console.error('Error in bulk image upload:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor en upload masivo' 
      },
      { status: 500 }
    );
  }
}
