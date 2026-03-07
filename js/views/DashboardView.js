/**
 * DashboardView — Resumen visual con gráficos y métricas
 */

import { store } from '../store.js';
import { formatCurrency, formatPercent, getCategoryById } from '../utils.js';

export class DashboardView {
  constructor() {
    this.charts = {};
  }

  render(container) {
    const summary = store.getSummary();
    const md = store.getMonthData();
    const investments = store.getInvestments();
    const income = md.income || [];
    const fixedExpenses = md.fixedExpenses || [];
    const variableExpenses = md.variableExpenses || [];

    const expensePercent = summary.income > 0
      ? ((summary.expenses.total / summary.income) * 100).toFixed(0) : 0;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Dashboard</h1>
          <p class="view-subtitle">Resumen de tu mes</p>
        </div>
      </div>

      <!-- Métricas -->
      <div class="metrics-grid">
        <div class="metric-card accent">
          <div class="metric-label">Patrimonio Total</div>
          <div class="metric-value">${formatCurrency(summary.patrimony)}</div>
          <div class="metric-change neutral">Inversiones + Ahorro</div>
        </div>
        <div class="metric-card green">
          <div class="metric-label">Ingresos</div>
          <div class="metric-value">${formatCurrency(summary.income)}</div>
          <div class="metric-change positive">${income.length} fuentes</div>
        </div>
        <div class="metric-card red">
          <div class="metric-label">Gastos</div>
          <div class="metric-value">${formatCurrency(summary.expenses.total)}</div>
          <div class="metric-change negative">${expensePercent}% de ingresos</div>
        </div>
        <div class="metric-card ${summary.netIncome >= 0 ? 'green' : 'red'}">
          <div class="metric-label">Ahorro Mensual</div>
          <div class="metric-value ${summary.netIncome >= 0 ? 'cell-positive' : 'cell-negative'}">${formatCurrency(summary.netIncome)}</div>
          <div class="metric-change ${summary.netIncome >= 0 ? 'positive' : 'negative'}">Tasa: ${summary.savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="card-header">
            <div>
              <div class="card-title">Distribución de Gastos</div>
              <div class="card-subtitle">Fijos + Variables por categoría</div>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="expenseChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="card-header">
            <div>
              <div class="card-title">Balance Mensual</div>
              <div class="card-subtitle">Ingresos vs Gastos vs Ahorro</div>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="balanceChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tablas resumen -->
      <div class="charts-grid">
        <!-- Resumen de ingresos -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Ingresos</div>
            <span class="cell-positive">${formatCurrency(summary.income)}</span>
          </div>
          <ul class="summary-list">
            ${income.map(i => `
              <li class="summary-item">
                <span class="summary-item-label">${i.name}</span>
                <span class="summary-item-value cell-positive">${formatCurrency(i.amount)}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Resumen de inversiones -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Inversiones</div>
            <span class="cell-amount">${formatCurrency(summary.investments.currentValue)}</span>
          </div>
          <ul class="summary-list">
            ${investments.map(inv => {
      const val = inv.shares * inv.pricePerShare;
      const profit = val - inv.invested;
      return `
                <li class="summary-item">
                  <span class="summary-item-label">
                    <span>${inv.name}</span>
                    <span class="broker-badge" style="margin-left: 0.5rem">${inv.broker}</span>
                  </span>
                  <span class="summary-item-value ${profit >= 0 ? 'cell-positive' : 'cell-negative'}">${formatCurrency(val)}</span>
                </li>
              `;
    }).join('')}
          </ul>
          <div class="summary-item" style="padding-top: 0.75rem; border-top: 1px solid var(--border);">
            <span class="summary-item-label" style="font-weight:700">Beneficio total</span>
            <span class="summary-item-value ${summary.investments.profit >= 0 ? 'cell-positive' : 'cell-negative'}">
              ${summary.investments.profit >= 0 ? '+' : ''}${formatCurrency(summary.investments.profit)} (${formatPercent(summary.investments.profitPercent)})
            </span>
          </div>
        </div>
      </div>

      <!-- Barra de ahorro -->
      <div class="card" style="margin-bottom: 1.5rem">
        <div class="card-header">
          <div class="card-title">Tasa de Ahorro</div>
          <span style="color: var(--text-secondary); font-size: 0.85rem;">${summary.savingsRate.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${summary.savingsRate >= 20 ? 'green' : summary.savingsRate >= 0 ? 'yellow' : 'red'}"
               style="width: ${Math.max(0, Math.min(100, summary.savingsRate))}%">
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
          <span style="font-size: 0.75rem; color: var(--text-muted);">0%</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Meta: 20%</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">50%</span>
        </div>
      </div>
    `;

    this.renderCharts(md, summary);
  }

  renderCharts(md, summary) {
    this.destroyCharts();

    // Gráfico donut de gastos
    const allExpenses = [...(md.fixedExpenses || []), ...(md.variableExpenses || [])];
    const categoryTotals = {};

    allExpenses.forEach(exp => {
      const cat = getCategoryById(exp.category);
      if (!categoryTotals[cat.id]) {
        categoryTotals[cat.id] = { label: cat.name, color: cat.color, total: 0 };
      }
      categoryTotals[cat.id].total += Number(exp.amount);
    });

    const catEntries = Object.values(categoryTotals).filter(c => c.total > 0);

    if (catEntries.length > 0) {
      const ctx1 = document.getElementById('expenseChart');
      if (ctx1) {
        this.charts.expense = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels: catEntries.map(c => c.label),
            datasets: [{
              data: catEntries.map(c => c.total),
              backgroundColor: catEntries.map(c => c.color),
              borderWidth: 0,
              spacing: 3,
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#8888a8',
                  font: { family: 'Inter', size: 11, weight: '500' },
                  padding: 12,
                  usePointStyle: true,
                  pointStyleWidth: 8,
                }
              },
              tooltip: {
                backgroundColor: '#1c1c35',
                titleColor: '#f0f0f8',
                bodyColor: '#8888a8',
                borderColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                cornerRadius: 10,
                padding: 12,
                callbacks: {
                  label: (ctx) => ` ${formatCurrency(ctx.parsed)}`
                }
              }
            }
          }
        });
      }
    }

    // Gráfico de barras de balance
    const ctx2 = document.getElementById('balanceChart');
    if (ctx2) {
      this.charts.balance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Ingresos', 'Gastos Fijos', 'Gastos Variables', 'Ahorro'],
          datasets: [{
            data: [summary.income, summary.expenses.fixed, summary.expenses.variable, Math.max(summary.netIncome, 0)],
            backgroundColor: ['#00d4aa', '#ff6b81', '#ffd93d', '#7c6df0'],
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1c1c35',
              titleColor: '#f0f0f8',
              bodyColor: '#8888a8',
              borderColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              cornerRadius: 10,
              padding: 12,
              callbacks: {
                label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#8888a8',
                font: { family: 'Inter', size: 11, weight: '500' }
              }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: {
                color: '#55556d',
                font: { family: 'Inter', size: 10 },
                callback: (v) => formatCurrency(v)
              }
            }
          }
        }
      });
    }
  }

  destroyCharts() {
    Object.values(this.charts).forEach(c => c?.destroy());
    this.charts = {};
  }

  destroy() {
    this.destroyCharts();
  }
}
