/**
 * IncomeView — Gestión de fuentes de ingreso
 */

import { store } from '../store.js';
import { formatCurrency } from '../utils.js';
import { openModal, showToast } from '../app.js';

export class IncomeView {
  render(container) {
    const income = store.getIncome();
    const total = income.reduce((s, i) => s + Number(i.amount), 0);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Ingresos</h1>
          <p class="view-subtitle">Gestiona tus fuentes de ingreso mensuales</p>
        </div>
        <button class="btn btn-primary" id="addIncomeBtn">+ Añadir Ingreso</button>
      </div>

      <div class="metrics-grid">
        <div class="metric-card green">
          <div class="metric-label">Total Ingresos</div>
          <div class="metric-value cell-positive">${formatCurrency(total)}</div>
          <div class="metric-change positive">${income.length} fuentes</div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <div class="table-title">Fuentes de Ingreso</div>
        </div>
        ${income.length > 0 ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Notas</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${income.map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td><span class="category-badge">${item.type === 'fijo' ? 'Fijo' : 'Variable'}</span></td>
                  <td style="color: var(--text-secondary); font-size: 0.85rem;">${item.notes || '—'}</td>
                  <td class="text-right">
                    <span class="cell-amount cell-positive">${formatCurrency(item.amount)}</span>
                  </td>
                  <td class="text-right">
                    <div class="row-actions" style="opacity:1; justify-content: flex-end;">
                      <button class="row-action-btn edit-income" data-id="${item.id}" title="Editar">Editar</button>
                      <button class="row-action-btn delete delete-income" data-id="${item.id}" title="Eliminar">Eliminar</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL</strong></td>
                <td class="text-right"><span class="cell-amount cell-positive">${formatCurrency(total)}</span></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        ` : `
          <div class="empty-state">
            <p class="empty-state-text">No hay ingresos registrados. Añade tu primera fuente de ingreso.</p>
            <button class="btn btn-primary" id="addIncomeEmpty">+ Añadir Ingreso</button>
          </div>
        `}
      </div>
    `;

    this.attachListeners(container);
  }

  attachListeners(container) {
    const addBtn = container.querySelector('#addIncomeBtn') || container.querySelector('#addIncomeEmpty');
    addBtn?.addEventListener('click', () => this.showForm());

    container.querySelectorAll('.edit-income').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = store.getIncome().find(i => i.id === id);
        if (item) this.showForm(item);
      });
    });

    container.querySelectorAll('.delete-income').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este ingreso?')) {
          store.deleteIncome(btn.dataset.id);
          showToast('Ingreso eliminado', 'success');
          this.render(container);
        }
      });
    });
  }

  showForm(item = null) {
    const isEdit = !!item;
    const title = isEdit ? 'Editar Ingreso' : 'Nuevo Ingreso';

    const html = `
      <form id="incomeForm">
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <input class="form-input" name="name" value="${item?.name || ''}" placeholder="Ej: Salario, freelance..." required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cantidad (EUR)</label>
            <input class="form-input" name="amount" type="number" step="0.01" min="0" value="${item?.amount || ''}" placeholder="0.00" required>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-select" name="type">
              <option value="fijo" ${item?.type === 'fijo' ? 'selected' : ''}>Fijo</option>
              <option value="variable" ${item?.type === 'variable' ? 'selected' : ''}>Variable</option>
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
      const form = modalBody.querySelector('#incomeForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          name: form.name.value.trim(),
          amount: parseFloat(form.amount.value),
          type: form.type.value,
          notes: form.notes.value.trim(),
        };
        if (isEdit) {
          store.updateIncome(item.id, data);
          showToast('Ingreso actualizado', 'success');
        } else {
          store.addIncome(data);
          showToast('Ingreso añadido', 'success');
        }
      });
    });
  }

  destroy() { }
}
