/**
 * Modelo de Transacción
 */

export class Transaction {
  /**
   * Crear una nueva transacción
   * @param {Object} data - Datos de la transacción
   */
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.type = data.type; // 'expense' | 'income'
    this.amount = parseFloat(data.amount) || 0;
    this.category = data.category;
    this.description = data.description || '';
    this.date = data.date || this.getTodayISO();
    this.month = data.month || this.getMonthFromDate(this.date);
    this.timestamp = data.timestamp || Date.now();
    this.source = data.source || 'manual'; // 'manual' | 'quick'
    this.tags = data.tags || [];
    this.recurring = data.recurring || false;
    this.recurringConfig = data.recurringConfig || null;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  /**
   * Generar ID único
   * @returns {string}
   */
  generateId() {
    // Simple UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Obtener fecha de hoy en formato ISO (YYYY-MM-DD)
   * @returns {string}
   */
  getTodayISO() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Obtener mes desde fecha (YYYY-MM)
   * @param {string} date - Fecha en formato ISO
   * @returns {string}
   */
  getMonthFromDate(date) {
    return date.substring(0, 7); // YYYY-MM
  }

  /**
   * Validar transacción
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validate() {
    const errors = [];

    if (!this.type || !['expense', 'income'].includes(this.type)) {
      errors.push('Tipo de transacción inválido');
    }

    if (!this.amount || this.amount <= 0) {
      errors.push('La cantidad debe ser mayor a 0');
    }

    if (this.amount > 1000000) {
      errors.push('La cantidad es demasiado grande');
    }

    if (!this.category) {
      errors.push('Debe seleccionar una categoría');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Debe proporcionar una descripción');
    }

    if (this.description.length > 200) {
      errors.push('La descripción es demasiado larga (máx. 200 caracteres)');
    }

    if (!this.date) {
      errors.push('Debe proporcionar una fecha');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convertir a objeto plano para almacenamiento
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      amount: this.amount,
      category: this.category,
      description: this.description,
      date: this.date,
      month: this.month,
      timestamp: this.timestamp,
      source: this.source,
      tags: this.tags,
      recurring: this.recurring,
      recurringConfig: this.recurringConfig,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Crear transacción desde objeto plano
   * @param {Object} data - Datos de la transacción
   * @returns {Transaction}
   */
  static fromJSON(data) {
    return new Transaction(data);
  }

  /**
   * Actualizar campos de la transacción
   * @param {Object} updates - Campos a actualizar
   */
  update(updates) {
    Object.assign(this, updates);
    this.updatedAt = Date.now();

    // Actualizar month si cambió la fecha
    if (updates.date) {
      this.month = this.getMonthFromDate(updates.date);
    }
  }
}
