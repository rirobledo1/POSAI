// src/hooks/useMultiSales.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNotifications } from '@/components/ui/NotificationProvider'
import type { CartItem, Customer, PaymentMethod } from '@/types/pos'

export interface SaleTab {
  id: string
  name: string
  cart: CartItem[]
  customer: Customer | null
  paymentMethod: PaymentMethod
  cashReceived: string
  createdAt: Date
  lastModified: Date
  isActive: boolean
}

interface MultiSalesState {
  tabs: SaleTab[]
  activeTabId: string | null
  nextTabNumber: number
}

const STORAGE_KEY = 'pos-multi-sales'
const MAX_TABS = 3
const AUTO_SAVE_INTERVAL = 30000 // 30 segundos

export const useMultiSales = () => {
  const { showSuccess, showWarning, showError } = useNotifications()
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null)

  // Estado principal
  const [state, setState] = useState<MultiSalesState>(() => {
    // Intentar cargar desde localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Convertir fechas de string a Date
          const tabs = parsed.tabs.map((tab: any) => ({
            ...tab,
            createdAt: new Date(tab.createdAt),
            lastModified: new Date(tab.lastModified)
          }))
          return {
            ...parsed,
            tabs,
            activeTabId: tabs.length > 0 ? tabs[0].id : null
          }
        }
      } catch (error) {
        console.error('Error loading saved sales:', error)
      }
    }

    // Estado inicial con una venta por defecto
    const defaultTab = createDefaultTab(1)
    return {
      tabs: [defaultTab],
      activeTabId: defaultTab.id,
      nextTabNumber: 2
    }
  })

  // Obtener la pestaña activa
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId) || null

  // Función para crear una pestaña por defecto
  function createDefaultTab(number: number): SaleTab {
    const now = new Date()
    return {
      id: crypto.randomUUID(),
      name: `Venta ${number}`,
      cart: [],
      customer: null,
      paymentMethod: 'EFECTIVO',
      cashReceived: '',
      createdAt: now,
      lastModified: now,
      isActive: false
    }
  }

  // Guardar en localStorage
  const saveToStorage = useCallback((newState: MultiSalesState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
        showError('Error guardando ventas')
      }
    }
  }, [showError])

  // Auto-guardar cada 30 segundos
  useEffect(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current)
    }

    autoSaveInterval.current = setInterval(() => {
      saveToStorage(state)
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current)
      }
    }
  }, [state, saveToStorage])

  // Guardar inmediatamente al cambiar estado
  useEffect(() => {
    saveToStorage(state)
  }, [state, saveToStorage])

  // Crear nueva pestaña
  const createNewTab = useCallback(() => {
    if (state.tabs.length >= MAX_TABS) {
      showWarning(`Máximo ${MAX_TABS} ventas simultáneas permitidas`)
      return false
    }

    const newTab = createDefaultTab(state.nextTabNumber)
    
    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
      nextTabNumber: prev.nextTabNumber + 1
    }))

    showSuccess(`Nueva venta creada: ${newTab.name}`)
    return true
  }, [state.tabs.length, state.nextTabNumber, showWarning, showSuccess])

  // Cambiar a otra pestaña
  const switchToTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId)
    if (!tab) {
      showError('Venta no encontrada')
      return false
    }

    setState(prev => ({
      ...prev,
      activeTabId: tabId
    }))

    return true
  }, [state.tabs, showError])

  // Cerrar pestaña
  const closeTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId)
    if (!tab) return false

    // No permitir cerrar la última pestaña
    if (state.tabs.length === 1) {
      showWarning('Debe mantener al menos una venta abierta')
      return false
    }

    // Confirmar si tiene productos
    if (tab.cart.length > 0) {
      const confirmed = window.confirm(
        `¿Está seguro de cerrar "${tab.name}"? Se perderán ${tab.cart.length} productos.`
      )
      if (!confirmed) return false
    }

    setState(prev => {
      const newTabs = prev.tabs.filter(t => t.id !== tabId)
      const newActiveId = prev.activeTabId === tabId 
        ? (newTabs[0]?.id || null)
        : prev.activeTabId

      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveId
      }
    })

    showSuccess(`Venta "${tab.name}" cerrada`)
    return true
  }, [state.tabs, state.activeTabId, showWarning, showSuccess])

  // Renombrar pestaña
  const renameTab = useCallback((tabId: string, newName: string) => {
    if (!newName.trim()) {
      showError('El nombre no puede estar vacío')
      return false
    }

    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, name: newName.trim(), lastModified: new Date() }
          : tab
      )
    }))

    showSuccess('Venta renombrada')
    return true
  }, [showError, showSuccess])

  // Actualizar datos de la pestaña activa
  const updateActiveTab = useCallback((updates: Partial<Omit<SaleTab, 'id' | 'createdAt'>>) => {
    if (!state.activeTabId) return false

    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab => 
        tab.id === state.activeTabId
          ? { ...tab, ...updates, lastModified: new Date() }
          : tab
      )
    }))

    return true
  }, [state.activeTabId])

  // Funciones específicas para actualizar datos del carrito
  const updateCart = useCallback((cart: CartItem[]) => {
    return updateActiveTab({ cart })
  }, [updateActiveTab])

  const updateCustomer = useCallback((customer: Customer | null) => {
    return updateActiveTab({ customer })
  }, [updateActiveTab])

  const updatePaymentMethod = useCallback((paymentMethod: PaymentMethod) => {
    return updateActiveTab({ paymentMethod })
  }, [updateActiveTab])

  const updateCashReceived = useCallback((cashReceived: string) => {
    return updateActiveTab({ cashReceived })
  }, [updateActiveTab])

  // Limpiar pestaña activa (equivalente al clearCart original)
  const clearActiveTab = useCallback(() => {
    return updateActiveTab({
      cart: [],
      customer: null,
      paymentMethod: 'EFECTIVO',
      cashReceived: ''
    })
  }, [updateActiveTab])

  // Duplicar pestaña
  const duplicateTab = useCallback((tabId: string) => {
    if (state.tabs.length >= MAX_TABS) {
      showWarning(`Máximo ${MAX_TABS} ventas simultáneas permitidas`)
      return false
    }

    const originalTab = state.tabs.find(t => t.id === tabId)
    if (!originalTab) {
      showError('Venta no encontrada')
      return false
    }

    const newTab: SaleTab = {
      ...originalTab,
      id: crypto.randomUUID(),
      name: `${originalTab.name} (copia)`,
      createdAt: new Date(),
      lastModified: new Date()
    }

    setState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id
    }))

    showSuccess(`Venta duplicada: ${newTab.name}`)
    return true
  }, [state.tabs, showWarning, showError, showSuccess])

  // Guardar manualmente
  const saveManually = useCallback(() => {
    saveToStorage(state)
    showSuccess('Ventas guardadas manualmente')
  }, [state, saveToStorage, showSuccess])

  // Obtener estadísticas
  const getStats = useCallback(() => {
    const totalTabs = state.tabs.length
    const tabsWithItems = state.tabs.filter(tab => tab.cart.length > 0).length
    const totalItems = state.tabs.reduce((sum, tab) => sum + tab.cart.length, 0)
    const tabsWithCustomers = state.tabs.filter(tab => tab.customer !== null).length

    return {
      totalTabs,
      tabsWithItems,
      totalItems,
      tabsWithCustomers,
      canCreateNew: totalTabs < MAX_TABS
    }
  }, [state.tabs])

  return {
    // Estado
    tabs: state.tabs,
    activeTab,
    activeTabId: state.activeTabId,
    
    // Acciones de pestañas
    createNewTab,
    switchToTab,
    closeTab,
    renameTab,
    duplicateTab,
    
    // Acciones de contenido
    updateCart,
    updateCustomer,
    updatePaymentMethod,
    updateCashReceived,
    clearActiveTab,
    
    // Utilidades
    saveManually,
    getStats,
    
    // Constantes
    MAX_TABS
  }
}