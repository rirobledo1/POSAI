'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useStoreAuthStore } from '@/store/storeAuthStore'
import { ShoppingCart, Search, Package, Store, X, Loader2, LogOut, User } from 'lucide-react'
import CheckoutModal from '@/components/tienda/CheckoutModal'
import toast from 'react-hot-toast'

interface StoreConfig {
  company: {
    id: string
    name: string
    slug: string
    phone?: string
    email?: string
    logo?: string
    currency: string
    taxRate: number
  }
  store: {
    enabled: boolean
    url: string
    features: {
      canQuote: boolean
      canBuy: boolean
      hasPayment: boolean
      paymentMode: string
    }
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  featured: boolean
  image?: string
  category?: {
    id: string
    name: string
  }
}

export default function TiendaPage() {
  const params = useParams()
  const slug = params.slug as string

  const [config, setConfig] = useState<StoreConfig | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCart, setShowCart] = useState(false)

  const { items, addItem, getTotalItems, getTotalPrice, updateQuantity, removeItem, setCompany, clearCart } = useCartStore()
  const { isAuthenticated, customer: authCustomer, logout } = useStoreAuthStore()

  useEffect(() => {
    loadStoreConfig()
    loadProducts()
    setCompany(slug)
  }, [slug])

  const loadStoreConfig = async () => {
    try {
      const response = await fetch(`/api/tienda/${slug}/config`)
      if (!response.ok) throw new Error('Error al cargar configuración')
      
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Error al cargar la tienda')
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tienda/${slug}/productos?limit=50`)
      if (!response.ok) throw new Error('Error al cargar productos')
      
      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    })
    toast.success(`${product.name} agregado al carrito`)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  const featuredProducts = filteredProducts.filter(p => p.featured)
  const regularProducts = filteredProducts.filter(p => !p.featured)

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y nombre */}
            <div className="flex items-center gap-3">
              {config.company.logo ? (
                <img 
                  src={config.company.logo} 
                  alt={config.company.name}
                  className="h-12 w-12 object-contain"
                />
              ) : (
                <Store className="h-12 w-12 text-blue-600" />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{config.company.name}</h1>
                <p className="text-sm text-gray-500">Tienda en línea</p>
              </div>
            </div>

            {/* Usuario y Carrito */}
            <div className="flex items-center gap-3">
              {/* Indicador de sesión */}
              {isAuthenticated && authCustomer && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="max-w-[120px] truncate">{authCustomer.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      toast.success('Sesión cerrada')
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Carrito */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Carrito</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Productos destacados */}
            {featuredProducts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  Productos Destacados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featuredProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      inCart={!!items.find(i => i.productId === product.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Todos los productos */}
            {regularProducts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Todos los Productos ({regularProducts.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {regularProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      inCart={!!items.find(i => i.productId === product.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                <p className="text-gray-500">Intenta con otra búsqueda</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Carrito flotante */}
      {showCart && (
        <CartSidebar 
          config={config}
          slug={slug}
          onClose={() => setShowCart(false)}
          onOrderComplete={() => {
            clearCart()
            setShowCart(false)
          }}
        />
      )}
    </div>
  )
}

// Componente de tarjeta de producto
function ProductCard({ 
  product, 
  onAddToCart,
  inCart 
}: { 
  product: Product
  onAddToCart: (product: Product) => void
  inCart: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
      {/* Imagen */}
      <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-300" />
          </div>
        )}
        
        {product.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
            Destacado
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : inCart
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {product.stock === 0 
            ? 'Sin stock' 
            : inCart 
            ? '✓ En carrito' 
            : 'Agregar al carrito'
          }
        </button>
      </div>
    </div>
  )
}

// Componente del carrito lateral
function CartSidebar({ 
  config,
  slug,
  onClose,
  onOrderComplete
}: { 
  config: StoreConfig
  slug: string
  onClose: () => void
  onOrderComplete: () => void
}) {
  const { items, getTotalPrice, updateQuantity, removeItem, clearCart } = useCartStore()
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutType, setCheckoutType] = useState<'QUOTE' | 'SALE'>('QUOTE')

  const handleQuote = () => {
    setCheckoutType('QUOTE')
    setShowCheckout(true)
  }

  const handleBuy = () => {
    setCheckoutType('SALE')
    setShowCheckout(true)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Carrito de Compras</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3 border-b pb-4">
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="max-w-full max-h-full object-contain rounded" />
                    ) : (
                      <Package className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{item.productName}</h3>
                    <p className="text-blue-600 font-bold mb-2">
                      ${(item.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-red-600 hover:text-red-700 text-sm"
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

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">
                ${getTotalPrice().toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2">
              {config.store.features.canBuy && (
                <button 
                  onClick={handleBuy}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  🛒 Comprar Ahora
                </button>
              )}
              
              {config.store.features.canQuote && (
                <button 
                  onClick={handleQuote}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  📝 Solicitar Cotización
                </button>
              )}

              <button 
                onClick={clearCart}
                className="w-full text-gray-600 hover:text-gray-800 text-sm py-2"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      {showCheckout && config && (
        <CheckoutModal
          config={config}
          slug={slug}
          type={checkoutType}
          items={items}
          total={getTotalPrice()}
          onClose={() => setShowCheckout(false)}
          onSuccess={onOrderComplete}
        />
      )}
    </>
  )
}
