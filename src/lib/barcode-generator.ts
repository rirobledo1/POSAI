/**
 * Generador de códigos de barras para productos
 * Genera códigos EAN-13 válidos cuando no se proporciona código de barras
 */

import { Pool } from 'pg';

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'ferreai_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Genera un código EAN-13 válido
 */
function generateEAN13(): string {
  // Código de país (020-029 para uso interno)
  const countryCode = '020';
  
  // Código de empresa (5 dígitos aleatorios)
  const companyCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  // Código de producto (4 dígitos aleatorios)
  const productCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Los primeros 12 dígitos
  const baseCode = countryCode + companyCode + productCode;
  
  // Calcular dígito verificador
  const checkDigit = calculateEAN13CheckDigit(baseCode);
  
  return baseCode + checkDigit;
}

/**
 * Calcula el dígito verificador para EAN-13
 */
function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      sum += digit * 3;
    }
  }
  
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  
  return checkDigit.toString();
}

/**
 * Verifica si un código de barras ya existe en la base de datos
 */
async function barcodeExists(barcode: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT id FROM products WHERE barcode = $1 LIMIT 1',
      [barcode]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error verificando código de barras:', error);
    return false;
  }
}

/**
 * Genera un código de barras único que no existe en la base de datos
 */
export async function generateUniqueBarcode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const barcode = generateEAN13();
    
    const exists = await barcodeExists(barcode);
    if (!exists) {
      return barcode;
    }
    
    attempts++;
  }
  
  throw new Error('No se pudo generar un código de barras único después de 100 intentos');
}

/**
 * Valida si un código de barras tiene el formato correcto
 */
export function isValidBarcode(barcode: string): boolean {
  // Acepta EAN-13, EAN-8, UPC-A, y códigos personalizados
  const patterns = [
    /^\d{13}$/, // EAN-13
    /^\d{8}$/,  // EAN-8
    /^\d{12}$/, // UPC-A
    /^[A-Z0-9]{6,20}$/ // Código personalizado
  ];
  
  return patterns.some(pattern => pattern.test(barcode));
}

/**
 * Procesa el código de barras: genera uno si está vacío o valida el existente
 */
export async function processBarcode(inputBarcode?: string): Promise<string> {
  // Si no se proporciona código de barras, generar uno nuevo
  if (!inputBarcode || inputBarcode.trim() === '') {
    return await generateUniqueBarcode();
  }
  
  const cleanBarcode = inputBarcode.trim();
  
  // Validar formato
  if (!isValidBarcode(cleanBarcode)) {
    throw new Error(`Código de barras inválido: ${cleanBarcode}`);
  }
  
  // Verificar que no exista en la base de datos
  const exists = await barcodeExists(cleanBarcode);
  if (exists) {
    throw new Error(`El código de barras ${cleanBarcode} ya existe en el sistema`);
  }
  
  return cleanBarcode;
}
