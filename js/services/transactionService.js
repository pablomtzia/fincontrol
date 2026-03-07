/**
 * Servicio para gestión de transacciones
 */

import { db } from '../data/database.js';
import { Transaction } from '../models/Transaction.js';
import { stateManager } from '../core/state.js';
import { eventBus, EVENTS } from '../core/eventBus.js';

class TransactionService {
  constructor() {
    this.storeName = 'transactions';
  }

  /**
   * Crear nueva transacción
   * @param {Object} data - Datos de la transacción
   * @returns {Promise<Transaction>}
   */
  async create(data) {
    try {
      // Crear instancia de Transaction
      const transaction = new Transaction(data);

      // Validar
      const validation = transaction.validate();
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Guardar en base de datos
      await db.add(this.storeName, transaction.toJSON());

      // Actualizar estado
      stateManager.addTransaction(transaction.toJSON());

      // Emitir evento
      eventBus.emit(EVENTS.TRANSACTION_CREATED, transaction.toJSON());

      return transaction;
    } catch (error) {
      console.error('Error al crear transacción:', error);
      throw error;
    }
  }

  /**
   * Obtener transacción por ID
   * @param {string} id - ID de la transacción
   * @returns {Promise<Transaction|null>}
   */
  async getById(id) {
    try {
      const data = await db.get(this.storeName, id);
      return data ? Transaction.fromJSON(data) : null;
    } catch (error) {
      console.error('Error al obtener transacción:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las transacciones
   * @returns {Promise<Array<Transaction>>}
   */
  async getAll() {
    try {
      const data = await db.getAll(this.storeName);
      return data.map(item => Transaction.fromJSON(item));
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      throw error;
    }
  }

  /**
   * Actualizar transacción
   * @param {string} id - ID de la transacción
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Transaction>}
   */
  async update(id, updates) {
    try {
      // Obtener transacción actual
      const current = await this.getById(id);
      if (!current) {
        throw new Error('Transacción no encontrada');
      }

      // Actualizar campos
      current.update(updates);

      // Validar
      const validation = current.validate();
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Guardar en base de datos
      await db.update(this.storeName, current.toJSON());

      // Actualizar estado
      stateManager.updateTransaction(id, current.toJSON());

      // Emitir evento
      eventBus.emit(EVENTS.TRANSACTION_UPDATED, current.toJSON());

      return current;
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      throw error;
    }
  }

  /**
   * Eliminar transacción
   * @param {string} id - ID de la transacción
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      // Eliminar de base de datos
      await db.delete(this.storeName, id);

      // Actualizar estado
      stateManager.deleteTransaction(id);

      // Emitir evento
      eventBus.emit(EVENTS.TRANSACTION_DELETED, id);
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      throw error;
    }
  }

  /**
   * Obtener balance total
   * @returns {Promise<Object>} { income, expenses, total }
   */
  async getBalance() {
    try {
      const transactions = await this.getAll();

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
    } catch (error) {
      console.error('Error al calcular balance:', error);
      throw error;
    }
  }

  /**
   * Obtener transacciones por mes
   * @param {string} month - Mes en formato YYYY-MM
   * @returns {Promise<Array<Transaction>>}
   */
  async getByMonth(month) {
    try {
      const transactions = await this.getAll();
      return transactions.filter(t => t.month === month);
    } catch (error) {
      console.error('Error al obtener transacciones por mes:', error);
      throw error;
    }
  }

  /**
   * Obtener total por mes
   * @param {string} month - Mes en formato YYYY-MM
   * @param {string} type - Tipo de transacción ('income' | 'expense')
   * @returns {Promise<number>}
   */
  async getMonthlyTotal(month, type) {
    try {
      const transactions = await this.getByMonth(month);
      return transactions
        .filter(t => t.type === type)
        .reduce((sum, t) => sum + t.amount, 0);
    } catch (error) {
      console.error('Error al calcular total mensual:', error);
      throw error;
    }
  }

  /**
   * Obtener últimas N transacciones
   * @param {number} limit - Número de transacciones
   * @returns {Promise<Array<Transaction>>}
   */
  async getRecent(limit = 5) {
    try {
      const transactions = await this.getAll();
      return transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    } catch (error) {
      console.error('Error al obtener transacciones recientes:', error);
      throw error;
    }
  }

  /**
   * Buscar transacciones
   * @param {string} query - Texto a buscar en descripción
   * @returns {Promise<Array<Transaction>>}
   */
  async search(query) {
    try {
      const transactions = await this.getAll();
      const queryLower = query.toLowerCase();

      return transactions.filter(t =>
        t.description.toLowerCase().includes(queryLower)
      );
    } catch (error) {
      console.error('Error al buscar transacciones:', error);
      throw error;
    }
  }

  /**
   * Obtener transacciones agrupadas por mes
   * @returns {Promise<Object>} Objeto con meses como claves
   */
  async getGroupedByMonth() {
    try {
      const transactions = await this.getAll();
      const grouped = {};

      transactions.forEach(transaction => {
        if (!grouped[transaction.month]) {
          grouped[transaction.month] = [];
        }
        grouped[transaction.month].push(transaction);
      });

      // Ordenar transacciones dentro de cada mes
      Object.keys(grouped).forEach(month => {
        grouped[month].sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      return grouped;
    } catch (error) {
      console.error('Error al agrupar transacciones:', error);
      throw error;
    }
  }

  /**
   * Cargar transacciones en el estado
   * @returns {Promise<void>}
   */
  async loadTransactions() {
    try {
      const transactions = await this.getAll();
      stateManager.setState({
        transactions: transactions.map(t => t.toJSON())
      });
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      throw error;
    }
  }
}

// Singleton instance
export const transactionService = new TransactionService();
