// Definición de características por plan de suscripción

export type PlanType = 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'

export interface PlanFeatures {
  // Cotizaciones
  quotationInPerson: boolean        // Cotización presencial
  quotationOnline: boolean          // Cotización en línea (formulario web)
  quotationWhatsApp: boolean        // Cotización vía WhatsApp
  
  // Tienda en línea
  onlineStore: boolean              // Tienda en línea activa
  onlinePayments: boolean           // Pagos en línea
  
  // Límites
  maxBranches: number
  maxUsers: number
  maxProducts: number | null        // null = ilimitado
  
  // Características avanzadas
  advancedReports: boolean          // Reportes avanzados
  apiAccess: boolean                // Acceso a API
  customBranding: boolean           // Personalización de marca
  prioritySupport: boolean          // Soporte prioritario
}

// Configuración de características por plan
export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  FREE: {
    quotationInPerson: true,
    quotationOnline: false,
    quotationWhatsApp: false,
    onlineStore: false,
    onlinePayments: false,
    maxBranches: 1,
    maxUsers: 3,
    maxProducts: 100,
    advancedReports: false,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
  },
  PRO: {
    quotationInPerson: true,
    quotationOnline: false,           // ⚠️ NO tiene cotización en línea
    quotationWhatsApp: false,         // ⚠️ NO tiene cotización WhatsApp
    onlineStore: true,
    onlinePayments: false,
    maxBranches: 3,
    maxUsers: 10,
    maxProducts: 1000,
    advancedReports: true,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
  },
  PRO_PLUS: {
    quotationInPerson: true,
    quotationOnline: true,            // ✅ Tiene cotización en línea
    quotationWhatsApp: true,          // ✅ Tiene cotización WhatsApp
    onlineStore: true,
    onlinePayments: true,
    maxBranches: 5,
    maxUsers: 25,
    maxProducts: 5000,
    advancedReports: true,
    apiAccess: true,
    customBranding: true,
    prioritySupport: false,
  },
  ENTERPRISE: {
    quotationInPerson: true,
    quotationOnline: true,            // ✅ Tiene cotización en línea
    quotationWhatsApp: true,          // ✅ Tiene cotización WhatsApp
    onlineStore: true,
    onlinePayments: true,
    maxBranches: 999,                 // Ilimitadas prácticamente
    maxUsers: 999,                    // Ilimitados prácticamente
    maxProducts: null,                // Ilimitado
    advancedReports: true,
    apiAccess: true,
    customBranding: true,
    prioritySupport: true,
  },
}

/**
 * Obtener características del plan
 */
export function getPlanFeatures(planType: PlanType): PlanFeatures {
  return PLAN_FEATURES[planType] || PLAN_FEATURES.FREE
}

/**
 * Verificar si un plan tiene una característica específica
 */
export function hasPlanFeature(
  planType: PlanType, 
  feature: keyof PlanFeatures
): boolean {
  const features = getPlanFeatures(planType)
  return Boolean(features[feature])
}

/**
 * Nombres amigables de los planes
 */
export const PLAN_NAMES: Record<PlanType, string> = {
  FREE: 'Plan Gratuito',
  PRO: 'Plan Profesional',
  PRO_PLUS: 'Plan Pro Plus',
  ENTERPRISE: 'Plan Enterprise',
}

/**
 * Descripción de características de cotizaciones
 */
export const QUOTATION_FEATURES_DESCRIPTION: Record<PlanType, string> = {
  FREE: 'Cotización presencial únicamente',
  PRO: 'Cotización presencial únicamente',
  PRO_PLUS: 'Cotización presencial, en línea y WhatsApp',
  ENTERPRISE: 'Cotización presencial, en línea y WhatsApp',
}
