// src/components/pos/POSInterface.optimized.tsx
// VERSIÓN OPTIMIZADA CON LAZY LOADING Y CACHE
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ShoppingCart, X, User, CreditCard, DollarSign, Smartphone, Banknote, Printer, Check, Package, AlertTriangle, Star, TrendingUp, Target, Grid3x3, Settings, Edit, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { formatProductUnit, formatQuantityWithUnit, getUnitInfo } from '@/lib/units';
import { soundManager } from '@/lib/sounds';
import { CashRegisterModal } from '@/components/cash-register/CashRegisterModal';

// Importar componentes touch-optimizados
import { 
  ResponsiveProductGrid, 
  CartTouchOptimized 
} from './touch';
import { CheckoutModal, CheckoutData } from './checkout';
import SaleSuccessModal from './SaleSuccessModal';
import useCompanySettings from '@/hooks/useCompanySettings';
import useFavoriteProducts from '@/hooks/useFavoriteProducts';
import useShippingSettings from '@/hooks/useShippingSettings';
import { useNotifications } from '@/components/ui/NotificationProvider';
import { useTickets } from '@/hooks/useTickets';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMultiSales } from '@/hooks/useMultiSales';
import MultiSaleTabs from './MultiSaleTabs';
import NetworkStatusIndicator from '@/components/ui/NetworkStatusIndicator';
import DeliverySelector from '@/components/delivery/DeliverySelector';
import AddressManager from '@/components/delivery/AddressManager';
import type { Product, Customer, CartItem, PaymentMethod, DeliveryAddress } from '@/types/pos';
import { DeliveryType } from '@/types/pos';

// ⭐ NUEVO: Importar hook optimizado
import { useProductsOptimized } from '@/hooks/useProductsOptimized';

interface POSInterfaceProps {
  initialProducts?: Product[];
  initialCustomers?: Customer[];
}

