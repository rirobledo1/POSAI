// 🛡️ ERROR BOUNDARY SYSTEM - SISTEMA COMPLETO DE MANEJO DE ERRORES
// src/components/error/ErrorBoundarySystem.tsx

'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// 🎯 Tipos de errores que manejamos
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'network' | 'ui' | 'data' | 'auth' | 'permission' | 'unknown'

export interface ErrorDetails {
  id: string
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  recoverable: boolean
}

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, details: ErrorDetails) => void
  level?: 'page' | 'section' | 'component'
  showDetails?: boolean
  enableRecovery?: boolean
  enableReporting?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorDetails: ErrorDetails | null
  isRecovering: boolean
  recoveryAttempts: number
}

// 🎯 Error Logger centralized
class ErrorLogger {
  private static instance: ErrorLogger
  private errors: ErrorDetails[] = []
  private maxErrors = 100

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  log(details: ErrorDetails) {
    this.errors.unshift(details)
    if (this.errors.length > this.maxErrors) {
      this.errors.pop()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error ${details.severity.toUpperCase()}: ${details.category}`)
      console.error('Message:', details.message)
      console.error('Stack:', details.stack)
      console.error('Details:', details)
      console.groupEnd()
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendToMonitoring(details)
    }
  }

  private sendToMonitoring(details: ErrorDetails) {
    // Integration with Sentry, LogRocket, etc.
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(details.message), {
        tags: {
          severity: details.severity,
          category: details.category,
          recoverable: details.recoverable
        },
        extra: details
      })
    }

    // Custom API endpoint for error reporting
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    }).catch(() => {
      // Fail silently to avoid infinite error loops
    })
  }

  getRecentErrors(): ErrorDetails[] {
    return this.errors.slice(0, 10)
  }

  clearErrors() {
    this.errors = []
  }
}

// 🎯 Error Analyzer - Clasifica errores automáticamente
class ErrorAnalyzer {
  static analyze(error: Error): Partial<ErrorDetails> {
    const message = error.message.toLowerCase()
    const stack = error.stack || ''

    // Determinar categoría
    let category: ErrorCategory = 'unknown'
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      category = 'network'
    } else if (message.includes('unauthorized') || message.includes('forbidden')) {
      category = 'auth'
    } else if (message.includes('permission') || message.includes('access denied')) {
      category = 'permission'
    } else if (stack.includes('components') || message.includes('render')) {
      category = 'ui'
    } else if (message.includes('data') || message.includes('parse') || message.includes('json')) {
      category = 'data'
    }

    // Determinar severidad
    let severity: ErrorSeverity = 'medium'
    if (message.includes('critical') || message.includes('fatal')) {
      severity = 'critical'
    } else if (category === 'auth' || category === 'permission') {
      severity = 'high'
    } else if (category === 'network' || category === 'data') {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    // Determinar si es recuperable
    const recoverable = !['critical', 'auth'].includes(category) && 
                       !message.includes('fatal') && 
                       !message.includes('out of memory')

    return {
      category,
      severity,
      recoverable
    }
  }
}

// 🎯 Error Boundary Component Principal
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null
  private logger = ErrorLogger.getInstance()

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null,
      isRecovering: false,
      recoveryAttempts: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const analysis = ErrorAnalyzer.analyze(error)
    
    const errorDetails: ErrorDetails = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: this.getUserId(),
      ...analysis
    } as ErrorDetails

    this.setState({
      error,
      errorInfo,
      errorDetails
    })

    // Log error
    this.logger.log(errorDetails)

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorDetails)
    }

    // Auto-recovery for recoverable errors
    if (this.props.enableRecovery && errorDetails.recoverable && this.state.recoveryAttempts < 3) {
      this.attemptRecovery()
    }
  }

  private getUserId(): string | undefined {
    // Try to get user ID from session or local storage
    try {
      if (typeof window !== 'undefined') {
        const session = localStorage.getItem('session')
        if (session) {
          const parsed = JSON.parse(session)
          return parsed.user?.id
        }
      }
    } catch {
      // Ignore errors getting user ID
    }
    return undefined
  }

  private attemptRecovery = () => {
    this.setState({ isRecovering: true })

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorDetails: null,
        isRecovering: false,
        recoveryAttempts: prevState.recoveryAttempts + 1
      }))
    }, 2000) // Wait 2 seconds before recovering
  }

  private handleManualRecovery = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
    this.attemptRecovery()
  }

  private handleReportError = () => {
    if (this.state.errorDetails) {
      // Copy error details to clipboard
      const errorReport = {
        id: this.state.errorDetails.id,
        message: this.state.errorDetails.message,
        timestamp: new Date(this.state.errorDetails.timestamp).toISOString(),
        url: this.state.errorDetails.url,
        severity: this.state.errorDetails.severity,
        category: this.state.errorDetails.category
      }

      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2)).then(() => {
        alert('Detalles del error copiados al portapapeles')
      }).catch(() => {
        alert('No se pudieron copiar los detalles')
      })
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { errorDetails, isRecovering } = this.state
      const level = this.props.level || 'component'

      return (
        <Card className={`border-red-200 ${level === 'page' ? 'm-4' : 'm-2'}`}>
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <ExclamationTriangleIcon className="h-5 w-5" />
              {level === 'page' ? 'Error en la Página' : 
               level === 'section' ? 'Error en la Sección' : 
               'Error en el Componente'}
              {errorDetails && (
                <Badge 
                  variant={
                    errorDetails.severity === 'critical' ? 'destructive' :
                    errorDetails.severity === 'high' ? 'destructive' :
                    errorDetails.severity === 'medium' ? 'secondary' : 'outline'
                  }
                >
                  {errorDetails.severity}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                {level === 'page' ? 
                  'Se produjo un error inesperado en esta página.' :
                  'Se produjo un error en esta sección de la página.'
                }
                {errorDetails?.recoverable && ' Este error puede ser recuperable.'}
              </p>

              {isRecovering && (
                <div className="flex items-center gap-2 text-blue-600">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Intentando recuperación automática...</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={this.handleManualRecovery}
                  disabled={isRecovering}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Intentar de nuevo
                </Button>

                {level === 'page' && (
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <HomeIcon className="h-4 w-4" />
                    Ir al Dashboard
                  </Button>
                )}

                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Recargar página
                </Button>

                {this.props.enableReporting && (
                  <Button 
                    onClick={this.handleReportError}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                    Copiar detalles
                  </Button>
                )}
              </div>

              {/* Debug info (only in development) */}
              {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Detalles técnicos (desarrollo)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                    <div className="text-red-600 font-bold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="text-gray-600 whitespace-pre-wrap mb-2">
                        {this.state.error.stack}
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div className="text-blue-600">
                        Component Stack:
                        <div className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </div>
                      </div>
                    )}
                    {errorDetails && (
                      <div className="mt-2 p-2 bg-white rounded">
                        <strong>Error Details:</strong>
                        <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {errorDetails && (
                <div className="text-xs text-gray-500">
                  ID del error: {errorDetails.id}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary