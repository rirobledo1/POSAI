/**
 * Normalizador de texto inteligente para productos
 * Corrige ortografía, caracteres especiales, unidades de medida, etc.
 */

export interface NormalizationResult {
  originalText: string;
  normalizedText: string;
  corrections: string[];
  confidence: number;
}

export class TextNormalizer {
  // Diccionario de correcciones ortográficas comunes
  private static readonly SPELLING_CORRECTIONS: Record<string, string> = {
    // Herramientas
    'tornilo': 'tornillo',
    'tornillos': 'tornillos',
    'destornilador': 'destornillador',
    'destornilladores': 'destornilladores',
    'martilo': 'martillo',
    'martilos': 'martillos',
    'taladoro': 'taladro',
    'taladoros': 'taladros',
    'alicates': 'alicates',
    'llaves': 'llaves',
    'llave': 'llave',
    
    // Eléctrico
    'interuptor': 'interruptor',
    'interruptores': 'interruptores',
    'enchufe': 'enchufe',
    'enchufes': 'enchufes',
    'conector': 'conector',
    'conectores': 'conectores',
    'electrico': 'eléctrico',
    'electrica': 'eléctrica',
    'electricos': 'eléctricos',
    'electricas': 'eléctricas',
    'voltaje': 'voltaje',
    'amperaje': 'amperaje',
    'resistance': 'resistencia',
    'capacitor': 'capacitor',
    
    // Plomería
    'tuberia': 'tubería',
    'tuberias': 'tuberías',
    'conexion': 'conexión',
    'conexiones': 'conexiones',
    'valvula': 'válvula',
    'valvulas': 'válvulas',
    'grifo': 'grifo',
    'grifos': 'grifos',
    'manguera': 'manguera',
    'mangueras': 'mangueras',
    
    // Construcción
    'cemento': 'cemento',
    'concreto': 'concreto',
    'ladrillos': 'ladrillos',
    'ladrillo': 'ladrillo',
    'adhesivo': 'adhesivo',
    'adhesivos': 'adhesivos',
    
    // Pintura
    'pintura': 'pintura',
    'pinturas': 'pinturas',
    'brocha': 'brocha',
    'brochas': 'brochas',
    'rodillo': 'rodillo',
    'rodillos': 'rodillos',
    'thinner': 'thinner',
    'diluyente': 'diluyente',
    
    // Tornillería
    'pulgada': 'pulgada',
    'pulgadas': 'pulgadas',
    'milimetro': 'milímetro',
    'milimetros': 'milímetros',
    'centimetro': 'centímetro',
    'centimetros': 'centímetros',
    'phillips': 'Phillips',
    'pozidriv': 'Pozidriv',
    'hexagonal': 'hexagonal',
    'plano': 'plano'
  };

  // Normalizaciones de unidades de medida
  private static readonly UNIT_NORMALIZATIONS: Record<string, string> = {
    // Pulgadas
    'inch': '"',
    'inches': '"',
    'pulgada': '"',
    'pulgadas': '"',
    'pulg': '"',
    
    // Fracciones comunes
    '1/2': '1/2',
    '1/4': '1/4',
    '3/4': '3/4',
    '1/8': '1/8',
    '3/8': '3/8',
    '5/8': '5/8',
    '7/8': '7/8',
    '½': '1/2',
    '¼': '1/4',
    '¾': '3/4',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
    
    // Metros y centímetros
    'metro': 'm',
    'metros': 'm',
    'centimetro': 'cm',
    'centimetros': 'cm',
    'centímetro': 'cm',
    'centímetros': 'cm',
    'milimetro': 'mm',
    'milimetros': 'mm',
    'milímetro': 'mm',
    'milímetros': 'mm',
    
    // Peso
    'gramo': 'g',
    'gramos': 'g',
    'kilogramo': 'kg',
    'kilogramos': 'kg',
    'kilo': 'kg',
    'kilos': 'kg',
    'libra': 'lb',
    'libras': 'lb',
    'onza': 'oz',
    'onzas': 'oz',
    
    // Voltaje y electricidad
    'volt': 'V',
    'volts': 'V',
    'voltio': 'V',
    'voltios': 'V',
    'amper': 'A',
    'amperio': 'A',
    'amperios': 'A',
    'amp': 'A',
    'amps': 'A',
    'watt': 'W',
    'watts': 'W',
    'vatio': 'W',
    'vatios': 'W'
  };

