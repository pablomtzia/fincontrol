/**
 * Vista de Transacciones
 */

import { transactionService } from '../../services/transactionService.js';
import { stateManager } from '../../core/state.js';
import { formatCurrency, formatDate, getMonthName, getTodayISO } from '../../utils/formatters.js';
import { ALL_CATEGORIES } from '../../core/config.js';
import { Modal } from '../components/Modal.js';
import { Toast } from '../components/Toast.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';

export class TransactionsView {
  constructor() {
    this.container = document.getElementById('appContent');
    this.currentFilter = 'all';
  }

  /**
   * Renderizar vista
   */
  async render() {
    try {
      const transactionsGrouped = await transactionService.getGroupedByMonth();

      this.container.innerHTML = `
        <div class="transactions-container">
          <!-- Toolbar -->
          <div class="transactions-toolbar">
            <button class="filter-button ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
              Todas
            </button>
            <button class="filter-button ${this.currentFilter === 'expense' ? 'active' : ''}" data-filter="expense">
              Gastos
            </button>
            <button class="filter-button ${this.currentFilter === 'income' ? 'active' : ''}" data-filter="income">
              Ingresos
            </button>
          </div>

          <!-- Transactions List -->
          <div class="transactions-list-container" id="transactionsList">
            ${this.renderTransactionsList(transactionsGrouped)}
          </div>
        </div>

        <!-- FAB Button -->
        <button class="btn-fab" id="addTransactionBtn" aria-label="Añadir transacción">
          +
        </button>
      `;

      this.attachEventListeners();
    } catch (error) {
      console.error('Error al renderizar transacciones:', error);
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Error al cargar transacciones</div>
        </div>
      `;
    }
  }

  /**
   * Renderizar lista de transacciones
   * @param {Object} grouped - Transacciones agrupadas por mes
   * @returns {string} HTML
   */
  renderTransactionsList(grouped) {
    const state = stateManager.getState();
    const months = Object.keys(grouped).sort().reverse();

    if (months.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">💸</div>
          <div class="empty-state-title">No hay transacciones</div>
          <div class="empty-state-description">
            Añade tu primera transacción usando el botón + de abajo
          </div>
        </div>
      `;
    }

    return months.map(month => {
      let transactions = grouped[month];

      // Aplicar filtro
      if (this.currentFilter !== 'all') {
        transactions = transactions.filter(t => t.type === this.currentFilter);
      }

      if (transactions.length === 0) return '';

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return `
        <div class="month-group">
          <div class="month-header">
            <div class="month-title">${getMonthName(month)}</div>
            <div class="month-summary">
              <div class="month-stat">
                <span class="stat-label">Ingresos</span>
                <span class="stat-value income">${formatCurrency(income)}</span>
              </div>
              <div class="month-stat">
                <span class="stat-label">Gastos</span>
                <span class="stat-value expense">${formatCurrency(expenses)}</span>
              </div>
            </div>
          </div>

          ${transactions.map(t => this.renderTransactionCard(t)).join('')}
        </div>
      `;
    }).join('');
  }

