// src/hooks/useMultiSalesEnhanced.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useIndexedDB } from '@/lib/indexedDB'
import { useSyncQueue } from '@/lib/syncQueue'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
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
  syncStatus: 'DRAFT' | 'PENDING_SYNC' | 'SYNCED' | 'CONFLICT'
  lastSyncAttempt?: Date
  syncError?: string
}

interface MultiSalesState {
  tabs: SaleTab[]
  activeTabId: string | null
  nextTabNumber: number
  initialized: boolean
  recoveryMode: boolean
}

const STORAGE_KEY = 'pos-multi-sales'
const MAX_TABS = 3
const AUTO_SAVE_INTERVAL = 30000 // 30 segundos
const BACKUP_INTERVAL = 300000 // 5 minutos para IndexedDB

export const useMultiSalesEnhanced = () => {
  const { showSuccess, showWarning, showError, showInfo } = useNotifications()
  const { 
    initDB, 
    saveSalesData, 
    getSalesData, 
    setMetadata 
  } = useIndexedDB()
  const { addSaleToQueue } = useSyncQueue()
  const { isOnline, shouldSyncNow } = useNetworkStatus()
  
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null)
  const backupInterval = useRef<NodeJS.Timeout | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Estado principal
  const [state, setState] = useState<MultiSalesState>(() => ({
    tabs: [],
    activeTabId: null,
    nextTabNumber: 1,
    initialized: false,
    recoveryMode: false
  }))

  // Inicialización del sistema
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // 1. Inicializar IndexedDB
        const dbInitialized = await initDB()
        
        // 2. Intentar cargar desde localStorage primero
        let localData: MultiSalesState | null = null
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
              const parsed = JSON.parse(saved)
              const tabs = parsed.tabs.map((tab: any) => ({
                ...tab,
                createdAt: new Date(tab.createdAt),
                lastModified: new Date(tab.lastModified),
                syncStatus: tab.syncStatus || 'DRAFT'
              }))
              localData = {
                ...parsed,
                tabs,
                initialized: true,
                recoveryMode: false
              }
            }
          } catch (error) {
            console.error('Error loading from localStorage:', error)
          }
        }

        // 3. Si IndexedDB está disponible, verificar si hay datos de backup
        let indexedData: Record<string, any> = {}
        if (dbInitialized) {
          try {
            indexedData = await getSalesData()
          } catch (error) {
            console.error('Error loading from IndexedDB:', error)
          }
        }

        // 4. Decidir qué datos usar
        const hasLocalData = localData && localData.tabs.length > 0
        const hasIndexedData = Object.keys(indexedData).length > 0
        
        let finalState: MultiSalesState

        if (hasLocalData && hasIndexedData) {
          // Ambos tienen datos - entrar en modo recuperación
          console.log('Multiple data sources found, entering recovery mode')
          finalState = {
            ...localData!,
            recoveryMode: true
          }
        } else if (hasLocalData) {
          // Solo localStorage tiene datos
          finalState = localData!
        } else if (hasIndexedData) {
          // Solo IndexedDB tiene datos - recuperar
          const tabs = Object.entries(indexedData).map(([id, data]: [string, any]) => ({
            id,
            name: data.name || `Venta ${id}`,
            cart: data.cart || [],
            customer: data.customer || null,
            paymentMethod: data.paymentMethod || 'EFECTIVO',
            cashReceived: data.cashReceived || '',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            lastModified: new Date(),
            isActive: false,
            syncStatus: 'DRAFT' as const
          }))
          
          finalState = {
            tabs,
            activeTabId: tabs.length > 0 ? tabs[0].id : null,
            nextTabNumber: tabs.length + 1,
            initialized: true,
            recoveryMode: false
          }
          
          showInfo(
            'Datos recuperados', 
            `Se recuperaron ${tabs.length} ventas desde el backup`
          )
        } else {
          // No hay datos - crear estado inicial
          const defaultTab = createDefaultTab(1)
          finalState = {
            tabs: [defaultTab],
            activeTabId: defaultTab.id,
            nextTabNumber: 2,
            initialized: true,
            recoveryMode: false
          }
        }

        setState(finalState)
        setIsInitialized(true)

        // 5. Marcar inicialización en metadatos
        if (dbInitialized) {
          await setMetadata('lastInit', new Date().toISOString())
        }

      } catch (error) {
        console.error('Error initializing enhanced multi-sales:', error)
        showError('Error de inicialización', 'No se pudo inicializar el sistema de ventas')
        
        // Fallback al estado básico
        const defaultTab = createDefaultTab(1)
        setState({
          tabs: [defaultTab],
          activeTabId: defaultTab.id,
          nextTabNumber: 2,
          initialized: true,
          recoveryMode: false
        })
        setIsInitialized(true)
      }
    }

    initializeSystem()
  }, [initDB, getSalesData, setMetadata, showError, showInfo])

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
      isActive: false,
      syncStatus: 'DRAFT'
    }
  }

  // Guardar en localStorage con manejo de errores mejorado
  const saveToStorage = useCallback(async (newState: MultiSalesState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
        showWarning(
          'Almacenamiento lleno', 
          'No se pudo guardar en localStorage. Usando backup en IndexedDB.'
        )
      }
    }
  }, [showWarning])

  // Backup en IndexedDB
  const backupToIndexedDB = useCallback(async (salesState: MultiSalesState) => {
    try {
      // Convertir tabs a formato de datos simples
      const salesData: Record<string, any> = {}
      salesState.tabs.forEach(tab => {
        salesData[tab.id] = {
          name: tab.name,
          cart: tab.cart,
          customer: tab.customer,
          paymentMethod: tab.paymentMethod,
          cashReceived: tab.cashReceived,
          createdAt: tab.createdAt.toISOString()
        }
      })

      await saveSalesData(salesData)
      await setMetadata('lastBackup', new Date().toISOString())
      
      console.log('Data backed up to IndexedDB successfully')
    } catch (error) {
      console.error('Error backing up to IndexedDB:', error)
    }
  }, [saveSalesData, setMetadata])

  // Auto-guardar mejorado
  useEffect(() => {
    if (!isInitialized || state.tabs.length === 0) return

    // Limpiar intervalos anteriores
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current)
    }
    if (backupInterval.current) {
      clearInterval(backupInterval.current)
    }

    // Auto-save a localStorage cada 30 segundos
    autoSaveInterval.current = setInterval(() => {
      saveToStorage(state)
    }, AUTO_SAVE_INTERVAL)

    // Backup a IndexedDB cada 5 minutos
    backupInterval.current = setInterval(() => {
      backupToIndexedDB(state)
    }, BACKUP_INTERVAL)

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current)
      }
      if (backupInterval.current) {
        clearInterval(backupInterval.current)
      }
    }
  }, [isInitialized, state, saveToStorage, backupToIndexedDB])

  // Función para actualizar estado y guardar
  const updateState = useCallback((updater: (prev: MultiSalesState) => MultiSalesState) => {
    setState(prev => {
      const newState = updater(prev)
      
      // Marcar tabs modificados
      const now = new Date()
      const updatedTabs = newState.tabs.map(tab => ({
        ...tab,
        lastModified: tab.id === newState.activeTabId ? now : tab.lastModified
      }))

      const finalState = {
        ...newState,
        tabs: updatedTabs
      }

      // Guardar inmediatamente en localStorage
      saveToStorage(finalState)
      
      return finalState
    })
  }, [saveToStorage])

  // ==========================================
  // FUNCIONES PRINCIPALES (Compatibles con el hook original)
  // ==========================================

  const createNewTab = useCallback(() => {
    if (state.tabs.length >= MAX_TABS) {
      showWarning('Límite alcanzado', `Solo se permiten ${MAX_TABS} ventas en paralelo`)
      return null
    }

    const newTab = createDefaultTab(state.nextTabNumber)
    
    updateState(prev => ({
      ...prev,
      tabs: [...prev.tabs, newTab],
      activeTabId: newTab.id,
      nextTabNumber: prev.nextTabNumber + 1
    }))

    showSuccess('Nueva venta', `Creada: ${newTab.name}`)
    return newTab.id
  }, [state.tabs.length, state.nextTabNumber, updateState, showSuccess, showWarning])

  const switchToTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId)
    if (!tab) return false

    updateState(prev => ({
      ...prev,
      activeTabId: tabId
    }))

    return true
  }, [state.tabs, updateState])

  const closeTab = useCallback((tabId: string) => {
    const tab = state.tabs.find(t => t.id === tabId)
    if (!tab) return false

    // Verificar si tiene datos antes de cerrar
    if (tab.cart.length > 0 || tab.customer) {
      const confirmed = confirm(
        `¿Estás seguro de cerrar "${tab.name}"? Se perderán ${tab.cart.length} productos y la información del cliente.`
      )
      if (!confirmed) return false
    }

    updateState(prev => {
      const newTabs = prev.tabs.filter(t => t.id !== tabId)
      
      if (newTabs.length === 0) {
        // Si no quedan tabs, crear uno nuevo
        const defaultTab = createDefaultTab(1)
        return {
          ...prev,
          tabs: [defaultTab],
          activeTabId: defaultTab.id,
          nextTabNumber: 2
        }
      }

      // Si se cierra el tab activo, activar el primero
      const newActiveTabId = prev.activeTabId === tabId ? newTabs[0].id : prev.activeTabId

      return {
        ...prev,
        tabs: newTabs,
        activeTabId: newActiveTabId
      }
    })

    showInfo('Venta cerrada', `Se cerró "${tab.name}"`)
    return true
  }, [state.tabs, updateState, showInfo])

  const renameTab = useCallback((tabId: string, newName: string) => {
    if (!newName.trim()) return false

    updateState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === tabId ? { ...tab, name: newName.trim() } : tab
      )
    }))

    return true
  }, [updateState])

  const duplicateTab = useCallback((tabId: string) => {
    if (state.tabs.length >= MAX_TABS) {
      showWarning('Límite alcanzado', `Solo se permiten ${MAX_TABS} ventas en paralelo`)
      return null
    }

    const originalTab = state.tabs.find(t => t.id === tabId)
    if (!originalTab) return null

    const duplicatedTab: SaleTab = {
      ...originalTab,
      id: crypto.randomUUID(),
      name: `${originalTab.name} (Copia)`,
      createdAt: new Date(),
      lastModified: new Date(),
      syncStatus: 'DRAFT'
    }

    updateState(prev => ({
      ...prev,
      tabs: [...prev.tabs, duplicatedTab],
      activeTabId: duplicatedTab.id,
      nextTabNumber: prev.nextTabNumber + 1
    }))

    showSuccess('Venta duplicada', `Creada: ${duplicatedTab.name}`)
    return duplicatedTab.id
  }, [state.tabs, state.nextTabNumber, updateState, showSuccess, showWarning])

  // Funciones de actualización de datos (compatibles con el hook original)
  const updateCart = useCallback((newCart: CartItem[]) => {
    if (!activeTab) return

    updateState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === activeTab.id 
          ? { ...tab, cart: newCart, syncStatus: 'DRAFT' as const }
          : tab
      )
    }))
  }, [activeTab, updateState])

  const updateCustomer = useCallback((customer: Customer | null) => {
    if (!activeTab) return

    updateState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === activeTab.id 
          ? { ...tab, customer, syncStatus: 'DRAFT' as const }
          : tab
      )
    }))
  }, [activeTab, updateState])

  const updatePaymentMethod = useCallback((method: PaymentMethod) => {
    if (!activeTab) return

    updateState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === activeTab.id 
          ? { ...tab, paymentMethod: method, syncStatus: 'DRAFT' as const }
          : tab
      )
    }))
  }, [activeTab, updateState])

  const updateCashReceived = useCallback((amount: string) => {
    if (!activeTab) return

    updateState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === activeTab.id 
          ? { ...tab, cashReceived: amount, syncStatus: 'DRAFT' as const }
          : tab
      )
    }))
  }, [activeTab, updateState])

  const clearActiveTab = useCallback(() => {
    if (!activeTab) return

    updateState(prev => ({
      ...prev,
      tabs: prev.tabs.map(tab =>
        tab.id === activeTab.id 
          ? { 
              ...tab, 
              cart: [], 
              customer: null, 
              paymentMethod: 'EFECTIVO' as PaymentMethod,
              cashReceived: '',
              syncStatus: 'DRAFT' as const
            }
          : tab
      )
    }))
  }, [activeTab, updateState])

  // Nueva función: Completar venta con cola de sincronización
  const completeSale = useCallback(async (saleData: any) => {
    if (!activeTab || !isOnline) {
      // Si no hay conexión, agregar a cola
      try {
        const queueId = await addSaleToQueue(saleData, { priority: 'high' })
        
        // Marcar como pendiente de sincronización
        updateState(prev => ({
          ...prev,
          tabs: prev.tabs.map(tab =>
            tab.id === activeTab?.id 
              ? { 
                  ...tab, 
                  syncStatus: 'PENDING_SYNC' as const,
                  lastSyncAttempt: new Date()
                }
              : tab
          )
        }))

        showInfo(
          'Venta guardada offline', 
          'La venta se sincronizará cuando se restaure la conexión'
        )
        
        return { success: true, queueId, offline: true }
      } catch (error) {
        showError('Error guardando venta', 'No se pudo guardar la venta offline')
        return { success: false, error }
      }
    }

    // Procesar venta online normalmente
    try {
      // Aquí iría la lógica de procesamiento normal
      // Por ahora, marcamos como sincronizada
      updateState(prev => ({
        ...prev,
        tabs: prev.tabs.map(tab =>
          tab.id === activeTab?.id 
            ? { 
                ...tab, 
                syncStatus: 'SYNCED' as const,
                lastSyncAttempt: new Date()
              }
            : tab
        )
      }))

      return { success: true, offline: false }
    } catch (error) {
      return { success: false, error }
    }
  }, [activeTab, isOnline, addSaleToQueue, updateState, showInfo, showError])

  // Función para forzar backup manual
  const forceBackup = useCallback(async () => {
    try {
      await backupToIndexedDB(state)
      await setMetadata('manualBackup', new Date().toISOString())
      showSuccess('Backup completado', 'Datos guardados en backup local')
    } catch (error) {
      showError('Error en backup', 'No se pudo crear el backup')
    }
  }, [state, backupToIndexedDB, setMetadata, showSuccess, showError])

  // Estado de recuperación para UI
  const recoveryInfo = {
    hasRecoveryData: state.recoveryMode,
    tabCount: state.tabs.length,
    canRecover: isInitialized
  }

  // ==========================================
  // RETORNO DEL HOOK (Compatible + Nuevas funciones)
  // ==========================================

  return {
    // Estado principal (compatible)
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    activeTab,
    
    // Datos de la pestaña activa (compatible)
    cart: activeTab?.cart || [],
    customer: activeTab?.customer || null,
    paymentMethod: activeTab?.paymentMethod || 'EFECTIVO',
    cashReceived: activeTab?.cashReceived || '',
    
    // Funciones principales (compatible)
    createNewTab,
    switchToTab,
    closeTab,
    renameTab,
    duplicateTab,
    updateCart,
    updateCustomer,
    updatePaymentMethod,
    updateCashReceived,
    clearActiveTab,
    
    // Nuevas funciones mejoradas
    completeSale,
    forceBackup,
    
    // Estados mejorados
    isInitialized,
    isOnline,
    shouldSyncNow,
    recoveryInfo,
    
    // Estadísticas
    totalTabs: state.tabs.length,
    totalProducts: state.tabs.reduce((sum, tab) => sum + tab.cart.length, 0),
    totalAmount: state.tabs.reduce((sum, tab) => 
      sum + tab.cart.reduce((tabSum, item) => tabSum + item.subtotal, 0), 0
    ),
    
    // Estado de sincronización
    syncStatus: {
      draft: state.tabs.filter(tab => tab.syncStatus === 'DRAFT').length,
      pending: state.tabs.filter(tab => tab.syncStatus === 'PENDING_SYNC').length,
      synced: state.tabs.filter(tab => tab.syncStatus === 'SYNCED').length,
      conflicts: state.tabs.filter(tab => tab.syncStatus === 'CONFLICT').length
    }
  }
}

export default useMultiSalesEnhanced