// src/lib/permissions/quotations.ts

export type Plan = 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'

/**
 * Permisos de cotizaciones por plan
 */
export const QUOTATION_PERMISSIONS = {
  FREE: {
    canCreate: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canGeneratePDF: true,
    canPrint: true,
    canSendEmail: false,
    canSendWhatsAppManual: false,
    canSendWhatsAppAuto: false,
    canUseWhatsAppAI: false,
    canConvertToSale: true,
    maxQuotationsPerMonth: 10,
  },
  PRO: {
    canCreate: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canGeneratePDF: true,
    canPrint: true,
    canSendEmail: true,
    canSendWhatsAppManual: true,
    canSendWhatsAppAuto: false,
    canUseWhatsAppAI: false,
    canConvertToSale: true,
    maxQuotationsPerMonth: 100,
  },
  PRO_PLUS: {
    canCreate: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canGeneratePDF: true,
    canPrint: true,
    canSendEmail: true,
    canSendWhatsAppManual: true,
    canSendWhatsAppAuto: true,
    canUseWhatsAppAI: false,
    canConvertToSale: true,
    maxQuotationsPerMonth: 500,
  },
  ENTERPRISE: {
    canCreate: true,
    canView: true,
    canEdit: true,
    canDelete: true,
    canGeneratePDF: true,
    canPrint: true,
    canSendEmail: true,
    canSendWhatsAppManual: true,
    canSendWhatsAppAuto: true,
    canUseWhatsAppAI: true,
    canConvertToSale: true,
    maxQuotationsPerMonth: -1, // Ilimitado
  },
}

/**
 * Verificar si un plan puede realizar una acción específica
 */
export function canPerformAction(
  plan: Plan,
  action: keyof typeof QUOTATION_PERMISSIONS.FREE
): boolean {
  const permissions = QUOTATION_PERMISSIONS[plan]
  return permissions?.[action] || false
}

/**
 * Verificar si puede enviar por email
 */
export function canSendEmailQuotation(plan: Plan): boolean {
  return canPerformAction(plan, 'canSendEmail')
}

/**
 * Verificar si puede enviar por WhatsApp manual
 */
export function canSendWhatsAppManual(plan: Plan): boolean {
  return canPerformAction(plan, 'canSendWhatsAppManual')
}

/**
 * Verificar si puede enviar por WhatsApp automático
 */
export function canSendWhatsAppAuto(plan: Plan): boolean {
  return canPerformAction(plan, 'canSendWhatsAppAuto')
}

/**
 * Verificar si puede usar WhatsApp con IA
 */
export function canUseWhatsAppAI(plan: Plan): boolean {
  return canPerformAction(plan, 'canUseWhatsAppAI')
}

/**
 * Obtener el límite de cotizaciones por mes
 */
export function getQuotationLimit(plan: Plan): number {
  return QUOTATION_PERMISSIONS[plan].maxQuotationsPerMonth
}

/**
 * Verificar si se alcanzó el límite de cotizaciones
 */
export async function hasReachedQuotationLimit(
  companyId: string,
  plan: Plan,
  prisma: any
): Promise<boolean> {
  const limit = getQuotationLimit(plan)
  
  // Si es ilimitado, retornar false
  if (limit === -1) {
    return false
  }

  // Obtener primer día del mes actual
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  // Contar cotizaciones del mes
  const count = await prisma.quotation.count({
    where: {
      companyId,
      createdAt: {
        gte: firstDayOfMonth
      }
    }
  })

  return count >= limit
}

/**
 * Obtener plan requerido para una característica
 */
export function getRequiredPlanForFeature(feature: string): Plan {
  const featureMap: Record<string, Plan> = {
    'email': 'PRO',
    'whatsapp_manual': 'PRO',
    'whatsapp_auto': 'PRO_PLUS',
    'whatsapp_ai': 'ENTERPRISE',
  }

  return featureMap[feature] || 'PRO'
}

/**
 * Obtener descripción de las características bloqueadas
 */
export function getBlockedFeatureMessage(feature: string): string {
  const messages: Record<string, string> = {
    'email': 'El envío de cotizaciones por email requiere el plan PRO o superior.',
    'whatsapp_manual': 'El envío de cotizaciones por WhatsApp requiere el plan PRO o superior.',
    'whatsapp_auto': 'El envío automático por WhatsApp requiere el plan PRO PLUS o superior.',
    'whatsapp_ai': 'Las funciones de IA para WhatsApp requieren el plan ENTERPRISE.',
    'limit_reached': 'Has alcanzado el límite de cotizaciones de tu plan. Actualiza para crear más.',
  }

  return messages[feature] || 'Esta característica no está disponible en tu plan actual.'
}

/**
 * Obtener todas las características bloqueadas para un plan
 */
export function getBlockedFeatures(plan: Plan): string[] {
  const permissions = QUOTATION_PERMISSIONS[plan]
  const blocked: string[] = []

  if (!permissions.canSendEmail) blocked.push('Envío por email')
  if (!permissions.canSendWhatsAppManual) blocked.push('WhatsApp manual')
  if (!permissions.canSendWhatsAppAuto) blocked.push('WhatsApp automático')
  if (!permissions.canUseWhatsAppAI) blocked.push('WhatsApp con IA')

  return blocked
}

/**
 * Obtener características disponibles para un plan
 */
export function getAvailableFeatures(plan: Plan): string[] {
  const permissions = QUOTATION_PERMISSIONS[plan]
  const available: string[] = []

  if (permissions.canCreate) available.push('Crear cotizaciones')
  if (permissions.canGeneratePDF) available.push('Generar PDF')
  if (permissions.canSendEmail) available.push('Envío por email')
  if (permissions.canSendWhatsAppManual) available.push('WhatsApp manual')
  if (permissions.canSendWhatsAppAuto) available.push('WhatsApp automático')
  if (permissions.canUseWhatsAppAI) available.push('WhatsApp con IA')
  if (permissions.canConvertToSale) available.push('Convertir a venta')

  return available
}
