// src/app/api/quotations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Obtener una cotización por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Incrementar contador de vistas
    await prisma.quotation.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    return NextResponse.json(quotation)

  } catch (error) {
    console.error('Error fetching quotation:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    )
  }
}

// PATCH: Actualizar cotización
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const data = await req.json()

    // Verificar que la cotización existe
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // No permitir editar cotizaciones ya convertidas a ventas
    if (existingQuotation.convertedToSaleId) {
      return NextResponse.json(
        { error: 'No se puede editar una cotización ya convertida a venta' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {}

    // Actualizar campos simples
    if (data.customerId) updateData.customerId = data.customerId
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.paymentTerms) updateData.paymentTerms = data.paymentTerms
    if (data.deliveryTime) updateData.deliveryTime = data.deliveryTime
    if (data.status) updateData.status = data.status
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil)

    // Si se actualizan los items, recalcular totales
    if (data.items && data.items.length > 0) {
      // Calcular nuevos totales
      const subtotal = data.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.price), 0
      )
      
      const discountAmount = data.discountPercent 
        ? subtotal * (data.discountPercent / 100) 
        : (data.discount || 0)
      
      const taxableAmount = subtotal - discountAmount
      const tax = taxableAmount * 0.16
      const total = taxableAmount + tax

      updateData.subtotal = subtotal
      updateData.discount = discountAmount
      updateData.discountPercent = data.discountPercent || 0
      updateData.tax = tax
      updateData.total = total

      // Eliminar items antiguos y crear nuevos
      updateData.items = {
        deleteMany: {},
        create: data.items.map((item: any) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          subtotal: (item.quantity * item.price) - (item.discount || 0),
          notes: item.notes || '',
        }))
      }
    }

    // Actualizar cotización
    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        company: true,
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json(updatedQuotation)

  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar cotización
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la cotización existe
    const quotation = await prisma.quotation.findUnique({
      where: { id }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar cotizaciones convertidas a ventas
    if (quotation.convertedToSaleId) {
      return NextResponse.json(
        { error: 'No se puede eliminar una cotización ya convertida a venta' },
        { status: 400 }
      )
    }

    // Soft delete: cambiar estado a CANCELLED
    await prisma.quotation.update({
      where: { id },
      data: { 
        status: 'CANCELLED'
      }
    })

    return NextResponse.json({ 
      message: 'Cotización cancelada exitosamente' 
    })

  } catch (error) {
    console.error('Error deleting quotation:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    )
  }
}
