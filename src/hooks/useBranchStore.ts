import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Branch {
  id: string
  name: string
  code: string
  isMain: boolean
  city: string
  state: string
}

interface BranchStore {
  currentBranch: Branch | null
  availableBranches: Branch[]
  setCurrentBranch: (branch: Branch) => void
  setAvailableBranches: (branches: Branch[]) => void
  loadBranches: () => Promise<void>
  clearBranches: () => void  // 🆕 Nueva función para limpiar
  isLoading: boolean
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      currentBranch: null,
      availableBranches: [],
      isLoading: false,

      setCurrentBranch: (branch) => {
        set({ currentBranch: branch })
        console.log('✅ Sucursal activa:', branch.name)
      },

      setAvailableBranches: (branches) => {
        set({ availableBranches: branches })
        
        // Si no hay sucursal seleccionada, seleccionar la principal
        const current = get().currentBranch
        if (!current && branches.length > 0) {
          const mainBranch = branches.find(b => b.isMain) || branches[0]
          set({ currentBranch: mainBranch })
        }
      },

      loadBranches: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/branches')
          if (!response.ok) {
            // Si hay error, limpiar sucursal actual
            set({ currentBranch: null, availableBranches: [] })
            throw new Error('Error al cargar sucursales')
          }
          
          const data = await response.json()
          const branches = data.branches.map((b: any) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            isMain: b.isMain,
            city: b.city,
            state: b.state
          }))
          
          // 🔥 CRITICAL: Limpiar sucursal si no pertenece a esta empresa
          const current = get().currentBranch
          const currentStillExists = branches.find((b: Branch) => b.id === current?.id)
          
          if (!currentStillExists) {
            // La sucursal guardada no existe en esta empresa, seleccionar nueva
            const mainBranch = branches.find((b: Branch) => b.isMain) || branches[0]
            set({ currentBranch: mainBranch, availableBranches: branches })
            console.log('⚠️ Sucursal anterior no válida, seleccionando:', mainBranch?.name)
          } else {
            set({ availableBranches: branches })
          }
        } catch (error) {
          console.error('Error cargando sucursales:', error)
          set({ currentBranch: null, availableBranches: [] })
        } finally {
          set({ isLoading: false })
        }
      },

      // 🆕 Función para limpiar todo el store (usar al cerrar sesión)
      clearBranches: () => {
        set({ 
          currentBranch: null, 
          availableBranches: [],
          isLoading: false 
        })
        console.log('🧹 Store de sucursales limpiado')
      }
    }),
    {
      name: 'branch-storage', // nombre en localStorage
      partialize: (state) => ({ 
        currentBranch: state.currentBranch 
      })
    }
  )
)
