// 🎯 HOOKS Y UTILIDADES PARA MANEJO DE ERRORES
// src/hooks/useErrorHandling.ts

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ErrorDetails, ErrorSeverity, ErrorCategory } from '@/components/error/ErrorBoundarySystem'

// 🎯 Hook principal para manejo de errores
export function useErrorHandler() {
  const [errors, setErrors] = useState<ErrorDetails[]>([])
  const [isRecovering, setIsRecovering] = useState(false)
  const retryCountRef = useRef<Map<string, number>>(new Map())

  // 🎯 Función para reportar errores manualmente
  const reportError = useCallback((
    error: Error | string,
    category: ErrorCategory = 'unknown',
    severity: ErrorSeverity = 'medium',
    recoverable: boolean = true
  ) => {
    const errorDetails: ErrorDetails = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      severity,
      category,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      recoverable
    }

    setErrors(prev => [errorDetails, ...prev.slice(0, 9)]) // Keep last 10 errors

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 Manual Error Report [${severity}]:`, errorDetails)
    }

    return errorDetails.id
  }, [])

  // 🎯 Función para intentos de recovery con backoff exponencial
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationId?: string
  ): Promise<T> => {
    const id = operationId || `retry-${Date.now()}`
    const currentRetries = retryCountRef.current.get(id) || 0

    try {
      const result = await operation()
      // Reset retry count on success
      retryCountRef.current.delete(id)
      setIsRecovering(false)
      return result
    } catch (error) {
      if (currentRetries >= maxRetries) {
        retryCountRef.current.delete(id)
        setIsRecovering(false)
        throw error
      }

      retryCountRef.current.set(id, currentRetries + 1)
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, currentRetries)
      
      setIsRecovering(true)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return retryWithBackoff(operation, maxRetries, baseDelay, id)
    }
  }, [])

  // 🎯 Wrapper para operaciones async con manejo de errores automático
  const safeAsync = useCallback(<T>(
    operation: () => Promise<T>,
    errorContext: string = 'Operación',
    category: ErrorCategory = 'unknown'
  ) => {
    return async (): Promise<T | null> => {
      try {
        return await operation()
      } catch (error) {
        reportError(
          error instanceof Error ? error : new Error(String(error)),
          category,
          'medium',
          true
        )
        console.error(`Error in ${errorContext}:`, error)
        return null
      }
    }
  }, [reportError])

  // 🎯 Función para limpiar errores
  const clearErrors = useCallback(() => {
    setErrors([])
    retryCountRef.current.clear()
  }, [])

  // 🎯 Función para obtener estadísticas de errores
  const getErrorStats = useCallback(() => {
    const total = errors.length
    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {} as Record<ErrorSeverity, number>)
    
    const byCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1
      return acc
    }, {} as Record<ErrorCategory, number>)

    return { total, bySeverity, byCategory }
  }, [errors])

  return {
    errors,
    isRecovering,
    reportError,
    retryWithBackoff,
    safeAsync,
    clearErrors,
    getErrorStats
  }
}

// 🎯 Hook para manejo de errores en formularios
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { reportError } = useErrorHandler()

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  const handleSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      setIsSubmitting(true)
      clearAllErrors()
      
      const result = await submitFn()
      
      if (onSuccess) onSuccess(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Report error for tracking
      reportError(err, 'ui', 'medium', true)
      
      if (onError) {
        onError(err)
      } else {
        // Default error handling - try to extract field errors
        if (err.message.includes('validation')) {
          setFieldError('general', 'Por favor verifica los datos ingresados')
        } else {
          setFieldError('general', 'Se produjo un error al enviar el formulario')
        }
      }
      
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [reportError, clearAllErrors, setFieldError])

  return {
    fieldErrors,
    isSubmitting,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    handleSubmit
  }
}

// 🎯 Hook para manejo de errores en APIs
export function useApiErrorHandler() {
  const { reportError, retryWithBackoff } = useErrorHandler()
  const [loading, setLoading] = useState(false)
  
  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: {
      retries?: number
      context?: string
      onError?: (error: Error) => void
      onSuccess?: (data: T) => void
    } = {}
  ): Promise<T | null> => {
    const { retries = 2, context = 'API Call', onError, onSuccess } = options
    
    try {
      setLoading(true)
      
      const result = await retryWithBackoff(apiCall, retries, 1000, context)
      
      if (onSuccess) onSuccess(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Determine error category
      let category: ErrorCategory = 'network'
      if (err.message.includes('401') || err.message.includes('unauthorized')) {
        category = 'auth'
      } else if (err.message.includes('403') || err.message.includes('forbidden')) {
        category = 'permission'
      } else if (err.message.includes('400') || err.message.includes('validation')) {
        category = 'data'
      }
      
      reportError(err, category, 'medium', true)
      
      if (onError) {
        onError(err)
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [reportError, retryWithBackoff])

  return {
    loading,
    handleApiCall
  }
}

// 🎯 Hook para manejo global de errores no capturados
export function useGlobalErrorHandler() {
  const { reportError } = useErrorHandler()

  useEffect(() => {
    // Manejar errores de JavaScript no capturados
    const handleError = (event: ErrorEvent) => {
      reportError(
        new Error(event.message),
        'unknown',
        'high',
        false
      )
    }

    // Manejar promesas rechazadas no manejadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        'unknown',
        'high',
        false
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [reportError])
}

// 🎯 Utilidades para clasificación automática de errores
export const ErrorUtils = {
  // Determinar si un error es recuperable
  isRecoverable: (error: Error): boolean => {
    const message = error.message.toLowerCase()
    const stack = error.stack || ''
    
    // Errores no recuperables
    const nonRecoverable = [
      'out of memory',
      'maximum call stack',
      'critical',
      'fatal',
      'syntax error',
      'reference error'
    ]
    
    return !nonRecoverable.some(pattern => 
      message.includes(pattern) || stack.includes(pattern)
    )
  },

  // Clasificar severidad automáticamente
  classifySeverity: (error: Error): ErrorSeverity => {
    const message = error.message.toLowerCase()
    
    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical'
    }
    if (message.includes('auth') || message.includes('permission')) {
      return 'high'
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'medium'
    }
    return 'low'
  },

  // Clasificar categoría automáticamente
  classifyCategory: (error: Error): ErrorCategory => {
    const message = error.message.toLowerCase()
    const stack = error.stack || ''
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network'
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth'
    }
    if (message.includes('permission') || message.includes('access denied')) {
      return 'permission'
    }
    if (stack.includes('components') || message.includes('render')) {
      return 'ui'
    }
    if (message.includes('data') || message.includes('parse') || message.includes('json')) {
      return 'data'
    }
    return 'unknown'
  },

  // Generar mensaje de error amigable para el usuario
  getUserFriendlyMessage: (error: Error, context?: string): string => {
    const category = ErrorUtils.classifyCategory(error)
    const baseContext = context ? `${context}: ` : ''
    
    switch (category) {
      case 'network':
        return `${baseContext}Problema de conexión. Verifica tu internet e intenta de nuevo.`
      case 'auth':
        return `${baseContext}Tu sesión ha expirado. Por favor inicia sesión nuevamente.`
      case 'permission':
        return `${baseContext}No tienes permisos para realizar esta acción.`
      case 'data':
        return `${baseContext}Los datos enviados no son válidos. Verifica la información.`
      case 'ui':
        return `${baseContext}Error en la interfaz. Intenta recargar la página.`
      default:
        return `${baseContext}Se produjo un error inesperado. Intenta de nuevo.`
    }
  }
}

// 🎯 Provider context para errores globales
import { createContext, useContext } from 'react'

interface ErrorContextType {
  reportError: (error: Error | string, category?: ErrorCategory, severity?: ErrorSeverity) => string
  clearErrors: () => void
  errors: ErrorDetails[]
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const errorHandler = useErrorHandler()
  
  useGlobalErrorHandler()
  
  return (
    <ErrorContext.Provider value={errorHandler}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}