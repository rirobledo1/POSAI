// src/app/api/images/[filename]/route.ts - Servir imágenes de productos
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validar que el filename no contenga caracteres peligrosos
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Nombre de archivo inválido' }, { status: 400 });
    }

    // Construir ruta completa del archivo
    const filePath = path.join(UPLOAD_DIR, filename);

    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    // Leer el archivo
    const imageBuffer = await readFile(filePath);

    // Determinar el content-type basado en la extensión
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default

    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.jpg':
      case '.jpeg':
      default:
        contentType = 'image/jpeg';
        break;
    }

    // Retornar la imagen con headers apropiados
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache por 1 año
        'Content-Length': imageBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Error al cargar la imagen' },
      { status: 500 }
    );
  }
}
