'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Package,
  Sparkles
} from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { getBusinessTypeInfo, getCategoryDescription } from '@/lib/business-type-helpers';

interface CategoryImportManagerProps {
  onImportComplete?: () => void;
  onClose?: () => void;
}

interface ImportResult {
  total: number;
  success: number;
  errors: number;
  skipped: number;
  warnings: number;
  details: Array<{
    row: number;
    message?: string;
    error?: string;
    warning?: string;
    data: any;
  }>;
  normalizations: Array<{
    field: 'name' | 'description';
    original: string;
    normalized: string;
    corrections: string[];
    confidence: number;
  }>;
  duplicatesHandled: Array<{
    categoryName: string;
    action: 'skipped' | 'merged';
    reason: string;
  }>;
}

export default function CategoryImportManager({ onImportComplete, onClose }: CategoryImportManagerProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useDefault, setUseDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Obtener información de la empresa
  const { company, loading: companyLoading } = useCompany();
  const hasCompany = company && company.id && company.businessType;
  const businessInfo = hasCompany ? getBusinessTypeInfo(company.businessType) : null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUseDefault(false);
    clearResults();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearResults = () => {
    setImportResult(null);
    setError(null);
  };

  const downloadSampleCSV = () => {
    window.open('/categorias-simple.csv', '_blank');
  };

  const handleUseDefault = () => {
    setUseDefault(true);
    setSelectedFile(null);
    clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!useDefault && !selectedFile) return;
    
    setIsImporting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (useDefault) {
        formData.append('useDefault', 'true');
      } else if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/categories/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la importación');
      }

      setImportResult(data.results);
      
      // Llamar callback cuando la importación sea exitosa
      if (onImportComplete && data.results.success > 0) {
        onImportComplete();
      }

    } catch (err: any) {
      setError(err.message || 'Error desconocido durante la importación');
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setUseDefault(false);
    clearResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Categorías
          </h1>
          <p className="text-gray-600 mt-1">
            Importa categorías desde archivo CSV o usa las predeterminadas del sistema
          </p>
        </div>
        <Button
          onClick={downloadSampleCSV}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar Ejemplo CSV
        </Button>
      </div>

      {/* Información del formato */}
      <Alert>
        <Info className="h-4 w-4" />
        <div>
          <h4 className="font-medium">Formato del archivo CSV</h4>
          <p className="text-sm text-gray-600 mt-1">
            El archivo debe contener la columna: <strong>name</strong> (obligatorio). 
            Las columnas <strong>id</strong>, <strong>description</strong> y <strong>active</strong> son opcionales.
            Si no se proporciona ID, se generará automáticamente. El sistema normalizará automáticamente 
            el texto para corregir caracteres especiales, espacios y errores ortográficos comunes.
          </p>
        </div>
      </Alert>

      {/* Alerta si no hay empresa configurada */}
      {!hasCompany && !companyLoading && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-800">Empresa no configurada</h4>
            <p className="text-sm text-amber-700 mt-1">
              Para acceder a las categorías predeterminadas específicas para tu tipo de negocio, 
              primero configura tu empresa en la sección de <strong>Configuración de Empresa</strong>.
            </p>
          </div>
        </Alert>
      )}

      {/* Opciones de importación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opción 1: Categorías predeterminadas */}
        <Card className={`cursor-pointer transition-all ${useDefault ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {businessInfo ? `${businessInfo.emoji} ` : ''}Categorías Predeterminadas
            </CardTitle>
            <CardDescription>
              {getCategoryDescription(company?.businessType || 'GENERAL', !!hasCompany)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleUseDefault}
              variant={useDefault ? "default" : "outline"}
              className="w-full flex items-center gap-2"
              disabled={!hasCompany || companyLoading}
            >
              <Sparkles className="h-4 w-4" />
              {useDefault ? 'Seleccionado' : 'Usar Categorías del Sistema'}
            </Button>
            {!hasCompany && !companyLoading && (
              <div className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Configura tu empresa primero para acceder a categorías específicas
              </div>
            )}
            {hasCompany && useDefault && (
              <div className="mt-3 text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {businessInfo?.categoryCount} categorías de {businessInfo?.name.toLowerCase()} listas para importar
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opción 2: Archivo personalizado */}
        <Card className={`cursor-pointer transition-all ${selectedFile ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Archivo Personalizado
            </CardTitle>
            <CardDescription>
              Sube tu propio archivo CSV con categorías personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`
                border-2 border-dashed rounded-lg p-4 text-center transition-colors
                ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                ${selectedFile ? 'border-green-500 bg-green-50' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <FileSpreadsheet className="h-6 w-6" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Arrastra tu archivo CSV aquí o haz clic para seleccionar
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between">
        <Button
          onClick={resetImport}
          variant="outline"
          disabled={isImporting || (!selectedFile && !useDefault)}
        >
          Limpiar Selección
        </Button>
        
        <div className="flex gap-3">
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleImport}
            disabled={isImporting || (!selectedFile && !useDefault) || (!hasCompany && useDefault)}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importar Categorías
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress bar durante importación */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando categorías...</span>
              </div>
              <Progress value={undefined} className="animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mostrar errores */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <div>
            <h4 className="font-medium text-red-800">Error en la importación</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </Alert>
      )}

      {/* Resultados de la importación */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultados de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                <div className="text-sm text-gray-600">Total procesadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-gray-600">Exitosas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-sm text-gray-600">Errores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div className="text-sm text-gray-600">Omitidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.normalizations?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Normalizadas</div>
              </div>
            </div>

            {/* Detalles de normalizaciones */}
            {importResult.normalizations && importResult.normalizations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-blue-800 mb-2">Texto normalizado automáticamente:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {importResult.normalizations.map((norm, index) => (
                    <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <strong>{norm.field === 'name' ? 'Nombre' : 'Descripción'}:</strong> "{norm.original}" → "{norm.normalized}"
                      <br />
                      <span className="text-blue-600">Correcciones: {norm.corrections.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles de duplicados */}
            {importResult.duplicatesHandled && importResult.duplicatesHandled.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-yellow-800 mb-2">Duplicados manejados:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {importResult.duplicatesHandled.map((dup, index) => (
                    <div key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <strong>"{dup.categoryName}"</strong> - {dup.action === 'skipped' ? 'Omitida' : 'Fusionada'}
                      <br />
                      <span className="text-yellow-600">{dup.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles de errores */}
            {importResult.details.filter(d => d.error).length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-800 mb-2">Errores encontrados:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {importResult.details
                    .filter(detail => detail.error)
                    .map((detail, index) => (
                      <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-400">
                        <strong>Fila {detail.row}:</strong> {detail.error}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Mensaje de éxito */}
            {importResult.success > 0 && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-800">¡Importación exitosa!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Se importaron {importResult.success} categorías correctamente.
                  </p>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}