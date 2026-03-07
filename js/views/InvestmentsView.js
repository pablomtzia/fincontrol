/**
 * InvestmentsView — Gestión de cartera con precios en tiempo real
 */

import { store } from '../store.js';
import { formatCurrency, formatPercent } from '../utils.js';
import { openModal, showToast } from '../app.js';
import { updatePrices } from '../priceService.js';

export class InvestmentsView {
  constructor() {
    this.charts = {};
    this.isRefreshing = false;
    this.hasAutoRefreshed = false;
    this.containerRef = null;
  }

  render(container) {
    this.containerRef = container;
    const investments = store.getInvestments();
    const summary = store.getSummary();
    const inv = summary.investments;
    const lastUpdate = store.getLastPriceUpdate();

    const brokers = [...new Set(investments.map(i => i.broker))];

    // Formatear última actualización
    let lastUpdateText = 'Nunca actualizado';
    if (lastUpdate) {
      const d = new Date(lastUpdate);
      lastUpdateText = `${d.toLocaleDateString('es-ES')} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    }

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Inversiones</h1>
          <p class="view-subtitle">Gestiona tu cartera de inversiones</p>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <button class="btn btn-secondary btn-sm" id="refreshPricesBtn" ${this.isRefreshing ? 'disabled' : ''}>
            ${this.isRefreshing ? 'Actualizando...' : 'Actualizar Precios'}
          </button>
          <button class="btn btn-primary" id="addInvestmentBtn">+ Nueva Posición</button>
        </div>
      </div>

      <!-- Estado de precios -->
      <div class="price-status" id="priceStatus">
        <span class="price-status-dot ${lastUpdate ? 'active' : ''}"></span>
        <span class="price-status-text">
          ${this.isRefreshing ? 'Obteniendo precios de mercado...' : `Última actualización: ${lastUpdateText}`}
        </span>
      </div>

      <!-- Métricas -->
      <div class="metrics-grid">
        <div class="metric-card accent">
          <div class="metric-label">Valor Total</div>
          <div class="metric-value">${formatCurrency(inv.currentValue)}</div>
          <div class="metric-change ${inv.profit >= 0 ? 'positive' : 'negative'}">
            ${inv.profit >= 0 ? '+' : ''}${formatCurrency(inv.profit)} (${formatPercent(inv.profitPercent)})
          </div>
        </div>
        <div class="metric-card blue">
          <div class="metric-label">Total Invertido</div>
          <div class="metric-value">${formatCurrency(inv.invested)}</div>
          <div class="metric-change neutral">${investments.length} posiciones</div>
        </div>
        <div class="metric-card ${inv.profit >= 0 ? 'green' : 'red'}">
          <div class="metric-label">Beneficio / Pérdida</div>
          <div class="metric-value ${inv.profit >= 0 ? 'cell-positive' : 'cell-negative'}">
            ${inv.profit >= 0 ? '+' : ''}${formatCurrency(inv.profit)}
          </div>
          <div class="metric-change ${inv.profit >= 0 ? 'positive' : 'negative'}">${formatPercent(inv.profitPercent)}</div>
        </div>
        <div class="metric-card yellow">
          <div class="metric-label">Brokers</div>
          <div class="metric-value">${brokers.length}</div>
          <div class="metric-change neutral">${brokers.join(', ')}</div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="charts-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Distribución de Cartera</div>
          </div>
          <div class="chart-wrapper">
            <canvas id="allocationChart"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="card-header">
            <div class="card-title">Rendimiento por Activo</div>
          </div>
          <div class="chart-wrapper">
            <canvas id="performanceChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tabla de cartera -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Cartera Completa</div>
        </div>
        ${investments.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Activo</th>
                <th>Broker</th>
                <th>Tipo</th>
                <th class="text-right">Participaciones</th>
                <th class="text-right">Precio Actual</th>
                <th class="text-right">Invertido</th>
                <th class="text-right">Valor Actual</th>
                <th class="text-right">P&L</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${investments.map(i => {
      const val = i.shares * i.pricePerShare;
      const profit = val - i.invested;
      const pct = i.invested > 0 ? ((profit / i.invested) * 100) : 0;
      return `
                  <tr>
                    <td><strong>${i.name}</strong></td>
                    <td><span class="broker-badge">${i.broker}</span></td>
                    <td><span class="category-badge">${i.type}</span></td>
                    <td class="text-right">${Number(i.shares).toLocaleString('es-ES', { maximumFractionDigits: 6 })}</td>
                    <td class="text-right">${formatCurrency(i.pricePerShare)}</td>
                    <td class="text-right"><span class="cell-amount">${formatCurrency(i.invested)}</span></td>
                    <td class="text-right"><span class="cell-amount">${formatCurrency(val)}</span></td>
                    <td class="text-right">
                      <span class="cell-amount ${profit >= 0 ? 'cell-positive' : 'cell-negative'}">
                        ${profit >= 0 ? '+' : ''}${formatCurrency(profit)}
                        <small style="opacity: 0.7; margin-left: 4px">(${formatPercent(pct)})</small>
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="row-actions" style="opacity:1; justify-content: flex-end;">
                        <button class="row-action-btn edit-inv" data-id="${i.id}">Editar</button>
                        <button class="row-action-btn delete delete-inv" data-id="${i.id}">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4"><strong>TOTAL CARTERA</strong></td>
                <td></td>
                <td class="text-right"><span class="cell-amount">${formatCurrency(inv.invested)}</span></td>
                <td class="text-right"><span class="cell-amount">${formatCurrency(inv.currentValue)}</span></td>
                <td class="text-right">
                  <span class="cell-amount ${inv.profit >= 0 ? 'cell-positive' : 'cell-negative'}">
                    ${inv.profit >= 0 ? '+' : ''}${formatCurrency(inv.profit)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        ` : `
          <div class="empty-state">
            <p class="empty-state-text">No hay inversiones. Añade tu primera posición.</p>
            <button class="btn btn-primary" id="addInvEmpty">+ Nueva Posición</button>
          </div>
        `}
      </div>
    `;

    this.renderCharts(investments);
    this.attachListeners(container);

    // Auto-actualizar precios solo una vez al entrar en la vista
    if (!this.hasAutoRefreshed && !this.isRefreshing) {
      this.hasAutoRefreshed = true;
      this.refreshPrices(container);
    }
  }

  async refreshPrices(container) {
    const investments = store.getInvestments();
    if (investments.length === 0) return;

    this.isRefreshing = true;

    // Actualizar solo el estado visual
    const statusEl = container.querySelector('#priceStatus');
    const refreshBtn = container.querySelector('#refreshPricesBtn');
    if (statusEl) {
      statusEl.innerHTML = `
        <span class="price-status-dot loading"></span>
        <span class="price-status-text">Obteniendo precios de mercado...</span>
      `;
    }
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Actualizando...';
    }

    try {
      const { updates, errors } = await updatePrices(investments);

      const updatedCount = store.applyPriceUpdates(updates);

      if (updatedCount > 0) {
        showToast(`${updatedCount} precios actualizados`, 'success');
      }

      if (errors.length > 0) {
        console.warn('Errores de precios:', errors);
        if (updatedCount === 0) {
          showToast('No se pudieron obtener precios', 'error');
        }
      }
    } catch (e) {
      console.error('Error actualizando precios:', e);
      showToast('Error de conexión', 'error');
    }

    this.isRefreshing = false;

    // Re-renderizar la vista con los nuevos precios (no disparará auto-refresh de nuevo)
    if (this.containerRef) {
      this.render(this.containerRef);
    }
  }

  renderCharts(investments) {
    this.destroyCharts();
    if (investments.length === 0) return;

    // Gráfico de distribución
    const ctx1 = document.getElementById('allocationChart');
    if (ctx1) {
      const colors = ['#7c6df0', '#00d4aa', '#ff6b81', '#ffd93d', '#54a0ff', '#f0b4ff', '#a8e6cf', '#ffb4d1'];
      this.charts.allocation = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: investments.map(i => i.name),
          datasets: [{
            data: investments.map(i => i.shares * i.pricePerShare),
            backgroundColor: investments.map((_, idx) => colors[idx % colors.length]),
            borderWidth: 0,
            spacing: 3,
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '60%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#8888a8', font: { family: 'Inter', size: 11, weight: '500' }, padding: 10, usePointStyle: true, pointStyleWidth: 8 }
            },
            tooltip: {
              backgroundColor: '#1c1c35', titleColor: '#f0f0f8', bodyColor: '#8888a8',
              borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, cornerRadius: 10, padding: 12,
              callbacks: { label: (ctx) => ` ${formatCurrency(ctx.parsed)}` }
            }
          }
        }
      });
    }

    // Gráfico de rendimiento
    const ctx2 = document.getElementById('performanceChart');
    if (ctx2) {
      const profits = investments.map(i => {
        const val = i.shares * i.pricePerShare;
        return val - i.invested;
      });
      this.charts.performance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: investments.map(i => i.name),
          datasets: [{
            data: profits,
            backgroundColor: profits.map(p => p >= 0 ? '#00d4aacc' : '#ff6b81cc'),
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1c1c35', titleColor: '#f0f0f8', bodyColor: '#8888a8',
              borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1, cornerRadius: 10, padding: 12,
              callbacks: { label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}` }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#8888a8', font: { family: 'Inter', size: 10 } } },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: '#55556d', font: { family: 'Inter', size: 10 }, callback: v => formatCurrency(v) }
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

  attachListeners(container) {
    const addBtn = container.querySelector('#addInvestmentBtn') || container.querySelector('#addInvEmpty');
    addBtn?.addEventListener('click', () => this.showForm());

    // Botón de actualizar precios
    container.querySelector('#refreshPricesBtn')?.addEventListener('click', () => {
      if (!this.isRefreshing) {
        this.refreshPrices(container);
      }
    });

    container.querySelectorAll('.edit-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = store.getInvestments().find(i => i.id === btn.dataset.id);
        if (item) this.showForm(item);
      });
    });

    container.querySelectorAll('.delete-inv').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar esta posición?')) {
          store.deleteInvestment(btn.dataset.id);
          showToast('Posición eliminada', 'success');
          this.render(container);
        }
      });
    });
  }

  showForm(item = null) {
    const isEdit = !!item;
    const title = isEdit ? 'Editar Posición' : 'Nueva Posición';

    const html = `
      <form id="investmentForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Activo</label>
            <input class="form-input" name="name" value="${item?.name || ''}" placeholder="Ej: Bitcoin, Apple..." required>
          </div>
          <div class="form-group">
            <label class="form-label">Broker</label>
            <input class="form-input" name="broker" value="${item?.broker || ''}" placeholder="Ej: Trade Republic" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" name="type">
              <option value="acción" ${item?.type === 'acción' ? 'selected' : ''}>Acción</option>
              <option value="ETF" ${item?.type === 'ETF' ? 'selected' : ''}>ETF</option>
              <option value="crypto" ${item?.type === 'crypto' ? 'selected' : ''}>Crypto</option>
              <option value="fondo" ${item?.type === 'fondo' ? 'selected' : ''}>Fondo</option>
              <option value="otro" ${item?.type === 'otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ticker (para precios)</label>
            <input class="form-input" name="ticker" value="${item?.ticker || ''}" placeholder="Ej: GOOGL, bitcoin">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Total Invertido (EUR)</label>
            <input class="form-input" name="invested" type="number" step="0.01" min="0" value="${item?.invested || ''}" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Participaciones</label>
            <input class="form-input" name="shares" type="number" step="0.000001" min="0" value="${item?.shares || ''}" placeholder="0.000000" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Precio Actual por Unidad (EUR)</label>
          <input class="form-input" name="pricePerShare" type="number" step="0.01" min="0" value="${item?.pricePerShare || ''}" placeholder="Se actualiza automáticamente">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="cancelModal">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Añadir'}</button>
        </div>
      </form>
    `;

    openModal(title, html, (modalBody) => {
      const form = modalBody.querySelector('#investmentForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          name: form.name.value.trim(),
          broker: form.broker.value.trim(),
          type: form.type.value,
          ticker: form.ticker.value.trim(),
          invested: parseFloat(form.invested.value),
          shares: parseFloat(form.shares.value),
          pricePerShare: parseFloat(form.pricePerShare.value) || 0,
        };
        if (isEdit) {
          store.updateInvestment(item.id, data);
          showToast('Posición actualizada', 'success');
        } else {
          store.addInvestment(data);
          showToast('Posición añadida', 'success');
        }
      });
    });
  }

  destroy() {
    this.destroyCharts();
  }
}
