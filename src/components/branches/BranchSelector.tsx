'use client'

import { useEffect } from 'react'
import { Building2, Check, ChevronDown } from 'lucide-react'
import { useBranchStore } from '@/hooks/useBranchStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function BranchSelector() {
  const { currentBranch, availableBranches, setCurrentBranch, loadBranches, isLoading } = useBranchStore()

  useEffect(() => {
    // 🔥 PRIORIDAD BAJA: Esperar 2.5 segundos antes de cargar sucursales
    // Esto da prioridad a productos y clientes en el POS
    const timer = setTimeout(() => {
      console.log('🏢 Cargando sucursales (prioridad baja)...')
      loadBranches()
    }, 2500)
    
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg animate-pulse">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">Cargando...</span>
      </div>
    )
  }

  if (!currentBranch) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[200px]">
          <Building2 className="h-4 w-4 text-blue-600" />
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">{currentBranch.name}</div>
            <div className="text-xs text-gray-500">{currentBranch.code}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Seleccionar Sucursal</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableBranches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => setCurrentBranch(branch)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{branch.name}</span>
                {branch.isMain && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Principal
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {branch.code} • {branch.city}
              </div>
            </div>
            {currentBranch.id === branch.id && (
              <Check className="h-4 w-4 text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}

        {availableBranches.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-gray-500">
            No hay sucursales disponibles
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
