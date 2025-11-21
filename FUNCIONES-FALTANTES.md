# 📋 FUNCIONES QUE FALTAN CREAR

## ✅ LO QUE YA TIENES Y FUNCIONA

1. **Servicio de Email** ✅
   - Ubicación: `src/lib/email/nodemailer.ts`
   - Función: `sendEmail()`
   - Ya funciona con Gmail, Outlook, SMTP
   
2. **Servicio de Email para Cotizaciones** ✅
   - Ubicación: `src/lib/email/emailService.ts`
   - Función: `sendQuotation()` (línea 123-160)
   - Ya está listo para usarse

---

## ❌ LO QUE FALTA CREAR (3 funciones)

### 1️⃣ GENERADOR DE PDF PARA COTIZACIONES

**📁 Archivo a crear:** `src/lib/pdf/quotation.ts`

**🎯 Propósito:** Tomar los datos de una cotización y generar un PDF profesional.

**📝 Código básico:**

```typescript
// src/lib/pdf/quotation.ts
import PDFDocument from 'pdfkit'

export async function generateQuotationPDF(quotation: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Encabezado
    doc.fontSize(20).text('COTIZACIÓN', { align: 'center' })
    doc.fontSize(12).text(`No. ${quotation.quotationNumber}`, { align: 'center' })
    doc.moveDown()

    // Datos de la empresa
    doc.fontSize(14).text(quotation.company.name)
    doc.fontSize(10).text(`Sucursal: ${quotation.branch.name}`)
    doc.moveDown()

    // Datos del cliente
    doc.text(`Cliente: ${quotation.customer.name}`)
    doc.text(`Fecha: ${new Date(quotation.createdAt).toLocaleDateString('es-MX')}`)
    doc.text(`Válida hasta: ${new Date(quotation.validUntil).toLocaleDateString('es-MX')}`)
    doc.moveDown()

    // Tabla de productos
    doc.fontSize(12).text('PRODUCTOS:', { underline: true })
    doc.moveDown(0.5)

    quotation.items.forEach((item: any, index: number) => {
      doc.fontSize(10)
      doc.text(`${index + 1}. ${item.product.name}`)
      doc.text(`   Cantidad: ${item.quantity} | Precio: $${item.price.toFixed(2)} | Subtotal: $${item.subtotal.toFixed(2)}`)
    })

    doc.moveDown()

    // Totales
    doc.fontSize(12)
    doc.text(`Subtotal: $${quotation.subtotal.toFixed(2)}`, { align: 'right' })
    doc.text(`Descuento: -$${quotation.discount.toFixed(2)}`, { align: 'right' })
    doc.text(`IVA (16%): $${quotation.tax.toFixed(2)}`, { align: 'right' })
    doc.fontSize(14).text(`TOTAL: $${quotation.total.toFixed(2)}`, { align: 'right', bold: true })

    doc.moveDown()

    // Notas
    if (quotation.notes) {
      doc.fontSize(10).text('Notas:', { underline: true })
      doc.text(quotation.notes)
    }

    doc.end()
  })
}
```

**🔧 Instalación:**
```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

**📍 Usado en:**
- `src/app/api/quotations/[id]/send-email/route.ts` (línea 62)
- `src/app/api/quotations/[id]/send-whatsapp/route.ts` (línea 97)
- `src/app/api/quotations/[id]/pdf/route.ts` (línea 42)

---

### 2️⃣ SERVICIO DE WHATSAPP

**📁 Archivo a crear:** `src/lib/whatsapp/sender.ts`

**🎯 Propósito:** Enviar mensajes por WhatsApp Business API.

**📝 Código básico:**

```typescript
// src/lib/whatsapp/sender.ts

interface SendWhatsAppMessageParams {
  to: string
  message: string
  mediaUrl?: string
  mediaType?: 'image' | 'document' | 'video'
  mediaCaption?: string
  businessPhone: string
  accessToken: string
}

