'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  PhotoIcon, 
  CloudArrowUpIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface BulkImageUploadResult {
  success: boolean;
  productId: string;
  productName: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface BulkImageManagerProps {
  onUploadComplete?: (results: BulkImageUploadResult[]) => void;
  onClose?: () => void;
}

export default function BulkImageManager({ onUploadComplete, onClose }: BulkImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [matchBy, setMatchBy] = useState<'name' | 'barcode'>('name');
  const [results, setResults] = useState<BulkImageUploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Configurar dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
    setResults([]);
    setShowResults(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  });

  // Procesar upload masivo
  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Selecciona al menos una imagen');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('matchBy', matchBy);
      
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      const response = await fetch('/api/products/images/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en upload masivo');
      }

      const result = await response.json();
      setResults(result.data.results);
      setShowResults(true);
      
      // Notificar al componente padre
      onUploadComplete?.(result.data.results);

    } catch (error) {
      console.error('Error in bulk upload:', error);
      alert(error instanceof Error ? error.message : 'Error en upload masivo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedFiles([]);
    setResults([]);
    setShowResults(false);
  };

  // Estadísticas de resultados
  const getResultStats = () => {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    return { successful, failed, total: results.length };
  };

  const stats = getResultStats();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Upload Masivo de Imágenes</h3>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>

          {/* Configuración de matching */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Hacer coincidencia por:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="name"
                  checked={matchBy === 'name'}
                  onChange={(e) => setMatchBy(e.target.value as 'name' | 'barcode')}
                  className="mr-2"
                  disabled={uploading}
                />
                Nombre del producto
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="barcode"
                  checked={matchBy === 'barcode'}
                  onChange={(e) => setMatchBy(e.target.value as 'name' | 'barcode')}
                  className="mr-2"
                  disabled={uploading}
                />
                Código de barras
              </label>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  {matchBy === 'name' ? (
                    <div>
                      <strong>Matching por nombre:</strong> El nombre del archivo debe contener 
                      (o estar contenido en) el nombre del producto.
                      <br />
                      <em>Ejemplo:</em> "martillo-truper.jpg" → "Martillo Truper 16oz"
                    </div>
                  ) : (
                    <div>
                      <strong>Matching por código de barras:</strong> El nombre del archivo debe 
                      contener el código de barras del producto.
                      <br />
                      <em>Ejemplo:</em> "7501234567890-producto.jpg" → producto con barcode "7501234567890"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dropzone */}
          {!showResults && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} disabled={uploading} />
              
              <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              
              <div className="space-y-2">
                <p className="text-xl font-medium text-gray-900">
                  {isDragActive ? 'Suelta las imágenes aquí' : 'Arrastra múltiples imágenes aquí'}
                </p>
                <p className="text-sm text-gray-600">
                  o haz clic para seleccionar archivos
                </p>
                <p className="text-xs text-gray-500">
                  Máximo 10MB por imagen • JPG, PNG, WebP • Múltiples archivos permitidos
                </p>
              </div>
            </div>
          )}

          {/* Lista de archivos seleccionados */}
          {selectedFiles.length > 0 && !showResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Archivos seleccionados ({selectedFiles.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={uploading}
                >
                  Limpiar
                </Button>
              </div>
              
              <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                Procesando imágenes... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Botones de acción */}
          {selectedFiles.length > 0 && !showResults && (
            <div className="flex gap-3">
              <Button
                onClick={handleBulkUpload}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2 animate-pulse" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Subir {selectedFiles.length} imagen{selectedFiles.length !== 1 ? 'es' : ''}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearSelection}
                disabled={uploading}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Resultados */}
      {showResults && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Resultados del Upload</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResults(false);
                  clearSelection();
                }}
              >
                Nuevo Upload
              </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                <div className="text-sm text-green-700">Exitosas</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-red-700">Fallidas</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            {/* Lista de resultados */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium text-sm">
                        {result.productName}
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={result.success ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {result.success ? 'OK' : 'Error'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
