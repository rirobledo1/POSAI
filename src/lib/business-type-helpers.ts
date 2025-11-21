// Helper para obtener información dinámica de categorías por tipo de empresa

export const BUSINESS_TYPE_INFO = {
  FERRETERIA: {
    emoji: "🔧",
    name: "Ferretería",
    categoryCount: 12,
    description: "Herramientas, construcción y materiales"
  },
  ABARROTES: {
    emoji: "🛒",
    name: "Abarrotes", 
    categoryCount: 10,
    description: "Alimentos, bebidas y productos básicos"
  },
  PAPELERIA: {
    emoji: "📝",
    name: "Papelería",
    categoryCount: 8,
    description: "Útiles escolares, oficina y arte"
  },
  FARMACIA: {
    emoji: "💊",
    name: "Farmacia",
    categoryCount: 8,
    description: "Medicamentos y cuidado personal"
  },
  RESTAURANTE: {
    emoji: "🍽️",
    name: "Restaurante",
    categoryCount: 8,
    description: "Alimentos, bebidas y servicios"
  },
  ROPA: {
    emoji: "👕",
    name: "Ropa",
    categoryCount: 9,
    description: "Vestimenta y accesorios"
  },
  ELECTRONICA: {
    emoji: "📱",
    name: "Electrónicos",
    categoryCount: 8,
    description: "Dispositivos y tecnología"
  },
  AUTOMOTRIZ: {
    emoji: "🚗",
    name: "Automotriz",
    categoryCount: 8,
    description: "Repuestos y accesorios"
  },
  BELLEZA: {
    emoji: "💄",
    name: "Belleza",
    categoryCount: 7,
    description: "Cosmética y cuidado personal"
  },
  DEPORTES: {
    emoji: "⚽",
    name: "Deportes",
    categoryCount: 7,
    description: "Equipos y ropa deportiva"
  },
  JUGUETERIA: {
    emoji: "🧸",
    name: "Juguetería",
    categoryCount: 8,
    description: "Juguetes y entretenimiento"
  },
  LIBRERIA: {
    emoji: "📚",
    name: "Librería",
    categoryCount: 6,
    description: "Libros y material educativo"
  },
  GENERAL: {
    emoji: "🏪",
    name: "General",
    categoryCount: 8,
    description: "Productos diversos"
  }
};

export function getBusinessTypeInfo(businessType: string) {
  return BUSINESS_TYPE_INFO[businessType as keyof typeof BUSINESS_TYPE_INFO] || BUSINESS_TYPE_INFO.GENERAL;
}

export function getCategoryDescription(businessType: string, hasCompany: boolean) {
  if (!hasCompany) {
    return "Configura primero tu empresa en la sección de configuración para acceder a categorías específicas";
  }
  
  const info = getBusinessTypeInfo(businessType);
  return `${info.categoryCount} categorías de ${info.name.toLowerCase()} del sistema (${info.description})`;
}