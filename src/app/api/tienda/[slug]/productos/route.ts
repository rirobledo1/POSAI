// src/app/api/tienda/[slug]/productos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tienda/[slug]/productos
 * Obtiene el catálogo de productos activos de la tienda
 * Soporta filtros, búsqueda y paginación
 * No requiere autenticación - endpoint público
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)

    // Parámetros de búsqueda y filtrado
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const featured = searchParams.get('featured') === 'true'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    // Parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Buscar empresa por slug
    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        onlineStoreEnabled: true,
        status: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que la tienda esté habilitada
    if (!company.onlineStoreEnabled) {
      return NextResponse.json(
        { error: 'Tienda no disponible' },
        { status: 403 }
      )
    }

    // Construir filtros
    const where: any = {
      companyId: company.id,
      active: true, // Solo productos activos
      stock: {
        gt: 0  // Solo productos con stock disponible
      }
    }

    // Filtro de búsqueda (nombre o código de barras)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } }
      ]
    }

    // Filtro de categoría
    if (category) {
      where.categoryId = category
    }

    // Filtro de destacados
    if (featured) {
      where.featured = true
    }

    // Filtro de precio
    if (minPrice) {
      where.price = { ...where.price, gte: parseFloat(minPrice) }
    }
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) }
    }

    // Obtener productos y conteo total
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          barcode: true,
          price: true,
          stock: true,
          featured: true,
          imageUrl: true,
          thumbnailUrl: true,
          hasImage: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },  // Destacados primero
          { createdAt: 'desc' }  // Más recientes después
        ],
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Formatear respuesta
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      barcode: product.barcode,
      price: Number(product.price),
      stock: product.stock,
      featured: product.featured,
      image: product.thumbnailUrl || product.imageUrl || null,
      hasImage: product.hasImage,
      category: product.category
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error al cargar los productos' },
      { status: 500 }
    )
  }
}
