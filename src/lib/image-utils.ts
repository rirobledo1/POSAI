// src/lib/image-utils.ts - Utilidades para manejo de imágenes
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export interface ProcessedImageSet {
  main: ProcessedImage;
  thumbnail?: ProcessedImage;
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 800,
  maxHeight: 600,
  quality: 85,
  createThumbnail: true,
  thumbnailSize: 150
};

/**
 * Procesar imagen con Sharp (redimensionamiento y optimización)
 */
export async function processImage(
  buffer: Buffer,
  originalFilename: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageSet> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Generar nombre único para evitar colisiones
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalFilename).toLowerCase() || '.jpg';
    const baseName = path.basename(originalFilename, path.extname(originalFilename));
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${sanitizedBaseName}_${timestamp}_${randomId}${extension}`;

    // Procesar imagen principal
    let mainProcessor = sharp(buffer)
      .resize(opts.maxWidth, opts.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: opts.quality, progressive: true });

    const mainBuffer = await mainProcessor.toBuffer();
    const mainMetadata = await sharp(mainBuffer).metadata();

    const mainImage: ProcessedImage = {
      buffer: mainBuffer,
      filename,
      mimeType: 'image/jpeg',
      size: mainBuffer.length,
      width: mainMetadata.width || 0,
      height: mainMetadata.height || 0
    };

    const result: ProcessedImageSet = { main: mainImage };

    // Crear thumbnail si se requiere
    if (opts.createThumbnail) {
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailBuffer = await sharp(buffer)
        .resize(opts.thumbnailSize, opts.thumbnailSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 75, progressive: true })
        .toBuffer();

      const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();

      result.thumbnail = {
        buffer: thumbnailBuffer,
        filename: thumbnailFilename,
        mimeType: 'image/jpeg',
        size: thumbnailBuffer.length,
        width: thumbnailMetadata.width || 0,
        height: thumbnailMetadata.height || 0
      };
    }

    return result;

  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Error al procesar la imagen');
  }
}

/**
 * Guardar imagen en el sistema de archivos
 */
export async function saveImageToLocal(
  processedImage: ProcessedImage,
  uploadDir: string
): Promise<string> {
  try {
    // Crear directorio si no existe
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, processedImage.filename);
    await fs.writeFile(filePath, processedImage.buffer);
    
    return filePath;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Error al guardar la imagen');
  }
}

/**
 * Validar tipo de archivo de imagen
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no válido. Solo se permiten: JPEG, PNG, WebP'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'El archivo es demasiado grande. Máximo 10MB'
    };
  }

  return { valid: true };
}

/**
 * Obtener URL pública para una imagen
 */
export function getImageUrl(filename: string, isPublic: boolean = true): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/images/${filename}`;
}

/**
 * Generar nombre de archivo basado en producto
 */
export function generateImageFilename(
  productName: string, 
  productBarcode?: string,
  index: number = 0
): string {
  const timestamp = Date.now();
  const sanitizedName = productName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Quitar caracteres especiales
    .replace(/\s+/g, '-')     // Espacios a guiones
    .substring(0, 30);        // Limitar longitud

  const suffix = index > 0 ? `_${index}` : '';
  const barcodePrefix = productBarcode ? `${productBarcode}_` : '';
  
  return `product_${barcodePrefix}${sanitizedName}_${timestamp}${suffix}.jpg`;
}

/**
 * Eliminar imagen del sistema de archivos
 */
export async function deleteImageFile(imagePath: string): Promise<boolean> {
  try {
    await fs.unlink(imagePath);
    return true;
  } catch (error) {
    console.error('Error deleting image file:', error);
    return false;
  }
}

/**
 * Obtener estadísticas de uso de imágenes
 */
export async function getImageStorageStats(uploadDir: string): Promise<{
  totalFiles: number;
  totalSize: number;
  sizeFormatted: string;
}> {
  try {
    const files = await fs.readdir(uploadDir);
    let totalSize = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      } catch (error) {
        // Ignorar archivos que no se pueden leer
        continue;
      }
    }

    // Formatear tamaño
    const sizeInMB = totalSize / (1024 * 1024);
    const sizeFormatted = sizeInMB > 1024 
      ? `${(sizeInMB / 1024).toFixed(2)} GB`
      : `${sizeInMB.toFixed(2)} MB`;

    return {
      totalFiles: files.length,
      totalSize,
      sizeFormatted
    };

  } catch (error) {
    return {
      totalFiles: 0,
      totalSize: 0,
      sizeFormatted: '0 MB'
    };
  }
}
