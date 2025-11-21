// src/app/api/settings/shipping/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Configuración por defecto mientras no tengamos acceso a la base de datos
const DEFAULT_SHIPPING_CONFIG = {
  zones: [
    {
      id: 'local',
      name: 'Local',
      description: 'Entregas dentro de la ciudad',
      baseCost: 50,
      costPerKm: 5,
      maxDistance: 15,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'foraneo',
      name: 'Foráneo',
      description: 'Entregas fuera de la ciudad',
      baseCost: 150,
      costPerKm: 10,
      maxDistance: 100,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'nacional',
      name: 'Nacional',
      description: 'Entregas a nivel nacional',
      baseCost: 300,
      costPerKm: 15,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  defaultLocalCost: 50,
  defaultForaneoCost: 150,
  allowManualEdit: true,
  lastUpdated: new Date().toISOString()
};

// GET - Obtener configuración de envío
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('🚚 Devolviendo configuración de envío por defecto');
    return NextResponse.json(DEFAULT_SHIPPING_CONFIG);

  } catch (error) {
    console.error('Error obteniendo configuración de envío:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear configuración inicial de envío
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🚚 Creando configuración de envío:', body);
    
    // Por ahora, devolver la configuración enviada con timestamps
    const settingsData = {
      ...DEFAULT_SHIPPING_CONFIG,
      ...body,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(settingsData);

  } catch (error) {
    console.error('Error creando configuración de envío:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de envío
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🚚 Actualizando configuración de envío:', body);

    const updatedSettings = {
      ...DEFAULT_SHIPPING_CONFIG,
      ...body,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(updatedSettings);

  } catch (error) {
    console.error('Error actualizando configuración de envío:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}