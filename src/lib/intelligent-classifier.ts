/**
 * Motor de Clasificación Inteligente para Productos
 * Sistema de IA que combina múltiples estrategias para categorizar productos automáticamente
 * Incluye aprendizaje automático básico y análisis semántico
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

interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  strategy: string;
  reasoning: string;
  isNewCategory: boolean;
}

interface ProductData {
  name: string;
  description?: string;
  cost: number;
  categoryId?: string;
}

interface ExistingProduct {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
}

interface CategoryKeywords {
  [key: string]: {
    primary: string[];
    secondary: string[];
    patterns: RegExp[];
    weight: number;
  };
}

// Base de conocimiento extensible con palabras clave y patrones
const KNOWLEDGE_BASE: CategoryKeywords = {
  'herramientas': {
    primary: ['martillo', 'destornillador', 'alicate', 'llave', 'sierra', 'taladro', 'nivel', 'escuadra'],
    secondary: ['mango', 'acero', 'cromado', 'profesional', 'industrial', 'ergonómico'],
    patterns: [
      /martillo.*\d+.*oz/i,
      /destornillador.*(phillips|plano|cruz)/i,
      /llave.*\d+.*mm/i
    ],
    weight: 0.9
  },
  'tornilleria': {
    primary: ['tornillo', 'tuerca', 'perno', 'clavo', 'arandela', 'taquete', 'ancla'],
    secondary: ['galvanizado', 'inoxidable', 'phillips', 'plano', 'hexagonal', 'métrico'],
    patterns: [
      /tornillo.*\d+.*["']/i,
      /tuerca.*\d+.*mm/i,
      /perno.*m\d+/i
    ],
    weight: 0.95
  },
  'pintura': {
    primary: ['pintura', 'barniz', 'esmalte', 'primer', 'sellador', 'thinner', 'brocha', 'rodillo'],
    secondary: ['vinílica', 'acrílica', 'látex', 'anticorrosivo', 'mate', 'satinado', 'brillante'],
    patterns: [
      /pintura.*\d+.*l(itros?)?/i,
      /barniz.*(mate|brillante)/i,
      /esmalte.*(acrílico|alquídico)/i
    ],
    weight: 0.88
  },
  'electrico': {
    primary: ['cable', 'interruptor', 'contacto', 'foco', 'led', 'transformador', 'fusible'],
    secondary: ['volt', 'amp', 'thw', 'awg', 'watts', 'lumens', 'dimmer'],
    patterns: [
      /cable.*\d+.*awg/i,
      /foco.*\d+.*w(atts?)?/i,
      /interruptor.*\d+.*amp/i
    ],
    weight: 0.92
  },
  'plomeria': {
    primary: ['tubería', 'tubo', 'codo', 'válvula', 'llave', 'sifón', 'tapón', 'reducción'],
    secondary: ['pvc', 'cpvc', 'galvanizado', 'cobre', 'pulgada', 'conexión'],
    patterns: [
      /tubo.*\d+.*["']/i,
      /codo.*\d+.*grados?/i,
      /válvula.*\d+.*["']/i
    ],
    weight: 0.90
  },
  'construccion': {
    primary: ['cemento', 'arena', 'grava', 'block', 'ladrillo', 'varilla', 'alambre'],
    secondary: ['portland', 'estructural', 'corrugado', 'galvanizado', 'bulto', 'metro'],
    patterns: [
      /cemento.*\d+.*kg/i,
      /varilla.*\d+.*mm/i,
      /alambre.*\d+.*cal/i
    ],
    weight: 0.85
  }
};

// Configuración del sistema
const CONFIG = {
  confidenceThreshold: 0.6,
  highConfidenceThreshold: 0.8,
  fallbackCategory: 'general',
  maxSimilarityProducts: 10,
  enableLearning: true
};

/**
 * Clase principal del motor de clasificación
 */
