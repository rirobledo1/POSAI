/**
 * API para gestionar las direcciones de los clientes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { determineDeliveryZone } from '@/lib/delivery';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = await params;

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener todas las direcciones del cliente
    const addresses = await prisma.deliveryAddress.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      addresses
    });

  } catch (error) {
    console.error('Error fetching customer addresses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = await params;
    const body = await request.json();
    
    console.log('📝 POST Address - CustomerId:', customerId);
    console.log('📝 POST Address - Body:', JSON.stringify(body, null, 2));

    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'México',
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

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Geocodificar la dirección - SIMPLIFICADO: Ya no usamos geocoding
    let latitude: number | null = null;
    let longitude: number | null = null;
    let deliveryZone = 'LOCAL'; // Zona por defecto como string del enum
    let geocodeProvider: string | null = null;
    
    const addressData = {
      customerId,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode: postalCode || null,
      country,
      latitude,
      longitude,
      deliveryZone,
      deliveryNotes: deliveryNotes || null,
      isVerified: false,
      isDefault,
      geocodeProvider: geocodeProvider || null,
      lastGeocoded: null
    };
    
    console.log('📝 Address data to create:', JSON.stringify(addressData, null, 2));

    // Si es dirección principal, desmarcar otras como principales
    if (isDefault) {
      await prisma.deliveryAddress.updateMany({
        where: { 
          customerId,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    // Crear la nueva dirección
    try {
      const newAddress = await prisma.deliveryAddress.create({
        data: addressData
      });
      
      console.log('✅ Address created successfully:', newAddress.id);
      
      return NextResponse.json({
        success: true,
        address: newAddress,
        geocoding: {
          success: false, // Ya no usamos geocoding
          provider: geocodeProvider,
          hasCoordinates: false
        }
      });
    } catch (dbError: any) {
      console.error('❌ Database error creating address:', dbError);
      return NextResponse.json(
        { error: `Error de base de datos: ${dbError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating customer address:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}