/**
 * SettingsView — Exportar/Importar, Sincronización, Restablecer
 */

import { store } from '../store.js';
import { showToast } from '../app.js';
import { getSyncUrl, isSyncEnabled, enableSync, disableSync, testConnection, pushData, fullSync } from '../syncService.js';

export class SettingsView {
  render(container) {
    const syncEnabled = isSyncEnabled();
    const syncUrl = getSyncUrl();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Ajustes</h1>
          <p class="view-subtitle">Configuración y gestión de datos</p>
        </div>
      </div>

      <!-- Sincronización -->
      <div class="settings-section sync-section">
        <h3 class="settings-title">Sincronización en la Nube</h3>
        <p class="settings-desc">
          Conecta tus dispositivos para que los datos se sincronicen automáticamente entre PC y móvil.
        </p>

        <div class="sync-status-bar">
          <span class="sync-indicator ${syncEnabled ? 'connected' : ''}"></span>
          <span>${syncEnabled ? 'Conectado' : 'Desconectado'}</span>
        </div>

        <div class="form-group" style="margin-top: 0.75rem;">
          <label class="form-label">URL de Firebase Database</label>
          <input
            class="form-input"
            id="syncUrlInput"
            placeholder="https://tu-proyecto-default-rtdb.firebaseio.com"
            value="${syncUrl}"
          >
        </div>

        <div class="settings-actions">
          ${syncEnabled ? `
            <button class="btn btn-primary" id="syncNowBtn">Sincronizar Ahora</button>
            <button class="btn btn-secondary" id="disconnectSyncBtn">Desconectar</button>
          ` : `
            <button class="btn btn-primary" id="connectSyncBtn">Conectar</button>
          `}
        </div>

        <!-- Guía rápida -->
        <details class="sync-guide">
          <summary>Como crear tu Firebase (2 minutos)</summary>
          <ol class="sync-steps">
            <li>Ve a <strong>console.firebase.google.com</strong> (necesitas cuenta Google)</li>
            <li>Haz clic en <strong>"Agregar proyecto"</strong> → ponle nombre (ej: "fincontrol") → crea el proyecto</li>
            <li>En el menú lateral, haz clic en <strong>"Realtime Database"</strong> → "Crear base de datos"</li>
            <li>Selecciona ubicación (europe-west1) → <strong>"Comenzar en modo de prueba"</strong> → Habilitar</li>
            <li>Copia la URL que aparece arriba (algo como <code>https://fincontrol-xxxxx-default-rtdb.europe-west1.firebasedatabase.app</code>)</li>
            <li>Pégala aquí arriba y pulsa <strong>"Conectar"</strong></li>
          </ol>
        </details>
      </div>

      <!-- Exportar -->
      <div class="settings-section">
        <h3 class="settings-title">Exportar Datos</h3>
        <p class="settings-desc">Descarga una copia de seguridad de todos tus datos en formato JSON.</p>
        <div class="settings-actions">
          <button class="btn btn-primary" id="exportBtn">Descargar Backup</button>
          <button class="btn btn-secondary" id="copyBtn">Copiar al portapapeles</button>
        </div>
      </div>

      <!-- Importar -->
      <div class="settings-section">
        <h3 class="settings-title">Importar Datos</h3>
        <p class="settings-desc">Restaura tus datos desde un archivo JSON previamente exportado.</p>
        <div class="settings-actions">
          <button class="btn btn-secondary" id="importBtn">Seleccionar Archivo</button>
          <input type="file" id="importFile" accept=".json" style="display: none">
        </div>
      </div>

      <!-- Restablecer -->
      <div class="settings-section">
        <h3 class="settings-title">Restablecer Datos</h3>
        <p class="settings-desc">Elimina todos tus datos y vuelve a los valores por defecto. Esta acción no se puede deshacer.</p>
        <div class="settings-actions">
          <button class="btn btn-danger" id="resetBtn">Restablecer Todo</button>
        </div>
      </div>

      <!-- Información -->
      <div class="settings-section">
        <h3 class="settings-title">Información</h3>
        <ul class="summary-list">
          <li class="summary-item">
            <span class="summary-item-label">Versión</span>
            <span class="summary-item-value" style="color: var(--text-secondary)">2.1.0</span>
          </li>
          <li class="summary-item">
            <span class="summary-item-label">Almacenamiento</span>
            <span class="summary-item-value" style="color: var(--text-secondary)">${syncEnabled ? 'localStorage + Firebase' : 'localStorage'}</span>
          </li>
          <li class="summary-item">
            <span class="summary-item-label">Sincronización</span>
            <span class="summary-item-value" style="color: ${syncEnabled ? 'var(--green)' : 'var(--text-muted)'}">${syncEnabled ? 'Activa' : 'Inactiva'}</span>
          </li>
          <li class="summary-item">
            <span class="summary-item-label">Tamaño de datos</span>
            <span class="summary-item-value" style="color: var(--text-secondary)" id="dataSize">Calculando...</span>
          </li>
        </ul>
      </div>
    `;

    // Calcular tamaño
    const dataSize = new Blob([store.exportData()]).size;
    const sizeKB = (dataSize / 1024).toFixed(1);
    const sizeEl = container.querySelector('#dataSize');
    if (sizeEl) sizeEl.textContent = `${sizeKB} KB`;

    this.attachListeners(container);
  }

  attachListeners(container) {
    // ===== SYNC =====

    // Conectar
    container.querySelector('#connectSyncBtn')?.addEventListener('click', async () => {
      const urlInput = container.querySelector('#syncUrlInput');
      const url = urlInput?.value.trim();

      if (!url || !url.startsWith('https://')) {
        showToast('URL no válida. Debe empezar con https://', 'error');
        return;
      }

      showToast('Probando conexión...', 'info');
      const ok = await testConnection(url);

      if (ok) {
        enableSync(url);

        // Push current data to cloud on first connect
        const pushed = await pushData(store.data);
        if (pushed) {
          showToast('Conectado y datos sincronizados', 'success');
        } else {
          showToast('Conectado (no se pudo subir datos)', 'info');
        }

        this.render(container);
      } else {
        showToast('No se pudo conectar. Verifica la URL y que la DB esté en modo de prueba.', 'error');
      }
    });

    // Desconectar
    container.querySelector('#disconnectSyncBtn')?.addEventListener('click', () => {
      if (confirm('¿Desconectar la sincronización?')) {
        disableSync();
        showToast('Sincronización desconectada', 'info');
        this.render(container);
      }
    });

    // Sincronizar ahora
    container.querySelector('#syncNowBtn')?.addEventListener('click', async () => {
      showToast('Sincronizando...', 'info');

      const result = await fullSync(store.data);
      if (result.changed) {
        store.data = result.data;
        store.data._lastModified = Date.now();
        localStorage.setItem('fincontrol_data', JSON.stringify(store.data));
        store.notify();
        showToast('Datos sincronizados correctamente', 'success');
        setTimeout(() => location.reload(), 500);
      } else {
        await pushData(store.data);
        showToast('Todo sincronizado', 'success');
      }
    });

    // ===== EXPORT =====
    container.querySelector('#exportBtn')?.addEventListener('click', () => {
      const data = store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fincontrol_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup descargado', 'success');
    });

    // Copiar al portapapeles
    container.querySelector('#copyBtn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(store.exportData());
        showToast('Datos copiados al portapapeles', 'success');
      } catch {
        showToast('Error al copiar', 'error');
      }
    });

    // ===== IMPORT =====
    const importFile = container.querySelector('#importFile');
    container.querySelector('#importBtn')?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (confirm('¿Importar estos datos? Se reemplazarán todos los datos actuales.')) {
          const success = store.importData(ev.target.result);
          if (success) {
            showToast('Datos importados correctamente', 'success');
            setTimeout(() => location.reload(), 500);
          } else {
            showToast('Archivo no válido', 'error');
          }
        }
      };
      reader.readAsText(file);
    });

    // ===== RESET =====
    container.querySelector('#resetBtn')?.addEventListener('click', () => {
      if (confirm('¿Estás seguro? Se perderán TODOS los datos.')) {
        if (confirm('Esta acción no se puede deshacer. ¿Confirmar?')) {
          store.resetData();
          showToast('Datos restablecidos', 'info');
          setTimeout(() => location.reload(), 500);
        }
      }
    });
  }

  destroy() { }
}