export default function POSInterface({ initialProducts = [], initialCustomers = [] }: POSInterfaceProps) {
  // Hook para múltiples ventas
  const {
    activeTab,
    updateCart,
    updateCustomer,
    updatePaymentMethod,
    updateCashReceived,
    clearActiveTab
  } = useMultiSales();

  // Hook para obtener configuración de empresa
  const { taxRate, currency, loading: settingsLoading } = useCompanySettings();
  
  // Hook para gestionar productos favoritos
  const { favoriteProducts, toggleFavorite, isFavorite } = useFavoriteProducts();

  // Hook para configuración de envíos
  const { 
    shippingSettings, 
    calculateShippingCost, 
    getZoneByName, 
    loading: shippingLoading,
    error: shippingError 
  } = useShippingSettings();

  // Hook para notificaciones
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  // Hook para tickets
  const { printTicket, sendViaWhatsApp } = useTickets();

  // Hook para obtener la sesión del usuario
  const { data: session, status } = useSession();
  
  // Hook para navegación
  const router = useRouter();

  // ⭐ NUEVO: Hook optimizado de productos con lazy loading
  const {
    products: optimizedProducts,
    loading: productsLoading,
    error: productsError,
    featuredOnly,
    setFeaturedOnly,
    setSearch: setProductSearch,
    refreshProducts,
    loadAllProducts
  } = useProductsOptimized(true); // Iniciar con solo productos destacados

  // Estados principales - AHORA VIENEN DEL activeTab
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  
  // Estados derivados del tab activo
  const cart = activeTab?.cart || [];
  const selectedCustomer = activeTab?.customer || null;
  const paymentMethod = activeTab?.paymentMethod || 'EFECTIVO';
  const cashReceived = activeTab?.cashReceived || '';
  
  // Funciones para actualizar el tab activo
  const setCart = (newCart: CartItem[]) => updateCart(newCart);
  const setSelectedCustomer = (customer: Customer | null) => {
    updateCustomer(customer);
    if (customer) {
      loadCustomerAddresses(customer.id);
    } else {
      setCustomerAddresses([]);
      setSelectedAddressId('');
    }
  };
  const setPaymentMethod = (method: PaymentMethod) => updatePaymentMethod(method);
  const setCashReceived = (amount: string) => updateCashReceived(amount);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    saleId: string;
    folio: string;
    total: number;
    customerName?: string;
    customerPhone?: string;
  } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Estados para sistema de entregas
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.PICKUP);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [customDeliveryFee, setCustomDeliveryFee] = useState<string>('');
  const [isEditingDeliveryFee, setIsEditingDeliveryFee] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState<DeliveryAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);
  const [hasCashRegister, setHasCashRegister] = useState<boolean | null>(null);
  const [checkingCashRegister, setCheckingCashRegister] = useState(true);

  // useEffect unificado para manejo de costos de envío
  useEffect(() => {
    if (deliveryType === DeliveryType.PICKUP) {
      setDeliveryFee(0);
      setCustomDeliveryFee('0');
      setSelectedZoneId('');
      return;
    }
    
    if (!selectedCustomer) {
      setDeliveryFee(0);
      setCustomDeliveryFee('0');
      setSelectedZoneId('');
      return;
    }

    if (selectedZoneId && calculateShippingCost) {
      try {
        const calculatedFee = calculateShippingCost(selectedZoneId);
        setDeliveryFee(calculatedFee);
        setCustomDeliveryFee(calculatedFee.toString());
        return;
      } catch (error) {
        console.error('Error calculando costo específico:', error);
      }
    }

    const defaultFee = deliveryType === DeliveryType.LOCAL ? 50 : 150;
    setDeliveryFee(defaultFee);
    setCustomDeliveryFee(defaultFee.toString());
    
  }, [deliveryType, selectedCustomer, selectedZoneId, calculateShippingCost]);

  // Manejar cambio manual del costo de envío
  const handleCustomDeliveryFeeChange = (value: string) => {
    setCustomDeliveryFee(value);
    const numericValue = parseFloat(value) || 0;
    setDeliveryFee(numericValue);
  };

  // Cargar clientes al iniciar
  useEffect(() => {
    if (session) {
      loadCustomers();
    }
  }, [session]);

  // Redirigir a login si no hay sesión
  useEffect(() => {
    if (!session && status === 'unauthenticated') {
      console.log('🔒 Usuario no autenticado, redirigiendo a login');
      router.push('/login');
    }
  }, [session, status, router]);

  // Verificar si hay caja abierta al cargar el POS
  useEffect(() => {
    const checkCashRegister = async () => {
      if (!session) return;
      
      try {
        setCheckingCashRegister(true);
        const response = await fetch('/api/cash-register?action=current');
        const data = await response.json();
        
        setHasCashRegister(data.hasOpenClosure);
        
        if (!data.hasOpenClosure) {
          setTimeout(() => {
            setShowCashRegisterModal(true);
          }, 300);
        }
      } catch (error) {
        console.error('❌ Error verificando caja:', error);
        setShowCashRegisterModal(true);
      } finally {
        setCheckingCashRegister(false);
      }
    };

    if (session) {
      checkCashRegister();
    }
  }, [session]);

  // ⭐ OPTIMIZACIÓN: Búsqueda con debounce automático
  useEffect(() => {
    // El hook ya tiene debounce implementado, solo pasamos el término
    if (searchTerm !== '') {
      setProductSearch(searchTerm);
    } else {
      setProductSearch('');
    }
  }, [searchTerm, setProductSearch]);

  const loadCustomers = async () => {
    if (!session) return;

    try {
      console.log('🔄 Cargando clientes...');
      const response = await fetch('/api/customers?active=true');
      
      if (response.ok) {
        const data = await response.json();
        let customersArray = [];
        if (Array.isArray(data)) {
          customersArray = data;
        } else if (data.customers && Array.isArray(data.customers)) {
          customersArray = data.customers;
        } else if (data.data && Array.isArray(data.data)) {
          customersArray = data.data;
        }
        
        console.log('👥 Clientes cargados:', customersArray.length);
        setCustomers(customersArray);
      } else {
        console.error('Error en respuesta:', response.status);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  // ⭐ NUEVO: Función para cambiar entre vista destacada y todos los productos
  const toggleProductsView = () => {
    if (featuredOnly) {
      loadAllProducts(); // Cargar todos los productos
      showInfo('Modo completo', 'Mostrando todos los productos');
    } else {
      setFeaturedOnly(true); // Volver a vista destacada
      showInfo('Modo destacados', 'Mostrando solo productos destacados');
    }
  };

  // Cargar direcciones del cliente seleccionado
  const loadCustomerAddresses = async (customerId: string) => {
    try {
      console.log('📍 Cargando direcciones para cliente:', customerId);
      const response = await fetch(`/api/delivery/addresses/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerAddresses(data.addresses || []);
        
        const defaultAddress = data.addresses?.find((addr: DeliveryAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else {
          setSelectedAddressId('');
        }
      } else {
        setCustomerAddresses([]);
        setSelectedAddressId('');
      }
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      setCustomerAddresses([]);
      setSelectedAddressId('');
    }
  };

  // Lógica del carrito
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showError('Producto sin stock', `${product.name} no tiene stock disponible`);
      return;
    }

    const productPrice = product.price && !isNaN(Number(product.price)) ? Number(product.price) : 0;
    if (productPrice <= 0) {
      showError('Precio inválido', `${product.name} no tiene un precio válido`);
      return;
    }

    const currentCart = cart;
    const existingItem = currentCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showWarning('Stock insuficiente', `Solo hay ${product.stock} unidades de ${product.name} disponibles`);
        return;
      }
      
      soundManager.playAddToCart();
      
      const newQuantity = existingItem.quantity + 1;
      const newSubtotal = newQuantity * productPrice;
      
      const updatedCart = currentCart.map(item =>
        item.product.id === product.id
          ? { 
              ...item, 
              quantity: newQuantity,
              unitPrice: productPrice,
              subtotal: newSubtotal
            }
          : item
      );
      setCart(updatedCart);
    } else {
      soundManager.playAddToCart();
      
      const newCart = [...currentCart, { 
        product, 
        quantity: 1, 
        unitPrice: productPrice,
        subtotal: productPrice
      }];
      setCart(newCart);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = optimizedProducts.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      setError(`No hay suficiente stock de ${product.name}`);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        const validUnitPrice = item.unitPrice && !isNaN(Number(item.unitPrice)) ? Number(item.unitPrice) : 0;
        const newSubtotal = newQuantity * validUnitPrice;
        
        return { 
          ...item, 
          quantity: newQuantity,
          unitPrice: validUnitPrice,
          subtotal: newSubtotal
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    const removedItem = cart.find(item => item.product.id === productId);
    const filteredCart = cart.filter(item => item.product.id !== productId);
    setCart(filteredCart);
    
    if (removedItem) {
      showInfo('Producto eliminado', `${removedItem.product.name} eliminado del carrito`);
    }
  };

  const clearCart = () => {
    if (cart.length > 0) {
      showInfo('Carrito vaciado', 'Todos los productos han sido eliminados del carrito');
    }
    clearActiveTab();
    setError(null);
    setSuccess(null);
    
    setDeliveryType(DeliveryType.PICKUP);
    setSelectedZoneId('');
    setDeliveryFee(0);
    setCustomDeliveryFee('');
    setIsEditingDeliveryFee(false);
  };

  // Cálculos de totales
  const productsTotal = cart.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || item.product?.price || 0;
    const itemSubtotal = item.subtotal || (quantity * unitPrice) || 0;
    const validSubtotal = isNaN(itemSubtotal) ? 0 : Number(itemSubtotal);
    return sum + validSubtotal;
  }, 0);
  
  const validProductsTotal = isNaN(productsTotal) ? 0 : Number(productsTotal);
  const validDeliveryFee = isNaN(deliveryFee) ? 0 : Number(deliveryFee);
  const total = validProductsTotal + validDeliveryFee;
  const validTaxRate = (taxRate && !isNaN(taxRate) && taxRate > 0) ? taxRate : 0.16;
  const subtotal = validProductsTotal / (1 + validTaxRate);
  const tax = validProductsTotal - subtotal;
  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'EFECTIVO' ? Math.max(0, cashReceivedAmount - total) : 0;

  // ⭐ OPTIMIZACIÓN: Filtrado local solo de productos ya cargados
  const filteredProducts = optimizedProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.active &&
    (customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.rfc?.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const canProcessSale = cart.length > 0 && 
    (paymentMethod !== 'EFECTIVO' || cashReceivedAmount >= total) &&
    (paymentMethod !== 'CREDITO' || selectedCustomer);

  // Manejar confirmación del checkout modal
  const handleCheckoutConfirm = async (checkoutData: CheckoutData) => {
    setShowCheckoutModal(false);
    await processSaleWithCheckoutData(checkoutData);
  };

  // Procesar venta con datos del checkout
  const processSaleWithCheckoutData = async (checkoutData: CheckoutData) => {
    if (cart.length === 0) {
      showWarning('Carrito vacío', 'Agrega productos al carrito antes de procesar la venta');
      return;
    }
    
    if (checkoutData.paymentMethod === 'CREDITO' && !selectedCustomer) {
      showWarning('Cliente requerido', 'Selecciona un cliente para ventas a crédito');
      return;
    }
    
    if (checkoutData.paymentMethod === 'EFECTIVO' && checkoutData.cashReceived && checkoutData.cashReceived < total) {
      showWarning('Efectivo insuficiente', `El efectivo recibido (${formatCurrency(checkoutData.cashReceived)}) es menor al total (${formatCurrency(total)})`);
      return;
    }
    
    if (checkoutData.deliveryType !== DeliveryType.PICKUP && !checkoutData.deliveryAddressId) {
      showWarning('Dirección requerida', 'Selecciona una dirección de entrega');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      setPaymentMethod(checkoutData.paymentMethod);
      setDeliveryType(checkoutData.deliveryType);
      setDeliveryFee(checkoutData.deliveryFee);
      if (checkoutData.cashReceived) {
        setCashReceived(checkoutData.cashReceived.toString());
      }
      if (checkoutData.deliveryAddressId) {
        setSelectedAddressId(checkoutData.deliveryAddressId);
      }
      
      const saleData = {
        customerId: selectedCustomer?.id,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discount: 0
        })),
        paymentMethod: checkoutData.paymentMethod,
        subtotal,
        tax,
        total,
        deliveryType: checkoutData.deliveryType,
        deliveryAddressId: checkoutData.deliveryType !== DeliveryType.PICKUP ? checkoutData.deliveryAddressId : undefined,
        deliveryFee: checkoutData.deliveryType !== DeliveryType.PICKUP ? checkoutData.deliveryFee : 0,
        notes: `Venta ${checkoutData.paymentMethod} ${selectedCustomer ? `- Cliente: ${selectedCustomer.name}` : '- Mostrador'}${checkoutData.deliveryType !== DeliveryType.PICKUP ? ` - Entrega: ${checkoutData.deliveryType}` : ''}`
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error procesando venta');
      }

      setCompletedSale({
        saleId: result.sale.id,
        folio: result.sale.folio,
        total,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone
      });
      
      soundManager.playSuccess();
      setShowSuccessModal(true);

      // Refrescar productos para actualizar stock
      await refreshProducts();
      
      if (checkoutData.paymentMethod === 'CREDITO' && selectedCustomer) {
        const newDebt = selectedCustomer.currentDebt + total;
        setCustomers(prevCustomers =>
          prevCustomers.map(customer =>
            customer.id === selectedCustomer.id
              ? { ...customer, currentDebt: newDebt }
              : customer
          )
        );
        
        showInfo(
          'Crédito actualizado',
          `${selectedCustomer.name} ahora debe ${formatCurrency(newDebt)}`
        );
      }

      clearCart();

    } catch (error) {
      console.error('Error procesando venta:', error);
      showError(
        'Error procesando venta',
        error instanceof Error ? error.message : 'Error inesperado al procesar la venta'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Funciones para gestión de productos
  const openEditProductModal = (product: Product) => {
    const params = new URLSearchParams({
      edit: product.id,
      returnTo: '/pos'
    });
    router.push(`/productos?${params.toString()}`);
  };

  const openCreateProductModal = (searchTerm?: string) => {
    const params = new URLSearchParams({
      create: 'true',
      returnTo: '/pos'
    });
    
    if (searchTerm) {
      params.set('name', searchTerm);
    }
    
    router.push(`/productos?${params.toString()}`);
  };

  const openCreateCustomerModal = (searchTerm?: string) => {
    const params = new URLSearchParams({
      create: 'true',
      returnTo: '/pos?refreshCustomers=true'
    });
    
    if (searchTerm) {
      params.set('name', searchTerm);
    }
    
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Sistema de pestañas */}
      <MultiSaleTabs />
      
      {/* Header con botones de control */}
      <div className="px-6 py-2 bg-white border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* ⭐ NUEVO: Botón para alternar vista de productos */}
          <Button
            onClick={toggleProductsView}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={productsLoading}
          >
            {productsLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-600 border-t-transparent mr-1"></div>
            ) : (
              <Grid3x3 className="h-3 w-3 mr-1" />
            )}
            {featuredOnly ? 'Ver todos' : 'Ver destacados'}
          </Button>
          
          {/* Indicador de modo actual */}
          {featuredOnly ? (
            <Badge variant="default" className="text-xs bg-yellow-500">
              <Star className="h-3 w-3 mr-1" />
              Destacados ({filteredProducts.length})
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              Todos ({filteredProducts.length})
            </Badge>
          )}
        </div>
        
        <Button
          onClick={() => setShowCashRegisterModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white shadow-md"
          size="sm"
        >
          <DollarSign className="h-4 w-4 mr-2" />
          💰 Corte de Caja
        </Button>
      </div>
      
      {/* Contenedor principal */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Panel izquierdo - Grid de productos */}
        <ResponsiveProductGrid
          products={filteredProducts}
          allProducts={optimizedProducts}
          featuredProducts={optimizedProducts} // Ya vienen filtrados del backend
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
          onEditProduct={openEditProductModal}
          onCreateProduct={openCreateProductModal}
          isFavorite={isFavorite}
          showAllProducts={!featuredOnly}
          onShowFeatured={() => setFeaturedOnly(true)}
          onShowAll={loadAllProducts}
          favoriteProducts={favoriteProducts}
          loading={productsLoading}
          error={productsError}
          className="flex-1"
        />

        {/* Panel derecho - Carrito */}
        <div className="w-80 xl:w-96 bg-white border-l flex flex-col h-full overflow-hidden">
          {/* Header micro */}
          <div className="px-2 py-1 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              <span className="text-xs font-medium">Carrito ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearCart} 
                className="h-5 w-5 p-0 text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Cliente */}
          <div className="px-2 py-1 border-b bg-gray-50 flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-medium">Cliente:</span>
            {selectedCustomer ? (
              <div className="flex items-center justify-between flex-1">
                <span className="text-xs truncate">{selectedCustomer.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const customerName = selectedCustomer?.name;
                    setSelectedCustomer(null);
                    if (customerName) {
                      showInfo('Cliente removido', `${customerName} ha sido removido de la venta`);
                    }
                  }}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => {
                setShowCustomerModal(true);
                loadCustomers();
              }} className="h-5 text-xs px-2">
                <User className="h-3 w-3 mr-1" />
                Seleccionar
              </Button>
            )}
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <ShoppingCart className="h-6 w-6 mb-1" />
                <span className="text-xs">Carrito vacío</span>
              </div>
            ) : (
              <div className="p-1">
                {/* Header de la tabla */}
                <div className="grid grid-cols-12 gap-1 px-1 py-1 bg-gray-100 text-xs font-medium text-gray-600 border-b">
                  <div className="col-span-4">Producto</div>
                  <div className="col-span-2 text-center">Cant</div>
                  <div className="col-span-3 text-right">Precio</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
                
                {/* Filas de productos */}
                {cart.map((item) => (
                  <div key={item.product.id} className="grid grid-cols-12 gap-1 px-1 py-1 border-b hover:bg-gray-50 text-xs">
                    <div className="col-span-4 flex items-center">
                      <span className="truncate font-medium">{item.product.name}</span>
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="h-4 w-4 rounded border text-xs flex items-center justify-center hover:bg-gray-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="h-4 w-4 rounded border text-xs flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="col-span-3 text-right flex items-center justify-end">
                      <span>{formatCurrency(item.unitPrice || item.product.price)}</span>
                    </div>
                    
                    <div className="col-span-3 flex items-center justify-end gap-1">
                      <span className="font-medium text-green-600">
                        {formatCurrency((item.unitPrice || item.product.price) * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="h-3 w-3 text-gray-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales y botón procesar */}
          {cart.length > 0 && (
            <div className="flex-shrink-0 bg-white">
              <div className="px-2 py-1 bg-gray-50 border-b">
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({Math.round(validTaxRate * 100)}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span className="text-blue-600">{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-0.5 border-t border-gray-300 font-bold">
                    <span>TOTAL</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="px-2 py-1 bg-white">
                <Button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={cart.length === 0}
                  className="w-full h-8 text-sm font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all disabled:opacity-50"
                >
                  {processingPayment ? (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <span>💰 Procesar {formatCurrency(total)}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 max-h-96 flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Seleccionar Cliente</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomerModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3">
                <Input
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                      setCustomerSearch('');
                      showSuccess('Cliente seleccionado', `${customer.name} ha sido seleccionado para la venta`);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.email && (
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        )}
                        {customer.phone && (
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600">Límite: {formatCurrency(customer.creditLimit)}</p>
                        <p className="text-blue-600">Usado: {formatCurrency(customer.currentDebt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  {customerSearch ? (
                    <div>
                      <p className="text-gray-500 mb-4">
                        No se encontró "{customerSearch}"
                      </p>
                      <Button
                        onClick={() => openCreateCustomerModal(customerSearch)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Cliente Nuevo
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-4">No hay clientes registrados</p>
                      <Button
                        onClick={() => openCreateCustomerModal()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Cliente Nuevo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        customer={selectedCustomer}
        subtotal={subtotal}
        tax={tax}
        deliveryFee={deliveryFee}
        total={total}
        onConfirm={handleCheckoutConfirm}
      />

      {/* Modal de Éxito */}
      {completedSale && (
        <SaleSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setCompletedSale(null);
          }}
          saleData={completedSale}
          onPrintTicket={printTicket}
          onSendWhatsApp={sendViaWhatsApp}
        />
      )}

      {/* Modal de Corte de Caja */}
      <CashRegisterModal
        isOpen={showCashRegisterModal}
        onClose={() => setShowCashRegisterModal(false)}
        onSuccess={() => {
          showSuccess('Operación exitosa', 'La caja se gestionó correctamente')
          setHasCashRegister(true)
          refreshProducts()
        }}
      />
    </div>
  );
}
