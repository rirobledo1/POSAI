export class PWAManager {
  private static instance: PWAManager
  private deferredPrompt: any = null

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registrado:', registration)
        
        // Escuchar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                this.showUpdateNotification()
              }
            })
          }
        })
      } catch (error) {
        console.error('Error registrando Service Worker:', error)
      }
    }

    // Manejar evento de instalación PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
    })
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt()
      const { outcome } = await this.deferredPrompt.userChoice
      this.deferredPrompt = null
      return outcome === 'accepted'
    }
    return false
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null
  }

  private showUpdateNotification() {
    // Implementar notificación de actualización
    if (confirm('Nueva versión disponible. ¿Actualizar ahora?')) {
      window.location.reload()
    }
  }

  async checkOnlineStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      return response.ok
    } catch {
      return false
    }
  }
}