/**
 * Vista de Gastos (Fijos + Variables)
 */

import { formatCurrency } from '../../utils/formatters.js';
import { monthlyDataService } from '../../services/monthlyDataService.js';

export class ExpensesView {
  constructor() {
    this.container = document.getElementById('appContent');
  }

  /**
   * Renderizar vista
   */
  async render() {
    const monthData = monthlyDataService.getMonthData();
    const summary = monthlyDataService.getCurrentMonthSummary();

    const fixedExpenses = monthData.fixedExpenses;
    const variableExpenses = monthData.variableExpenses;

    const totalFixed = summary.expenses.fixed;
    const totalVariable = summary.expenses.variable;
    const totalExpenses = summary.expenses.total;

    this.container.innerHTML = `
      <div class="dashboard-container">
        <!-- Métricas -->
        <div class="dashboard-metrics">
          <div class="metric-card highlight">
            <div class="metric-header">
              <div class="metric-label">Total Expenses</div>
            </div>
            <div class="metric-value">${formatCurrency(totalExpenses)}</div>
            <div class="metric-change">
              <span>Monthly</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Fixed Expenses</div>
            </div>
            <div class="metric-value">${formatCurrency(totalFixed)}</div>
            <div class="metric-change">
              <span>${fixedExpenses.length} items</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Variable Expenses</div>
            </div>
            <div class="metric-value">${formatCurrency(totalVariable)}</div>
            <div class="metric-change">
              <span>${variableExpenses.length} items</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">% of Income</div>
            </div>
            <div class="metric-value">${((totalExpenses / 1880) * 100).toFixed(1)}%</div>
            <div class="metric-change">
              <span>Of 1,880.00 €</span>
            </div>
          </div>
        </div>

        <!-- Gastos Fijos -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              Fixed Expenses
              <div class="section-subtitle">Recurring monthly expenses</div>
            </div>
            <div class="table-actions">
              <button class="table-action-btn" onclick="alert('Coming soon')">
                + Add Expense
              </button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Notes</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${fixedExpenses.map(expense => this.renderExpenseRow(expense)).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL FIXED</strong></td>
                <td class="text-right">
                  <span class="cell-amount cell-negative">${formatCurrency(totalFixed)}</span>
                </td>
              </tr>
            </tfoot>
          </table>

          <button class="add-row-btn">
            <span>+</span>
            <span>Add fixed expense</span>
          </button>
        </div>

        <!-- Gastos Variables -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              Variable Expenses
              <div class="section-subtitle">Expenses that vary month to month</div>
            </div>
            <div class="table-actions">
              <button class="table-action-btn" onclick="alert('Coming soon')">
                + Add Expense
              </button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Notes</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${variableExpenses.map(expense => this.renderExpenseRow(expense)).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL VARIABLE</strong></td>
                <td class="text-right">
                  <span class="cell-amount cell-negative">${formatCurrency(totalVariable)}</span>
                </td>
              </tr>
            </tfoot>
          </table>

          <button class="add-row-btn">
            <span>+</span>
            <span>Add variable expense</span>
          </button>
        </div>

        <!-- Resumen total -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              Monthly Summary
            </div>
          </div>

          <table class="data-table">
            <tbody>
              <tr>
                <td><strong>Fixed Expenses</strong></td>
                <td class="text-right">
                  <span class="cell-amount cell-negative">${formatCurrency(totalFixed)}</span>
                </td>
              </tr>
              <tr>
                <td><strong>Variable Expenses</strong></td>
                <td class="text-right">
                  <span class="cell-amount cell-negative">${formatCurrency(totalVariable)}</span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td><strong>TOTAL MONTHLY EXPENSES</strong></td>
                <td class="text-right">
                  <span class="cell-amount cell-negative">${formatCurrency(totalExpenses)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Renderizar fila de gasto
   */
  renderExpenseRow(expense) {
    return `
      <tr class="editable" data-id="${expense.id}">
        <td>
          <strong>${expense.name}</strong>
        </td>
        <td>
          <span class="cell-badge">${expense.category}</span>
        </td>
        <td class="cell-broker">${expense.notes || '-'}</td>
        <td class="text-right">
          <span class="cell-amount cell-negative">${formatCurrency(expense.amount)}</span>
        </td>
      </tr>
    `;
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    // Click en fila para editar (futuro)
    const rows = document.querySelectorAll('.data-table tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        console.log('Edit expense:', id);
        // TODO: Implement edit modal
      });
    });
  }

  /**
   * Limpiar vista
   */
  destroy() {
    // Cleanup if needed
  }
}
