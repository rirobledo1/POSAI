// Instrumentation - Se ejecuta una sola vez cuando el servidor inicia
// Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Inicializando aplicación...')
    
    try {
      // Importar dinámicamente para evitar problemas de bundling
      const { initCronJobs } = await import('./lib/cron/scheduler')
      
      // Inicializar cron jobs
      initCronJobs()
      
      console.log('✅ Aplicación inicializada correctamente')
    } catch (error) {
      console.error('❌ Error inicializando aplicación:', error)
    }
  }
}
