/**
 * Componente Modal
 */

import { ANIMATIONS } from '../../core/config.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';

class ModalComponent {
  constructor() {
    this.container = document.getElementById('modalContainer');
    this.currentModal = null;
  }

  /**
   * Mostrar modal
   * @param {Object} options - Opciones del modal
   * @returns {HTMLElement}
   */
  show(options = {}) {
    const {
      title = '',
      content = '',
      footer = '',
      closable = true,
      onClose = null
    } = options;

    // Cerrar modal existente si hay uno
    if (this.currentModal) {
      this.hide();
    }

    // Crear modal
    this.currentModal = this.createModal({ title, content, footer, closable, onClose });

    // Mostrar container
    this.container.classList.add('active');
    this.container.appendChild(this.currentModal);

    // Trap focus en modal
    this.trapFocus(this.currentModal);

    // Emitir evento
    eventBus.emit(EVENTS.MODAL_OPENED);

    return this.currentModal;
  }

  /**
   * Crear elemento modal
   * @param {Object} options - Opciones
   * @returns {HTMLElement}
   */
  createModal({ title, content, footer, closable, onClose }) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal-wrapper';

    modalElement.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          ${closable ? '<button class="modal-close" aria-label="Cerrar modal">×</button>' : ''}
        </div>
        <div class="modal-body">
          ${typeof content === 'string' ? content : ''}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    // Si content es un elemento, insertarlo
    if (content instanceof HTMLElement) {
      const modalBody = modalElement.querySelector('.modal-body');
      modalBody.innerHTML = '';
      modalBody.appendChild(content);
    }

    // Eventos de cierre
    if (closable) {
      const closeBtn = modalElement.querySelector('.modal-close');
      const overlay = modalElement.querySelector('.modal-overlay');

      closeBtn.addEventListener('click', () => {
        this.hide(onClose);
      });

      overlay.addEventListener('click', () => {
        this.hide(onClose);
      });

      // ESC para cerrar
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.hide(onClose);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    }

    return modalElement;
  }

  /**
   * Ocultar modal
   * @param {Function} callback - Callback al cerrar
   */
  hide(callback = null) {
    if (!this.currentModal) return;

    // Animación de salida
    this.container.classList.remove('active');

    setTimeout(() => {
      if (this.currentModal && this.currentModal.parentNode) {
        this.currentModal.parentNode.removeChild(this.currentModal);
      }
      this.currentModal = null;

      // Callback
      if (callback) {
        callback();
      }

      // Emitir evento
      eventBus.emit(EVENTS.MODAL_CLOSED);
    }, ANIMATIONS.MODAL_ANIMATION);
  }

  /**
   * Modal de confirmación
   * @param {Object} options - Opciones
   * @returns {Promise<boolean>}
   */
  confirm(options = {}) {
    const {
      title = '¿Estás seguro?',
      message = '',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      type = 'warning' // 'warning', 'danger', 'info'
    } = options;

    return new Promise((resolve) => {
      const content = `
        <div style="text-align: center; padding: 20px 0;">
          <p style="font-size: 16px; color: var(--color-text-secondary);">
            ${message}
          </p>
        </div>
      `;

      const footer = `
        <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
        <button class="btn btn-${type === 'danger' ? 'error' : 'primary'}" data-action="confirm">${confirmText}</button>
      `;

      const modal = this.show({
        title,
        content,
        footer,
        closable: true,
        onClose: () => resolve(false)
      });

      // Eventos de botones
      const confirmBtn = modal.querySelector('[data-action="confirm"]');
      const cancelBtn = modal.querySelector('[data-action="cancel"]');

      confirmBtn.addEventListener('click', () => {
        this.hide();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        this.hide();
        resolve(false);
      });
    });
  }

  /**
   * Trap focus dentro del modal (accesibilidad)
   * @param {HTMLElement} modal - Elemento modal
   */
  trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus en primer elemento
    setTimeout(() => firstElement.focus(), 100);

    // Trap focus
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Tab + Shift
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }
}

// Singleton instance
export const Modal = new ModalComponent();
