/**
 * Utilidades para manejo de unidades de medida
 */

import { UnitOfMeasure } from '@/types/pos';

export interface UnitOfMeasureInfo {
  value: UnitOfMeasure;
  label: string;
  shortLabel: string;
  category: string;
  isWeight: boolean;
  isVolume: boolean;
  isLength: boolean;
  isArea: boolean;
  isQuantity: boolean;
}

export const UNIT_OF_MEASURE_INFO: Record<UnitOfMeasure, UnitOfMeasureInfo> = {
  [UnitOfMeasure.PIECE]: {
    value: UnitOfMeasure.PIECE,
    label: 'Pieza',
    shortLabel: 'pza',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.KG]: {
    value: UnitOfMeasure.KG,
    label: 'Kilogramo',
    shortLabel: 'kg',
    category: 'Peso',
    isWeight: true,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.GRAM]: {
    value: UnitOfMeasure.GRAM,
    label: 'Gramo',
    shortLabel: 'g',
    category: 'Peso',
    isWeight: true,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.LITER]: {
    value: UnitOfMeasure.LITER,
    label: 'Litro',
    shortLabel: 'L',
    category: 'Volumen',
    isWeight: false,
    isVolume: true,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.ML]: {
    value: UnitOfMeasure.ML,
    label: 'Mililitro',
    shortLabel: 'ml',
    category: 'Volumen',
    isWeight: false,
    isVolume: true,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.METER]: {
    value: UnitOfMeasure.METER,
    label: 'Metro',
    shortLabel: 'm',
    category: 'Longitud',
    isWeight: false,
    isVolume: false,
    isLength: true,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.CM]: {
    value: UnitOfMeasure.CM,
    label: 'Centímetro',
    shortLabel: 'cm',
    category: 'Longitud',
    isWeight: false,
    isVolume: false,
    isLength: true,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.M2]: {
    value: UnitOfMeasure.M2,
    label: 'Metro cuadrado',
    shortLabel: 'm²',
    category: 'Área',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: true,
    isQuantity: false
  },
  [UnitOfMeasure.M3]: {
    value: UnitOfMeasure.M3,
    label: 'Metro cúbico',
    shortLabel: 'm³',
    category: 'Volumen',
    isWeight: false,
    isVolume: true,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.PACK]: {
    value: UnitOfMeasure.PACK,
    label: 'Paquete',
    shortLabel: 'paq',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.BOX]: {
    value: UnitOfMeasure.BOX,
    label: 'Caja',
    shortLabel: 'caja',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.DOZEN]: {
    value: UnitOfMeasure.DOZEN,
    label: 'Docena',
    shortLabel: 'doc',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.PAIR]: {
    value: UnitOfMeasure.PAIR,
    label: 'Par',
    shortLabel: 'par',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.SET]: {
    value: UnitOfMeasure.SET,
    label: 'Conjunto',
    shortLabel: 'set',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.BOTTLE]: {
    value: UnitOfMeasure.BOTTLE,
    label: 'Botella',
    shortLabel: 'bot',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.CAN]: {
    value: UnitOfMeasure.CAN,
    label: 'Lata',
    shortLabel: 'lata',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.BAG]: {
    value: UnitOfMeasure.BAG,
    label: 'Bolsa',
    shortLabel: 'bolsa',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.ROLL]: {
    value: UnitOfMeasure.ROLL,
    label: 'Rollo',
    shortLabel: 'rollo',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.SHEET]: {
    value: UnitOfMeasure.SHEET,
    label: 'Hoja',
    shortLabel: 'hoja',
    category: 'Cantidad',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: true
  },
  [UnitOfMeasure.GALLON]: {
    value: UnitOfMeasure.GALLON,
    label: 'Galón',
    shortLabel: 'gal',
    category: 'Volumen',
    isWeight: false,
    isVolume: true,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.POUND]: {
    value: UnitOfMeasure.POUND,
    label: 'Libra',
    shortLabel: 'lb',
    category: 'Peso',
    isWeight: true,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.OUNCE]: {
    value: UnitOfMeasure.OUNCE,
    label: 'Onza',
    shortLabel: 'oz',
    category: 'Peso',
    isWeight: true,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.FOOT]: {
    value: UnitOfMeasure.FOOT,
    label: 'Pie',
    shortLabel: 'ft',
    category: 'Longitud',
    isWeight: false,
    isVolume: false,
    isLength: true,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.INCH]: {
    value: UnitOfMeasure.INCH,
    label: 'Pulgada',
    shortLabel: 'in',
    category: 'Longitud',
    isWeight: false,
    isVolume: false,
    isLength: true,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.YARD]: {
    value: UnitOfMeasure.YARD,
    label: 'Yarda',
    shortLabel: 'yd',
    category: 'Longitud',
    isWeight: false,
    isVolume: false,
    isLength: true,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.TON]: {
    value: UnitOfMeasure.TON,
    label: 'Tonelada',
    shortLabel: 't',
    category: 'Peso',
    isWeight: true,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: false
  },
  [UnitOfMeasure.OTHER]: {
    value: UnitOfMeasure.OTHER,
    label: 'Otra',
    shortLabel: 'otro',
    category: 'Personalizada',
    isWeight: false,
    isVolume: false,
    isLength: false,
    isArea: false,
    isQuantity: false
  }
};

export const UNIT_CATEGORIES = [
  'Cantidad',
  'Peso',
  'Volumen',
  'Longitud',
  'Área',
  'Personalizada'
];

/**
 * Obtiene la información de una unidad de medida
 */
export function getUnitInfo(unit: UnitOfMeasure): UnitOfMeasureInfo {
  return UNIT_OF_MEASURE_INFO[unit];
}

/**
 * Obtiene todas las unidades de una categoría específica
 */
export function getUnitsByCategory(category: string): UnitOfMeasureInfo[] {
  return Object.values(UNIT_OF_MEASURE_INFO).filter(unit => unit.category === category);
}

/**
 * Formatea una cantidad con su unidad de medida
 */
export function formatQuantityWithUnit(quantity: number, unitQuantity: number, unit: UnitOfMeasure): string {
  const unitInfo = getUnitInfo(unit);
  const totalQuantity = quantity * unitQuantity;
  
  if (unitInfo.isQuantity && unitQuantity === 1) {
    return `${quantity} ${unitInfo.shortLabel}`;
  }
  
  return `${totalQuantity} ${unitInfo.shortLabel}`;
}

/**
 * Formatea el display de un producto con su unidad
 */
export function formatProductUnit(unitQuantity: number, unit: UnitOfMeasure): string {
  const unitInfo = getUnitInfo(unit);
  
  if (unitQuantity === 1 && unitInfo.isQuantity) {
    return unitInfo.shortLabel;
  }
  
  return `${unitQuantity} ${unitInfo.shortLabel}`;
}