/**
 * Vista de Ingresos
 */

import { formatCurrency } from '../../utils/formatters.js';
import { monthlyDataService } from '../../services/monthlyDataService.js';

export class IncomeView {
  constructor() {
    this.container = document.getElementById('appContent');
  }

  /**
   * Renderizar vista
   */
  async render() {
    const monthData = monthlyDataService.getMonthData();
    const incomes = monthData.income;
    const total = incomes.reduce((sum, income) => sum + income.amount, 0);

    this.container.innerHTML = `
      <div class="dashboard-container">
        <!-- Métricas -->
        <div class="dashboard-metrics">
          <div class="metric-card highlight">
            <div class="metric-header">
              <div class="metric-label">Total Income</div>
            </div>
            <div class="metric-value">${formatCurrency(total)}</div>
            <div class="metric-change">
              <span>Monthly</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Fixed Income</div>
            </div>
            <div class="metric-value">${formatCurrency(total)}</div>
            <div class="metric-change">
              <span>${incomes.length} sources</span>
            </div>
          </div>
        </div>

        <!-- Tabla de ingresos -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              Monthly Income Sources
            </div>
            <div class="table-actions">
              <button class="table-action-btn" onclick="alert('Coming soon')">
                + Add Income
              </button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Notes</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${incomes.map(income => this.renderIncomeRow(income)).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL</strong></td>
                <td class="text-right">
                  <span class="cell-amount cell-positive">${formatCurrency(total)}</span>
                </td>
              </tr>
            </tfoot>
          </table>

          <button class="add-row-btn">
            <span>+</span>
            <span>Add new income source</span>
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Renderizar fila de ingreso
   */
  renderIncomeRow(income) {
    const typeLabel = income.type === 'fixed' ? 'Fixed' : 'Variable';

    return `
      <tr class="editable" data-id="${income.id}">
        <td>
          <strong>${income.name}</strong>
        </td>
        <td>
          <span class="cell-badge">${typeLabel}</span>
        </td>
        <td class="cell-broker">${income.notes || '-'}</td>
        <td class="text-right">
          <span class="cell-amount cell-positive">${formatCurrency(income.amount)}</span>
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
        console.log('Edit income:', id);
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
