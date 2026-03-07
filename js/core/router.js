/**
 * Router para navegación SPA (Single Page Application)
 * Usa hash-based routing (#/ruta)
 */

import { eventBus, EVENTS } from './eventBus.js';
import { stateManager } from './state.js';

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }

  /**
   * Inicializar router
   */
  init() {
    // Escuchar cambios en el hash
    window.addEventListener('hashchange', () => this.handleRoute());

    // Cargar ruta inicial
    this.handleRoute();
  }

  /**
   * Registrar una ruta
   * @param {string} path - Ruta (sin el #)
   * @param {Function} handler - Función a ejecutar cuando se navegue a esta ruta
   */
  register(path, handler) {
    this.routes[path] = handler;
  }

  /**
   * Navegar a una ruta
   * @param {string} path - Ruta destino
   */
  navigate(path) {
    window.location.hash = path;
  }

  /**
   * Manejar cambio de ruta
   */
  async handleRoute() {
    // Obtener ruta del hash (sin el #)
    let path = window.location.hash.slice(1);

    // Si no hay hash, usar ruta por defecto
    if (!path || path === '/') {
      path = 'dashboard';
      window.location.hash = path;
      return;
    }

    // Remover slash inicial si existe
    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    // Si la ruta no está registrada, ir a dashboard
    if (!this.routes[path]) {
      console.warn(`Ruta "${path}" no encontrada, redirigiendo a dashboard`);
      this.navigate('dashboard');
      return;
    }

    // Actualizar ruta actual
    this.currentRoute = path;

    // Actualizar estado
    stateManager.setCurrentView(path);

    // Actualizar UI: título y navegación activa
    this.updateUI(path);

    // Ejecutar handler de la ruta
    try {
      await this.routes[path]();
    } catch (error) {
      console.error(`Error al cargar ruta "${path}":`, error);
    }

    // Emitir evento de cambio de ruta
    eventBus.emit(EVENTS.ROUTE_CHANGED, path);
  }

  /**
   * Actualizar UI (título, navegación)
   * @param {string} path - Ruta actual
   */
  updateUI(path) {
    // Actualizar navegación activa (tabs)
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      const route = tab.dataset.route;
      if (route === path) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * Ir atrás en el historial
   */
  back() {
    window.history.back();
  }

  /**
   * Obtener ruta actual
   * @returns {string} Ruta actual
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Verificar si una ruta está activa
   * @param {string} path - Ruta a verificar
   * @returns {boolean} true si es la ruta actual
   */
  isActive(path) {
    return this.currentRoute === path;
  }
}

// Singleton instance
export const router = new Router();
