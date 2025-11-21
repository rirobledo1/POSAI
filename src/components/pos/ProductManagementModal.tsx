'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Package, DollarSign, Hash, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types/pos';

interface ProductManagementModalProps {
  product?: Product | null; // null significa crear nuevo producto
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => void;
  userRole: 'ADMIN' | 'VENDEDOR';
}

interface ProductFormData {
  name: string;
  price: string;
  unitCost: string;
  stock: string;
  barcode: string;
  category: string;
  description: string;
  minStock: string;
}

// Límites para vendedores (pueden ser configurables desde admin)
const VENDOR_LIMITS = {
  maxPriceIncrease: 0.20, // 20% máximo de aumento
  maxPriceDecrease: 0.10, // 10% máximo de descuento
  maxStockAdjustment: 50,  // ±50 unidades máximo
  canChangeCost: false,    // No pueden cambiar costo
  requiresApproval: true   // Cambios requieren aprobación
};

export default function ProductManagementModal({
  product,
  isOpen,
  onClose,
  onSave,
  userRole
}: ProductManagementModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    unitCost: '',
    stock: '',
    barcode: '',
    category: '',
    description: '',
    minStock: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const isEditing = !!product;
  const isVendor = userRole === 'VENDEDOR';

  // Inicializar formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Modo edición
        setFormData({
          name: product.name || '',
          price: product.price?.toString() || '',
          unitCost: product.unitCost?.toString() || '',
          stock: product.stock?.toString() || '',
          barcode: product.barcode || '',
          category: product.category || '',
          description: product.description || '',
          minStock: product.minStock?.toString() || '5'
        });
      } else {
        // Modo nuevo producto
        setFormData({
          name: '',
          price: '',
          unitCost: '',
          stock: '0',
          barcode: '',
          category: '',
          description: '',
          minStock: '5'
        });
      }
      setError(null);
      setWarnings([]);
    }
  }, [isOpen, product]);

  // Validar cambios para vendedores
  const validateVendorLimits = (newPrice: number, newStock: number): string[] => {
    const warnings: string[] = [];

    if (isVendor && product) {
      // Validar precio
      const originalPrice = product.price;
      const priceIncrease = (newPrice - originalPrice) / originalPrice;
      const priceDecrease = (originalPrice - newPrice) / originalPrice;

      if (priceIncrease > VENDOR_LIMITS.maxPriceIncrease) {
        warnings.push(`El aumento de precio excede el límite permitido (${VENDOR_LIMITS.maxPriceIncrease * 100}%)`);
      }
      if (priceDecrease > VENDOR_LIMITS.maxPriceDecrease) {
        warnings.push(`El descuento excede el límite permitido (${VENDOR_LIMITS.maxPriceDecrease * 100}%)`);
      }

      // Validar stock
      const stockChange = Math.abs(newStock - product.stock);
      if (stockChange > VENDOR_LIMITS.maxStockAdjustment) {
        warnings.push(`El ajuste de stock excede el límite permitido (±${VENDOR_LIMITS.maxStockAdjustment} unidades)`);
      }
    }

    return warnings;
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validar en tiempo real para vendedores
    if (isVendor && product && (field === 'price' || field === 'stock')) {
      const newPrice = field === 'price' ? parseFloat(value) || 0 : parseFloat(formData.price) || 0;
      const newStock = field === 'stock' ? parseInt(value) || 0 : parseInt(formData.stock) || 0;
      
      const validationWarnings = validateVendorLimits(newPrice, newStock);
      setWarnings(validationWarnings);
    }
  };

  const calculateMargin = (): number => {
    const price = parseFloat(formData.price) || 0;
    const cost = parseFloat(formData.unitCost) || 0;
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validaciones básicas
      if (!formData.name.trim()) {
        throw new Error('El nombre del producto es requerido');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Validaciones específicas para vendedores
      if (isVendor && warnings.length > 0) {
        throw new Error('Hay cambios que exceden los límites permitidos');
      }

      const productData = {
        id: product?.id,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        unitCost: isVendor && VENDOR_LIMITS.canChangeCost === false 
          ? product?.unitCost 
          : parseFloat(formData.unitCost) || 0,
        stock: parseInt(formData.stock) || 0,
        barcode: formData.barcode.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        minStock: parseInt(formData.minStock) || 5,
        userRole,
        isNewProduct: !isEditing,
        requiresApproval: isVendor && VENDOR_LIMITS.requiresApproval
      };

      await onSave(productData);
      onClose();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="text-sm text-gray-500">
                {isVendor ? 'Edición rápida para vendedores' : 'Gestión completa de producto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información del rol */}
          <div className="flex items-center justify-between">
            <Badge variant={isVendor ? "secondary" : "default"}>
              {userRole}
            </Badge>
            {isEditing && product && (
              <div className="text-sm text-gray-500">
                ID: {product.id} | Stock actual: {product.stock}
              </div>
            )}
          </div>

          {/* Alertas */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Martillo 16oz"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Ej: Herramientas"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="Ej: 1234567890123"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descripción del producto"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Precios y stock */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Precios y Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price">Precio de Venta * {isVendor && product && `(Original: ${formatCurrency(product.price)})`}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="unitCost">
                    Costo Unitario 
                    {isVendor && VENDOR_LIMITS.canChangeCost === false && (
                      <span className="text-gray-500 text-xs">(Solo lectura)</span>
                    )}
                  </Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => handleInputChange('unitCost', e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                    disabled={isVendor && !VENDOR_LIMITS.canChangeCost}
                  />
                  {formData.price && formData.unitCost && (
                    <p className="text-xs text-gray-600 mt-1">
                      Margen: {calculateMargin().toFixed(1)}%
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stock">Stock {isVendor && product && `(Actual: ${product.stock})`}</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="minStock">Stock Mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', e.target.value)}
                    placeholder="5"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información adicional para vendedores */}
          {isVendor && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                <strong>Límites para vendedores:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Precio: máximo {VENDOR_LIMITS.maxPriceIncrease * 100}% aumento, {VENDOR_LIMITS.maxPriceDecrease * 100}% descuento</li>
                  <li>Stock: máximo ±{VENDOR_LIMITS.maxStockAdjustment} unidades de ajuste</li>
                  {VENDOR_LIMITS.requiresApproval && <li>Los cambios pueden requerir aprobación del administrador</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || (isVendor && warnings.length > 0)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}