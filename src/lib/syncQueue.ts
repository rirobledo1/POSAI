/**
 * Queue Manager - Sistema de cola para sincronización offline/online
 * Maneja operaciones pendientes cuando no hay conexión a internet
 */

import { posDB } from '@/lib/indexedDB';

interface SyncResult {
  success: boolean;
  error?: string;
  retryAfter?: number; // segundos
}

interface SyncOptions {
  maxRetries?: number;
  retryDelay?: number; // segundos
  priority?: 'high' | 'normal' | 'low';
}

class SyncQueueManager {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, (result: SyncResult) => void> = new Map();
  private initialized = false;

  constructor() {
    // Solo auto-inicializar en el cliente
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    if (this.initialized) return;
    
    try {
      await posDB.init();
      this.initialized = true;
      console.log('SyncQueueManager initialized');
    } catch (error) {
      console.error('Failed to initialize SyncQueueManager:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.initialized && typeof window !== 'undefined') {
      await this.init();
    }
  }

  // ==========================================
  // GESTIÓN DE COLA
  // ==========================================

  async addSaleToQueue(saleData: any, options: SyncOptions = {}): Promise<string> {
    await this.ensureInitialized();
    
    const queueId = await posDB.addToSyncQueue('SALE_COMPLETE', {
      ...saleData,
      options: {
        maxRetries: options.maxRetries || 5,
        retryDelay: options.retryDelay || 30,
        priority: options.priority || 'high'
      }
    });

    console.log('Sale added to sync queue:', queueId);
    return queueId;
  }

  async addCancellationToQueue(cancellationData: any, options: SyncOptions = {}): Promise<string> {
    await this.ensureInitialized();
    
    const queueId = await posDB.addToSyncQueue('SALE_CANCEL', {
      ...cancellationData,
      options: {
        maxRetries: options.maxRetries || 5,
        retryDelay: options.retryDelay || 30,
        priority: options.priority || 'high'
      }
    });

    console.log('Cancellation added to sync queue:', queueId);
    return queueId;
  }

  async addInventoryUpdateToQueue(inventoryData: any, options: SyncOptions = {}): Promise<string> {
    await this.ensureInitialized();
    
    const queueId = await posDB.addToSyncQueue('INVENTORY_UPDATE', {
      ...inventoryData,
      options: {
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 60,
        priority: options.priority || 'normal'
      }
    });

    console.log('Inventory update added to sync queue:', queueId);
    return queueId;
  }

  // ==========================================
  // PROCESAMIENTO DE COLA
  // ==========================================

  async startProcessing(intervalSeconds: number = 30) {
    await this.ensureInitialized();
    
    if (this.isProcessing) {
      console.log('Queue processing already started');
      return;
    }

    this.isProcessing = true;
    console.log(`Starting queue processing with ${intervalSeconds}s interval`);

    // Procesar inmediatamente
    await this.processQueue();

    // Luego procesar en intervalos
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, intervalSeconds * 1000);
  }

  stopProcessing() {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('Queue processing stopped');
  }

  async processQueue(): Promise<{ processed: number; failed: number; pending: number }> {
    if (typeof window === 'undefined') {
      return { processed: 0, failed: 0, pending: 0 };
    }

    await this.ensureInitialized();
    
    try {
      const pendingItems = await posDB.getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        return { processed: 0, failed: 0, pending: 0 };
      }

      console.log(`Processing ${pendingItems.length} items in sync queue`);

      let processed = 0;
      let failed = 0;

      // Procesar por prioridad: high -> normal -> low
      const sortedItems = pendingItems.sort((a, b) => {
        const priorities: Record<string, number> = { high: 3, normal: 2, low: 1 };
        const aPriority = priorities[(a.data.options?.priority as string) || 'normal'];
        const bPriority = priorities[(b.data.options?.priority as string) || 'normal'];
        return bPriority - aPriority;
      });

      for (const item of sortedItems) {
        try {
          // Verificar si debe reintentarse (basado en intentos y tiempo)
          if (!this.shouldRetry(item)) {
            console.log(`Skipping item ${item.id} - max retries exceeded or too recent`);
            continue;
          }

          const result = await this.processItem(item);
          
          if (result.success) {
            await posDB.removeSyncItem(item.id);
            processed++;
            
            // Notificar a listeners
            const listener = this.listeners.get(item.id);
            if (listener) {
              listener(result);
              this.listeners.delete(item.id);
            }
            
            console.log(`Successfully processed item ${item.id}`);
          } else {
            await posDB.updateSyncItemError(item.id, result.error || 'Unknown error');
            failed++;
            
            console.log(`Failed to process item ${item.id}:`, result.error);
          }

        } catch (error) {
          await posDB.updateSyncItemError(item.id, error instanceof Error ? error.message : 'Processing error');
          failed++;
          console.error(`Error processing item ${item.id}:`, error);
        }

        // Pequeña pausa entre items para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const stillPending = await posDB.getPendingSyncItems();
      
      console.log(`Queue processing complete: ${processed} processed, ${failed} failed, ${stillPending.length} pending`);
      
      return { processed, failed, pending: stillPending.length };

    } catch (error) {
      console.error('Error processing sync queue:', error);
      return { processed: 0, failed: 0, pending: 0 };
    }
  }

