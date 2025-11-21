// Inicializador de Cron Jobs
import { NextResponse } from 'next/server'
import { initCronJobs, getCronStatus } from '@/lib/cron/scheduler'

// Esta variable se ejecuta solo una vez cuando el servidor inicia
let initialized = false

export async function GET() {
  if (!initialized) {
    try {
      initCronJobs()
      initialized = true
      
      return NextResponse.json({
        success: true,
        message: 'Cron jobs inicializados',
        status: getCronStatus()
      })
    } catch (error) {
      console.error('Error inicializando cron jobs:', error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Cron jobs ya están inicializados',
    status: getCronStatus()
  })
}
