/**
 * Modelo de Categoría
 */

export class Category {
  /**
   * Crear una nueva categoría
   * @param {Object} data - Datos de la categoría
   */
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type; // 'expense' | 'income'
    this.color = data.color;
    this.icon = data.icon;
    this.keywords = data.keywords || [];
    this.budget = data.budget || null;
    this.order = data.order || 0;
    this.isDefault = data.isDefault || false;
    this.createdAt = data.createdAt || Date.now();
  }

  /**
   * Convertir a objeto plano
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      color: this.color,
      icon: this.icon,
      keywords: this.keywords,
      budget: this.budget,
      order: this.order,
      isDefault: this.isDefault,
      createdAt: this.createdAt
    };
  }

  /**
   * Crear categoría desde objeto plano
   * @param {Object} data - Datos de la categoría
   * @returns {Category}
   */
  static fromJSON(data) {
    return new Category(data);
  }

  /**
   * Verificar si una descripción coincide con las keywords de esta categoría
   * @param {string} description - Descripción a verificar
   * @returns {boolean}
   */
  matchesDescription(description) {
    if (!description || this.keywords.length === 0) {
      return false;
    }

    const descLower = description.toLowerCase();
    return this.keywords.some(keyword =>
      descLower.includes(keyword.toLowerCase())
    );
  }
}