  // Patrones de caracteres problemáticos
  private static readonly CHARACTER_FIXES: Array<{ pattern: RegExp; replacement: string; description: string }> = [
    // Espacios múltiples
    { pattern: /\s+/g, replacement: ' ', description: 'Espacios múltiples' },
    
    // Guiones múltiples
    { pattern: /--+/g, replacement: '-', description: 'Guiones múltiples' },
    
    // Underscores a espacios
    { pattern: /_+/g, replacement: ' ', description: 'Underscores a espacios' },
    
    // Caracteres especiales problemáticos
    { pattern: /['']/g, replacement: "'", description: 'Apostrofes especiales' },
    { pattern: /[""]/g, replacement: '"', description: 'Comillas especiales' },
    { pattern: /[–—]/g, replacement: '-', description: 'Guiones especiales' },
    
    // Fracciones especiales
    { pattern: /½/g, replacement: '1/2', description: 'Fracción 1/2' },
    { pattern: /¼/g, replacement: '1/4', description: 'Fracción 1/4' },
    { pattern: /¾/g, replacement: '3/4', description: 'Fracción 3/4' },
    { pattern: /⅛/g, replacement: '1/8', description: 'Fracción 1/8' },
    { pattern: /⅜/g, replacement: '3/8', description: 'Fracción 3/8' },
    { pattern: /⅝/g, replacement: '5/8', description: 'Fracción 5/8' },
    { pattern: /⅞/g, replacement: '7/8', description: 'Fracción 7/8' },
  ];

  /**
   * Normaliza un texto de producto aplicando todas las correcciones
   */
  public static normalize(text: string): NormalizationResult {
    if (!text || typeof text !== 'string') {
      return {
        originalText: text || '',
        normalizedText: '',
        corrections: [],
        confidence: 0
      };
    }

    const originalText = text;
    let normalizedText = text;
    const corrections: string[] = [];
    
    // 1. Trim inicial
    normalizedText = normalizedText.trim();
    
    // 2. Corrección de caracteres especiales
    for (const fix of this.CHARACTER_FIXES) {
      if (fix.pattern.test(normalizedText)) {
        normalizedText = normalizedText.replace(fix.pattern, fix.replacement);
        corrections.push(fix.description);
      }
    }
    
    // 3. Normalización de unidades
    const unitNormalized = this.normalizeUnits(normalizedText);
    if (unitNormalized.text !== normalizedText) {
      normalizedText = unitNormalized.text;
      corrections.push(...unitNormalized.corrections);
    }
    
    // 4. Corrección ortográfica
    const spellCorrected = this.correctSpelling(normalizedText);
    if (spellCorrected.text !== normalizedText) {
      normalizedText = spellCorrected.text;
      corrections.push(...spellCorrected.corrections);
    }
    
    // 5. Capitalización inteligente
    const capitalized = this.smartCapitalization(normalizedText);
    if (capitalized.text !== normalizedText) {
      normalizedText = capitalized.text;
      corrections.push(...capitalized.corrections);
    }
    
    // 6. Trim final
    normalizedText = normalizedText.trim();
    
    // Calcular confianza basada en el número de correcciones
    const confidence = this.calculateConfidence(originalText, normalizedText, corrections.length);
    
    return {
      originalText,
      normalizedText,
      corrections: [...new Set(corrections)], // Eliminar duplicados
      confidence
    };
  }

  /**
   * Normaliza unidades de medida
   */
  private static normalizeUnits(text: string): { text: string; corrections: string[] } {
    let normalizedText = text;
    const corrections: string[] = [];
    
    // Aplicar normalizaciones de unidades
    for (const [original, normalized] of Object.entries(this.UNIT_NORMALIZATIONS)) {
      const pattern = new RegExp(`\\b${original}\\b`, 'gi');
      if (pattern.test(normalizedText)) {
        normalizedText = normalizedText.replace(pattern, normalized);
        corrections.push(`Unidad: ${original} → ${normalized}`);
      }
    }
    
    return { text: normalizedText, corrections };
  }

  /**
   * Corrección ortográfica
   */
  private static correctSpelling(text: string): { text: string; corrections: string[] } {
    let normalizedText = text;
    const corrections: string[] = [];
    
    // Aplicar correcciones ortográficas
    for (const [incorrect, correct] of Object.entries(this.SPELLING_CORRECTIONS)) {
      const pattern = new RegExp(`\\b${incorrect}\\b`, 'gi');
      if (pattern.test(normalizedText)) {
        normalizedText = normalizedText.replace(pattern, correct);
        corrections.push(`Ortografía: ${incorrect} → ${correct}`);
      }
    }
    
    return { text: normalizedText, corrections };
  }

