/**
 * Database wrapper para IndexedDB con fallback a localStorage
 */

import { CONFIG } from '../core/config.js';

class Database {
  constructor() {
    this.db = null;
    this.isIndexedDBSupported = this.checkIndexedDBSupport();
    this.storeName = {
      TRANSACTIONS: 'transactions',
      CATEGORIES: 'categories',
      SETTINGS: 'settings'
    };
  }

  /**
   * Verificar si IndexedDB está soportado
   * @returns {boolean}
   */
  checkIndexedDBSupport() {
    return 'indexedDB' in window;
  }

  /**
   * Inicializar base de datos
   * @returns {Promise}
   */
  async init() {
    if (!this.isIndexedDBSupported) {
      console.warn('IndexedDB no soportado, usando localStorage como fallback');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        this.isIndexedDBSupported = false;
        resolve(); // Resolver de todos modos para usar fallback
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB inicializado correctamente');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Object Store: Transactions
        if (!db.objectStoreNames.contains(this.storeName.TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(this.storeName.TRANSACTIONS, {
            keyPath: 'id'
          });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
          transactionStore.createIndex('category', 'category', { unique: false });
          transactionStore.createIndex('month', 'month', { unique: false });
        }

        // Object Store: Categories
        if (!db.objectStoreNames.contains(this.storeName.CATEGORIES)) {
          db.createObjectStore(this.storeName.CATEGORIES, {
            keyPath: 'id'
          });
        }

        // Object Store: Settings
        if (!db.objectStoreNames.contains(this.storeName.SETTINGS)) {
          db.createObjectStore(this.storeName.SETTINGS, {
            keyPath: 'key'
          });
        }

        console.log('Esquema de base de datos creado');
      };
    });
  }

  /**
   * Agregar registro
   * @param {string} storeName - Nombre del object store
   * @param {Object} data - Datos a agregar
   * @returns {Promise}
   */
  async add(storeName, data) {
    if (!this.isIndexedDBSupported) {
      return this.localStorageAdd(storeName, data);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtener registro por ID
   * @param {string} storeName - Nombre del object store
   * @param {string} id - ID del registro
   * @returns {Promise}
   */
  async get(storeName, id) {
    if (!this.isIndexedDBSupported) {
      return this.localStorageGet(storeName, id);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtener todos los registros
   * @param {string} storeName - Nombre del object store
   * @returns {Promise<Array>}
   */
  async getAll(storeName) {
    if (!this.isIndexedDBSupported) {
      return this.localStorageGetAll(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Actualizar registro
   * @param {string} storeName - Nombre del object store
   * @param {Object} data - Datos actualizados (debe incluir id)
   * @returns {Promise}
   */
  async update(storeName, data) {
    if (!this.isIndexedDBSupported) {
      return this.localStorageUpdate(storeName, data);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Eliminar registro
   * @param {string} storeName - Nombre del object store
   * @param {string} id - ID del registro a eliminar
   * @returns {Promise}
   */
  async delete(storeName, id) {
    if (!this.isIndexedDBSupported) {
      return this.localStorageDelete(storeName, id);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpiar object store
   * @param {string} storeName - Nombre del object store
   * @returns {Promise}
   */
  async clear(storeName) {
    if (!this.isIndexedDBSupported) {
      return this.localStorageClear(storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===================================
  // FALLBACK: localStorage
  // ===================================

  localStorageAdd(storeName, data) {
    const items = this.localStorageGetAll(storeName);
    items.push(data);
    localStorage.setItem(storeName, JSON.stringify(items));
    return Promise.resolve(data.id);
  }

  localStorageGet(storeName, id) {
    const items = this.localStorageGetAll(storeName);
    const item = items.find(i => i.id === id);
    return Promise.resolve(item);
  }

  localStorageGetAll(storeName) {
    const data = localStorage.getItem(storeName);
    return data ? JSON.parse(data) : [];
  }

  localStorageUpdate(storeName, data) {
    const items = this.localStorageGetAll(storeName);
    const index = items.findIndex(i => i.id === data.id);

    if (index !== -1) {
      items[index] = data;
    } else {
      items.push(data);
    }

    localStorage.setItem(storeName, JSON.stringify(items));
    return Promise.resolve(data.id);
  }

  localStorageDelete(storeName, id) {
    const items = this.localStorageGetAll(storeName);
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(storeName, JSON.stringify(filtered));
    return Promise.resolve();
  }

  localStorageClear(storeName) {
    localStorage.removeItem(storeName);
    return Promise.resolve();
  }
}

// Singleton instance
export const db = new Database();
