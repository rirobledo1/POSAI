/**
 * IndexedDB Manager - Sistema de backup persistente para POS
 * Más robusto que localStorage, sobrevive a limpiezas del navegador
 */

interface SaleData {
  id: string;
  name: string;
  cart: any[];
  customer: any | null;
  paymentMethod: string;
  cashReceived: string;
  status: 'DRAFT' | 'PENDING_SYNC' | 'SYNCED' | 'CONFLICT';
  createdAt: Date;
  updatedAt: Date;
  syncAttempts: number;
  lastSyncError?: string;
}

interface SyncQueue {
  id: string;
  type: 'SALE_COMPLETE' | 'SALE_CANCEL' | 'INVENTORY_UPDATE';
  data: any;
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  lastError?: string;
}

class PosIndexedDB {
  private dbName = 'ferreai-pos';
  private version = 1;
  private db: IDBDatabase | null = null;

  // Verificar si estamos en el cliente
  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
  }

  async init(): Promise<void> {
    // Solo ejecutar en el cliente
    if (!this.isClient()) {
      console.warn('IndexedDB not available (SSR context)');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para ventas/drafts
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('status', 'status', { unique: false });
          salesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store para cola de sincronización
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          queueStore.createIndex('type', 'type', { unique: false });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Store para metadatos del sistema
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        console.log('IndexedDB schema created/updated');
      };
    });
  }

  // ==========================================
  // GESTIÓN DE VENTAS
  // ==========================================

  async saveSalesData(salesData: Record<string, any>): Promise<void> {
    if (!this.isClient()) {
      console.warn('IndexedDB not available (SSR context)');
      return;
    }

    if (!this.db) {
      console.warn('IndexedDB not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        return; // Fallar silenciosamente
      }
    }

    if (!this.db) return; // Salir si aún no se inicializó

    const transaction = this.db.transaction(['sales'], 'readwrite');
    const store = transaction.objectStore('sales');

    // Convertir el objeto de ventas a array y guardar cada una
    const sales = Object.entries(salesData).map(([id, data]) => ({
      id,
      name: data.name || `Venta ${id}`,
      cart: data.cart || [],
      customer: data.customer || null,
      paymentMethod: data.paymentMethod || 'EFECTIVO',
      cashReceived: data.cashReceived || '',
      status: 'DRAFT' as const,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date(),
      syncAttempts: 0
    }));

    // Limpiar ventas existentes en DRAFT
    await this.clearDraftSales();

    // Guardar ventas actuales
    for (const sale of sales) {
      store.put(sale);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getSalesData(): Promise<Record<string, any>> {
    if (!this.isClient()) {
      return {}; // Retornar objeto vacío en SSR
    }

    if (!this.db) {
      console.warn('IndexedDB not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        return {}; // Retornar objeto vacío
      }
    }

    if (!this.db) return {}; // Salir si aún no se inicializó

    const transaction = this.db.transaction(['sales'], 'readonly');
    const store = transaction.objectStore('sales');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('DRAFT');
      
      request.onsuccess = () => {
        const sales = request.result;
        const salesObject: Record<string, any> = {};

        sales.forEach(sale => {
          salesObject[sale.id] = {
            name: sale.name,
            cart: sale.cart,
            customer: sale.customer,
            paymentMethod: sale.paymentMethod,
            cashReceived: sale.cashReceived,
            createdAt: sale.createdAt.toISOString()
          };
        });

        resolve(salesObject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async clearDraftSales(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['sales'], 'readwrite');
    const store = transaction.objectStore('sales');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll('DRAFT');
      
      request.onsuccess = () => {
        const sales = request.result;
        const deletePromises = sales.map(sale => {
          return new Promise<void>((deleteResolve, deleteReject) => {
            const deleteRequest = store.delete(sale.id);
            deleteRequest.onsuccess = () => deleteResolve();
            deleteRequest.onerror = () => deleteReject(deleteRequest.error);
          });
        });

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // COLA DE SINCRONIZACIÓN
  // ==========================================

  async addToSyncQueue(type: SyncQueue['type'], data: any): Promise<string> {
    if (!this.isClient() || !this.db) {
      throw new Error('IndexedDB not available or not initialized');
    }

    const queueItem: SyncQueue = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: new Date(),
      attempts: 0
    };

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      
      request.onsuccess = () => resolve(queueItem.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncItems(): Promise<SyncQueue[]> {
    if (!this.isClient()) {
      return []; // Retornar array vacío en SSR
    }

    if (!this.db) {
      console.warn('IndexedDB not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        return []; // Retornar array vacío en lugar de lanzar error
      }
    }

    if (!this.db) return []; // Salir si aún no se inicializó

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items = request.result;
        // Ordenar por fecha de creación
        items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removeSyncItem(id: string): Promise<void> {
    if (!this.isClient() || !this.db) {
      throw new Error('IndexedDB not available or not initialized');
    }

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncItemError(id: string, error: string): Promise<void> {
    if (!this.isClient() || !this.db) {
      throw new Error('IndexedDB not available or not initialized');
    }

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.attempts += 1;
          item.lastAttempt = new Date();
          item.lastError = error;
          
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Sync item not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // ==========================================
  // METADATOS Y ESTADÍSTICAS
  // ==========================================

  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.isClient() || !this.db) {
      throw new Error('IndexedDB not available or not initialized');
    }

    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: new Date() });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(key: string): Promise<any> {
    if (!this.isClient() || !this.db) {
      return null;
    }

    const transaction = this.db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // UTILIDADES Y MANTENIMIENTO
  // ==========================================

  async getStorageStats(): Promise<{
    salesCount: number;
    queueCount: number;
    lastBackup: Date | null;
  }> {
    if (!this.isClient() || !this.db) {
      return { salesCount: 0, queueCount: 0, lastBackup: null };
    }

    const [salesCount, queueCount, lastBackup] = await Promise.all([
      this.getStoreCount('sales'),
      this.getStoreCount('syncQueue'),
      this.getMetadata('lastBackup')
    ]);

    return {
      salesCount,
      queueCount,
      lastBackup: lastBackup ? new Date(lastBackup) : null
    };
  }

  private async getStoreCount(storeName: string): Promise<number> {
    if (!this.db) return 0;

    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(): Promise<void> {
    // Limpiar items de sincronización muy antiguos (más de 7 días)
    if (!this.isClient() || !this.db) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('createdAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const posDB = new PosIndexedDB();

// Hook para facilitar el uso en componentes React
export const useIndexedDB = () => {
  const initDB = async () => {
    try {
      await posDB.init();
      return true;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      return false;
    }
  };

  return {
    initDB,
    saveSalesData: posDB.saveSalesData.bind(posDB),
    getSalesData: posDB.getSalesData.bind(posDB),
    addToSyncQueue: posDB.addToSyncQueue.bind(posDB),
    getPendingSyncItems: posDB.getPendingSyncItems.bind(posDB),
    removeSyncItem: posDB.removeSyncItem.bind(posDB),
    updateSyncItemError: posDB.updateSyncItemError.bind(posDB),
    setMetadata: posDB.setMetadata.bind(posDB),
    getMetadata: posDB.getMetadata.bind(posDB),
    getStorageStats: posDB.getStorageStats.bind(posDB),
    cleanup: posDB.cleanup.bind(posDB)
  };
};
