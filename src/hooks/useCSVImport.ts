/**
 * Hook personalizado para manejar la importación masiva de productos via CSV
 * Sistema completamente independiente del módulo de productos existente
 */

import { useState } from 'react';

interface ImportError {
  row: number;
  data: any;
  error: string;
}

interface ImportResult {
  success: boolean;
  processedRows: number;
  successfulImports: number;
  errors: ImportError[];
  summary: {
    totalRows: number;
    processed: number;
    successful: number;
    failed: number;
  };
  intelligentInsights?: {
    categoriesCreated: Array<{
      id: string;
      name: string;
      reason: string;
    }>;
    autoClassified: Array<{
      productName: string;
      category: string;
      confidence: number;
      strategy: string;
    }>;
    needsReview: Array<{
      productName: string;
      category: string;
      confidence: number;
      reason: string;
    }>;
    textNormalizations: Array<{
      field: 'name' | 'description';
      original: string;
      normalized: string;
      corrections: string[];
      confidence: number;
    }>;
    duplicatesHandled: Array<{
      productName: string;
      action: 'updated' | 'skipped';
      reason: string;
      stockAdded?: number;
    }>;
  };
}

interface UseCSVImportState {
  isImporting: boolean;
  importResult: ImportResult | null;
  error: string | null;
}

export function useCSVImport() {
  const [state, setState] = useState<UseCSVImportState>({
    isImporting: false,
    importResult: null,
    error: null
  });

  const importProducts = async (file: File): Promise<ImportResult | null> => {
    setState(prev => ({
      ...prev,
      isImporting: true,
      error: null,
      importResult: null
    }));

    try {
      // Validaciones del archivo
      if (!file.name.endsWith('.csv')) {
        throw new Error('Solo se permiten archivos CSV');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB máximo
        throw new Error('El archivo es demasiado grande (máximo 10MB)');
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);

      // Enviar a la API
      const response = await fetch('/api/products/import-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la importación');
      }

      setState(prev => ({
        ...prev,
        isImporting: false,
        importResult: data
      }));

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      setState(prev => ({
        ...prev,
        isImporting: false,
        error: errorMessage
      }));

      return null;
    }
  };

  const clearResults = () => {
    setState({
      isImporting: false,
      importResult: null,
      error: null
    });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'name,description,cost,price,stock,minStock,categoryId,barcode,profitMargin,useAutomaticPricing,active',
      // Productos con categorías existentes
      'Tornillo Phillips 1/4",Tornillo Phillips acero inoxidable,0.50,,100,10,tornilleria,,25,true,true',
      'Martillo 16oz,Martillo con mango de fibra de vidrio,25.00,,50,5,herramientas,,30,true,true',
      // Productos con categorías nuevas que se crearán automáticamente
      'Cable THW 12 AWG,Cable eléctrico THW calibre 12 para instalaciones residenciales,2.50,,200,20,electrico-residencial,,40,true,true',
      'Pintura Vinílica Blanca 4L,Pintura vinílica lavable color blanco,45.00,,30,5,pinturas-decorativas,,35,true,true',
      // Productos sin categoría definida - sistema inteligente los clasificará
      'Tubo PVC 4 pulgadas,Tubo de PVC sanitario de 4 pulgadas para drenaje,12.50,,75,10,,,45,true,true',
      'Destornillador Phillips #2,Destornillador con mango ergonómico,8.50,,100,15,,,50,true,true',
      'Cemento Portland 50kg,Cemento Portland tipo I para construcción general,85.00,,25,5,,,25,true,true',
      // Productos con códigos de barras específicos
      'Foco LED 9W,Foco LED de 9 watts luz cálida,35.00,42.50,150,25,,7501234567890,20,false,true'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'productos_ejemplo.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    ...state,
    importProducts,
    clearResults,
    downloadSampleCSV
  };
}
