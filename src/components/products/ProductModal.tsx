'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Product, Category, UnitOfMeasure } from '@/types/pos';
import { UNIT_OF_MEASURE_INFO, UNIT_CATEGORIES, getUnitsByCategory } from '@/lib/units';
import ImageUploadComponent, { ImageUploadRef, TempImageData } from './ImageUploadComponent';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface ProductModalProps {
  product?: Product | null;
  categories: Category[];
  onSave: () => void;
  onClose: () => void;
  isQuickEdit?: boolean; // Nueva prop para indicar si es edición rápida desde POS
  onImageUploaded?: () => void; // Nueva prop para refrescar después de subir imagen
}

export default function ProductModal({ product, categories, onSave, onClose, isQuickEdit = false, onImageUploaded }: ProductModalProps) {
  const { data: session } = useSession();
  const { showSuccess, showError } = useNotifications();
  const imageUploadRef = useRef<ImageUploadRef>(null);
  const [loading, setLoading] = useState(false);
  const [tempImageData, setTempImageData] = useState<TempImageData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '5', // Vuelve a camelCase
    categoryId: '', // Vuelve a camelCase
    profitMargin: '', // Porcentaje de ganancia
    useAutomaticPricing: false, // Switch para usar cálculo automático
    unitOfMeasure: UnitOfMeasure.PIECE, // Nueva: Unidad de medida por defecto
    unitQuantity: '1', // Nueva: Cantidad por unidad
    isBulkSale: false, // Nueva: Venta a granel
    active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [taxPercentage, setTaxPercentage] = useState(16); // IVA por defecto 16%

  // Cargar configuración de la empresa
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/settings/company');
        if (response.ok) {
          const data = await response.json();
          setTaxPercentage(data.taxPercentage || 16);
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };
    fetchCompanySettings();
  }, []);

  // Calcular precio automáticamente cuando cambian costo o margen
  useEffect(() => {
    if (formData.useAutomaticPricing && formData.cost && formData.profitMargin) {
      const cost = parseFloat(formData.cost);
      const margin = parseFloat(formData.profitMargin);
      
      if (!isNaN(cost) && !isNaN(margin) && cost > 0 && margin >= 0) {
        // Precio = (Costo * (1 + Margen/100)) * (1 + IVA/100)
        const taxRate = taxPercentage / 100;
        const basePrice = cost * (1 + margin / 100);
        const finalPrice = basePrice * (1 + taxRate);
        
        setFormData(prev => ({
          ...prev,
          price: finalPrice.toFixed(2)
        }));
      }
    }
  }, [formData.cost, formData.profitMargin, formData.useAutomaticPricing, taxPercentage]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        barcode: product.barcode || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        stock: product.stock?.toString() || '',
        minStock: product.minStock?.toString() || '5', // CamelCase con fallback
        categoryId: product.categoryId || '', // CamelCase
        profitMargin: product.profitMargin?.toString() || '',
        useAutomaticPricing: product.useAutomaticPricing || false,
        unitOfMeasure: product.unitOfMeasure || UnitOfMeasure.PIECE,
        unitQuantity: product.unitQuantity?.toString() || '1',
        isBulkSale: product.isBulkSale || false,
        active: product.active !== undefined ? product.active : true
      });
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        barcode: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '5',
        categoryId: '',
        profitMargin: '',
        useAutomaticPricing: false,
        unitOfMeasure: UnitOfMeasure.PIECE,
        unitQuantity: '1',
        isBulkSale: false,
        active: true
      });
    }
  }, [product]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    console.log('🔍 Validando formulario con datos:', formData);

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      console.log('❌ Error: Nombre vacío');
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'La categoría es requerida';
      console.log('❌ Error: Categoría no seleccionada');
    }

    // Validación condicional según el tipo de pricing
    if (formData.useAutomaticPricing) {
      console.log('🤖 Validando pricing automático...');
      // Para pricing automático: costo y margen son requeridos
      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        newErrors.cost = 'El costo es requerido y debe ser mayor a 0 para pricing automático';
        console.log('❌ Error: Costo inválido para pricing automático');
      }
      
      if (!formData.profitMargin || parseFloat(formData.profitMargin) < 0) {
        newErrors.profitMargin = 'El margen de ganancia es requerido y no puede ser negativo';
        console.log('❌ Error: Margen de ganancia inválido');
      }
    } else {
      console.log('✋ Validando pricing manual...');
      // Para pricing manual: precio es requerido
      if (!formData.price || parseFloat(formData.price) <= 0) {
        newErrors.price = 'El precio es requerido y debe ser mayor a 0';
        console.log('❌ Error: Precio inválido para pricing manual');
      }
    }

    if (formData.stock && parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
      console.log('❌ Error: Stock negativo');
    }

    if (formData.minStock && parseInt(formData.minStock) < 0) {
      newErrors.minStock = 'El stock mínimo no puede ser negativo';
      console.log('❌ Error: Stock mínimo negativo');
    }

    if (formData.cost && parseFloat(formData.cost) < 0) {
      newErrors.cost = 'El costo no puede ser negativo';
      console.log('❌ Error: Costo negativo');
    }

    // Validaciones para unidades de medida
    if (!formData.unitQuantity || parseFloat(formData.unitQuantity) <= 0) {
      newErrors.unitQuantity = 'La cantidad por unidad debe ser mayor a 0';
      console.log('❌ Error: Cantidad por unidad inválida');
    }

    console.log('📋 Errores encontrados:', newErrors);
    console.log('✅ Validación exitosa:', Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Iniciando submit del formulario...');
    console.log('📄 Datos del formulario:', formData);
    console.log('📄 Producto actual:', product);
    
    if (!validateForm()) {
      console.log('❌ Validación fallida');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Enviando petición...');

      // Determinar qué endpoint usar basado en isQuickEdit
      let url: string;
      let method: string;
      let requestBody: any;

      if (isQuickEdit) {
        // Usar el endpoint de edición rápida para POS
        // Map ALMACEN role to ADMIN for quick-edit API compatibility
        const userRole = session?.user?.role === 'ALMACEN' ? 'ADMIN' : (session?.user?.role || 'VENDEDOR');
        
        url = '/api/products/quick-edit';
        method = 'POST';
        requestBody = {
          id: product?.id,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          barcode: formData.barcode.trim() || '',
          price: parseFloat(formData.price),
          unitCost: formData.cost ? parseFloat(formData.cost) : undefined,
          stock: parseInt(formData.stock) || 0,
          minStock: parseInt(formData.minStock) || 5,
          category: formData.categoryId,
          unitOfMeasure: formData.unitOfMeasure,
          unitQuantity: parseFloat(formData.unitQuantity),
          isBulkSale: formData.isBulkSale,
          userRole: userRole as 'ADMIN' | 'VENDEDOR',
          isNewProduct: !product,
          requiresApproval: userRole === 'VENDEDOR'
        };
      } else {
        // Usar el endpoint normal para administración completa
        url = product ? `/api/products/${product.id}` : '/api/products';
        method = product ? 'PUT' : 'POST';
        requestBody = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          barcode: formData.barcode.trim() || null,
          price: formData.useAutomaticPricing ? parseFloat(formData.price) : parseFloat(formData.price),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          stock: parseInt(formData.stock) || 0,
          minStock: parseInt(formData.minStock) || 5,
          categoryId: formData.categoryId,
          profitMargin: formData.profitMargin ? parseFloat(formData.profitMargin) : null,
          useAutomaticPricing: formData.useAutomaticPricing,
          unitOfMeasure: formData.unitOfMeasure,
          unitQuantity: parseFloat(formData.unitQuantity),
          isBulkSale: formData.isBulkSale,
          active: formData.active
        };
      }

      console.log('📤 Datos que se van a enviar:', {
        url,
        method,
        requestBody
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url,
        method
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Error de API:', errorData);
        throw new Error(errorData.error || 'Error al guardar el producto');
      }

      const responseData = await response.json();
      console.log('✅ Producto guardado exitosamente:', responseData);

      // Si es un producto nuevo y hay imagen temporal, subirla al servidor
      if (!product && tempImageData && imageUploadRef.current) {
        try {
          console.log('📤 Subiendo imagen temporal para nuevo producto...');
          const imageResult = await imageUploadRef.current.uploadTempImageToServer(responseData.product?.id || responseData.id);
          if (imageResult) {
            console.log('✅ Imagen temporal subida exitosamente:', imageResult);
            showSuccess(
              'Producto e imagen guardados',
              'El producto y su imagen se crearon correctamente'
            );
          } else {
            showSuccess(
              'Producto creado',
              'El producto se creó correctamente. La imagen no se pudo procesar.'
            );
          }
        } catch (imageError) {
          console.error('❌ Error subiendo imagen temporal:', imageError);
          showError(
            'Producto creado, error en imagen',
            'El producto se creó pero hubo un error al subir la imagen'
          );
        }
      } else if (!product) {
        showSuccess(
          'Producto creado exitosamente',
          tempImageData ? 'Imagen incluida correctamente' : 'Producto creado sin imagen'
        );
      } else {
        showSuccess(
          'Producto actualizado',
          'Los cambios se guardaron correctamente'
        );
      }

      onSave();
    } catch (error) {
      console.error('❌ Error saving product:', error);
      showError(
        'Error al guardar producto',
        error instanceof Error ? error.message : 'Error al guardar el producto'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Gestión de Imagen - Ahora funciona para productos nuevos y existentes */}
          {!isQuickEdit && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Imagen del Producto</h3>
              
              {/* Mensaje informativo para productos nuevos */}
              {!product && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-700">
                        🎆 <strong>¡Ahora puedes subir la imagen directamente!</strong> Se guardará automáticamente cuando crees el producto.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <ImageUploadComponent
                ref={imageUploadRef}
                productId={product?.id}
                productName={formData.name || product?.name || 'Nuevo Producto'}
                currentImageUrl={product?.imageUrl}
                allowTempUpload={true}
                onTempImageChange={(tempData) => {
                  console.log('📷 Imagen temporal cambiada:', tempData);
                  setTempImageData(tempData);
                }}
                onImageUploaded={async (imageUrl, thumbnailUrl, tempData) => {
                  console.log('📷 Imagen subida/temporal:', { imageUrl, thumbnailUrl, tempData });
                  
                  // Si es un producto existente, actualizar localmente
                  if (product && !tempData) {
                    product.imageUrl = imageUrl;
                    product.thumbnailUrl = thumbnailUrl;
                    product.hasImage = true;
                    console.log('📝 Producto actualizado localmente:', product);
                    
                    showSuccess(
                      'Imagen subida exitosamente',
                      'La imagen del producto se ha actualizado correctamente'
                    );
                    
                    // Refrescar la lista de productos en el componente padre
                    if (onImageUploaded) {
                      console.log('🔄 Refrescando lista de productos...');
                      await onImageUploaded();
                    }
                  }
                  // Si es temporal, se manejará automáticamente al guardar el producto
                }}
                onUploadError={(error) => {
                  console.error('❌ Error en upload:', error);
                  showError(
                    'Error al subir imagen',
                    error
                  );
                }}
              />
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Nombre del Producto *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Martillo Truper 16oz"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción detallada del producto..."
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Código de Barras
                </label>
                <Input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="7501206612345"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Precios</h3>
            
            {/* Switch para activar pricing automático */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <input
                type="checkbox"
                id="useAutomaticPricing"
                checked={formData.useAutomaticPricing}
                onChange={(e) => handleInputChange('useAutomaticPricing', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useAutomaticPricing" className="text-sm font-medium text-gray-700">
                Usar cálculo automático de precios
              </label>
            </div>

            {formData.useAutomaticPricing && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-700">
                  💡 <strong>Cálculo automático:</strong> Precio = (Costo × (1 + Margen%)) × (1 + IVA {taxPercentage}%)
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Costo - Ahora obligatorio si usa pricing automático */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Costo {formData.useAutomaticPricing ? '*' : '(Opcional)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    placeholder="0.00"
                    className={`pl-8 ${errors.cost ? 'border-red-500' : ''}`}
                    required={formData.useAutomaticPricing}
                  />
                </div>
                {errors.cost && (
                  <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
                )}
              </div>

              {/* Margen de Ganancia - Solo si usa pricing automático */}
              {formData.useAutomaticPricing && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Margen de Ganancia (%) *
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1000"
                      value={formData.profitMargin}
                      onChange={(e) => handleInputChange('profitMargin', e.target.value)}
                      placeholder="25.0"
                      className={`pr-8 ${errors.profitMargin ? 'border-red-500' : ''}`}
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                  {errors.profitMargin && (
                    <p className="text-red-500 text-sm mt-1">{errors.profitMargin}</p>
                  )}
                </div>
              )}

              {/* Precio de Venta - Solo editable si NO usa pricing automático */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Precio de Venta {!formData.useAutomaticPricing ? '*' : '(Calculado)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    className={`pl-8 ${errors.price ? 'border-red-500' : ''} ${
                      formData.useAutomaticPricing ? 'bg-gray-100' : ''
                    }`}
                    disabled={formData.useAutomaticPricing}
                    required={!formData.useAutomaticPricing}
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
                {formData.useAutomaticPricing && (
                  <p className="text-xs text-gray-500 mt-1">
                    Este precio se calcula automáticamente
                  </p>
                )}
              </div>
            </div>

            {/* Información de cálculo */}
            {formData.useAutomaticPricing && formData.cost && formData.profitMargin && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Desglose del cálculo:</strong></p>
                  <p>• Costo base: ${parseFloat(formData.cost || '0').toFixed(2)}</p>
                  <p>• Margen {formData.profitMargin}%: ${(parseFloat(formData.cost || '0') * (parseFloat(formData.profitMargin || '0') / 100)).toFixed(2)}</p>
                  <p>• Subtotal: ${(parseFloat(formData.cost || '0') * (1 + parseFloat(formData.profitMargin || '0') / 100)).toFixed(2)}</p>
                  <p>• IVA {taxPercentage}%: ${((parseFloat(formData.cost || '0') * (1 + parseFloat(formData.profitMargin || '0') / 100)) * (taxPercentage / 100)).toFixed(2)}</p>
                  <p className="font-bold">• <strong>Precio final: ${formData.price}</strong></p>
                </div>
              </div>
            )}

            {/* Margen de ganancia manual (para pricing manual) */}
            {!formData.useAutomaticPricing && formData.price && formData.cost && parseFloat(formData.price) > 0 && parseFloat(formData.cost) > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Margen actual: </strong>
                  {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%
                  (Ganancia: ${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)})
                </p>
              </div>
            )}
          </div>

          {/* Unidades de Medida */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Unidades de Medida</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Unidad de Medida *
                </label>
                <select
                  value={formData.unitOfMeasure}
                  onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {UNIT_CATEGORIES.map(category => (
                    <optgroup key={category} label={category}>
                      {getUnitsByCategory(category).map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label} ({unit.shortLabel})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Cantidad por Unidad */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cantidad por Unidad *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.unitQuantity}
                  onChange={(e) => handleInputChange('unitQuantity', e.target.value)}
                  placeholder="1.000"
                  className={errors.unitQuantity ? 'border-red-500' : ''}
                />
                {errors.unitQuantity && (
                  <p className="text-red-500 text-sm mt-1">{errors.unitQuantity}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Ej: 500ml, 2kg, 1pza
                </p>
              </div>

              {/* Venta a Granel */}
              <div className="flex items-center space-x-3 mt-6">
                <input
                  type="checkbox"
                  id="isBulkSale"
                  checked={formData.isBulkSale}
                  onChange={(e) => handleInputChange('isBulkSale', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isBulkSale" className="text-sm font-medium text-gray-700">
                  Venta a granel
                </label>
              </div>
            </div>

            {/* Información de unidades */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700">
                <strong>Información:</strong> {UNIT_OF_MEASURE_INFO[formData.unitOfMeasure].label} ({UNIT_OF_MEASURE_INFO[formData.unitOfMeasure].category})
                {formData.isBulkSale && ' • Este producto se vende a granel'}
              </p>
            </div>
          </div>

          {/* Inventario */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inventario</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stock Actual */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Actual
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                  className={errors.stock ? 'border-red-500' : ''}
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                )}
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Mínimo
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', e.target.value)}
                  placeholder="5"
                  className={errors.minStock ? 'border-red-500' : ''}
                />
                {errors.minStock && (
                  <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Se generará una alerta cuando el stock sea igual o menor a este valor
                </p>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Estado</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Producto activo (visible en el POS)
              </label>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            {/* Mostrar errores de validación si existen */}
            {Object.keys(errors).length > 0 && (
              <div className="flex-1">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">Errores de validación:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear Producto')}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}