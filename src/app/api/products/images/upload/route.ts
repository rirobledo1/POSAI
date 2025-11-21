// src/app/api/products/images/upload/route.ts - API para subir imágenes de productos
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { processImage, saveImageToLocal, validateImageFile, getImageUrl, generateImageFilename } from '@/lib/image-utils';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

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
    const productId = formData.get('productId') as string;
    const file = formData.get('image') as File;

    if (!productId || !file) {
      return NextResponse.json({ 
        error: 'Product ID e imagen son requeridos' 
      }, { status: 400 });
    }

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 });
    }

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ 
        error: 'Producto no encontrado' 
      }, { status: 404 });
    }

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Procesar imagen
    const filename = generateImageFilename(product.name, product.barcode);
    const processedImages = await processImage(buffer, filename, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 85,
      createThumbnail: true,
      thumbnailSize: 200
    });

    // Guardar imágenes
    const imagePath = await saveImageToLocal(processedImages.main, UPLOAD_DIR);
    let thumbnailPath: string | undefined;
    
    if (processedImages.thumbnail) {
      thumbnailPath = await saveImageToLocal(processedImages.thumbnail, UPLOAD_DIR);
    }

    // Generar URLs públicas
    const imageUrl = getImageUrl(processedImages.main.filename);
    const thumbnailUrl = processedImages.thumbnail ? getImageUrl(processedImages.thumbnail.filename) : undefined;

    // Actualizar producto en base de datos
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
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

    console.log('✅ Producto actualizado en BD:', {
      id: updatedProduct.id,
      name: updatedProduct.name,
      hasImage: updatedProduct.hasImage,
      imageUrl: updatedProduct.imageUrl
    });

    // Log de auditoría
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRODUCT_IMAGE_UPLOAD',
        entityType: 'Product',
        entityId: productId,
        details: {
          productName: product.name,
          imageFileName: processedImages.main.filename,
          imageSize: processedImages.main.size,
          hasThumbnail: !!processedImages.thumbnail
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        imageUrl,
        thumbnailUrl,
        fileName: processedImages.main.filename,
        fileSize: processedImages.main.size,
        mimeType: processedImages.main.mimeType,
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          hasImage: updatedProduct.hasImage
        }
      }
    });

  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor al subir la imagen' 
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estadísticas de imágenes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener estadísticas de productos con imágenes
    const totalProducts = await prisma.product.count({
      where: { active: true }
    });

    const productsWithImages = await prisma.product.count({
      where: { 
        active: true,
        hasImage: true 
      }
    });

    const productsWithoutImages = totalProducts - productsWithImages;
    const percentageWithImages = totalProducts > 0 
      ? Math.round((productsWithImages / totalProducts) * 100)
      : 0;

    // Calcular espacio usado basado en registros
    const productsWithImageData = await prisma.product.findMany({
      where: {
        hasImage: true,
        imageSize: { not: null }
      },
      select: {
        imageSize: true
      }
    });

    const storageUsed = productsWithImageData.reduce((total, product) => {
      return total + (product.imageSize || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        productsWithImages,
        productsWithoutImages,
        percentageWithImages,
        storageUsed,
        storageUsedFormatted: formatBytes(storageUsed)
      }
    });

  } catch (error) {
    console.error('Error getting image stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
