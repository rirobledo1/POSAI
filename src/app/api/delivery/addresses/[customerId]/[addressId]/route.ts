/**
 * API para operaciones individuales de direcciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { determineDeliveryZone } from '@/lib/delivery';

export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string, addressId: string } }
) {
  try {
    const { customerId, addressId } = params;
    const body = await request.json();

    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'MX',
      deliveryNotes,
      isDefault = false
    } = body;

    // Validaciones básicas
    if (!addressLine1 || !city || !state) {
      return NextResponse.json(
        { error: 'Campos requeridos: addressLine1, city, state' },
        { status: 400 }
      );
    }

    // Verificar que la dirección existe y pertenece al cliente
    const existingAddress = await (prisma as any).deliveryAddress.findFirst({
      where: { 
        id: addressId,
        customerId
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Geocodificar la dirección actualizada - SIMPLIFICADO: Ya no usamos geocoding
    let latitude: number | null = null;
    let longitude: number | null = null;
    let formattedAddress: string | null = null;
    let deliveryZone: string = 'LOCAL'; // Zona por defecto
    let geocodeProvider: string | null = null;

    // Si es dirección principal, desmarcar otras como principales
    if (isDefault && !existingAddress.isDefault) {
      await (prisma as any).deliveryAddress.updateMany({
        where: { 
          customerId,
          isDefault: true,
          id: { not: addressId }
        },
        data: { isDefault: false }
      });
    }

    // Actualizar la dirección
    const updatedAddress = await (prisma as any).deliveryAddress.update({
      where: { id: addressId },
      data: {
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        postalCode: postalCode || null,
        country,
        latitude,
        longitude,
        formattedAddress,
        deliveryZone,
        deliveryNotes: deliveryNotes || null,
        isDefault,
        geocodeProvider: geocodeProvider || null
      }
    });

    return NextResponse.json({
      success: true,
      address: updatedAddress,
      geocoding: {
        success: false, // Ya no usamos geocoding
        provider: geocodeProvider,
        hasCoordinates: false
      }
    });

  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string, addressId: string } }
) {
  try {
    const { customerId, addressId } = params;

    // Verificar que la dirección existe y pertenece al cliente
    const existingAddress = await (prisma as any).deliveryAddress.findFirst({
      where: { 
        id: addressId,
        customerId
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay entregas asociadas a esta dirección
    const deliveriesCount = await (prisma as any).delivery.count({
      where: { 
        addressId: addressId,
        status: { 
          not: 'DELIVERED' 
        }
      }
    });

    if (deliveriesCount > 0) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar la dirección porque tiene entregas pendientes',
          canDelete: false
        },
        { status: 400 }
      );
    }

    // Eliminar la dirección
    await (prisma as any).deliveryAddress.delete({
      where: { id: addressId }
    });

    // Si era la dirección principal, marcar otra como principal
    if (existingAddress.isDefault) {
      const firstAddress = await (prisma as any).deliveryAddress.findFirst({
        where: { customerId },
        orderBy: { createdAt: 'asc' }
      });

      if (firstAddress) {
        await (prisma as any).deliveryAddress.update({
          where: { id: firstAddress.id },
          data: { isDefault: true }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Dirección eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}