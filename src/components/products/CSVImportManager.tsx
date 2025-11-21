/**
 * Componente para importación masiva de productos via CSV
 * Sistema completamente independiente del módulo de productos existente
 */

'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCSVImport } from '@/hooks/useCSVImport';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Brain,
  Sparkles,
  Eye,
  Plus
} from 'lucide-react';

interface CSVImportManagerProps {
  onImportComplete?: () => void;
  onClose?: () => void;
}

export default function CSVImportManager({ onImportComplete, onClose }: CSVImportManagerProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isImporting,
    importResult,
    error,
    importProducts,
    clearResults,
    downloadSampleCSV
  } = useCSVImport();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
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

  const handleImport = async () => {
    if (!selectedFile) return;
    
    await importProducts(selectedFile);
    
    // Llamar callback cuando la importación sea exitosa
    if (onImportComplete) {
      onImportComplete();
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
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
            Importación Masiva de Productos
          </h1>
          <p className="text-gray-600 mt-1">
            Carga múltiples productos desde un archivo CSV
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
            El archivo debe contener las columnas: name, description, cost, price, stock, minStock, 
            categoryId, barcode, profitMargin, useAutomaticPricing, active. Si no se proporciona 
            código de barras, se generará automáticamente.
          </p>
        </div>
      </Alert>

      {/* Área de carga */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivo CSV</CardTitle>
          <CardDescription>
            Arrastra y suelta tu archivo CSV o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${selectedFile ? 'border-green-500 bg-green-50' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <FileSpreadsheet className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <p className="font-medium text-green-800">{selectedFile.name}</p>
                  <p className="text-sm text-green-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isImporting ? 'Importando...' : 'Importar Productos'}
                  </Button>
                  <Button
                    onClick={resetImport}
                    variant="outline"
                    disabled={isImporting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Selecciona un archivo CSV
                  </p>
                  <p className="text-gray-500">
                    o arrastra y suelta aquí
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Seleccionar Archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progreso de importación */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importando productos...</span>
                <span className="text-sm text-gray-500">Procesando archivo</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error en la importación</h4>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </Alert>
      )}

      {/* Resultados */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Resultados de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.summary.totalRows}
                </div>
                <div className="text-sm text-blue-700">Total filas</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {importResult.summary.processed}
                </div>
                <div className="text-sm text-gray-700">Procesadas</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.summary.successful}
                </div>
                <div className="text-sm text-green-700">Exitosas</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.summary.failed}
                </div>
                <div className="text-sm text-red-700">Fallidas</div>
              </div>
            </div>

            {/* Progreso visual */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso de importación</span>
                <span>{importResult.summary.successful}/{importResult.summary.totalRows}</span>
              </div>
              <Progress 
                value={(importResult.summary.successful / importResult.summary.totalRows) * 100} 
                className="w-full"
              />
            </div>

            {/* Errores detallados */}
            {importResult.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-red-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Errores encontrados ({importResult.errors.length})
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="destructive">Fila {error.row}</Badge>
                            <span className="text-sm font-medium text-red-800">
                              {error.data.name || 'Sin nombre'}
                            </span>
                          </div>
                          <p className="text-sm text-red-700">{error.error}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje de éxito */}
            {importResult.success && importResult.summary.successful > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <div>
                  <h4 className="font-medium">Importación completada exitosamente</h4>
                  <p className="text-sm mt-1">
                    Se importaron {importResult.summary.successful} productos correctamente.
                    {importResult.summary.failed > 0 && ` ${importResult.summary.failed} productos tuvieron errores.`}
                  </p>
                </div>
              </Alert>
            )}

            {/* 🧠 INSIGHTS INTELIGENTES */}
            {importResult.intelligentInsights && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Insights del Sistema Inteligente
                </h4>

                {/* Categorías Creadas Automáticamente */}
                {importResult.intelligentInsights.categoriesCreated.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-600" />
                        Categorías Creadas Automáticamente ({importResult.intelligentInsights.categoriesCreated.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {importResult.intelligentInsights.categoriesCreated.map((category, index) => (
                          <div key={index} className="flex items-start justify-between p-2 bg-white rounded border border-green-200">
                            <div>
                              <div className="font-medium text-green-800">{category.name}</div>
                              <div className="text-xs text-green-600">ID: {category.id}</div>
                              <div className="text-xs text-gray-600 mt-1">{category.reason}</div>
                            </div>
                            <Badge variant="outline" className="text-green-700 border-green-300">Nueva</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Productos Auto-Clasificados */}
                {importResult.intelligentInsights.autoClassified.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        Productos Clasificados Automáticamente ({importResult.intelligentInsights.autoClassified.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importResult.intelligentInsights.autoClassified.map((item, index) => (
                          <div key={index} className="flex items-start justify-between p-2 bg-white rounded border border-blue-200">
                            <div className="flex-1">
                              <div className="font-medium text-blue-800 text-sm">{item.productName}</div>
                              <div className="text-xs text-blue-600">Categoría: {item.category}</div>
                              <div className="text-xs text-gray-600">Estrategia: {item.strategy}</div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-blue-700 border-blue-300">
                                {(item.confidence * 100).toFixed(0)}% confianza
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Productos que Necesitan Revisión */}
                {importResult.intelligentInsights.needsReview.length > 0 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4 text-yellow-600" />
                        Productos que Necesitan Revisión ({importResult.intelligentInsights.needsReview.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Productos con baja confianza en la clasificación automática
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importResult.intelligentInsights.needsReview.map((item, index) => (
                          <div key={index} className="flex items-start justify-between p-2 bg-white rounded border border-yellow-200">
                            <div className="flex-1">
                              <div className="font-medium text-yellow-800 text-sm">{item.productName}</div>
                              <div className="text-xs text-yellow-600">Categoría asignada: {item.category}</div>
                              <div className="text-xs text-gray-600">{item.reason}</div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                {(item.confidence * 100).toFixed(0)}% confianza
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Normalizaciones de Texto */}
                {importResult.intelligentInsights.textNormalizations?.length > 0 && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        Correcciones de Texto Aplicadas ({importResult.intelligentInsights.textNormalizations.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Texto corregido automáticamente durante la importación
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importResult.intelligentInsights.textNormalizations.map((normalization, index) => (
                          <div key={index} className="p-2 bg-white rounded border border-purple-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs">
                                {normalization.field === 'name' ? 'Nombre' : 'Descripción'}
                              </Badge>
                              <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs">
                                {(normalization.confidence * 100).toFixed(0)}% confianza
                              </Badge>
                            </div>
                            <div className="text-xs">
                              <div className="text-gray-600 mb-1">
                                <span className="font-medium">Original:</span> "{normalization.original}"
                              </div>
                              <div className="text-purple-800 mb-2">
                                <span className="font-medium">Corregido:</span> "{normalization.normalized}"
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {normalization.corrections.map((correction, corrIndex) => (
                                  <Badge key={corrIndex} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                    {correction}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Productos Duplicados Manejados */}
                {importResult.intelligentInsights.duplicatesHandled?.length > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Productos Duplicados Manejados ({importResult.intelligentInsights.duplicatesHandled.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Productos que ya existían y fueron actualizados en lugar de duplicarse
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {importResult.intelligentInsights.duplicatesHandled.map((duplicate, index) => (
                          <div key={index} className="p-2 bg-white rounded border border-orange-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                                {duplicate.action === 'updated' ? 'Stock Actualizado' : 'Omitido'}
                              </Badge>
                              {duplicate.stockAdded && (
                                <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
                                  +{duplicate.stockAdded} unidades
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs">
                              <div className="text-orange-800 mb-1">
                                <span className="font-medium">Producto:</span> "{duplicate.productName}"
                              </div>
                              <div className="text-gray-600">
                                <span className="font-medium">Razón:</span> {duplicate.reason}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Estadísticas de IA */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {importResult.intelligentInsights.categoriesCreated.length}
                        </div>
                        <div className="text-xs text-purple-700">Categorías Creadas</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {importResult.intelligentInsights.autoClassified.length}
                        </div>
                        <div className="text-xs text-purple-700">Auto-Clasificados</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {importResult.intelligentInsights.needsReview.length}
                        </div>
                        <div className="text-xs text-purple-700">Necesitan Revisión</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">
                          {importResult.intelligentInsights.duplicatesHandled?.length || 0}
                        </div>
                        <div className="text-xs text-orange-700">Duplicados Manejados</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {importResult.intelligentInsights.textNormalizations?.length || 0}
                        </div>
                        <div className="text-xs text-purple-700">Texto Corregido</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {importResult.intelligentInsights.autoClassified.length > 0 
                            ? Math.round(
                                importResult.intelligentInsights.autoClassified.reduce((acc, item) => acc + item.confidence, 0) / 
                                importResult.intelligentInsights.autoClassified.length * 100
                              )
                            : 0}%
                        </div>
                        <div className="text-xs text-purple-700">Confianza Promedio</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Botón para nueva importación */}
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={resetImport} variant="outline">
                Realizar nueva importación
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="default">
                  Cerrar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