export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // URL de WhatsApp Business API
    const url = `https://graph.facebook.com/v18.0/${params.businessPhone}/messages`

    // Preparar payload
    const payload: any = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'text',
      text: { body: params.message }
    }

    // Si hay archivo adjunto
    if (params.mediaUrl && params.mediaType) {
      payload.type = params.mediaType
      payload[params.mediaType] = {
        link: params.mediaUrl,
        caption: params.mediaCaption || ''
      }
    }

    // Hacer petición a WhatsApp API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error al enviar mensaje')
    }

    return {
      success: true,
      messageId: data.messages[0]?.id
    }
  } catch (error) {
    console.error('Error enviando mensaje de WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
```

**🔧 Instalación:** No requiere instalación (usa fetch nativo)

**📍 Usado en:**
- `src/app/api/quotations/[id]/send-whatsapp/route.ts` (línea 107)

**⚠️ Requisitos:**
- Cuenta de WhatsApp Business
- Aplicación de Facebook
- Token de acceso de WhatsApp Business API

---

### 3️⃣ SERVICIO DE STORAGE (CLOUD)

**📁 Archivo a crear:** `src/lib/storage.ts`

**🎯 Propósito:** Subir archivos a la nube y obtener URL pública (para WhatsApp).

**📝 Código básico (con AWS S3):**

```typescript
// src/lib/storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || ''

export async function uploadToCloudStorage(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' // URL pública
    })

    await s3Client.send(command)

    // Retornar URL pública
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${path}`
    return url
  } catch (error) {
    console.error('Error subiendo archivo a S3:', error)
    throw new Error('Error al subir archivo')
  }
}
```

**🔧 Instalación:**
```bash
npm install @aws-sdk/client-s3
```

**🔐 Variables de entorno (.env):**
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET=nombre-de-tu-bucket
```

**📍 Usado en:**
- `src/app/api/quotations/[id]/send-whatsapp/route.ts` (línea 100-104)

**💡 Alternativas:**
- Cloudinary (más fácil de usar)
- Azure Blob Storage
- Google Cloud Storage
- DigitalOcean Spaces

---

## 🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **PRIMERO:** Crear generador de PDF ✅ (esencial)
2. **SEGUNDO:** Probar envío por email (ya funciona) ✅
3. **TERCERO:** Crear servicio de WhatsApp (solo si usas WhatsApp)
4. **CUARTO:** Crear servicio de Storage (solo si usas WhatsApp automático)

---

## 🎯 RESUMEN VISUAL

```
API de Cotizaciones
├── Listar/Crear ✅ (Ya funciona)
├── Actualizar/Eliminar ✅ (Ya funciona)
├── Enviar Email
│   ├── sendQuotation() ✅ (Ya existe)
│   └── generateQuotationPDF() ❌ (FALTA CREAR)
├── Enviar WhatsApp
│   ├── sendWhatsAppMessage() ❌ (FALTA CREAR)
│   ├── generateQuotationPDF() ❌ (FALTA CREAR)
│   └── uploadToCloudStorage() ❌ (FALTA CREAR - solo auto)
├── Convertir a Venta ✅ (Ya funciona)
└── Generar PDF
    └── generateQuotationPDF() ❌ (FALTA CREAR)
```

---

## ❓ DECISIONES QUE DEBES TOMAR

1. **¿Quieres usar WhatsApp?**
   - ❌ NO → Solo necesitas crear el generador de PDF
   - ✅ SÍ → Necesitas crear todo

2. **¿Qué modo de WhatsApp?**
   - Manual (PLAN PRO) → No necesitas `uploadToCloudStorage()`
   - Automático (PLAN PRO PLUS) → Necesitas todo

3. **¿Qué servicio de storage?**
   - AWS S3 (recomendado)
   - Cloudinary (más fácil)
   - Otro proveedor

---

## 📞 SIGUIENTE PASO

Dime:
1. ¿Quieres que cree el generador de PDF ahora?
2. ¿Vas a usar WhatsApp o solo email por ahora?
3. Si usas WhatsApp, ¿ya tienes cuenta de WhatsApp Business?