  /**
   * Capitalización inteligente
   */
  private static smartCapitalization(text: string): { text: string; corrections: string[] } {
    const corrections: string[] = [];
    
    // Palabras que deben permanecer en minúscula (excepto al inicio)
    const lowercaseWords = ['de', 'del', 'la', 'el', 'las', 'los', 'en', 'con', 'para', 'por', 'y', 'o', 'u'];
    
    // Palabras que deben estar en mayúscula
    const uppercaseWords = ['Phillips', 'Pozidriv', 'PVC', 'LED', 'USB', 'HDMI', 'WiFi', 'AC', 'DC'];
    
    const words = text.split(' ');
    const capitalizedWords = words.map((word, index) => {
      const cleanWord = word.toLowerCase();
      
      // Verificar si es una palabra especial que debe estar en mayúscula
      const uppercaseMatch = uppercaseWords.find(uw => uw.toLowerCase() === cleanWord);
      if (uppercaseMatch) {
        if (word !== uppercaseMatch) {
          corrections.push(`Capitalización: ${word} → ${uppercaseMatch}`);
        }
        return uppercaseMatch;
      }
      
      // Primera palabra siempre capitalizada
      if (index === 0) {
        const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        if (word !== capitalized) {
          corrections.push(`Primera palabra capitalizada: ${word} → ${capitalized}`);
        }
        return capitalized;
      }
      
      // Palabras que deben permanecer en minúscula
      if (lowercaseWords.includes(cleanWord)) {
        if (word !== cleanWord) {
          corrections.push(`Palabra en minúscula: ${word} → ${cleanWord}`);
        }
        return cleanWord;
      }
      
      // Capitalización normal
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      if (word !== capitalized) {
        corrections.push(`Capitalización: ${word} → ${capitalized}`);
      }
      return capitalized;
    });
    
    return {
      text: capitalizedWords.join(' '),
      corrections
    };
  }

  /**
   * Calcula la confianza de la normalización
   */
  private static calculateConfidence(original: string, normalized: string, correctionCount: number): number {
    if (original === normalized) {
      return 1.0; // Sin cambios = máxima confianza
    }
    
    const originalLength = original.length;
    const changeRatio = correctionCount / Math.max(1, originalLength / 10);
    
    // Confianza alta para pocos cambios, baja para muchos cambios
    if (changeRatio <= 0.1) return 0.95;
    if (changeRatio <= 0.2) return 0.85;
    if (changeRatio <= 0.3) return 0.75;
    if (changeRatio <= 0.5) return 0.65;
    return 0.5;
  }

  /**
   * Normaliza específicamente nombres de productos
   */
  public static normalizeProductName(name: string): NormalizationResult {
    const result = this.normalize(name);
    
    // Validaciones adicionales para nombres de productos
    if (result.normalizedText.length < 2) {
      result.normalizedText = result.originalText; // Mantener original si es muy corto
      result.confidence = Math.min(result.confidence, 0.3);
      result.corrections.push('Nombre muy corto - mantenido original');
    }
    
    if (result.normalizedText.length > 100) {
      result.normalizedText = result.normalizedText.substring(0, 100).trim();
      result.corrections.push('Nombre truncado a 100 caracteres');
      result.confidence = Math.min(result.confidence, 0.8);
    }
    
    return result;
  }

  /**
   * Normaliza específicamente descripciones de productos
   */
  public static normalizeProductDescription(description: string): NormalizationResult {
    if (!description) {
      return {
        originalText: '',
        normalizedText: '',
        corrections: [],
        confidence: 1.0
      };
    }
    
    const result = this.normalize(description);
    
    // Validaciones adicionales para descripciones
    if (result.normalizedText.length > 500) {
      result.normalizedText = result.normalizedText.substring(0, 500).trim();
      result.corrections.push('Descripción truncada a 500 caracteres');
      result.confidence = Math.min(result.confidence, 0.8);
    }
    
    return result;
  }

  /**
   * Normaliza específicamente nombres de categorías
   */
  public static normalizeCategoryName(name: string): NormalizationResult {
    const result = this.normalize(name);
    
    // Validaciones específicas para categorías
    if (result.normalizedText.length < 2) {
      result.normalizedText = result.originalText;
      result.confidence = Math.min(result.confidence, 0.3);
      result.corrections.push('Nombre de categoría muy corto - mantenido original');
    }
    
    if (result.normalizedText.length > 50) {
      result.normalizedText = result.normalizedText.substring(0, 50).trim();
      result.corrections.push('Nombre de categoría truncado a 50 caracteres');
      result.confidence = Math.min(result.confidence, 0.8);
    }
    
    // Capitalizar primera letra de cada palabra para categorías
    result.normalizedText = result.normalizedText
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (result.normalizedText !== name.trim()) {
      result.corrections.push('Formato de capitalización mejorado');
    }
    
    return result;
  }

  /**
   * Normaliza específicamente descripciones de categorías
   */
  public static normalizeCategoryDescription(description: string): NormalizationResult {
    if (!description) {
      return {
        originalText: '',
        normalizedText: '',
        corrections: [],
        confidence: 1.0
      };
    }
    
    const result = this.normalize(description);
    
    // Validaciones para descripciones de categorías
    if (result.normalizedText.length > 200) {
      result.normalizedText = result.normalizedText.substring(0, 200).trim();
      result.corrections.push('Descripción de categoría truncada a 200 caracteres');
      result.confidence = Math.min(result.confidence, 0.8);
    }
    
    // Asegurar que termine con punto si no lo tiene
    if (result.normalizedText && !result.normalizedText.endsWith('.') && 
        !result.normalizedText.endsWith('!') && !result.normalizedText.endsWith('?')) {
      result.normalizedText += '.';
      result.corrections.push('Agregado punto final');
    }
    
    return result;
  }
}

export default TextNormalizer;
