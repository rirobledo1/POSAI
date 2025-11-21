// src/components/pos/POSInterface.tsx
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
import useProductsLazy from '@/hooks/useProductsLazy';
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

interface POSInterfaceProps {
  initialProducts?: Product[];
  initialCustomers?: Customer[];
}

export default function POSInterface({ initialProducts = [], initialCustomers = [] }: POSInterfaceProps) {
  // 🔍 LOG DE DIAGNÓSTICO - Inicio del componente
  console.log('🎬 POSInterface montado - timestamp:', Date.now());
  
  // Hook para múltiples ventas - NUEVA FUNCIONALIDAD
  const {
    activeTab,
    updateCart,
    updateCustomer,
    updatePaymentMethod,
    updateCashReceived,
    clearActiveTab
  } = useMultiSales();

  // 🔥 PRIORIDAD BAJA: Configuración de empresa (se carga después)
  const { taxRate, currency, loading: settingsLoading } = useCompanySettings();
  
  // ⚡ PRIORIDAD ALTA: Productos favoritos (solo localStorage, rápido)
  const { favoriteProducts, toggleFavorite, isFavorite } = useFavoriteProducts();

  // 🔥 PRIORIDAD BAJA: Configuración de envíos (se carga después)
  const { 
    shippingSettings, 
    calculateShippingCost, 
    getZoneByName, 
    loading: shippingLoading,
    error: shippingError 
  } = useShippingSettings();

  // COMENTADO: Debug de configuración de envío - CAUSABA LOGS CONSTANTES
  // useEffect(() => {
  //   if (shippingSettings) {
  //     console.log('🚚 Configuración de envío cargada:', {
  //       zonas: shippingSettings.zones.length,
  //       costoLocal: shippingSettings.defaultLocalCost,
  //       costoForaneo: shippingSettings.defaultForaneoCost,
  //       edicionManual: shippingSettings.allowManualEdit
  //     });
  //   }
  //   if (shippingError) {
  //     console.error('❌ Error en configuración de envío:', shippingError);
  //   }
  // }, [shippingSettings, shippingError]);

  // Hook para notificaciones
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  // Función helper para compatibilidad con código existente
  const addNotification = (notification: any) => {
    const { type, title, message, duration, action } = notification;
    if (type === 'success') {
      showSuccess(title, message);
    } else if (type === 'error') {
      showError(title, message);
    } else if (type === 'warning') {
      showWarning(title, message);
    } else {
      showInfo(title, message);
    }
  };

  // Hook para tickets
  const { printTicket, sendViaWhatsApp } = useTickets();

  // Hook para obtener la sesión del usuario
  const { data: session, status } = useSession();
  
  // Hook para navegación
  const router = useRouter();

  // 🔥 PRIORIDAD MÁXIMA: Hook optimizado para carga progresiva de productos
  // Se ejecuta INMEDIATAMENTE cuando hay sesión
  const {
    products: lazyProducts,
    loading: lazyLoading,
    error: lazyError,
    hasMore: lazyHasMore,
    loadMore: lazyLoadMore,
    refresh: lazyRefresh,
    totalLoaded
  } = useProductsLazy({
    initialLimit: 50, // Solo 50 productos iniciales
    pageSize: 50, // Cargar 50 más cada vez
    autoLoad: !!session, // ⚡ Carga inmediata cuando hay sesión
    enabled: !!session
  });
  
  // Estados principales - AHORA VIENEN DEL activeTab
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  
  // Estados para lazy loading manual
  const [manualLoading, setManualLoading] = useState(false);
  
  // Estados derivados del tab activo
  const cart = activeTab?.cart || [];
  const selectedCustomer = activeTab?.customer || null;
  const paymentMethod = activeTab?.paymentMethod || 'EFECTIVO';
  const cashReceived = activeTab?.cashReceived || '';
  
  // Funciones para actualizar el tab activo
  const setCart = (newCart: CartItem[]) => updateCart(newCart);
  const setSelectedCustomer = (customer: Customer | null) => {
    updateCustomer(customer);
    // Cargar direcciones cuando se selecciona un cliente
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
  const [loading, setLoading] = useState(false);
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
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false); // 💰 Estado para modal de corte
  const [hasCashRegister, setHasCashRegister] = useState<boolean | null>(null); // null = no verificado
  const [checkingCashRegister, setCheckingCashRegister] = useState(true);

  // useEffect unificado para manejo de costos de envío
  useEffect(() => {
    console.log('🔄 useEffect de costos ejecutado:', {
      deliveryType,
      selectedCustomer: selectedCustomer?.name || 'Ninguno',
      selectedZoneId,
      deliveryFee: deliveryFee
    });

    if (deliveryType === DeliveryType.PICKUP) {
      console.log('🏪 Modo recogida - limpiando envío');
      setDeliveryFee(0);
      setCustomDeliveryFee('0');
      setSelectedZoneId('');
      return;
    }
    
    if (!selectedCustomer) {
      console.log('👤 Sin cliente - sin envío');
      setDeliveryFee(0);
      setCustomDeliveryFee('0');
      setSelectedZoneId('');
      return;
    }

    // Si hay una zona específica seleccionada Y coincide con el tipo actual, usarla
    if (selectedZoneId && calculateShippingCost) {
      console.log('🎯 Calculando con zona específica:', selectedZoneId);
      try {
        const calculatedFee = calculateShippingCost(selectedZoneId);
        console.log('✅ Costo calculado por zona:', calculatedFee);
        setDeliveryFee(calculatedFee);
        setCustomDeliveryFee(calculatedFee.toString());
        return;
      } catch (error) {
        console.error('Error calculando costo específico:', error);
      }
    }

    // Si no hay zona específica, usar costo por defecto del tipo de entrega
    const defaultFee = deliveryType === DeliveryType.LOCAL ? 50 : 150;
    console.log('💰 Usando costo por defecto:', {
      tipo: deliveryType,
      costo: defaultFee,
      costoAnterior: deliveryFee
    });
    
    setDeliveryFee(defaultFee);
    setCustomDeliveryFee(defaultFee.toString());
    
  }, [deliveryType, selectedCustomer, selectedZoneId, calculateShippingCost]);

  // Manejar cambio manual del costo de envío
  const handleCustomDeliveryFeeChange = (value: string) => {
    setCustomDeliveryFee(value);
    const numericValue = parseFloat(value) || 0;
    setDeliveryFee(numericValue);
  };
  
  // Estados para productos destacados
  const [productFilter, setProductFilter] = useState<'all' | 'featured' | 'bestsellers' | 'highMargin'>('featured');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false); // Controla si mostrar todos o solo destacados
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Estado para indicar carga de más productos

  // Estados para el sidebar colapsable
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Cargar estado del localStorage al iniciar
    const saved = localStorage.getItem('pos-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // 📱 Estado para carrito móvil (drawer)
  const [showMobileCart, setShowMobileCart] = useState(false);

  // 🚀 OPTIMIZACIÓN: Sincronizar productos lazy con estado local
  useEffect(() => {
    const syncStart = performance.now();
    if (lazyProducts.length > 0) {
      console.log(`✅ Productos lazy cargados: ${lazyProducts.length}`);
      setProducts(lazyProducts);
      setAllProducts(lazyProducts);
      
      // Regenerar productos destacados con los nuevos datos
      // ✅ FIX: Generar destacados sin importar la cantidad
      if (!showAllProducts) {
        const featuredStart = performance.now();
        generateFeaturedProducts(lazyProducts);
        const featuredEnd = performance.now();
        console.log(`⏱️ Productos destacados generados en: ${(featuredEnd - featuredStart).toFixed(0)}ms`);
      }
      
      const syncEnd = performance.now();
      console.log(`⏱️ Sincronización de productos completada en: ${(syncEnd - syncStart).toFixed(0)}ms`);
    }
  }, [lazyProducts, showAllProducts]);
  
  // 🔥 CARGAR DATOS CRÍTICOS INMEDIATAMENTE
  useEffect(() => {
    if (session) {
      console.log('🚀 PRIORIDAD: Cargando clientes (crítico para POS)...');
      // ⚡ Productos se cargan automáticamente con useProductsLazy
      // ⚡ Clientes se cargan en paralelo
      loadCustomers();
    } else {
      console.log('⚠️ No hay sesión activa, esperando autenticación...');
    }
  }, [session]);

  // Redirigir a login si no hay sesión
  useEffect(() => {
      if (!session && status === 'unauthenticated') {
        console.log('🔒 Usuario no autenticado, redirigiendo a login');
        router.push('/login');
      }
    }, [session, status, router]);

    // 🔥 PRIORIDAD BAJA: Verificar caja abierta DESPUÉS de productos
    // Usar setTimeout para NO bloquear carga de productos
    useEffect(() => {
      const checkCashRegister = async () => {
        if (!session) {
          console.log('⏸️ No hay sesión, esperando...');
          return;
        }
        
        // ⏱️ Esperar 500ms para dar prioridad a productos y clientes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          console.log('💰 Verificando caja abierta (prioridad baja)...');
          setCheckingCashRegister(true);
          
          const response = await fetch('/api/cash-register?action=current');
          const data = await response.json();
          
          console.log('📊 Respuesta de caja:', data);
          setHasCashRegister(data.hasOpenClosure);
          
          // Si NO hay caja abierta, abrir modal automáticamente
          if (!data.hasOpenClosure) {
            console.log('🚨 NO HAY CAJA ABIERTA - Abriendo modal automáticamente');
            // Usar un pequeño delay para asegurar que el componente está montado
            setTimeout(() => {
              console.log('✅ Mostrando modal de apertura de caja');
              setShowCashRegisterModal(true);
            }, 300);
          } else {
            console.log('✅ Ya hay caja abierta, continuando normalmente');
          }
        } catch (error) {
          console.error('❌ Error verificando caja:', error);
          // En caso de error, también mostrar el modal por seguridad
          setShowCashRegisterModal(true);
        } finally {
          setCheckingCashRegister(false);
        }
      };

      // Ejecutar la verificación cuando haya sesión
      if (session) {
        checkCashRegister();
      }
    }, [session]); // ✅ Solo depende de session

  // COMENTADO: Recargar clientes cuando la página vuelve a tener foco (después de crear cliente)
  // CAUSABA REFRESHES AUTOMÁTICOS
  // useEffect(() => {
  //   const handleFocus = () => {
  //     // Verificar si venimos de crear un cliente
  //     const urlParams = new URLSearchParams(window.location.search);
  //     if (urlParams.get('refreshCustomers') === 'true') {
  //       loadCustomers();
  //       // Limpiar el parámetro de la URL
  //       window.history.replaceState({}, '', '/pos');
  //     }
  //   };

  //   const handleVisibilityChange = () => {
  //     if (!document.hidden) {
  //       handleFocus();
  //     }
  //   };

  //   window.addEventListener('focus', handleFocus);
  //   document.addEventListener('visibilitychange', handleVisibilityChange);

  //   return () => {
  //     window.removeEventListener('focus', handleFocus);
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //   };
  // }, []);

  // ELIMINAR ESTOS useEffect QUE CAUSAN REFRESHES AUTOMÁTICOS
  // Regenerar productos destacados cuando cambien los favoritos - SOLO CUANDO EL USUARIO CAMBIE ALGO
  // useEffect(() => {
  //   if (allProducts.length > 0) {
  //     generateFeaturedProducts(allProducts);
  //   }
  // }, [favoriteProducts, allProducts]);

  // Recargar productos cuando cambie el modo de vista - SOLO MANUAL
  // useEffect(() => {
  //   if (showAllProducts && allProducts.length === 0) {
  //     loadProducts();
  //   } else if (!showAllProducts && featuredProducts.length === 0) {
  //     loadProducts();
  //   }
  // }, [showAllProducts]);

  // 🚀 FUNCIÓN OPTIMIZADA: Manejar carga manual de más productos
  const handleLoadMore = async () => {
    if (isLoadingMore || !lazyHasMore) return;
    
    try {
      setIsLoadingMore(true);
      console.log('🔽 Cargando más productos...');
      await lazyLoadMore();
    } catch (error) {
      console.error('❌ Error cargando más productos:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // 🚀 FUNCIóN OPTIMIZADA: Refrescar productos (para cuando se crea/edita uno)
  const refreshProducts = async () => {
    try {
      console.log('🔄 Refrescando productos...');
      setManualLoading(true);
      await lazyRefresh();
    } catch (error) {
      console.error('❌ Error refrescando productos:', error);
    } finally {
      setManualLoading(false);
    }
  };

  // ❌ REMOVIDA: loadAllProductsData ya no es necesaria con lazy loading

  // Función para generar productos destacados basados en diferentes criterios
  const generateFeaturedProducts = (allProds: Product[]) => {
    // Criterios para productos destacados:
    // 1. Productos marcados como favoritos manualmente
    // 2. Productos con ventas (si tienen estadísticas)
    // 3. Productos con buen margen de ganancia
    // 4. Productos con stock disponible
    // 5. Productos populares de ferretería

    const productsWithStock = allProds.filter(p => p.stock > 0);
    
    // Productos favoritos marcados manualmente (prioridad máxima)
    const manualFavorites = productsWithStock
      .filter(p => favoriteProducts.includes(p.id))
      .slice(0, 15);

    // Productos más vendidos (si tienen estadísticas de ventas)
    const bestsellers = productsWithStock
      .filter(p => (p as any).totalSold > 0 && !favoriteProducts.includes(p.id))
      .sort((a, b) => ((b as any).totalSold || 0) - ((a as any).totalSold || 0))
      .slice(0, 8);

    // Productos con mejor margen
    const highMarginProducts = productsWithStock
      .filter(p => p.profitMargin && p.profitMargin > 25 && !favoriteProducts.includes(p.id))
      .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
      .slice(0, 8);

    // Productos comunes de ferretería (palabras clave)
    const commonKeywords = ['martillo', 'destornillador', 'tornillo', 'clavo', 'pintura', 'broca', 'cable', 'tubo'];
    const commonProducts = productsWithStock
      .filter(p => 
        commonKeywords.some(keyword => p.name.toLowerCase().includes(keyword)) &&
        !favoriteProducts.includes(p.id)
      )
      .slice(0, 10);

    // Combinar y eliminar duplicados
    const featured = new Map();
    
    // Prioridad 1: Favoritos manuales
    manualFavorites.forEach(p => featured.set(p.id, { ...p, reason: 'Favorito' }));
    
    // Prioridad 2: Más vendidos
    bestsellers.forEach(p => {
      if (!featured.has(p.id)) {
        featured.set(p.id, { ...p, reason: 'Más vendido' });
      }
    });
    
    // Prioridad 3: Alto margen
    highMarginProducts.forEach(p => {
      if (!featured.has(p.id)) {
        featured.set(p.id, { ...p, reason: 'Alto margen' });
      }
    });
    
    // Prioridad 4: Productos comunes
    commonProducts.forEach(p => {
      if (!featured.has(p.id)) {
        featured.set(p.id, { ...p, reason: 'Producto popular' });
      }
    });

    // Si no hay suficientes, agregar productos con stock
    const featuredArray = Array.from(featured.values());
    if (featuredArray.length < 25) {
      const remaining = productsWithStock
        .filter(p => !featured.has(p.id))
        .slice(0, 25 - featuredArray.length);
      
      remaining.forEach(p => featured.set(p.id, { ...p, reason: 'Disponible' }));
    }

    const finalFeatured = Array.from(featured.values()).slice(0, 30);
    console.log('⭐ Productos destacados generados:', finalFeatured.length);
    console.log('❤️ Favoritos manuales incluidos:', manualFavorites.length);
    setFeaturedProducts(finalFeatured);
  };

  const loadCustomers = async () => {
    if (!session) {
      console.log('⚠️ No se pueden cargar clientes sin sesión');
      return;
    }

    try {
      console.log('🔄 Cargando clientes...');
      const response = await fetch('/api/customers?active=true');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Respuesta de clientes:', data);
        console.log('📋 Tipo de respuesta:', typeof data);
        console.log('📋 Es array?:', Array.isArray(data));
        console.log('📋 Keys del objeto:', Object.keys(data));
        
        // Intentar extraer el array de clientes de diferentes estructuras posibles
        let customersArray = [];
        if (Array.isArray(data)) {
          customersArray = data;
        } else if (data.customers && Array.isArray(data.customers)) {
          customersArray = data.customers;
        } else if (data.data && Array.isArray(data.data)) {
          customersArray = data.data;
        } else {
          console.warn('⚠️ Estructura de respuesta no reconocida:', data);
        }
        
        console.log('👥 Clientes extraídos:', customersArray.length);
        if (customersArray.length > 0) {
          console.log('👤 Primer cliente:', customersArray[0]);
        }
        setCustomers(customersArray);
      } else {
        console.error('Error en respuesta:', response.status, response.statusText);
        setError(`Error cargando clientes: ${response.status}`);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setError('Error de red al cargar clientes');
    }
  };

  // 🚀 OPTIMIZADO: Funciones para alternar entre vista de destacados y todos los productos
  const showFeaturedProducts = () => {
    setShowAllProducts(false);
    if (featuredProducts.length > 0) {
      setProducts(featuredProducts);
      console.log('🌟 Cambiando a vista de productos destacados');
    } else {
      // Regenerar destacados con los productos cargados
      if (lazyProducts.length > 0) {
        generateFeaturedProducts(lazyProducts);
      }
    }
  };

  const showAllProductsView = async () => {
    setShowAllProducts(true);
    // Usar los productos lazy que ya tenemos
    setProducts(lazyProducts);
    console.log(`📋 Cambiando a vista de todos los productos (${lazyProducts.length} cargados)`);
  };

  // Cargar direcciones del cliente seleccionado
  const loadCustomerAddresses = async (customerId: string) => {
    try {
      console.log('📍 Cargando direcciones para cliente:', customerId);
      const response = await fetch(`/api/delivery/addresses/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📍 Direcciones recibidas:', data.addresses);
        setCustomerAddresses(data.addresses || []);
        
        // Auto-seleccionar dirección principal si existe
        const defaultAddress = data.addresses?.find((addr: DeliveryAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          console.log('🏠 Dirección principal seleccionada:', defaultAddress.addressLine1);
        } else {
          setSelectedAddressId('');
        }
      } else {
        console.error('Error cargando direcciones:', response.status);
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

    // Validar precio del producto
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
      
      // Reproducir sonido de agregar producto
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
      // Reproducir sonido de agregar producto
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

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      setError(`No hay suficiente stock de ${product.name}`);
      return;
    }

    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        // Validar precio unitario
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
    const filteredCart = cart.filter(item => item.product.id !== productId);
    setCart(filteredCart);
  };

  const clearCart = () => {
    if (cart.length > 0) {
      showInfo('Carrito vaciado', 'Todos los productos han sido eliminados del carrito');
    }
    clearActiveTab();
    setError(null);
    setSuccess(null);
    
    // Limpiar estados de entrega
    setDeliveryType(DeliveryType.PICKUP);
    setSelectedZoneId('');
    setDeliveryFee(0);
    setCustomDeliveryFee('');
    setIsEditingDeliveryFee(false);
  };

  // Cálculos de totales - MÉTODO MEXICANO: precios incluyen IVA
  // Total productos = suma directa de subtotales (ya incluyen IVA)
  const productsTotal = cart.reduce((sum, item) => {
    // Validar cada item del carrito
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || item.product?.price || 0;
    const itemSubtotal = item.subtotal || (quantity * unitPrice) || 0;
    
    // Asegurar que sea un número válido
    const validSubtotal = isNaN(itemSubtotal) ? 0 : Number(itemSubtotal);
    
    return sum + validSubtotal;
  }, 0);
  
  // Total con envío - validar ambos valores
  const validProductsTotal = isNaN(productsTotal) ? 0 : Number(productsTotal);
  const validDeliveryFee = isNaN(deliveryFee) ? 0 : Number(deliveryFee);
  const total = validProductsTotal + validDeliveryFee;
  
  // Validar taxRate y calcular subtotal
  const validTaxRate = (taxRate && !isNaN(taxRate) && taxRate > 0) ? taxRate : 0.16; // 16% por defecto
  
  // Subtotal = productsTotal / (1 + taxRate) - precio sin IVA
  const subtotal = validProductsTotal / (1 + validTaxRate);
  
  // Tax = productsTotal - subtotal - el IVA contenido en el precio de productos
  const tax = validProductsTotal - subtotal;
  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'EFECTIVO' ? Math.max(0, cashReceivedAmount - total) : 0;

  // Obtener productos según el filtro seleccionado
  const getProductsToShow = () => {
    console.log('🔍 getProductsToShow - productFilter:', productFilter);
    console.log('🔍 allProducts.length:', allProducts.length);
    console.log('🔍 featuredProducts.length:', featuredProducts.length);
    
    // Si estamos mostrando todos los productos, usar allProducts
    if (showAllProducts) {
      return allProducts;
    }
    
    // Si no, usar productos según el filtro
    switch (productFilter) {
      case 'featured':
        return featuredProducts;
      default:
        return featuredProducts; // Por defecto mostrar destacados
    }
  };

  // Filtros de búsqueda aplicados a los productos seleccionados
  const baseProducts = getProductsToShow();
  console.log('🔍 baseProducts después de getProductsToShow:', baseProducts.length);
  console.log('🔍 searchTerm actual:', searchTerm);
  
  const filteredProducts = baseProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('🔍 Debug filtros:');
  console.log('  - baseProducts.length:', baseProducts.length);
  console.log('  - searchTerm:', searchTerm);
  console.log('  - filteredProducts.length:', filteredProducts.length);
  console.log('  - productFilter:', productFilter);
  
  if (baseProducts.length > 0 && filteredProducts.length === 0) {
    console.log('🚨 PROBLEMA: Hay productos base pero filteredProducts está vacío');
    console.log('🔍 Primer producto base:', baseProducts[0]);
  }

  const filteredCustomers = customers.filter(customer =>
    customer.active &&
    (customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
     customer.rfc?.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Validaciones
  const canProcessSale = cart.length > 0 && 
    (paymentMethod !== 'EFECTIVO' || cashReceivedAmount >= total) &&
    (paymentMethod !== 'CREDITO' || selectedCustomer);

  // Manejar confirmación del checkout modal
  const handleCheckoutConfirm = async (checkoutData: CheckoutData) => {
    console.log('✅ Datos recibidos del checkout:', checkoutData);
    
    // Cerrar modal
    setShowCheckoutModal(false);
    
    // Procesar la venta DIRECTAMENTE con los datos del checkout
    await processSaleWithCheckoutData(checkoutData);
  };

  // Procesar venta con datos del checkout
  const processSaleWithCheckoutData = async (checkoutData: CheckoutData) => {
    console.log('🔄 Procesando venta con datos del checkout...');
    
    // Validación básica
    if (cart.length === 0) {
      showWarning('Carrito vacío', 'Agrega productos al carrito antes de procesar la venta');
      return;
    }
    
    // Validar método de pago
    if (checkoutData.paymentMethod === 'CREDITO' && !selectedCustomer) {
      showWarning('Cliente requerido', 'Selecciona un cliente para ventas a crédito');
      return;
    }
    
    // Validar efectivo recibido
    if (checkoutData.paymentMethod === 'EFECTIVO' && checkoutData.cashReceived && checkoutData.cashReceived < total) {
      showWarning('Efectivo insuficiente', `El efectivo recibido (${formatCurrency(checkoutData.cashReceived)}) es menor al total (${formatCurrency(total)})`);
      return;
    }
    
    // Validar dirección de entrega
    if (checkoutData.deliveryType !== DeliveryType.PICKUP && !checkoutData.deliveryAddressId) {
      showWarning('Dirección requerida', 'Selecciona una dirección de entrega');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      // Actualizar estados locales ANTES de enviar
      setPaymentMethod(checkoutData.paymentMethod);
      setDeliveryType(checkoutData.deliveryType);
      setDeliveryFee(checkoutData.deliveryFee);
      if (checkoutData.cashReceived) {
        setCashReceived(checkoutData.cashReceived.toString());
      }
      if (checkoutData.deliveryAddressId) {
        setSelectedAddressId(checkoutData.deliveryAddressId);
      }
      
      console.log('📦 Preparando datos de venta:', {
        paymentMethod: checkoutData.paymentMethod,
        deliveryType: checkoutData.deliveryType,
        deliveryFee: checkoutData.deliveryFee,
        total,
        cartItems: cart.length
      });
      
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
      console.log('🔍 Respuesta del servidor:', result); // Debug

      if (!response.ok) {
        throw new Error(result.error || 'Error procesando venta');
      }

      // Venta exitosa
      const saleId = result.sale.id;
      
      console.log('🎯 Venta completada exitosamente:', {
        saleId: result.sale.id,
        folio: result.sale.folio,
        total,
        response: result
      });
      
      // Guardar datos de la venta completada
      setCompletedSale({
        saleId: result.sale.id,
        folio: result.sale.folio,
        total,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone
      });
      
      // Reproducir sonido de éxito
      soundManager.playSuccess();
      
      console.log('🔔 Sonido de éxito reproducido');
      console.log('🎯 Abriendo modal de éxito con datos:', {
        saleId: result.sale.id,
        folio: result.sale.folio
      });
      
      // Mostrar modal de éxito en lugar de notificación
      setShowSuccessModal(true);
      
      // Actualizar stock local y guardar productos con stock bajo
      const productsWithLowStock: {name: string, stock: number}[] = [];
      const productsOutOfStock: string[] = [];
      
      setProducts(prevProducts =>
        prevProducts.map(product => {
          const cartItem = cart.find(item => item.product.id === product.id);
          if (cartItem) {
            const newStock = product.stock - cartItem.quantity;
            // Guardar info para notificar después
            if (newStock <= 5 && newStock > 0) {
              productsWithLowStock.push({ name: product.name, stock: newStock });
            } else if (newStock <= 0) {
              productsOutOfStock.push(product.name);
            }
            return { ...product, stock: newStock };
          }
          return product;
        })
      );
      
      // Notificar sobre stock bajo DESPUÉS de actualizar el estado
      setTimeout(() => {
        productsWithLowStock.forEach(({ name, stock }) => {
          showWarning('Stock bajo', `${name} tiene solo ${stock} unidades restantes`);
        });
        productsOutOfStock.forEach(name => {
          showError('Producto agotado', `${name} se ha quedado sin stock`);
        });
      }, 100);

      // Actualizar crédito del cliente si aplica
      if (checkoutData.paymentMethod === 'CREDITO' && selectedCustomer) {
        const newDebt = selectedCustomer.currentDebt + total;
        setCustomers(prevCustomers =>
          prevCustomers.map(customer =>
            customer.id === selectedCustomer.id
              ? { ...customer, currentDebt: newDebt }
              : customer
          )
        );
        
        // Notificar sobre el nuevo crédito
        showInfo(
          'Crédito actualizado',
          `${selectedCustomer.name} ahora debe ${formatCurrency(newDebt)}`
        );
      }

      // Limpiar carrito y estados de entrega
      clearCart(); // Esto ya incluye la limpieza de estados de entrega

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
    // Redirigir a la página de productos con el ID del producto a editar
    const params = new URLSearchParams({
      edit: product.id,
      returnTo: '/pos'
    });
    router.push(`/productos?${params.toString()}`);
  };

  const openCreateProductModal = (searchTerm?: string) => {
    // Redirigir a la página de productos para crear nuevo producto
    const params = new URLSearchParams({
      create: 'true',
      returnTo: '/pos'
    });
    
    if (searchTerm) {
      params.set('name', searchTerm);
    }
    
    router.push(`/productos?${params.toString()}`);
  };

  // Función para gestión de clientes
  const openCreateCustomerModal = (searchTerm?: string) => {
    // Redirigir a la página de clientes para crear nuevo cliente
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
      {/* Sistema de pestañas para ventas en paralelo - SIN MARGEN */}
      <MultiSaleTabs onCashRegister={() => setShowCashRegisterModal(true)} />
      

      
      {/* Contenedor principal SIN PADDING Y SIN OVERFLOW */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Panel izquierdo - Grid de productos TOUCH-OPTIMIZADO */}
        <ResponsiveProductGrid
          products={products}
          allProducts={allProducts}
          featuredProducts={featuredProducts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddToCart={addToCart}
          onToggleFavorite={(productId) => {
            toggleFavorite(productId);
            // Regenerar productos destacados después de cambiar favoritos
            setTimeout(() => generateFeaturedProducts(lazyProducts), 100);
          }}
          onEditProduct={openEditProductModal}
          onCreateProduct={openCreateProductModal}
          isFavorite={isFavorite}
          showAllProducts={showAllProducts}
          onShowFeatured={showFeaturedProducts}
          onShowAll={showAllProductsView}
          favoriteProducts={favoriteProducts}
          loading={lazyLoading || manualLoading}
          error={lazyError || error}
          className="flex-1"
          hasMore={lazyHasMore}
          onLoadMore={handleLoadMore}
          loadingMore={isLoadingMore}
        />

      {/* Panel derecho - Carrito y pago - OCULTO EN MÓVIL */}
      <div className="hidden md:flex w-80 xl:w-96 bg-white border-l flex-col overflow-hidden">
        {/* Header del carrito */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm font-medium">Carrito ({cart.length})</span>
          </div>
          {cart.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCart} 
              title={`Vaciar carrito (${cart.length} productos)`}
              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Cliente en una línea */}
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-medium">Cliente:</span>
          {selectedCustomer ? (
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm truncate">{selectedCustomer.name}</span>
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
                className="h-5 w-5 p-0 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => {
              setShowCustomerModal(true);
              loadCustomers(); // Recargar clientes al abrir modal
            }} className="h-7 text-sm px-3">
              <User className="h-4 w-4 mr-1" />
              Seleccionar
            </Button>
          )}
        </div>

        {/* La selección de entrega ahora está en el CheckoutModal */}

        {/* Lista de productos del carrito */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 360px)' }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <ShoppingCart className="h-10 w-10 mb-2" />
              <span className="text-sm">Carrito vacío</span>
              <span className="text-xs mt-1">Agrega productos para comenzar</span>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 border-b pb-3 last:border-b-0">
                  {/* Thumbnail del producto */}
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="max-w-full max-h-full object-contain" 
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  
                  {/* Info del producto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 truncate" title={item.product.name}>
                      {item.product.name}
                    </h4>
                    <p className="text-blue-600 font-bold text-sm mb-2">
                      {formatCurrency((item.unitPrice || item.product.price) * item.quantity)}
                    </p>
                    
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        title="Reducir cantidad"
                        className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        title={item.quantity >= item.product.stock ? `Stock máximo (${item.product.stock})` : "Aumentar cantidad"}
                        className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-auto text-red-600 hover:text-red-700 text-sm hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MÉTODOS DE PAGO - REMOVIDOS (Ahora en el modal) */}
        {/* Los métodos de pago ahora se seleccionan en el CheckoutModal */}

        {/* TOTALES Y BOTÓN PROCESAR - SOLO CON CARRITO */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 bg-white">
            {/* Totales */}
            <div className="px-3 py-2 bg-gray-50 border-b">
              <div className="space-y-1 text-sm">
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
                <div className="flex justify-between pt-1 border-t border-gray-300 font-bold text-base">
                  <span>TOTAL</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* BOTÓN PROCESAR */}
            <div className="px-3 py-2 bg-white">
              <Button
                onClick={() => setShowCheckoutModal(true)}
                disabled={cart.length === 0}
                title={cart.length === 0 ? "Agrega productos al carrito" : `Procesar venta por ${formatCurrency(total)}`}
                className="w-full h-10 text-base font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all disabled:opacity-50 shadow-md"
              >
                {processingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>💰 Procesar {formatCurrency(total)}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 📱 BOTÓN FLOTANTE DEL CARRITO - SOLO MÓVIL */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg active:scale-95 transition-all"
        title={`Ver carrito (${cart.length} productos)`}
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {cart.length > 99 ? '99+' : cart.length}
          </span>
        )}
      </button>

      {/* 📱 DRAWER DEL CARRITO - SOLO MÓVIL */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowMobileCart(false)}
          />
          
          {/* Drawer desde abajo */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header del drawer */}
            <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">Carrito ({cart.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-red-500 hover:bg-red-50"
                  >
                    Vaciar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileCart(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Cliente */}
            <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium">Cliente:</span>
              {selectedCustomer ? (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm truncate">{selectedCustomer.name}</span>
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
                    className="h-6 w-6 p-0 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowCustomerModal(true);
                    loadCustomers();
                  }} 
                  className="h-8 text-sm px-3"
                >
                  <User className="h-4 w-4 mr-1" />
                  Seleccionar
                </Button>
              )}
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mb-3" />
                  <span className="text-base">Carrito vacío</span>
                  <span className="text-sm mt-1">Agrega productos para comenzar</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-3 border-b pb-4 last:border-b-0">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.product.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                            className="max-w-full max-h-full object-contain" 
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-blue-600 font-bold text-sm mb-2">
                          {formatCurrency((item.unitPrice || item.product.price) * item.quantity)}
                        </p>
                        
                        {/* Controles de cantidad - MÁS GRANDES PARA TOUCH */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-9 h-9 rounded-lg border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center text-lg font-medium"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-bold text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-9 h-9 rounded-lg border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center text-lg font-medium disabled:opacity-50"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totales y botón procesar */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 border-t bg-white">
                <div className="px-4 py-3 bg-gray-50">
                  <div className="space-y-1 text-sm">
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
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-lg">
                      <span>TOTAL</span>
                      <span className="text-green-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <Button
                    onClick={() => {
                      setShowMobileCart(false);
                      setShowCheckoutModal(true);
                    }}
                    disabled={cart.length === 0}
                    className="w-full h-12 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all shadow-lg active:scale-98"
                  >
                    {processingPayment ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      <span>💰 Procesar {formatCurrency(total)}</span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de selección de cliente */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
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
              {/* Debug info */}
              <div className="mb-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                Total clientes: {customers.length} | Filtrados: {filteredCustomers.length} | Búsqueda: "{customerSearch}"
              </div>
              
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
                        {customer.rfc && (
                          <p className="text-xs text-gray-500">RFC: {customer.rfc}</p>
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

      {/* Modal de Éxito de Venta */}
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

      {/* Modal de gestión de direcciones */}
      {showAddressModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Direcciones de {selectedCustomer.name}
              </h3>
              <Button
                onClick={() => setShowAddressModal(false)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <AddressManager
                customerId={selectedCustomer.id}
                addresses={customerAddresses}
                onAddressAdded={(address) => {
                  console.log('📍 Nueva dirección agregada:', address);
                  setCustomerAddresses(prev => {
                    const updated = [...prev, address];
                    console.log('📍 Direcciones actualizadas:', updated);
                    return updated;
                  });
                  setSelectedAddressId(address.id);
                  setShowAddressModal(false);
                }}
                onAddressUpdated={(address) => {
                  setCustomerAddresses(prev => 
                    prev.map(addr => addr.id === address.id ? address : addr)
                  );
                }}
                onAddressDeleted={(addressId) => {
                  setCustomerAddresses(prev => 
                    prev.filter(addr => addr.id !== addressId)
                  );
                  if (selectedAddressId === addressId) {
                    setSelectedAddressId('');
                  }
                }}
                onAddressSelected={(address) => {
                  setSelectedAddressId(address.id);
                  setShowAddressModal(false);
                }}
                selectedAddressId={selectedAddressId}
                showSelector={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Corte de Caja */}
      <CashRegisterModal
        isOpen={showCashRegisterModal}
        onClose={() => setShowCashRegisterModal(false)}
        onSuccess={() => {
          showSuccess('Operación exitosa', 'La caja se gestionó correctamente')
          setHasCashRegister(true) // Marcar que ya hay caja abierta
          refreshProducts() // 🚀 Usar refreshProducts en lugar de loadProducts
        }}
              />
      </div>
    </div>
  );
}