export class IntelligentCategoryClassifier {
  private existingProducts: ExistingProduct[] = [];
  private existingCategories: Map<string, string> = new Map();

  /**
   * Inicializa el clasificador cargando datos existentes
   */
  async initialize(): Promise<void> {
    await this.loadExistingData();
  }

  /**
   * Carga productos y categorías existentes para aprendizaje
   */
  private async loadExistingData(): Promise<void> {
    try {
      console.log('🔄 Cargando datos existentes para clasificación...');
      
      // Cargar categorías existentes
      const categoriesResult = await pool.query(
        'SELECT id, name FROM categories WHERE active = true'
      );
      
      this.existingCategories.clear();
      console.log(`📂 Encontradas ${categoriesResult.rows.length} categorías existentes:`);
      
      categoriesResult.rows.forEach(cat => {
        this.existingCategories.set(cat.id, cat.name);
        console.log(`  - ${cat.id}: ${cat.name}`);
      });

      // Cargar productos existentes para similitud
      const productsResult = await pool.query(`
        SELECT p.id, p.name, p.description, p.category_id, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.active = true
        LIMIT 1000
      `);
      
      this.existingProducts = productsResult.rows;
      
      console.log(`🧠 Clasificador inicializado: ${this.existingCategories.size} categorías, ${this.existingProducts.length} productos`);
      
      if (this.existingCategories.size === 0) {
        console.log('⚠️ ADVERTENCIA: No hay categorías existentes - todas las categorías serán nuevas');
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos existentes:', error);
    }
  }

  /**
   * Clasifica un producto usando múltiples estrategias
   */
  async classifyProduct(productData: ProductData): Promise<ClassificationResult> {
    const strategies = [
      () => this.strategyExactMatch(productData),
      () => this.strategyKeywordAnalysis(productData),
      () => this.strategySemanticAnalysis(productData),
      () => this.strategyProductSimilarity(productData),
      () => this.strategyPatternMatching(productData)
    ];

    const results: ClassificationResult[] = [];

    // Ejecutar todas las estrategias
    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn('Error en estrategia de clasificación:', error);
      }
    }

    // Combinar resultados y seleccionar el mejor
    console.log(`📊 Combinando ${results.length} resultados de clasificación...`);
    const bestResult = this.combineResults(results);
    
    console.log(`🎯 Resultado combinado:`, bestResult);
    console.log(`🔍 Umbral de confianza: ${CONFIG.confidenceThreshold}`);
    
    // Si no hay resultado satisfactorio, crear categoría inteligente
    if (!bestResult || bestResult.confidence < CONFIG.confidenceThreshold) {
      console.log(`⚠️ Resultado insatisfactorio, creando categoría inteligente...`);
      return await this.createIntelligentCategory(productData);
    }

