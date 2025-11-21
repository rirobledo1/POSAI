// src/store/cartStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  image?: string
  stock: number
}

interface CartStore {
  items: CartItem[]
  companySlug: string | null
  
  // Actions
  setCompany: (slug: string) => void
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
  getItem: (productId: string) => CartItem | undefined
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      companySlug: null,

      setCompany: (slug) => set({ companySlug: slug }),

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find(i => i.productId === item.productId)

        if (existingItem) {
          // Si ya existe, incrementar cantidad
          set({
            items: items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )
          })
        } else {
          // Si no existe, agregar nuevo
          set({
            items: [...items, { ...item, quantity: item.quantity || 1 }]
          })
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(i => i.productId !== productId)
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map(i =>
            i.productId === productId
              ? { ...i, quantity }
              : i
          )
        })
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      getItem: (productId) => {
        return get().items.find(i => i.productId === productId)
      }
    }),
    {
      name: 'ferreai-cart-storage', // nombre en localStorage
    }
  )
)
