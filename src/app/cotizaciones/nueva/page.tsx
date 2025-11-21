'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import MainLayout from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  Plus,
  Trash2,
  Save,
  AlertCircle,
  DollarSign,
  Package,
  User,
  FileText
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  barcode?: string
}

interface QuotationItem {
  productId: string
  productName: string
  description: string
  quantity: number
  price: number
  discount: number
  subtotal: number
}

interface FormData {
  customerId: string
  validDays: number
  items: QuotationItem[]
  discountPercent: number
  notes: string
  termsConditions: string
}

export default function NuevaCotizacionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    validDays: 15,
    items: [],
    discountPercent: 0,
    notes: '',
    termsConditions: getDefaultTermsConditions()
  })

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    productName: '',
    description: '',
    quantity: 1,
    price: 0,
    discount: 0
  })

  useEffect(() => {
    if (session?.user?.companyId) {
      loadCustomers()
      loadProducts()
    }
  }, [session])

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(customers)
      return
    }
    
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
    )
    setFilteredCustomers(filtered)
  }, [customerSearch, customers])

  useEffect(() => {
    if (!productSearch.trim()) {
      setFilteredProducts([])
      return
    }
    
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode?.includes(productSearch)
    ).slice(0, 10)
    
    setFilteredProducts(filtered)
  }, [productSearch, products])

  const loadCustomers = async () => {
    try {
      const response = await fetch(`/api/customers?companyId=${session?.user?.companyId}&active=true`)
      if (!response.ok) throw new Error('Error al cargar clientes')
      
      const data = await response.json()
      setCustomers(data.customers || [])
      setFilteredCustomers(data.customers || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/products?companyId=${session?.user?.companyId}&active=true`)
      if (!response.ok) throw new Error('Error al cargar productos')
      
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({ ...prev, customerId: customer.id }))
    setCustomerSearch(customer.name)
    setShowCustomerDropdown(false)
    setErrors(prev => ({ ...prev, customer: '' }))
  }

  const selectProduct = (product: Product) => {
    setCurrentItem({
      productId: product.id,
      productName: product.name,
      description: product.name,
      quantity: 1,
      price: product.price,
      discount: 0
    })
    setProductSearch(product.name)  // Mostrar el nombre del producto seleccionado
    setShowProductDropdown(false)
  }

  const addItem = () => {
    if (!currentItem.productId) {
      toast.error('Selecciona un producto')
      return
    }
    
    if (currentItem.quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (currentItem.price <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    const exists = formData.items.find(item => item.productId === currentItem.productId)
    if (exists) {
      toast.error('Este producto ya está en la cotización')
      return
    }

    const subtotal = (currentItem.quantity * currentItem.price) - currentItem.discount

    const newItem: QuotationItem = {
      ...currentItem,
      subtotal
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))

    // Limpiar el formulario y el campo de búsqueda para el siguiente producto
    setCurrentItem({
      productId: '',
      productName: '',
      description: '',
      quantity: 1,
      price: 0,
      discount: 0
    })
    setProductSearch('')  // Limpiar el campo de búsqueda para el siguiente producto
    toast.success(`${currentItem.productName} agregado`)
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const subtotal = (quantity * item.price) - item.discount
          return { ...item, quantity, subtotal }
        }
        return item
      })
    }))
  }

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const subtotal = (item.quantity * price) - item.discount
          return { ...item, price, subtotal }
        }
        return item
      })
    }))
  }

  const calculations = {
    itemsTotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    discount: 0,
    totalAfterDiscount: 0,
    subtotal: 0,  // Sin IVA
    tax: 0,       // IVA desglosado
    total: 0      // Con IVA incluido
  }

  // Los precios YA incluyen IVA - hay que desglosarlo
  const taxRate = 16 // TODO: Obtener de la configuración de la empresa
  const taxMultiplier = 1 + (taxRate / 100) // 1.16

  calculations.discount = calculations.itemsTotal * (formData.discountPercent / 100)
  calculations.totalAfterDiscount = calculations.itemsTotal - calculations.discount
  
  // Desglosar el IVA que ya está incluido en los precios
  calculations.subtotal = calculations.totalAfterDiscount / taxMultiplier  // Sin IVA
  calculations.tax = calculations.totalAfterDiscount - calculations.subtotal  // IVA desglosado
  calculations.total = calculations.totalAfterDiscount  // Total con IVA

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerId) {
      newErrors.customer = 'Selecciona un cliente'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Agrega al menos un producto'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setLoading(true)

    const loadingToast = toast.loading('Creando cotización...')

    try {
      const payload = {
        customerId: formData.customerId,
        companyId: session?.user?.companyId,
        branchId: session?.user?.branchId,
        validDays: formData.validDays,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          description: item.description
        })),
        discountPercent: formData.discountPercent,
        notes: formData.notes,
        termsConditions: formData.termsConditions
      }

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear cotización')
      }

      const result = await response.json()
      
      toast.success(
        `Cotización ${result.quotation.quotationNumber} creada exitosamente`,
        { duration: 4000 }
      )
      
      // Esperar un momento para que el usuario vea la notificación
      setTimeout(() => {
        router.push('/cotizaciones')
      }, 500)
      
    } catch (error: any) {
      console.error('Error creating quotation:', error)
      toast.error(error.message || 'Error al crear la cotización')
    } finally {
      toast.dismiss(loadingToast)
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
            <p className="text-gray-600">Crea una cotización para un cliente</p>
          </div>
          
          <Button variant="outline" onClick={() => router.push('/cotizaciones')}>
            Cancelar
          </Button>
        </div>

        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Label>Buscar Cliente *</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerDropdown(true)
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="pl-10"
                  />
                </div>

                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCustomers.slice(0, 10).map(customer => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {customer.email && <span>{customer.email}</span>}
                          {customer.phone && <span className="ml-2">{customer.phone}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {errors.customer && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.customer}
                </div>
              )}

              {selectedCustomer && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-gray-600">
                        {selectedCustomer.email && <span>{selectedCustomer.email}</span>}
                        {selectedCustomer.phone && <span className="ml-3">{selectedCustomer.phone}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null)
                        setFormData(prev => ({ ...prev, customerId: '' }))
                        setCustomerSearch('')
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-md">
                <div className="col-span-4 relative">
                  <Label className="text-xs">Producto</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                        // Si limpia el campo, limpiar también el producto seleccionado
                        if (!e.target.value.trim()) {
                          setCurrentItem({
                            productId: '',
                            productName: '',
                            description: '',
                            quantity: 1,
                            price: 0,
                            discount: 0
                          })
                        }
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className={`pl-8 h-9 text-sm ${
                        currentItem.productId ? 'bg-green-50 border-green-300' : ''
                      }`}
                    />
                  </div>

                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(product)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            Precio: ${product.price.toFixed(2)} | Stock: {product.stock}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Precio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.price}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs">Descuento</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.discount}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div className="col-span-2 flex items-end">
                  <Button
                    type="button"
                    onClick={addItem}
                    className="w-full h-9 text-sm"
                    disabled={!currentItem.productId}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {errors.items && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.items}
                </div>
              )}

              {formData.items.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Producto</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Cantidad</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Precio</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Subtotal</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{item.productName}</td>
                          <td className="px-3 py-2 text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="h-8 w-20 text-center text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                              className="h-8 w-24 text-right text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-medium">
                            ${item.subtotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuración y Totales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Vigencia</Label>
                <select
                  value={formData.validDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, validDays: parseInt(e.target.value) }))}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="7">7 días</option>
                  <option value="15">15 días</option>
                  <option value="30">30 días</option>
                  <option value="45">45 días</option>
                  <option value="60">60 días</option>
                </select>
              </div>

              <div>
                <Label>Descuento General (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas opcionales..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${calculations.subtotal.toFixed(2)}</span>
                </div>
                
                {formData.discountPercent > 0 && (
                  <div className="flex justify-between py-2 text-red-600">
                    <span>Descuento ({formData.discountPercent}%):</span>
                    <span className="font-medium">-${calculations.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">IVA ({taxRate}%):</span>
                  <span className="font-medium">${calculations.tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${calculations.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botones */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => router.push('/cotizaciones')}
                disabled={loading}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={loading || formData.items.length === 0 || !formData.customerId}
                className="min-w-[150px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

function getDefaultTermsConditions(): string {
  return `TÉRMINOS Y CONDICIONES:

1. Esta cotización es válida por el período indicado.
2. Los precios están sujetos a cambios sin previo aviso.
3. Los precios incluyen IVA.
4. El tiempo de entrega puede variar según disponibilidad.

Para aceptar esta cotización, por favor confirme por email o WhatsApp.`
}
