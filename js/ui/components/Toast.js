/**
 * Componente Toast para notificaciones
 */

import { ANIMATIONS } from '../../core/config.js';

class ToastComponent {
  constructor() {
    this.container = document.getElementById('toastContainer');
    this.toasts = [];
  }

  /**
   * Mostrar toast
   * @param {Object} options - Opciones del toast
   */
  show(options = {}) {
    const {
      message = '',
      description = '',
      type = 'info', // 'success', 'error', 'warning', 'info'
      duration = ANIMATIONS.TOAST_DURATION,
      closable = true
    } = options;

    const toast = this.createToast({ message, description, type, closable });
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toast);
      }, duration);
    }

    return toast;
  }

  /**
   * Crear elemento toast
   * @param {Object} options - Opciones del toast
   * @returns {HTMLElement}
   */
  createToast({ message, description, type, closable }) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icono según tipo
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
        ${description ? `<div class="toast-description">${description}</div>` : ''}
      </div>
      ${closable ? '<button class="toast-close" aria-label="Cerrar">×</button>' : ''}
    `;

    // Evento de cierre
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.hide(toast));
    }

    return toast;
  }

  /**
   * Ocultar toast
   * @param {HTMLElement} toast - Elemento toast a ocultar
   */
  hide(toast) {
    toast.classList.add('removing');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts = this.toasts.filter(t => t !== toast);
    }, ANIMATIONS.TOAST_ANIMATION);
  }

  /**
   * Toast de éxito
   * @param {string} message - Mensaje
   * @param {string} description - Descripción opcional
   */
  success(message, description = '') {
    return this.show({ message, description, type: 'success' });
  }

  /**
   * Toast de error
   * @param {string} message - Mensaje
   * @param {string} description - Descripción opcional
   */
  error(message, description = '') {
    return this.show({ message, description, type: 'error' });
  }

  /**
   * Toast de advertencia
   * @param {string} message - Mensaje
   * @param {string} description - Descripción opcional
   */
  warning(message, description = '') {
    return this.show({ message, description, type: 'warning' });
  }

  /**
   * Toast de información
   * @param {string} message - Mensaje
   * @param {string} description - Descripción opcional
   */
  info(message, description = '') {
    return this.show({ message, description, type: 'info' });
  }

  /**
   * Limpiar todos los toasts
   */
  clearAll() {
    this.toasts.forEach(toast => this.hide(toast));
  }
}

// Singleton instance
export const Toast = new ToastComponent();
