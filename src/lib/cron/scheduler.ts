// Sistema de Cron Jobs para recordatorios automáticos
import cron from 'node-cron'
import { processPaymentReminders } from './reminderService'

let reminderJob: cron.ScheduledTask | null = null
let isRunning = false

/**
 * Inicializa los cron jobs
 */
export function initCronJobs() {
  console.log('🚀 [CRON] Inicializando sistema de recordatorios automáticos...')

  // Programar ejecución diaria a las 9:00 AM
  // Formato: segundo minuto hora día mes día-semana
  reminderJob = cron.schedule('0 0 9 * * *', async () => {
    if (isRunning) {
      console.log('⏭️  [CRON] Job ya está en ejecución, saltando...')
      return
    }

    isRunning = true
    console.log('⏰ [CRON] Ejecutando job de recordatorios automáticos...')

    try {
      const results = await processPaymentReminders()
      
      // Log de resumen
      const totalSent = results.reduce((sum, r) => sum + r.successCount, 0)
      const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0)
      
      console.log(`✅ [CRON] Job completado: ${totalSent} enviados, ${totalErrors} errores`)
    } catch (error) {
      console.error('❌ [CRON] Error en job de recordatorios:', error)
    } finally {
      isRunning = false
    }
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  })

  console.log('✅ [CRON] Recordatorios programados para las 9:00 AM diariamente')
}

/**
 * Detiene los cron jobs
 */
export function stopCronJobs() {
  if (reminderJob) {
    reminderJob.stop()
    console.log('🛑 [CRON] Cron jobs detenidos')
  }
}

/**
 * Ejecuta el job de recordatorios manualmente (para testing)
 */
export async function runRemindersManually() {
  console.log('🔧 [CRON] Ejecutando recordatorios manualmente...')
  
  if (isRunning) {
    return { success: false, error: 'El job ya está en ejecución' }
  }

  isRunning = true

  try {
    const results = await processPaymentReminders()
    return { success: true, results }
  } catch (error) {
    console.error('❌ [CRON] Error ejecutando manualmente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  } finally {
    isRunning = false
  }
}

/**
 * Verifica el estado del cron job
 */
export function getCronStatus() {
  return {
    isActive: reminderJob !== null,
    isRunning,
    nextExecution: reminderJob ? '9:00 AM (diario)' : null,
    timezone: 'America/Mexico_City'
  }
}
