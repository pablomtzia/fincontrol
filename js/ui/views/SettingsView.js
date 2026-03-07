/**
 * Vista de Configuración (Placeholder para MVP)
 */

export class SettingsView {
  constructor() {
    this.container = document.getElementById('appContent');
  }

  /**
   * Renderizar vista
   */
  async render() {
    this.container.innerHTML = `
      <div class="dashboard-container">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span class="card-title-icon">⚙️</span>
              Configuración
            </h2>
          </div>
          <div class="card-body">
            <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-md);">
              Las opciones de configuración estarán disponibles próximamente.
            </p>

            <h3 style="color: var(--color-text-primary); margin-bottom: var(--spacing-sm); margin-top: var(--spacing-lg);">
              Información
            </h3>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">
              <strong>Versión:</strong> 1.0.0 MVP<br>
              <strong>Almacenamiento:</strong> IndexedDB / localStorage<br>
              <strong>Privacidad:</strong> Todos los datos se guardan localmente en tu dispositivo
            </p>
          </div>
          <div class="card-footer">
            <button class="btn btn-secondary" onclick="window.location.hash='dashboard'">
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Limpiar vista
   */
  destroy() {
    // Cleanup
  }
}
