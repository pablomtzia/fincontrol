/**
 * Vista del Dashboard - Resumen General
 */

import { formatCurrency } from '../../utils/formatters.js';
import { router } from '../../core/router.js';
import { monthlyDataService } from '../../services/monthlyDataService.js';

export class DashboardView {
  constructor() {
    this.container = document.getElementById('appContent');
  }

  /**
   * Renderizar vista
   */
  async render() {
    // Obtener datos del mes actual
    const summary = monthlyDataService.getCurrentMonthSummary();
    const monthData = monthlyDataService.getMonthData();

    const netIncome = summary.netIncome;
    const savingsRate = summary.savingsRate.toFixed(1);
    const totalPatrimony = summary.investments.currentValue + netIncome;

    this.container.innerHTML = `
      <div class="dashboard-container">
        <!-- Métricas principales -->
        <div class="dashboard-metrics">
          <div class="metric-card highlight">
            <div class="metric-header">
              <div class="metric-label">Cartera Total</div>
            </div>
            <div class="metric-value">${formatCurrency(totalPatrimony)}</div>
            <div class="metric-change">
              <span>Inversiones + Balance</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Ingresos Mensuales</div>
            </div>
            <div class="metric-value">${formatCurrency(summary.income)}</div>
            <div class="metric-change positive">
              <span>Ingresos fijos</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Gastos Mensuales</div>
            </div>
            <div class="metric-value">${formatCurrency(summary.expenses.total)}</div>
            <div class="metric-change">
              <span>${((summary.expenses.total / summary.income) * 100).toFixed(0)}% de ingresos</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <div class="metric-label">Ahorro Mensual</div>
            </div>
            <div class="metric-value cell-positive">${formatCurrency(netIncome)}</div>
            <div class="metric-change positive">
              <span>${savingsRate}% tasa de ahorro</span>
            </div>
          </div>
        </div>

        <!-- Contenido principal -->
        <div class="dashboard-content">
          <!-- Resumen de ingresos -->
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">
                  Ingresos Mensuales
                </h2>
                <div class="section-subtitle">${monthData.income.length} fuentes de ingreso</div>
              </div>
              <button class="table-action-btn" onclick="window.location.hash='income'">
                Ver detalles →
              </button>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th class="text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthData.income.map(item => `
                    <tr>
                      <td><strong>${item.name}</strong></td>
                      <td class="text-right">
                        <span class="cell-amount cell-positive">${formatCurrency(item.amount)}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td class="text-right">
                      <span class="cell-amount cell-positive">${formatCurrency(summary.income)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Resumen de inversiones -->
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">
                  Inversiones
                </h2>
                <div class="section-subtitle">${monthData.investments.length} posiciones activas</div>
              </div>
              <button class="table-action-btn" onclick="window.location.hash='investments'">
                Ver detalles →
              </button>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Activo</th>
                    <th class="text-right">Invertido</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthData.investments.map(item => `
                    <tr>
                      <td><strong>${item.name}</strong></td>
                      <td class="text-right">
                        <span class="cell-amount">${formatCurrency(item.invested)}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td><strong>TOTAL INVERTIDO</strong></td>
                    <td class="text-right">
                      <span class="cell-amount">${formatCurrency(summary.investments.invested)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Resumen de gastos -->
          <div class="section">
            <div class="section-header">
              <div>
                <h2 class="section-title">
                  Monthly Expenses
                </h2>
                <div class="section-subtitle">Fixed + Variable</div>
              </div>
              <button class="table-action-btn" onclick="window.location.hash='expenses'">
                View details →
              </button>
            </div>

            <div class="table-container">
              <table class="data-table">
                <tbody>
                  <tr>
                    <td><strong>Fixed Expenses</strong></td>
                    <td class="text-right">
                      <span class="cell-amount cell-negative">${formatCurrency(summary.expenses.fixed)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Variable Expenses</strong></td>
                    <td class="text-right">
                      <span class="cell-amount cell-negative">${formatCurrency(summary.expenses.variable)}</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td class="text-right">
                      <span class="cell-amount cell-negative">${formatCurrency(summary.expenses.total)}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Adjuntar event listeners
   */
  attachEventListeners() {
    // Ya manejados por onclick inline
  }

  /**
   * Limpiar vista
   */
  destroy() {
    // Cleanup si es necesario
  }
}
