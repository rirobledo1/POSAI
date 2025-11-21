// src/lib/storage.ts
/**
 * Servicio de almacenamiento en la nube
 * Soporta Cloudinary (recomendado para simplicidad) o AWS S3
 */

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Subir archivo a Cloudinary
 * Configuración en .env:
 * CLOUDINARY_CLOUD_NAME=tu_cloud_name
 * CLOUDINARY_API_KEY=tu_api_key
 * CLOUDINARY_API_SECRET=tu_api_secret
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'raw'
): Promise<string> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary no está configurado. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET')
    }

    // Convertir buffer a base64
    const base64File = buffer.toString('base64')
    const dataUri = `data:application/pdf;base64,${base64File}`

    // URL del endpoint de Cloudinary
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

    // Preparar form data
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await generateCloudinarySignature(
      { timestamp, public_id: filename },
      apiSecret
    )

    const formData = new FormData()
    formData.append('file', dataUri)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('public_id', filename)
    formData.append('resource_type', resourceType)

    // Subir a Cloudinary
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Error al subir archivo')
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error('❌ Error subiendo a Cloudinary:', error)
    throw error
  }
}

/**
 * Generar firma de Cloudinary
 */
async function generateCloudinarySignature(
  params: Record<string, any>,
  apiSecret: string
): Promise<string> {
  // Ordenar parámetros alfabéticamente
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')

  // Concatenar con el secret
  const stringToSign = sortedParams + apiSecret

  // Generar hash SHA-1
  const encoder = new TextEncoder()
  const data = encoder.encode(stringToSign)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Función principal de upload - detecta qué servicio usar
 * Por defecto usa Cloudinary si está configurado
 */
export async function uploadToCloudStorage(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  try {
    // Intentar Cloudinary primero
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const resourceType = contentType.startsWith('image') ? 'image' : 'raw'
      return await uploadToCloudinary(buffer, path, resourceType)
    }

    // Si no hay Cloudinary configurado, usar almacenamiento local temporal
    // NOTA: Esto NO funcionará en producción con múltiples servidores
    console.warn('⚠️ Usando almacenamiento local temporal. Configure Cloudinary para producción.')
    
    // Por ahora retornar error pidiendo configuración
    throw new Error(
      'No hay servicio de almacenamiento configurado. ' +
      'Configure Cloudinary agregando: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    )
  } catch (error) {
    console.error('❌ Error subiendo archivo:', error)
    throw error
  }
}

/**
 * ALTERNATIVA: Upload a AWS S3
 * Descomentar y usar si prefieres S3 sobre Cloudinary
 * 
 * Requiere: npm install @aws-sdk/client-s3
 * Variables de entorno:
 * AWS_REGION=us-east-1
 * AWS_ACCESS_KEY_ID=tu_access_key
 * AWS_SECRET_ACCESS_KEY=tu_secret_key
 * AWS_S3_BUCKET=nombre-bucket
 */

/*
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export async function uploadToS3(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    })

    const bucket = process.env.AWS_S3_BUCKET
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET no está configurado')
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' // URL pública
    })

    await s3Client.send(command)

    // Retornar URL pública
    return `https://${bucket}.s3.amazonaws.com/${path}`
  } catch (error) {
    console.error('❌ Error subiendo a S3:', error)
    throw error
  }
}
*/
