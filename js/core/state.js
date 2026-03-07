/**
 * Gestión de estado global de la aplicación
 * Patrón Observer para notificar cambios
 */

import { eventBus, EVENTS } from './eventBus.js';

class StateManager {
  constructor() {
    this.state = {
      transactions: [],
      categories: {
        expense: [],
        income: []
      },
      currentView: 'dashboard',
      currentMonth: '2026-03', // Mes actual seleccionado
      filters: {
        type: 'all', // 'all', 'expense', 'income'
        category: null,
        dateFrom: null,
        dateTo: null,
        searchQuery: ''
      },
      loading: false,
      user: {
        settings: {
          currency: 'EUR',
          locale: 'es-ES',
          theme: 'dark'
        }
      }
    };

    this.subscribers = [];
  }

  /**
   * Obtener el estado actual
   * @returns {Object} Estado actual
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Actualizar el estado
   * @param {Object} updates - Actualizaciones parciales del estado
   */
  setState(updates) {
    this.state = {
      ...this.state,
      ...updates
    };

    // Notificar a suscriptores
    this.notifySubscribers();

    // Emitir evento global
    eventBus.emit(EVENTS.STATE_CHANGED, this.state);
  }

  /**
   * Suscribirse a cambios de estado
   * @param {Function} callback - Función a ejecutar cuando cambie el estado
   * @returns {Function} Función para desuscribirse
   */
  subscribe(callback) {
    this.subscribers.push(callback);

    // Retornar función para desuscribirse
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notificar a todos los suscriptores
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error en suscriptor:', error);
      }
    });
  }

  /**
   * Obtener transacciones filtradas
   * @returns {Array} Transacciones filtradas según filtros actuales
   */
  getFilteredTransactions() {
    let filtered = [...this.state.transactions];

    // Filtrar por tipo
    if (this.state.filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === this.state.filters.type);
    }

    // Filtrar por categoría
    if (this.state.filters.category) {
      filtered = filtered.filter(t => t.category === this.state.filters.category);
    }

    // Filtrar por fecha desde
    if (this.state.filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(this.state.filters.dateFrom));
    }

    // Filtrar por fecha hasta
    if (this.state.filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(this.state.filters.dateTo));
    }

    // Filtrar por búsqueda
    if (this.state.filters.searchQuery) {
      const query = this.state.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query)
      );
    }

    // Ordenar por fecha (más reciente primero)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  }

  /**
   * Calcular balance total
   * @returns {Object} Balance con ingresos, gastos y total
   */
  getBalance() {
    const transactions = this.state.transactions;

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      total: income - expenses
    };
  }

  /**
   * Agregar transacción al estado
   * @param {Object} transaction - Transacción a agregar
   */
  addTransaction(transaction) {
    this.state.transactions.push(transaction);
    this.setState({ transactions: this.state.transactions });
  }

  /**
   * Actualizar transacción en el estado
   * @param {string} id - ID de la transacción
   * @param {Object} updates - Actualizaciones de la transacción
   */
  updateTransaction(id, updates) {
    const index = this.state.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.transactions[index] = {
        ...this.state.transactions[index],
        ...updates
      };
      this.setState({ transactions: this.state.transactions });
    }
  }

  /**
   * Eliminar transacción del estado
   * @param {string} id - ID de la transacción a eliminar
   */
  deleteTransaction(id) {
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.setState({ transactions: this.state.transactions });
  }

  /**
   * Establecer categorías
   * @param {Object} categories - Categorías por tipo
   */
  setCategories(categories) {
    this.setState({ categories });
  }

  /**
   * Establecer filtros
   * @param {Object} filters - Nuevos filtros
   */
  setFilters(filters) {
    this.setState({
      filters: {
        ...this.state.filters,
        ...filters
      }
    });
  }

  /**
   * Limpiar filtros
   */
  clearFilters() {
    this.setState({
      filters: {
        type: 'all',
        category: null,
        dateFrom: null,
        dateTo: null,
        searchQuery: ''
      }
    });
  }

  /**
   * Establecer vista actual
   * @param {string} view - Nombre de la vista
   */
  setCurrentView(view) {
    this.setState({ currentView: view });
  }

  /**
   * Establecer estado de carga
   * @param {boolean} loading - Estado de carga
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Establecer mes actual
   * @param {string} month - Mes en formato YYYY-MM
   */
  setCurrentMonth(month) {
    this.setState({ currentMonth: month });
  }

  /**
   * Obtener mes actual
   * @returns {string} Mes actual
   */
  getCurrentMonth() {
    return this.state.currentMonth;
  }
}

// Singleton instance
export const stateManager = new StateManager();