  private shouldRetry(item: any): boolean {
    const maxRetries = item.data.options?.maxRetries || 5;
    const retryDelay = item.data.options?.retryDelay || 30;

    // Verificar max intentos
    if (item.attempts >= maxRetries) {
      return false;
    }

    // Verificar tiempo desde último intento
    if (item.lastAttempt) {
      const timeSinceLastAttempt = (Date.now() - new Date(item.lastAttempt).getTime()) / 1000;
      if (timeSinceLastAttempt < retryDelay) {
        return false;
      }
    }

    return true;
  }

  // ==========================================
  // PROCESADORES ESPECÍFICOS
  // ==========================================

  private async processItem(item: any): Promise<SyncResult> {
    switch (item.type) {
      case 'SALE_COMPLETE':
        return await this.processSaleComplete(item.data);
      
      case 'SALE_CANCEL':
        return await this.processSaleCancel(item.data);
      
      case 'INVENTORY_UPDATE':
        return await this.processInventoryUpdate(item.data);
      
      default:
        return {
          success: false,
          error: `Unknown item type: ${item.type}`
        };
    }
  }

  private async processSaleComplete(data: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const result = await response.json();
      
      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async processSaleCancel(data: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/sales/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async processInventoryUpdate(data: any): Promise<SyncResult> {
    try {
      const response = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // ==========================================
  // UTILIDADES Y ESTADÍSTICAS
  // ==========================================

  async getQueueStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    oldestItem?: Date;
    failedItems: number;
  }> {
    if (typeof window === 'undefined') {
      return {
        total: 0,
        byType: {},
        byPriority: {},
        failedItems: 0
      };
    }

    await this.ensureInitialized();
    
    try {
      const items = await posDB.getPendingSyncItems();
    
      const stats = {
        total: items.length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        oldestItem: undefined as Date | undefined,
        failedItems: items.filter(item => item.attempts > 0).length
      };

      items.forEach(item => {
        // Por tipo
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        
        // Por prioridad
        const priority = item.data.options?.priority || 'normal';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        
        // Item más antiguo
        if (!stats.oldestItem || item.createdAt < stats.oldestItem) {
          stats.oldestItem = item.createdAt;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {
        total: 0,
        byType: {},
        byPriority: {},
        failedItems: 0
      };
    }
  }

  async clearFailedItems(): Promise<number> {
    await this.ensureInitialized();
    
    const items = await posDB.getPendingSyncItems();
    const failedItems = items.filter(item => {
      const maxRetries = item.data.options?.maxRetries || 5;
      return item.attempts >= maxRetries;
    });

    for (const item of failedItems) {
      await posDB.removeSyncItem(item.id);
    }

    console.log(`Cleared ${failedItems.length} failed items from queue`);
    return failedItems.length;
  }

  // Listener para resultados específicos
  onItemComplete(itemId: string, callback: (result: SyncResult) => void) {
    this.listeners.set(itemId, callback);
  }

  removeListener(itemId: string) {
    this.listeners.delete(itemId);
  }
}

// Singleton instance
export const syncQueue = new SyncQueueManager();

// Hook para usar en componentes React
export const useSyncQueue = () => {
  const addSaleToQueue = async (saleData: any, options?: SyncOptions) => {
    return await syncQueue.addSaleToQueue(saleData, options);
  };

  const addCancellationToQueue = async (cancellationData: any, options?: SyncOptions) => {
    return await syncQueue.addCancellationToQueue(cancellationData, options);
  };

  const processQueueNow = async () => {
    return await syncQueue.processQueue();
  };

  const getStats = async () => {
    return await syncQueue.getQueueStats();
  };

  const clearFailed = async () => {
    return await syncQueue.clearFailedItems();
  };

  return {
    addSaleToQueue,
    addCancellationToQueue,
    processQueueNow,
    getStats,
    clearFailed,
    onItemComplete: syncQueue.onItemComplete.bind(syncQueue),
    removeListener: syncQueue.removeListener.bind(syncQueue)
  };
};
