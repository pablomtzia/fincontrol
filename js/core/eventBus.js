/**
 * Event Bus para comunicación desacoplada entre módulos
 * Patrón Observer/PubSub
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar cuando se emita el evento
   * @returns {Function} Función para desuscribirse
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Retornar función para desuscribirse
    return () => this.off(event, callback);
  }

  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a remover
   */
  off(event, callback) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emitir un evento
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos a pasar a los callbacks
   */
  emit(event, data) {
    if (!this.events[event]) return;

    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en evento "${event}":`, error);
      }
    });
  }

  /**
   * Suscribirse a un evento que se ejecutará una sola vez
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   */
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };

    this.on(event, wrapper);
  }

  /**
   * Limpiar todos los eventos
   */
  clear() {
    this.events = {};
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * Eventos de la aplicación
 */
export const EVENTS = {
  // Transacciones
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',

  // Estado
  STATE_CHANGED: 'state:changed',

  // Navegación
  ROUTE_CHANGED: 'route:changed',

  // UI
  MODAL_OPENED: 'modal:opened',
  MODAL_CLOSED: 'modal:closed',
  TOAST_SHOWN: 'toast:shown',

  // Datos
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error'
};
