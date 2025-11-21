'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useNotifications } from '@/components/ui/NotificationProvider'
import { useBranchStore } from '@/hooks/useBranchStore'
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  FileText,
  Clock,
  User,
  TrendingUp,
  AlertCircle,
  LogIn
} from 'lucide-react'

interface CashRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface TurnSummary {
  totalSales: number
  totalAmount: number
  cash: { count: number; amount: number }
  card: { count: number; amount: number }
  transfer: { count: number; amount: number }
  credit: { count: number; amount: number }
}

export function CashRegisterModal({ isOpen, onClose, onSuccess }: CashRegisterModalProps) {
  const { data: session } = useSession()
  const { showSuccess, showError, showWarning } = useNotifications()
  const { currentBranch } = useBranchStore()
  
  const [loading, setLoading] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [summary, setSummary] = useState<TurnSummary | null>(null)
  const [currentClosure, setCurrentClosure] = useState<any>(null)
  
  // Form state para CERRAR caja
  const [cashReal, setCashReal] = useState('')
  const [notes, setNotes] = useState('')
  
  // Form state para ABRIR caja
  const [initialFund, setInitialFund] = useState('500')
  const [shift, setShift] = useState('GENERAL')

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCurrentClosure()
    }
  }, [isOpen])

  // Cargar resumen cuando hay un corte abierto
  useEffect(() => {
    if (currentClosure) {
      loadTurnSummary()
    }
  }, [currentClosure])

  const loadCurrentClosure = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cash-register?action=current')
      const data = await response.json()
      
      console.log('📊 Estado de la caja:', data)
      
      if (data.hasOpenClosure) {
        setCurrentClosure(data.closure)
      } else {
        setCurrentClosure(null)
      }
    } catch (error) {
      console.error('Error cargando corte:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTurnSummary = async () => {
    setLoadingSummary(true)
    try {
      const fromDate = currentClosure?.opened_at 
        ? new Date(currentClosure.opened_at).toISOString()
        : undefined
      
      const url = fromDate 
        ? `/api/cash-register/summary?from=${fromDate}`
        : '/api/cash-register/summary'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error cargando resumen:', error)
      showError('Error al cargar resumen del turno')
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleOpenCashRegister = async () => {
    if (!initialFund || parseFloat(initialFund) < 0) {
      showWarning('Campo requerido', 'Debes ingresar el fondo inicial')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          closureData: {
            initialFund: parseFloat(initialFund),
            shift: shift,
            branchId: currentBranch?.id || null
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al abrir corte')
      }

      showSuccess('Caja abierta', `Corte ${data.closure.folio} abierto exitosamente`)
      
      // Recargar datos
      await loadCurrentClosure()
      
      onSuccess?.()

    } catch (error) {
      console.error('Error abriendo corte:', error)
      showError('Error', error instanceof Error ? error.message : 'Error al abrir corte')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseCashRegister = async () => {
    if (!cashReal || parseFloat(cashReal) < 0) {
      showWarning('Campo requerido', 'Debes ingresar el efectivo real en caja')
      return
    }

    if (!currentClosure) {
      showError('Error', 'No hay un corte abierto')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cash-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          closureData: {
            closureId: currentClosure.id,
            cashReal: parseFloat(cashReal),
            notes: notes.trim()
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cerrar corte')
      }

      showSuccess('Corte de caja cerrado', 'El corte se cerró exitosamente')
      
      // Resetear formulario
      setCashReal('')
      setNotes('')
      setCurrentClosure(null)
      setSummary(null)
      
      onSuccess?.()
      onClose()

    } catch (error) {
      console.error('Error cerrando corte:', error)
      showError('Error', error instanceof Error ? error.message : 'Error al cerrar corte')
    } finally {
      setLoading(false)
    }
  }

  const cashExpected = summary?.cash.amount || 0
  const cashDifference = cashReal ? parseFloat(cashReal) - cashExpected : 0

  // Si está cargando, mostrar loader CON DialogTitle para accesibilidad
  if (loading && !currentClosure) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Cargando...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Si NO hay corte abierto, mostrar formulario para ABRIR
  if (!currentClosure) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <LogIn className="h-6 w-6 text-green-600" />
              Abrir Caja
            </DialogTitle>
            <DialogDescription>
              Inicia un nuevo turno de ventas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información del Usuario */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Vendedor:</span>
                <span>{session?.user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Fecha:</span>
                <span>{new Date().toLocaleDateString('es-MX')}</span>
              </div>
              {currentBranch && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Sucursal:</span>
                  <span>{currentBranch.name}</span>
                </div>
              )}
            </div>

            {/* Formulario de Apertura */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialFund" className="text-base font-medium">
                  Fondo inicial en efectivo: *
                </Label>
                <Input
                  id="initialFund"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500.00"
                  value={initialFund}
                  onChange={(e) => setInitialFund(e.target.value)}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-gray-500">
                  Dinero con el que inicias el día para dar cambio
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift" className="text-base font-medium">
                  Turno:
                </Label>
                <select
                  id="shift"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="GENERAL">General / Todo el día</option>
                  <option value="MATUTINO">Matutino (6am - 2pm)</option>
                  <option value="VESPERTINO">Vespertino (2pm - 10pm)</option>
                  <option value="NOCTURNO">Nocturno (10pm - 6am)</option>
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenCashRegister}
                disabled={loading || !initialFund}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Abriendo...' : '🔓 Abrir Caja'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Si HAY corte abierto, mostrar resumen para CERRAR
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Corte de Caja
          </DialogTitle>
          <DialogDescription>
            Resumen de ventas del turno actual
          </DialogDescription>
        </DialogHeader>

        {loadingSummary ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del Usuario y Turno */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Vendedor:</span>
                <span>{session?.user?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Apertura:</span>
                <span>{new Date(currentClosure.opened_at).toLocaleString('es-MX')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Folio:</span>
                <span className="font-mono">{currentClosure.folio}</span>
              </div>
            </div>

            {/* Resumen de Ventas */}
            {summary && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Resumen de Ventas</h3>
                </div>

                {/* Total General */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Total de Ventas</p>
                      <p className="text-3xl font-bold text-blue-700">
                        ${summary.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-700">
                        {summary.totalSales}
                      </p>
                      <p className="text-sm text-gray-600">tickets</p>
                    </div>
                  </div>
                </div>

                {/* Desglose por Método de Pago */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Efectivo */}
                  <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-sm">Efectivo</span>
                    </div>
                    <p className="text-xl font-bold text-green-700">
                      ${summary.cash.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">{summary.cash.count} transacciones</p>
                  </div>

                  {/* Tarjeta */}
                  <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-sm">Tarjeta</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700">
                      ${summary.card.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">{summary.card.count} transacciones</p>
                  </div>

                  {/* Transferencia */}
                  <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-sm">Transferencia</span>
                    </div>
                    <p className="text-xl font-bold text-purple-700">
                      ${summary.transfer.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">{summary.transfer.count} transacciones</p>
                  </div>

                  {/* Crédito */}
                  <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-sm">Crédito</span>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                      ${summary.credit.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600">{summary.credit.count} transacciones</p>
                  </div>
                </div>

                {/* Formulario de Cierre */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Efectivo en Caja
                  </h4>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900">Efectivo esperado:</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          ${cashExpected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cashReal" className="text-base font-medium">
                      Efectivo real en caja: *
                    </Label>
                    <Input
                      id="cashReal"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cashReal}
                      onChange={(e) => setCashReal(e.target.value)}
                      className="text-lg font-semibold"
                    />
                    <p className="text-xs text-gray-500">
                      Cuenta el efectivo físico en caja e ingrésalo aquí
                    </p>
                  </div>

                  {/* Mostrar diferencia si hay */}
                  {cashReal && (
                    <div className={`rounded-lg p-3 ${
                      Math.abs(cashDifference) < 0.01 
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className="text-sm font-medium mb-1">
                        {Math.abs(cashDifference) < 0.01 ? '✅ Cuadra perfecto' : '⚠️ Diferencia detectada'}
                      </p>
                      <p className={`text-2xl font-bold ${
                        Math.abs(cashDifference) < 0.01 
                          ? 'text-green-700' 
                          : cashDifference > 0 
                            ? 'text-blue-700' 
                            : 'text-red-700'
                      }`}>
                        {cashDifference > 0 ? '+' : ''}
                        ${Math.abs(cashDifference).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {cashDifference > 0 
                          ? 'Sobrante en caja' 
                          : cashDifference < 0 
                            ? 'Faltante en caja' 
                            : 'Sin diferencias'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observaciones (opcional):</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notas, comentarios o explicación de diferencias..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCloseCashRegister}
                disabled={loading || !cashReal}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Cerrando...' : '✅ Cerrar Caja'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
