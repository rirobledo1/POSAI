// src/store/storeAuthStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CustomerData {
  id: string
  email: string
  name: string
  phone: string | null
  defaultAddress?: {
    id: string
    label: string | null
    name: string
    phone: string
    street: string
    colony: string | null
    city: string
    state: string
    postalCode: string | null
  } | null
}

interface StoreAuthState {
  // Estado
  token: string | null
  customer: CustomerData | null
  isAuthenticated: boolean
  
  // Acciones
  login: (token: string, customer: CustomerData) => void
  logout: () => void
  updateCustomer: (customer: Partial<CustomerData>) => void
  setDefaultAddress: (address: CustomerData['defaultAddress']) => void
}

export const useStoreAuthStore = create<StoreAuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      token: null,
      customer: null,
      isAuthenticated: false,

      // Login
      login: (token, customer) => {
        set({
          token,
          customer,
          isAuthenticated: true
        })
      },

      // Logout
      logout: () => {
        set({
          token: null,
          customer: null,
          isAuthenticated: false
        })
      },

      // Actualizar datos del cliente
      updateCustomer: (updates) => {
        const current = get().customer
        if (current) {
          set({
            customer: { ...current, ...updates }
          })
        }
      },

      // Establecer dirección por defecto
      setDefaultAddress: (address) => {
        const current = get().customer
        if (current) {
          set({
            customer: { ...current, defaultAddress: address }
          })
        }
      }
    }),
    {
      name: 'store-auth', // nombre en localStorage
      partialize: (state) => ({
        token: state.token,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
