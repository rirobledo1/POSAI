'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface Category {
  id: string
  name: string
  description: string
  active: boolean
  productCount: number
  createdAt: string
  parentId?: string
  children?: Category[]
}

interface CategoryFormData {
  name: string
  description: string
  parentId?: string
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parentId: undefined
  })

  // Mock data
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Herramientas',
      description: 'Herramientas manuales y eléctricas',
      active: true,
      productCount: 45,
      createdAt: '2024-01-01',
      children: [
        {
          id: '1-1',
          name: 'Herramientas Manuales',
          description: 'Martillos, destornilladores, llaves',
          active: true,
          productCount: 28,
          createdAt: '2024-01-01',
          parentId: '1'
        },
        {
          id: '1-2',
          name: 'Herramientas Eléctricas',
          description: 'Taladros, sierras, lijadoras',
          active: true,
          productCount: 17,
          createdAt: '2024-01-01',
          parentId: '1'
        }
      ]
    },
    {
      id: '2',
      name: 'Eléctrico',
      description: 'Material eléctrico y cables',
      active: true,
      productCount: 32,
      createdAt: '2024-01-02'
    },
    {
      id: '3',
      name: 'Plomería',
      description: 'Tuberías, conexiones y accesorios',
      active: true,
      productCount: 28,
      createdAt: '2024-01-03'
    },
    {
      id: '4',
      name: 'Fijaciones',
      description: 'Tornillos, clavos, tuercas',
      active: true,
      productCount: 156,
      createdAt: '2024-01-04'
    },
    {
      id: '5',
      name: 'Pinturas',
      description: 'Pinturas, barnices y accesorios',
      active: false,
      productCount: 0,
      createdAt: '2024-01-05'
    }
  ]

  useEffect(() => {
    // Simulate API call
    const loadCategories = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setCategories(mockCategories)
      setLoading(false)
    }
    loadCategories()
  }, [])

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      parentId: undefined
    })
    setShowModal(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description,
      parentId: category.parentId
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Saving category:', formData)
      
      if (editingCategory) {
        // Update existing category
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...formData }
            : cat
        ))
      } else {
        // Create new category
        const newCategory: Category = {
          id: Date.now().toString(),
          ...formData,
          active: true,
          productCount: 0,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setCategories([...categories, newCategory])
      }
      
      setShowModal(false)
      alert(editingCategory ? 'Categoría actualizada' : 'Categoría creada')
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error al guardar categoría')
    }
  }

  const handleToggleActive = async (categoryId: string) => {
    try {
      setCategories(categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, active: !cat.active }
          : cat
      ))
    } catch (error) {
      console.error('Error toggling category status:', error)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        setCategories(categories.filter(cat => cat.id !== categoryId))
        alert('Categoría eliminada')
      } catch (error) {
        console.error('Error deleting category:', error)
        alert('Error al eliminar categoría')
      }
    }
  }

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parentId)
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderCategory = (category: Category, level: number = 0) => (
    <Card key={category.id} className={`${level > 0 ? 'ml-8 border-l-4 border-blue-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {level > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
            <FolderIcon className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {category.productCount} productos • Creado: {category.createdAt}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={category.active ? 'default' : 'secondary'}>
              {category.active ? 'Activa' : 'Inactiva'}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditCategory(category)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleActive(category.id)}
            >
              {category.active ? 'Desactivar' : 'Activar'}
            </Button>
            
            {category.productCount === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded bg-gray-200 h-8 w-8"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Gestión de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar categorías..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleCreateCategory} className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Nueva Categoría
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-gray-500">Total categorías</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{categories.filter(c => c.active).length}</div>
              <p className="text-xs text-gray-500">Categorías activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
              </div>
              <p className="text-xs text-gray-500">Total productos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {categories.filter(c => c.children && c.children.length > 0).length}
              </div>
              <p className="text-xs text-gray-500">Con subcategorías</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              {renderCategory(category)}
              {category.children && category.children.map(child => 
                renderCategory(child, 1)
              )}
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TagIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron categorías
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera categoría'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la categoría</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="parentId">Categoría padre (opcional)</Label>
                  <select
                    id="parentId"
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({...formData, parentId: e.target.value || undefined})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Sin categoría padre</option>
                    {getParentCategories()
                      .filter(cat => cat.id !== editingCategory?.id)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingCategory ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