    console.log(`✅ Usando resultado combinado`);
    return bestResult;
  }

  /**
   * Estrategia 1: Coincidencia exacta con categorías existentes
   */
  private async strategyExactMatch(productData: ProductData): Promise<ClassificationResult | null> {
    if (!productData.categoryId) return null;

    const categoryName = this.existingCategories.get(productData.categoryId);
    if (categoryName) {
      return {
        categoryId: productData.categoryId,
        categoryName,
        confidence: 1.0,
        strategy: 'exact_match',
        reasoning: `Categoría ${productData.categoryId} existe en la base de datos`,
        isNewCategory: false
      };
    }

    return null;
  }

  /**
   * Estrategia 2: Análisis de palabras clave con pesos
   */
  private async strategyKeywordAnalysis(productData: ProductData): Promise<ClassificationResult | null> {
    const text = `${productData.name} ${productData.description || ''}`.toLowerCase();
    const scores: { [key: string]: number } = {};

    for (const [categoryKey, keywords] of Object.entries(KNOWLEDGE_BASE)) {
      let score = 0;
      
      // Palabras clave primarias
      keywords.primary.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 2 * keywords.weight;
        }
      });

      // Palabras clave secundarias
      keywords.secondary.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score += 1 * keywords.weight;
        }
      });

      if (score > 0) {
        scores[categoryKey] = score;
      }
    }

    if (Object.keys(scores).length === 0) return null;

    const bestCategory = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
    const [categoryKey, score] = bestCategory;
    
    // Normalizar confidence (máximo posible sería ~6)
    const confidence = Math.min(score / 6, 1.0);

    if (confidence < 0.4) return null;

    return {
      categoryId: categoryKey,
      categoryName: this.categorizeTitleCase(categoryKey),
      confidence,
      strategy: 'keyword_analysis',
      reasoning: `Palabras clave detectadas: ${this.getMatchedKeywords(text, categoryKey).join(', ')}`,
      isNewCategory: !this.existingCategories.has(categoryKey)
    };
  }

  /**
   * Estrategia 3: Análisis semántico básico
   */
  private async strategySemanticAnalysis(productData: ProductData): Promise<ClassificationResult | null> {
    const text = productData.name.toLowerCase();
    
    // Análisis de patrones semánticos
    const semanticPatterns = {
      'herramientas': ['tool', 'herramienta', 'manual', 'hand'],
      'tornilleria': ['screw', 'bolt', 'nut', 'fastener', 'sujetador'],
      'electrico': ['electric', 'eléctrico', 'wire', 'cable', 'switch'],
      'pintura': ['paint', 'coating', 'finish', 'acabado'],
      'plomeria': ['pipe', 'plumbing', 'water', 'agua', 'drainage']
    };

    for (const [category, patterns] of Object.entries(semanticPatterns)) {
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          return {
            categoryId: category,
            categoryName: this.categorizeTitleCase(category),
            confidence: 0.7,
            strategy: 'semantic_analysis',
            reasoning: `Patrón semántico detectado: "${pattern}"`,
            isNewCategory: !this.existingCategories.has(category)
          };
        }
      }
    }

    return null;
  }

  /**
   * Estrategia 4: Similitud con productos existentes
   */
  private async strategyProductSimilarity(productData: ProductData): Promise<ClassificationResult | null> {
    if (this.existingProducts.length === 0) return null;

    const similarities = this.existingProducts.map(existing => ({
      ...existing,
      similarity: this.calculateTextSimilarity(productData.name, existing.name)
    })).filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, CONFIG.maxSimilarityProducts);

    if (similarities.length === 0) return null;

    // Agrupar por categoría y calcular confianza promedio
    const categoryGroups: { [key: string]: { similarities: number[], name: string } } = {};
    
    similarities.forEach(item => {
      if (!categoryGroups[item.category_id]) {
        categoryGroups[item.category_id] = { similarities: [], name: item.category_name };
      }
      categoryGroups[item.category_id].similarities.push(item.similarity);
    });

    // Encontrar la categoría con mayor confianza
    let bestCategory = '';
    let bestConfidence = 0;
    let bestName = '';

    for (const [categoryId, group] of Object.entries(categoryGroups)) {
      const avgSimilarity = group.similarities.reduce((a, b) => a + b, 0) / group.similarities.length;
      const confidence = avgSimilarity * 0.8; // Factor de ajuste
      
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestCategory = categoryId;
        bestName = group.name;
      }
    }

    if (bestConfidence < 0.3) return null;

    return {
      categoryId: bestCategory,
      categoryName: bestName,
      confidence: bestConfidence,
      strategy: 'product_similarity',
      reasoning: `Similar a: ${similarities.slice(0, 3).map(s => s.name).join(', ')}`,
      isNewCategory: false
    };
  }

  /**
   * Estrategia 5: Coincidencia de patrones regex
   */
  private async strategyPatternMatching(productData: ProductData): Promise<ClassificationResult | null> {
    const text = `${productData.name} ${productData.description || ''}`;

    for (const [categoryKey, keywords] of Object.entries(KNOWLEDGE_BASE)) {
      for (const pattern of keywords.patterns) {
        if (pattern.test(text)) {
          return {
            categoryId: categoryKey,
            categoryName: this.categorizeTitleCase(categoryKey),
            confidence: 0.85,
            strategy: 'pattern_matching',
            reasoning: `Patrón detectado: ${pattern.source}`,
            isNewCategory: !this.existingCategories.has(categoryKey)
          };
        }
      }
    }

    return null;
  }

  /**
   * Combina resultados de múltiples estrategias
   */
  private combineResults(results: ClassificationResult[]): ClassificationResult | null {
    if (results.length === 0) return null;

    // Agrupar por categoría
    const grouped: { [key: string]: ClassificationResult[] } = {};
    results.forEach(result => {
      if (!grouped[result.categoryId]) {
        grouped[result.categoryId] = [];
      }
      grouped[result.categoryId].push(result);
    });

    // Calcular puntuación combinada para cada categoría
    const finalScores: { [key: string]: { result: ClassificationResult, score: number } } = {};

    for (const [categoryId, categoryResults] of Object.entries(grouped)) {
      const weights = {
        'exact_match': 1.0,
        'pattern_matching': 0.9,
        'keyword_analysis': 0.8,
        'semantic_analysis': 0.7,
        'product_similarity': 0.6
      };

      let totalScore = 0;
      let totalWeight = 0;
      let bestResult = categoryResults[0];

      categoryResults.forEach(result => {
        const weight = weights[result.strategy as keyof typeof weights] || 0.5;
        totalScore += result.confidence * weight;
        totalWeight += weight;
        
        if (result.confidence > bestResult.confidence) {
          bestResult = result;
        }
      });

      const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      finalScores[categoryId] = { result: bestResult, score: avgScore };
    }

    // Seleccionar el mejor resultado
    const bestEntry = Object.values(finalScores).reduce((a, b) => 
      a.score > b.score ? a : b
    );

    // 🔍 VERIFICACIÓN CRÍTICA: Antes de devolver una nueva categoría, verificar si existe una similar
    if (bestEntry.result.isNewCategory) {
      console.log(`🔍 Verificando similitud antes de crear nueva categoría: "${bestEntry.result.categoryName}"`);
      console.log(`📂 Categorías existentes para comparar: ${Array.from(this.existingCategories.values()).join(', ')}`);
      
      // Buscar categoría similar existente
      for (const [existingId, existingName] of this.existingCategories.entries()) {
        console.log(`  🔎 Comparando "${bestEntry.result.categoryName}" con "${existingName}"`);
        
        if (this.areCategoriesSimilar(bestEntry.result.categoryName, existingName, 0.8)) {
          console.log(`🔄 USANDO CATEGORÍA EXISTENTE SIMILAR: "${existingName}" en lugar de crear "${bestEntry.result.categoryName}"`);
          
          // Devolver la categoría existente en lugar de crear nueva
          return {
            categoryId: existingId,
            categoryName: existingName,
            confidence: bestEntry.result.confidence,
            strategy: 'existing_category_similarity',
            reasoning: `Usando categoría existente similar: "${existingName}" en lugar de crear "${bestEntry.result.categoryName}"`,
            isNewCategory: false
          };
        }
      }
      console.log(`❌ No se encontró categoría similar para "${bestEntry.result.categoryName}"`);
    }

    // Actualizar el resultado con la puntuación combinada
    bestEntry.result.confidence = bestEntry.score;
    bestEntry.result.strategy = 'combined';
    
    return bestEntry.result;
  }

  /**
   * Crea una categoría inteligente cuando no se puede clasificar
   */
  private async createIntelligentCategory(productData: ProductData): Promise<ClassificationResult> {
    // 🔍 PRIMERO: Buscar categorías existentes que sean similares
    const existingCategoryMatch = await this.findSimilarExistingCategory(productData);
    if (existingCategoryMatch) {
      return existingCategoryMatch;
    }

    // 🎯 SEGUNDO: Usar categorías predefinidas amplias basadas en el tipo de producto
    const broadCategory = await this.identifyBroadCategory(productData);
    if (broadCategory) {
      return broadCategory;
    }

    // �️ ÚLTIMO RECURSO: Usar categoría "General" para productos que no se pueden clasificar
    console.log(`⚠️ Producto "${productData.name}" no se pudo clasificar - asignando a categoría General`);
    
    return {
      categoryId: 'general',
      categoryName: 'General',
      confidence: 0.3, // Baja confianza para indicar que necesita revisión
      strategy: 'fallback_general',
      reasoning: `Producto sin categoría específica identificada - asignado a categoría General para revisión manual`,
      isNewCategory: !this.existingCategories.has('general')
    };
  }

  /**
   * Busca categorías existentes que sean similares al producto
   */
  private async findSimilarExistingCategory(productData: ProductData): Promise<ClassificationResult | null> {
    console.log(`🔍 Buscando categorías similares para: "${productData.name}"`);
    console.log(`📂 Categorías disponibles: ${Array.from(this.existingCategories.values()).join(', ')}`);
    
    const productText = `${productData.name} ${productData.description || ''}`.toLowerCase();
    
    // 🎯 NUEVO ALGORITMO DE SIMILITUD MEJORADO
    let bestMatch: { categoryId: string; categoryName: string; score: number } | null = null;
    
    for (const [categoryId, categoryName] of this.existingCategories.entries()) {
      console.log(`  🔎 Analizando categoría: "${categoryName}"`);
      
      // 1. Verificar similitud directa de nombres
      const directSimilarity = this.calculateAdvancedSimilarity(productData.name, categoryName);
      console.log(`    📏 Similitud directa: ${directSimilarity.toFixed(3)}`);
      
      if (directSimilarity > 0.8) {
        console.log(`    🎯 ALTA SIMILITUD DIRECTA encontrada`);
        bestMatch = { categoryId, categoryName, score: directSimilarity };
        break; // Salir inmediatamente si hay alta similitud directa
      }
      
      // 2. Buscar palabras clave del producto en el nombre de la categoría
      let keywordScore = 0;
      const productWords = this.normalizeForComparison(productData.name).split(' ');
      const categoryWords = this.normalizeForComparison(categoryName).split(' ');
      
      for (const productWord of productWords) {
        if (productWord.length > 2) {
          for (const categoryWord of categoryWords) {
            if (categoryWord.length > 2) {
              const wordSimilarity = this.calculateAdvancedSimilarity(productWord, categoryWord);
              if (wordSimilarity > 0.8) {
                keywordScore += wordSimilarity;
                console.log(`    � Palabra similar: "${productWord}" ~ "${categoryWord}" (+${wordSimilarity.toFixed(2)})`);
              }
            }
          }
        }
      }
      
      // 3. Buscar en descripción si existe
      let descriptionScore = 0;
      if (productData.description) {
        const descSimilarity = this.calculateAdvancedSimilarity(productData.description, categoryName);
        if (descSimilarity > 0.6) {
          descriptionScore = descSimilarity * 0.5; // Peso menor para descripción
          console.log(`    � Similitud en descripción: +${descriptionScore.toFixed(2)}`);
        }
      }
      
      // 4. Buscar sinónimos
      const synonymScore = this.findSynonymMatch(productText, categoryName.toLowerCase());
      if (synonymScore > 0) {
        console.log(`    🧠 Sinónimos encontrados: +${synonymScore.toFixed(2)}`);
      }
      
      // Calcular score total
      const totalScore = Math.min(directSimilarity + keywordScore + descriptionScore + synonymScore, 1.0);
      console.log(`    📊 Score total para "${categoryName}": ${totalScore.toFixed(3)}`);
      
      // Actualizar mejor coincidencia
      if (totalScore > 0.6 && (!bestMatch || totalScore > bestMatch.score)) {
        bestMatch = { categoryId, categoryName, score: totalScore };
        console.log(`    🏆 Nueva mejor coincidencia: "${categoryName}" (${totalScore.toFixed(3)})`);
      }
    }
    
    if (bestMatch && bestMatch.score > 0.6) {
      console.log(`🎯 CATEGORÍA EXISTENTE ENCONTRADA: "${bestMatch.categoryName}" (similitud: ${bestMatch.score.toFixed(3)})`);
      return {
        categoryId: bestMatch.categoryId,
        categoryName: bestMatch.categoryName,
        confidence: Math.min(bestMatch.score, 0.95),
        strategy: 'existing_category_similarity',
        reasoning: `Encontrada categoría existente similar: "${bestMatch.categoryName}" con ${(bestMatch.score * 100).toFixed(0)}% de similitud`,
        isNewCategory: false
      };
    }

    console.log(`❌ No se encontraron categorías similares (mejor score: ${bestMatch?.score.toFixed(3) || '0.000'})`);
    return null;
  }

  /**
   * Calcula la distancia de Levenshtein entre dos strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Normaliza texto para comparación (elimina tildes, convierte a minúsculas, etc.)
   */
  private normalizeForComparison(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/[^a-z0-9\s]/g, ' ') // Solo letras, números y espacios
      .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
      .trim();
  }

  /**
   * Calcula similitud de cadenas mejorada
   */
  private calculateAdvancedSimilarity(str1: string, str2: string): number {
    const norm1 = this.normalizeForComparison(str1);
    const norm2 = this.normalizeForComparison(str2);
    
    // Si son exactamente iguales después de normalizar
    if (norm1 === norm2) return 1.0;
    
    // Similitud por subcadenas
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      const longer = norm1.length > norm2.length ? norm1 : norm2;
      const shorter = norm1.length > norm2.length ? norm2 : norm1;
      return shorter.length / longer.length;
    }
    
    // Levenshtein normalizado
    const distance = this.calculateLevenshteinDistance(norm1, norm2);
    const maxLen = Math.max(norm1.length, norm2.length);
    return maxLen > 0 ? 1 - (distance / maxLen) : 0;
  }

  /**
   * Detecta si dos categorías son esencialmente la misma
   */
  private areCategoriesSimilar(name1: string, name2: string, threshold: number = 0.85): boolean {
    const similarity = this.calculateAdvancedSimilarity(name1, name2);
    console.log(`    🔍 Similitud entre "${name1}" y "${name2}": ${similarity.toFixed(3)}`);
    
    // Casos especiales comunes en ferretería
    const norm1 = this.normalizeForComparison(name1);
    const norm2 = this.normalizeForComparison(name2);
    
    // Detectar variaciones comunes
    const commonVariations = [
      ['electricidad', 'electrico', 'electrical'],
      ['construccion', 'construcción'],
      ['fontaneria', 'fontanería', 'plomeria'],
      ['jardineria', 'jardinería'],
      ['ferreteria', 'ferretería'],
      ['herramienta', 'herramientas'],
      ['pintura', 'pinturas'],
      ['general', 'generales']
    ];
    
    for (const group of commonVariations) {
      if (group.some(variant => norm1.includes(variant)) && 
          group.some(variant => norm2.includes(variant))) {
        console.log(`    ✅ Variación común detectada: ${group.join(', ')}`);
        return true;
      }
    }
    
    return similarity >= threshold;
  }

  /**
   * Busca coincidencias de sinónimos en la base de conocimiento
   */
  private findSynonymMatch(productText: string, categoryName: string): number {
    const synonyms = {
      'herramientas': ['tools', 'utensilio', 'implemento', 'equipo'],
      'electricidad': ['electrico', 'electrical', 'energia', 'corriente'],
      'plomeria': ['plomería', 'fontaneria', 'hidraulica', 'agua', 'tuberia'],
      'construccion': ['construcción', 'obra', 'albañil', 'cemento', 'material'],
      'pintura': ['paint', 'color', 'acabado', 'recubrimiento'],
      'ferreteria': ['hardware', 'tornillo', 'sujetador', 'fijacion'],
      'seguridad': ['proteccion', 'safety', 'equipo de proteccion'],
      'jardin': ['jardín', 'jardineria', 'plantas', 'exterior']
    };

    let score = 0;
    for (const [category, syns] of Object.entries(synonyms)) {
      if (categoryName.includes(category)) {
        for (const syn of syns) {
          if (productText.includes(syn)) {
            score += 0.3;
          }
        }
      }
    }

    return Math.min(score, 0.6);
  }

  /**
   * Identifica categorías amplias predefinidas para evitar duplicados
   */
  private identifyBroadCategory(productData: ProductData): Promise<ClassificationResult | null> {
    const text = `${productData.name} ${productData.description || ''}`.toLowerCase();
    
    // Categorías amplias predefinidas para ferretería
    const broadCategories = {
      'ferreteria-general': {
        name: 'Ferretería General',
        keywords: ['tornillo', 'clavo', 'tuerca', 'arandela', 'perno', 'remache', 'sujetador'],
        confidence: 0.8
      },
      'herramientas-manuales': {
        name: 'Herramientas Manuales', 
        keywords: ['martillo', 'destornillador', 'alicate', 'llave', 'sierra', 'lima', 'escofina'],
        confidence: 0.8
      },
      'herramientas-electricas': {
        name: 'Herramientas Eléctricas',
        keywords: ['taladro', 'amoladora', 'sierra circular', 'lijadora', 'rotomartillo'],
        confidence: 0.8
      },
      'material-electrico': {
        name: 'Material Eléctrico',
        keywords: ['cable', 'interruptor', 'contacto', 'foco', 'reflector', 'breaker', 'alambre'],
        confidence: 0.8
      },
      'plomeria-hidraulica': {
        name: 'Plomería e Hidráulica',
        keywords: ['tubo', 'codo', 'válvula', 'llave', 'manguera', 'conexión', 'reducción'],
        confidence: 0.8
      },
      'pintura-acabados': {
        name: 'Pintura y Acabados',
        keywords: ['pintura', 'brocha', 'rodillo', 'thinner', 'barniz', 'esmalte', 'lija'],
        confidence: 0.8
      },
      'jardineria': {
        name: 'Jardinería',
        keywords: ['pala', 'rastrillo', 'tijera', 'manguera', 'aspersor', 'fertilizante', 'maceta'],
        confidence: 0.8
      },
      'construccion': {
        name: 'Construcción',
        keywords: ['cemento', 'varilla', 'alambre', 'malla', 'poste', 'ancla', 'concreto'],
        confidence: 0.8
      }
    };

    for (const [categoryId, category] of Object.entries(broadCategories)) {
      for (const keyword of category.keywords) {
        if (text.includes(keyword)) {
          console.log(`🏷️ Categoría amplia identificada: "${category.name}" por palabra "${keyword}"`);
          
          // 🔍 VERIFICAR SI YA EXISTE UNA CATEGORÍA SIMILAR ANTES DE CREAR
          let finalCategoryId = categoryId;
          let finalCategoryName = category.name;
          let isNewCategory = true;
          
          // Buscar categoría similar existente
          for (const [existingId, existingName] of this.existingCategories.entries()) {
            if (this.areCategoriesSimilar(category.name, existingName, 0.8)) {
              console.log(`🔄 Usando categoría existente similar: "${existingName}" en lugar de crear "${category.name}"`);
              finalCategoryId = existingId;
              finalCategoryName = existingName;
              isNewCategory = false;
              break;
            }
          }
          
          return Promise.resolve({
            categoryId: finalCategoryId,
            categoryName: finalCategoryName,
            confidence: category.confidence,
            strategy: isNewCategory ? 'broad_category_identification' : 'existing_category_similarity',
            reasoning: isNewCategory 
              ? `Categoría amplia identificada por palabra clave: "${keyword}"`
              : `Usando categoría existente similar: "${finalCategoryName}" en lugar de crear "${category.name}"`,
            isNewCategory
          });
        }
      }
    }

    return Promise.resolve(null);
  }

  /**
   * Crea categoría en la base de datos si no existe
   */
  async createCategoryIfNotExists(categoryId: string, categoryName: string): Promise<void> {
    try {
      console.log(`🔍 Verificando si existe categoría: ${categoryId} - ${categoryName}`);
      
      // Verificar primero en memoria (cache)
      if (this.existingCategories.has(categoryId)) {
        console.log(`✅ Categoría ${categoryId} ya existe en memoria`);
        return;
      }

      // Verificar en base de datos
      const exists = await pool.query(
        'SELECT id, name FROM categories WHERE id = $1 OR LOWER(name) = LOWER($2)',
        [categoryId, categoryName]
      );

      if (exists.rows.length > 0) {
        const existingCategory = exists.rows[0];
        console.log(`✅ Categoría encontrada en BD: ${existingCategory.id} - ${existingCategory.name}`);
        
        // Actualizar cache con la categoría existente
        this.existingCategories.set(existingCategory.id, existingCategory.name);
        return;
      }

      // Crear nueva categoría solo si no existe
      console.log(`🆕 Intentando crear categoría: ${categoryId} - ${categoryName}`);
      
      const result = await pool.query(`
        INSERT INTO categories (id, name, description, active, created_at, updated_at)
        VALUES ($1, $2, $3, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id, name
      `, [
        categoryId,
        categoryName,
        `Categoría generada automáticamente por el sistema de IA`
      ]);

      if (result.rows.length > 0) {
        console.log(`✅ Categoría creada exitosamente: ${result.rows[0].id} - ${result.rows[0].name}`);
      } else {
        console.log(`ℹ️ Categoría ya existía (conflicto resuelto): ${categoryId}`);
      }

      // Actualizar cache
      this.existingCategories.set(categoryId, categoryName);
      console.log(`🆕 Nueva categoría creada: ${categoryId} - ${categoryName}`);
      
    } catch (error) {
      console.error('❌ Error creando categoría:', {
        categoryId,
        categoryName,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Si hay error de duplicado, intentar actualizar cache
      if (error instanceof Error && error.message.includes('duplicate key')) {
        try {
          const result = await pool.query('SELECT id, name FROM categories WHERE id = $1', [categoryId]);
          if (result.rows.length > 0) {
            this.existingCategories.set(result.rows[0].id, result.rows[0].name);
            console.log(`🔄 Cache actualizado para categoría existente: ${categoryId}`);
          }
        } catch (updateError) {
          console.error('Error actualizando cache:', updateError);
        }
      } else {
        // Re-lanzar el error para que se maneje en el nivel superior
        throw error;
      }
    }
  }

  /**
   * Utilidades privadas
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private getMatchedKeywords(text: string, categoryKey: string): string[] {
    const keywords = KNOWLEDGE_BASE[categoryKey];
    if (!keywords) return [];

    const matched: string[] = [];
    
    [...keywords.primary, ...keywords.secondary].forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    });

    return matched;
  }

  private cleanCategoryId(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private categorizeTitleCase(text: string): string {
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Instancia singleton del clasificador
let classifier: IntelligentCategoryClassifier | null = null;

export async function getClassifier(): Promise<IntelligentCategoryClassifier> {
  if (!classifier) {
    classifier = new IntelligentCategoryClassifier();
    await classifier.initialize();
  }
  return classifier;
}
