/**
 * Vista de Inversiones
 */

import { formatCurrency } from '../../utils/formatters.js';
import { monthlyDataService } from '../../services/monthlyDataService.js';

export class InvestmentsView {
  constructor() {
    this.container = document.getElementById('appContent');
  }

  /**
   * Renderizar vista
   */
  async render() {
    const monthData = monthlyDataService.getMonthData();
    const investments = monthData.investments;

    const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
    const currentValue = investments.reduce((sum, inv) => sum + (inv.shares * inv.pricePerShare), 0);
    const profit = currentValue - totalInvested;
    const profitPercent = ((profit / totalInvested) * 100).toFixed(2);

    this.container.innerHTML = `
      <div class="dashboard-container">
        <!-- Métricas -->
        <div class="dashboard-metrics">
          <div class="metric-card highlight">
            <div class="metric-header">
              <div class="metric-label">Total Value</div>
            </div>
            <div class="metric-value">${formatCurrency(currentValue)}</div>
            <div class="metric-change ${profit >= 0 ? 'positive' : 'negative'}">
              <span>${profit >= 0 ? '+' : ''}${formatCurrency(profit)} (${profitPercent}%)</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Invested</div>
            </div>
            <div class="metric-value">${formatCurrency(totalInvested)}</div>
            <div class="metric-change">
              <span>${investments.length} positions</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Profit/Loss</div>
            </div>
            <div class="metric-value ${profit >= 0 ? 'cell-positive' : 'cell-negative'}">
              ${profit >= 0 ? '+' : ''}${formatCurrency(profit)}
            </div>
            <div class="metric-change ${profit >= 0 ? 'positive' : 'negative'}">
              <span>${profitPercent}%</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Brokers</div>
            </div>
            <div class="metric-value">${new Set(investments.map(i => i.broker)).size}</div>
            <div class="metric-change">
              <span>${[...new Set(investments.map(i => i.broker))].join(', ')}</span>
            </div>
          </div>
        </div>

        <!-- Tabla de inversiones -->
        <div class="table-container">
          <div class="table-header">
            <div class="table-title">
              Investment Portfolio
            </div>
            <div class="table-actions">
              <button class="table-action-btn" onclick="alert('Coming soon')">
                Import
              </button>
              <button class="table-action-btn" onclick="alert('Coming soon')">
                + Add Position
              </button>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Broker</th>
                <th class="text-right">Shares/Units</th>
                <th class="text-right">Purchase Price</th>
                <th class="text-right">Invested</th>
                <th class="text-right">Current Value</th>
                <th class="text-right">Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              ${investments.map(inv => this.renderInvestmentRow(inv)).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4"><strong>TOTAL PORTFOLIO</strong></td>
                <td class="text-right">
                  <span class="cell-amount">${formatCurrency(totalInvested)}</span>
                </td>
                <td class="text-right">
                  <span class="cell-amount">${formatCurrency(currentValue)}</span>
                </td>
                <td class="text-right">
                  <span class="cell-amount ${profit >= 0 ? 'cell-positive' : 'cell-negative'}">
                    ${profit >= 0 ? '+' : ''}${formatCurrency(profit)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>

          <button class="add-row-btn">
            <span>+</span>
            <span>Add new investment</span>
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Renderizar fila de inversión
   */
  renderInvestmentRow(inv) {
    const currentValue = inv.shares * inv.pricePerShare;
    const profit = currentValue - inv.invested;
    const profitPercent = ((profit / inv.invested) * 100).toFixed(2);

    return `
      <tr class="editable" data-id="${inv.id}">
        <td>
          <strong>${inv.name}</strong>
        </td>
        <td>
          <span class="cell-broker">${inv.broker}</span>
        </td>
        <td class="text-right">${inv.shares.toLocaleString('es-ES', { maximumFractionDigits: 6 })}</td>
        <td class="text-right">${formatCurrency(inv.pricePerShare)}</td>
        <td class="text-right">
          <span class="cell-amount">${formatCurrency(inv.invested)}</span>
        </td>
        <td class="text-right">
          <span class="cell-amount">${formatCurrency(currentValue)}</span>
        </td>
        <td class="text-right">
          <span class="cell-amount ${profit >= 0 ? 'cell-positive' : 'cell-negative'}">
            ${profit >= 0 ? '+' : ''}${formatCurrency(profit)}
            <small style="opacity: 0.7">(${profitPercent}%)</small>
          </span>
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
        console.log('Edit investment:', id);
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
