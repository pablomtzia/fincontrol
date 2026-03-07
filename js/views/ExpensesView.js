/**
 * ExpensesView — Gastos fijos y variables con categorías
 */

import { store } from '../store.js';
import { formatCurrency, EXPENSE_CATEGORIES, getCategoryById } from '../utils.js';
import { openModal, showToast } from '../app.js';

export class ExpensesView {
  constructor() {
    this.charts = {};
  }

  render(container) {
    const summary = store.getSummary();
    const md = store.getMonthData();
    const fixedExpenses = md.fixedExpenses;
    const variableExpenses = md.variableExpenses;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Gastos</h1>
          <p class="view-subtitle">Control de gastos fijos y variables</p>
        </div>
      </div>

      <!-- Métricas -->
      <div class="metrics-grid">
        <div class="metric-card red">
          <div class="metric-label">Total Gastos</div>
          <div class="metric-value cell-negative">${formatCurrency(summary.expenses.total)}</div>
          <div class="metric-change negative">${summary.income > 0 ? ((summary.expenses.total / summary.income) * 100).toFixed(0) : 0}% de ingresos</div>
        </div>
        <div class="metric-card yellow">
          <div class="metric-label">Gastos Fijos</div>
          <div class="metric-value">${formatCurrency(summary.expenses.fixed)}</div>
          <div class="metric-change neutral">${fixedExpenses.length} conceptos</div>
        </div>
        <div class="metric-card blue">
          <div class="metric-label">Gastos Variables</div>
          <div class="metric-value">${formatCurrency(summary.expenses.variable)}</div>
          <div class="metric-change neutral">${variableExpenses.length} registros</div>
        </div>
      </div>

      <!-- Gráfico -->
      <div class="charts-grid" style="grid-template-columns: 1fr;">
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Gastos por Categoría</div>
          </div>
          <div class="chart-wrapper" style="max-height: 260px;">
            <canvas id="expCategoryChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Gastos Fijos -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Gastos Fijos</h2>
          <button class="btn btn-primary btn-sm" id="addFixedBtn">+ Añadir</button>
        </div>
        <div class="table-container">
          ${fixedExpenses.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Notas</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${fixedExpenses.map(exp => {
      const cat = getCategoryById(exp.category);
      return `
                    <tr>
                      <td><strong>${exp.name}</strong></td>
                      <td><span class="category-badge"><span class="color-dot" style="background:${cat.color}"></span> ${cat.name}</span></td>
                      <td style="color: var(--text-secondary); font-size: 0.85rem;">${exp.notes || '—'}</td>
                      <td class="text-right"><span class="cell-amount cell-negative">${formatCurrency(exp.amount)}</span></td>
                      <td class="text-right">
                        <div class="row-actions" style="opacity:1; justify-content: flex-end;">
                          <button class="row-action-btn edit-fixed" data-id="${exp.id}">Editar</button>
                          <button class="row-action-btn delete delete-fixed" data-id="${exp.id}">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL FIJOS</strong></td>
                  <td class="text-right"><span class="cell-amount cell-negative">${formatCurrency(summary.expenses.fixed)}</span></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ` : `
            <div class="empty-state">
              <p class="empty-state-text">No hay gastos fijos. Añade tus gastos recurrentes.</p>
            </div>
          `}
        </div>
      </div>

      <!-- Gastos Variables -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Gastos Variables</h2>
          <button class="btn btn-primary btn-sm" id="addVariableBtn">+ Añadir</button>
        </div>
        <div class="table-container">
          ${variableExpenses.length > 0 ? `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Notas</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${variableExpenses.map(exp => {
      const cat = getCategoryById(exp.category);
      return `
                    <tr>
                      <td><strong>${exp.name}</strong></td>
                      <td><span class="category-badge"><span class="color-dot" style="background:${cat.color}"></span> ${cat.name}</span></td>
                      <td style="color: var(--text-secondary); font-size: 0.85rem;">${exp.notes || '—'}</td>
                      <td class="text-right"><span class="cell-amount cell-negative">${formatCurrency(exp.amount)}</span></td>
                      <td class="text-right">
                        <div class="row-actions" style="opacity:1; justify-content: flex-end;">
                          <button class="row-action-btn edit-variable" data-id="${exp.id}">Editar</button>
                          <button class="row-action-btn delete delete-variable" data-id="${exp.id}">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  `;
    }).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3"><strong>TOTAL VARIABLES</strong></td>
                  <td class="text-right"><span class="cell-amount cell-negative">${formatCurrency(summary.expenses.variable)}</span></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ` : `
            <div class="empty-state">
              <p class="empty-state-text">No hay gastos variables este mes. Añade uno cuando lo necesites.</p>
            </div>
          `}
        </div>
      </div>
    `;

    this.renderChart(md);
    this.attachListeners(container);
  }

  renderChart(md) {
    this.destroyCharts();

    const allExp = [...md.fixedExpenses, ...md.variableExpenses];
    const catTotals = {};
    allExp.forEach(e => {
      const cat = getCategoryById(e.category);
      catTotals[cat.id] = (catTotals[cat.id] || { label: cat.name, color: cat.color, total: 0 });
      catTotals[cat.id].total += Number(e.amount);
    });

    const entries = Object.values(catTotals).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
    if (entries.length === 0) return;

    const ctx = document.getElementById('expCategoryChart');
    if (!ctx) return;

    this.charts.category = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(c => c.label),
        datasets: [{
          data: entries.map(c => c.total),
          backgroundColor: entries.map(c => c.color + 'cc'),
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
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
            callbacks: { label: (ctx) => ` ${formatCurrency(ctx.parsed.x)}` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#55556d', font: { family: 'Inter', size: 10 }, callback: v => formatCurrency(v) }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#8888a8', font: { family: 'Inter', size: 11, weight: '500' } }
          }
        }
      }
    });
  }

  destroyCharts() {
    Object.values(this.charts).forEach(c => c?.destroy());
    this.charts = {};
  }

  attachListeners(container) {
    container.querySelector('#addFixedBtn')?.addEventListener('click', () => this.showForm('fixed'));
    container.querySelector('#addVariableBtn')?.addEventListener('click', () => this.showForm('variable'));

    container.querySelectorAll('.edit-fixed').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = store.getFixedExpenses().find(e => e.id === btn.dataset.id);
        if (item) this.showForm('fixed', item);
      });
    });

    container.querySelectorAll('.delete-fixed').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este gasto fijo?')) {
          store.deleteFixedExpense(btn.dataset.id);
          showToast('Gasto fijo eliminado', 'success');
          this.render(container);
        }
      });
    });

    container.querySelectorAll('.edit-variable').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = store.getVariableExpenses().find(e => e.id === btn.dataset.id);
        if (item) this.showForm('variable', item);
      });
    });

    container.querySelectorAll('.delete-variable').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este gasto variable?')) {
          store.deleteVariableExpense(btn.dataset.id);
          showToast('Gasto variable eliminado', 'success');
          this.render(container);
        }
      });
    });
  }

  showForm(type = 'fixed', item = null) {
    const isEdit = !!item;
    const title = isEdit
      ? `Editar Gasto ${type === 'fixed' ? 'Fijo' : 'Variable'}`
      : `Nuevo Gasto ${type === 'fixed' ? 'Fijo' : 'Variable'}`;

    const html = `
      <form id="expenseForm">
        <div class="form-group">
          <label class="form-label">Concepto</label>
          <input class="form-input" name="name" value="${item?.name || ''}" placeholder="Ej: Alquiler, Spotify..." required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cantidad (EUR)</label>
            <input class="form-input" name="amount" type="number" step="0.01" min="0" value="${item?.amount || ''}" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select class="form-select" name="category">
              ${EXPENSE_CATEGORIES.map(c => `
                <option value="${c.id}" ${item?.category === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notas (opcional)</label>
          <input class="form-input" name="notes" value="${item?.notes || ''}" placeholder="Observaciones...">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="cancelModal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Añadir'}</button>
        </div>
      </form>
    `;

    openModal(title, html, (modalBody) => {
      const form = modalBody.querySelector('#expenseForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          name: form.name.value.trim(),
          amount: parseFloat(form.amount.value),
          category: form.category.value,
          notes: form.notes.value.trim(),
        };
        if (type === 'fixed') {
          isEdit ? store.updateFixedExpense(item.id, data) : store.addFixedExpense(data);
        } else {
          isEdit ? store.updateVariableExpense(item.id, data) : store.addVariableExpense(data);
        }
        showToast(isEdit ? 'Gasto actualizado' : 'Gasto añadido', 'success');
      });
    });
  }

  destroy() {
    this.destroyCharts();
  }
}
