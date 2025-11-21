'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  PhotoIcon, 
  CloudArrowUpIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ImageUploadComponentProps {
  productId?: string; // Ahora es opcional
  productName?: string;
  currentImageUrl?: string;
  onImageUploaded?: (imageUrl: string, thumbnailUrl?: string, tempImageData?: TempImageData) => void;
  onUploadError?: (error: string) => void;
  onTempImageChange?: (tempImageData: TempImageData | null) => void; // Nuevo: para manejar imágenes temporales
  maxFileSize?: number; // en MB
  allowedTypes?: string[];
  allowTempUpload?: boolean; // Nuevo: permitir uploads temporales
}

export interface TempImageData {
  file: File;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ImageUploadRef {
  uploadTempImageToServer: (productId: string) => Promise<{ imageUrl: string; thumbnailUrl?: string } | null>;
}

const ImageUploadComponent = React.forwardRef<ImageUploadRef, ImageUploadComponentProps>((
  {
    productId,
    productName,
    currentImageUrl,
    onImageUploaded,
    onUploadError,
    onTempImageChange,
    maxFileSize = 10,
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowTempUpload = true
  },
  ref
) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const [tempImageData, setTempImageData] = useState<TempImageData | null>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar archivo
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de archivo no válido. Solo se permiten: ${allowedTypes.join(', ')}`
      };
    }

    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo ${maxFileSize}MB`
      };
    }

    return { valid: true };
  };

  // Manejar upload de archivo (temporal o permanente)
  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      onUploadError?.(validation.error || 'Archivo inválido');
      return;
    }

    // Crear preview local inmediatamente
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    // Si no hay productId, manejar como imagen temporal
    if (!productId && allowTempUpload) {
      console.log('💾 Guardando imagen temporalmente (sin productId)');
      
      const tempData: TempImageData = {
        file,
        previewUrl: localPreviewUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };
      
      setTempImageData(tempData);
      setIsTemporary(true);
      
      // Notificar al componente padre
      onTempImageChange?.(tempData);
      onImageUploaded?.(localPreviewUrl, undefined, tempData);
      
      console.log('✅ Imagen temporal guardada:', tempData);
      return;
    }

    // Si hay productId, subir directamente al servidor
    if (!productId) {
      onUploadError?.('ID de producto es requerido para upload permanente');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setIsTemporary(false);

      console.log('📤 Iniciando upload permanente para producto:', productId);

      // Preparar FormData
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('image', file);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Realizar upload
      const response = await fetch('/api/products/images/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir imagen');
      }

      const result = await response.json();
      
      console.log('✅ Upload permanente exitoso:', result.data);
      
      // Limpiar preview temporal
      URL.revokeObjectURL(localPreviewUrl);
      
      // Actualizar con imagen real del servidor
      setPreviewUrl(result.data.imageUrl);
      setTempImageData(null);
      
      // Notificar éxito al componente padre
      onImageUploaded?.(result.data.imageUrl, result.data.thumbnailUrl);
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen';
      onUploadError?.(errorMessage);
      
      // Limpiar preview en caso de error y restaurar imagen anterior
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(currentImageUrl || null);
      setTempImageData(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Configurar dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !uploading) {
      handleFileUpload(acceptedFiles[0]);
    }
  }, [productId, uploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': allowedTypes.map(type => `.${type.split('/')[1]}`)
    },
    maxFiles: 1,
    maxSize: maxFileSize * 1024 * 1024,
    disabled: uploading || !!previewUrl // Deshabilitar si ya hay imagen
  });

  // Manejar click en el botón de archivo
  const handleFileButtonClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  // Manejar selección de archivo manual
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !uploading) {
      handleFileUpload(file);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo otra vez
    event.target.value = '';
  };

  // Eliminar imagen actual
  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setTempImageData(null);
    setIsTemporary(false);
    
    // Notificar al componente padre
    onTempImageChange?.(null);
    
    // Aquí podrías agregar lógica para eliminar la imagen del servidor si es permanente
  };

  // Función pública para subir imagen temporal al servidor
  const uploadTempImageToServer = async (productId: string): Promise<{ imageUrl: string; thumbnailUrl?: string } | null> => {
    if (!tempImageData || !isTemporary) {
      console.log('😅 No hay imagen temporal para subir');
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      console.log('📤 Subiendo imagen temporal al servidor para producto:', productId);

      // Preparar FormData
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('image', tempImageData.file);

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Realizar upload
      const response = await fetch('/api/products/images/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir imagen temporal');
      }

      const result = await response.json();
      
      console.log('✅ Imagen temporal subida exitosamente:', result.data);
      
      // Limpiar datos temporales
      if (tempImageData.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(tempImageData.previewUrl);
      }
      
      // Actualizar estado
      setPreviewUrl(result.data.imageUrl);
      setTempImageData(null);
      setIsTemporary(false);
      
      return result.data;
      
    } catch (error) {
      console.error('❌ Error uploading temp image:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Exponer la función al componente padre
  React.useImperativeHandle(ref, () => ({
    uploadTempImageToServer
  }), [uploadTempImageToServer]);

  // Limpiar preview cuando se actualiza currentImageUrl
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Imagen del Producto</h3>
          {previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          )}
        </div>

        {/* Preview de imagen actual */}
        {previewUrl && (
          <div className="relative">
            <div className="w-full h-48 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              <img
                src={previewUrl}
                alt={productName || 'Producto'}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            
            {/* Indicador de estado temporal */}
            {isTemporary && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Temporal
                </span>
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <CloudArrowUpIcon className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">{isTemporary ? 'Guardando imagen temporal...' : 'Subiendo...'}</p>
                </div>
              </div>
            )}
            
            {/* Botón para cambiar imagen */}
            {!uploading && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileButtonClick}
                  className="flex-1"
                >
                  <PhotoIcon className="h-4 w-4 mr-2" />
                  Cambiar Imagen
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Progress bar durante upload */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">
              Subiendo imagen... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Dropzone para upload - Solo mostrar si NO hay imagen */}
        {!previewUrl && !uploading && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            
            <PhotoIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}
              </p>
              <p className="text-sm text-gray-600">
                o{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFileButtonClick();
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  selecciona un archivo
                </button>
              </p>
              <p className="text-xs text-gray-500">
                Máximo {maxFileSize}MB • JPG, PNG, WebP
              </p>
            </div>
          </div>
        )}

        {/* Input file oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {/* Información del producto */}
        {productName && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Producto:</strong> {productName}
          </div>
        )}
      </div>
    </Card>
  );
});

// Asignar displayName para debugging
ImageUploadComponent.displayName = 'ImageUploadComponent';

export default ImageUploadComponent;
