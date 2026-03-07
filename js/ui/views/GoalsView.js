/**
 * Vista de Objetivos (Placeholder para MVP)
 */

export class GoalsView {
  constructor() {
    this.container = document.getElementById('appContent');
  }

  /**
   * Renderizar vista
   */
  async render() {
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">Objetivos de Ahorro</div>
        <div class="empty-state-description">
          Esta funcionalidad estará disponible próximamente.<br>
          Podrás crear metas de ahorro y hacer seguimiento de tu progreso.
        </div>
        <button class="btn btn-primary mt-md" onclick="window.location.hash='dashboard'">
          Volver al Dashboard
        </button>
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
