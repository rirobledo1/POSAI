/**
 * Utilidad mejorada para parsear CSV con manejo correcto de comillas
 */

export class CSVParser {
  /**
   * Parsea una línea CSV con manejo correcto de comillas
   */
  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Comillas escapadas ("") dentro de un campo quoted
          current += '"';
          i += 2; // Saltar ambas comillas
          continue;
        } else if (inQuotes) {
          // Final de campo quoted
          inQuotes = false;
        } else {
          // Inicio de campo quoted
          inQuotes = true;
        }
      } else if (char === ',' && !inQuotes) {
        // Separador de campo fuera de comillas
        result.push(current.trim());
        current = '';
      } else {
        // Carácter normal
        current += char;
      }
      
      i++;
    }
    
    // Agregar el último campo
    result.push(current.trim());
    
    return result;
  }
  
  /**
   * Limpia un valor CSV removiendo comillas externas y normalizando comillas internas
   */
  static cleanCSVValue(value: string): string {
    // Remover comillas externas si las hay
    let cleaned = value.trim();
    
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Normalizar comillas dobles escapadas
    cleaned = cleaned.replace(/""/g, '"');
    
    return cleaned;
  }
  
  /**
   * Parsea todo el contenido CSV
   */
  static parseCSV(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('El archivo CSV está vacío');
    }
    
    // Parsear headers
    const headers = this.parseCSVLine(lines[0]).map(h => this.cleanCSVValue(h));
    
    // Parsear filas de datos
    const rows: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const parsedRow = this.parseCSVLine(lines[i]).map(v => this.cleanCSVValue(v));
      rows.push(parsedRow);
    }
    
    return { headers, rows };
  }
}
