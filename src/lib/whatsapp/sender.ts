// src/lib/whatsapp/sender.ts
/**
 * Servicio para envío de mensajes por WhatsApp Business API
 */

interface SendWhatsAppMessageParams {
  to: string                    // Número de teléfono (con código de país)
  message: string               // Mensaje de texto
  mediaUrl?: string             // URL del archivo (PDF, imagen, video)
  mediaType?: 'image' | 'document' | 'video' | 'audio'
  mediaCaption?: string         // Caption para el archivo
  businessPhone: string         // ID del teléfono de negocio
  accessToken: string           // Token de acceso de WhatsApp Business API
}

interface WhatsAppResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Enviar mensaje por WhatsApp Business API
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<WhatsAppResult> {
  try {
    const {
      to,
      message,
      mediaUrl,
      mediaType,
      mediaCaption,
      businessPhone,
      accessToken
    } = params

    // URL del endpoint de WhatsApp Business API
    const apiUrl = `https://graph.facebook.com/v18.0/${businessPhone}/messages`

    // Preparar payload según si hay archivo adjunto o no
    let payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to
    }

    // Si hay archivo adjunto
    if (mediaUrl && mediaType) {
      payload.type = mediaType
      payload[mediaType] = {
        link: mediaUrl
      }
      
      // Caption solo para ciertos tipos
      if (mediaCaption && (mediaType === 'image' || mediaType === 'document' || mediaType === 'video')) {
        payload[mediaType].caption = mediaCaption
      }
      
      // Filename específico para documentos
      if (mediaType === 'document') {
        const filename = mediaUrl.split('/').pop() || 'documento.pdf'
        payload[mediaType].filename = filename
      }
    } else {
      // Solo mensaje de texto
      payload.type = 'text'
      payload.text = {
        preview_url: true, // Mostrar preview de URLs
        body: message
      }
    }

    // Hacer petición a WhatsApp API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error de WhatsApp API:', data)
      throw new Error(
        data.error?.message || 
        data.error?.error_data?.details ||
        'Error al enviar mensaje por WhatsApp'
      )
    }

    console.log('✅ Mensaje enviado por WhatsApp:', data)

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }
  } catch (error) {
    console.error('❌ Error enviando mensaje de WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Generar URL de WhatsApp Web para envío manual (Plan PRO)
 */
export function generateWhatsAppWebUrl(phoneNumber: string, message: string): string {
  // Limpiar número de teléfono
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  
  // Codificar mensaje para URL
  const encodedMessage = encodeURIComponent(message)
  
  // Retornar URL de WhatsApp Web
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Validar formato de número de teléfono
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Limpiar número
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  
  // Debe tener entre 10 y 15 dígitos
  return cleanPhone.length >= 10 && cleanPhone.length <= 15
}

/**
 * Formatear número de teléfono a formato internacional
 * Ejemplo: 5551234567 → 525551234567 (México)
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string = '52'): string {
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  
  // Si ya tiene código de país, retornar tal cual
  if (cleanPhone.startsWith(countryCode)) {
    return cleanPhone
  }
  
  // Agregar código de país
  return `${countryCode}${cleanPhone}`
}