  /**
   * Renderizar tarjeta de transacción
   * @param {Object} transaction - Transacción
   * @returns {string} HTML
   */
  renderTransactionCard(transaction) {
    const category = this.getCategoryInfo(transaction.type, transaction.category);
    const isIncome = transaction.type === 'income';

    return `
      <div class="card-transaction" data-id="${transaction.id}">
        <div class="transaction-icon" style="background: ${category.color}20; color: ${category.color};">
          ${category.icon}
        </div>
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-meta">
            <span>${category.name}</span>
            <span>•</span>
            <span>${formatDate(transaction.date)}</span>
          </div>
        </div>
        <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
          ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
        </div>
        <div class="transaction-actions">
          <button class="action-button" data-action="edit" data-id="${transaction.id}" aria-label="Editar">
            ✏️
          </button>
          <button class="action-button delete" data-action="delete" data-id="${transaction.id}" aria-label="Eliminar">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Obtener información de categoría
   * @param {string} type - Tipo de transacción
   * @param {string} categoryId - ID de categoría
   * @returns {Object} Información de categoría
   */
  getCategoryInfo(type, categoryId) {
    const categories = type === 'expense'
      ? ALL_CATEGORIES.expense
      : ALL_CATEGORIES.income;

    const category = categories.find(c => c.id === categoryId);

    return category || {
      id: 'otros',
      name: 'Otros',
      icon: '💰',
      color: '#C7CEEA'
    };
  }

  /**
   * Mostrar modal de añadir/editar transacción
   * @param {Object|null} transaction - Transacción a editar (null para nueva)
   */
  showTransactionModal(transaction = null) {
    const isEdit = transaction !== null;
    const type = transaction?.type || 'expense';
    const categories = type === 'expense' ? ALL_CATEGORIES.expense : ALL_CATEGORIES.income;

    const formHtml = `
      <form id="transactionForm" class="form-group">
        <!-- Toggle Tipo -->
        <div class="form-group">
          <div class="toggle-type">
            <button type="button" class="toggle-option ${type === 'expense' ? 'active' : ''}" data-type="expense">
              Gasto
            </button>
            <button type="button" class="toggle-option ${type === 'income' ? 'active' : ''}" data-type="income">
              Ingreso
            </button>
          </div>
        </div>

        <!-- Cantidad -->
        <div class="form-group">
          <label class="form-label required">Cantidad</label>
          <input
            type="number"
            name="amount"
            class="form-input"
            placeholder="0,00"
            step="0.01"
            min="0.01"
            value="${transaction?.amount || ''}"
            required
          >
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label class="form-label required">Descripción</label>
          <input
            type="text"
            name="description"
            class="form-input"
            placeholder="Ej: Compra en Mercadona"
            value="${transaction?.description || ''}"
            required
          >
        </div>

        <!-- Categoría -->
        <div class="form-group">
          <label class="form-label required">Categoría</label>
          <div class="category-grid" id="categoryGrid">
            ${categories.map(cat => `
              <div class="category-item ${transaction?.category === cat.id ? 'active' : ''}" data-category="${cat.id}">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
              </div>
            `).join('')}
          </div>
          <input type="hidden" name="category" value="${transaction?.category || ''}" required>
        </div>

        <!-- Fecha -->
        <div class="form-group">
          <label class="form-label required">Fecha</label>
          <input
            type="date"
            name="date"
            class="form-input"
            value="${transaction?.date || getTodayISO()}"
            required
          >
        </div>
      </form>
    `;

    const footer = `
      <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
      <button type="button" class="btn btn-primary" data-action="save">
        ${isEdit ? 'Guardar' : 'Añadir'}
      </button>
    `;

    const modal = Modal.show({
      title: isEdit ? 'Editar transacción' : 'Nueva transacción',
      content: formHtml,
      footer
    });

    // Event listeners del formulario
    this.attachFormEventListeners(modal, transaction);
  }

  /**
   * Adjuntar event listeners al formulario
   * @param {HTMLElement} modal - Elemento modal
   * @param {Object|null} transaction - Transacción a editar
   */
  attachFormEventListeners(modal, transaction) {
    const form = modal.querySelector('#transactionForm');
    const toggleButtons = modal.querySelectorAll('.toggle-option');
    const categoryItems = modal.querySelectorAll('.category-item');
    const categoryInput = modal.querySelector('input[name="category"]');
    const categoryGrid = modal.querySelector('#categoryGrid');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    const saveBtn = modal.querySelector('[data-action="save"]');

    // Toggle tipo
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const newType = btn.dataset.type;

        // Actualizar botones activos
        toggleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Actualizar categorías
        const categories = newType === 'expense' ? ALL_CATEGORIES.expense : ALL_CATEGORIES.income;
        categoryGrid.innerHTML = categories.map(cat => `
          <div class="category-item" data-category="${cat.id}">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
          </div>
        `).join('');

        // Reset categoría seleccionada
        categoryInput.value = '';

        // Re-attach listeners
        this.attachCategoryListeners(categoryGrid, categoryInput);
      });
    });

    // Selección de categoría
    this.attachCategoryListeners(categoryGrid, categoryInput);

    // Botón cancelar
    cancelBtn.addEventListener('click', () => Modal.hide());

    // Botón guardar
    saveBtn.addEventListener('click', () => this.handleSaveTransaction(form, transaction));
  }

  /**
   * Adjuntar listeners de categorías
   * @param {HTMLElement} grid - Grid de categorías
   * @param {HTMLElement} input - Input oculto de categoría
   */
  attachCategoryListeners(grid, input) {
    const items = grid.querySelectorAll('.category-item');

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        input.value = item.dataset.category;
      });
    });
  }

  /**
   * Manejar guardado de transacción
   * @param {HTMLFormElement} form - Formulario
   * @param {Object|null} transaction - Transacción a editar
   */
  async handleSaveTransaction(form, transaction) {
    try {
      // Validar formulario
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Obtener datos del formulario
      const formData = new FormData(form);
      const type = form.querySelector('.toggle-option.active').dataset.type;

      const data = {
        type,
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description').trim(),
        category: formData.get('category'),
        date: formData.get('date')
      };

      // Validar categoría
      if (!data.category) {
        Toast.error('Debe seleccionar una categoría');
        return;
      }

      // Crear o actualizar
      if (transaction) {
        await transactionService.update(transaction.id, data);
        Toast.success('Transacción actualizada');
      } else {
        await transactionService.create(data);
        Toast.success('Transacción añadida');
      }

      // Cerrar modal
      Modal.hide();

      // Re-renderizar
      await this.render();

    } catch (error) {
      console.error('Error al guardar transacción:', error);
      Toast.error('Error', error.message);
    }
  }

  /**
   * Manejar eliminación de transacción
   * @param {string} id - ID de la transacción
   */
  async handleDeleteTransaction(id) {
    const confirmed = await Modal.confirm({
      title: 'Eliminar transacción',
      message: '¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await transactionService.delete(id);
      Toast.success('Transacción eliminada');
      await this.render();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      Toast.error('Error', error.message);
    }
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    // Botón FAB
    const addBtn = document.getElementById('addTransactionBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showTransactionModal());
    }

    // Filtros
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        this.currentFilter = btn.dataset.filter;
        await this.render();
      });
    });

    // Acciones de transacciones
    const actionButtons = document.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'edit') {
          const transaction = await transactionService.getById(id);
          this.showTransactionModal(transaction);
        } else if (action === 'delete') {
          await this.handleDeleteTransaction(id);
        }
      });
    });
  }

  /**
   * Limpiar vista
   */
  destroy() {
    // Cleanup si es necesario
  }
}
