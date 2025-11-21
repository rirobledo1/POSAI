import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Verificar autenticación y permisos de administrador
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Acceso denegado. Solo los administradores pueden ver estadísticas de duplicados.' 
        },
        { status: 403 }
      );
    }

    // Obtener estadísticas de productos duplicados eliminados usando SQL directo
    const duplicateStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_duplicates,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_duplicates,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_duplicates
      FROM products 
      WHERE active = false 
      AND name LIKE '%[DUPLICADO-INACTIVO%'
    ` as Array<{
      total_duplicates: bigint;
      recent_duplicates: bigint;
      monthly_duplicates: bigint;
    }>;

    // Obtener los duplicados más recientes
    const recentDuplicates = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        created_at as "createdAt",
        updated_at as "updatedAt",
        stock
      FROM products 
      WHERE active = false 
      AND name LIKE '%[DUPLICADO-INACTIVO%'
      ORDER BY updated_at DESC
      LIMIT 10
    ` as Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      stock: number;
    }>;

    const stats = duplicateStats[0];

    return NextResponse.json({
      success: true,
      data: {
        totalDuplicates: Number(stats.total_duplicates),
        recentDuplicates: Number(stats.recent_duplicates),
        monthlyDuplicates: Number(stats.monthly_duplicates),
        recentDuplicatesList: recentDuplicates
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de duplicados:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
