/**
 * App.js — Main entry point
 * Router, navigation, modal system, toast notifications
 */

import { store } from './store.js';
import { getMonthLabel, getMonthShort, prevMonth, nextMonth, getCategoryById, formatCurrency } from './utils.js';
import { DashboardView } from './views/DashboardView.js';
import { IncomeView } from './views/IncomeView.js';
import { ExpensesView } from './views/ExpensesView.js';
import { InvestmentsView } from './views/InvestmentsView.js';
import { SettingsView } from './views/SettingsView.js';
import { parseExpenseText, detectCategory, processQuickAdd } from './quickAdd.js';

// ===== VIEWS =====
const views = {
  dashboard: new DashboardView(),
  income: new IncomeView(),
  expenses: new ExpensesView(),
  investments: new InvestmentsView(),
  settings: new SettingsView(),
};

let currentView = null;
let currentViewName = 'dashboard';

// ===== DOM ELEMENTS =====
const mainContent = document.getElementById('mainContent');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const toastContainer = document.getElementById('toastContainer');
const sidebar = document.getElementById('sidebar');

// ===== NAVIGATION =====

function navigateTo(viewName) {
  if (!views[viewName]) return;

  // Destroy previous view
  if (currentView && currentView.destroy) {
    currentView.destroy();
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Render new view
  currentView = views[viewName];
  currentViewName = viewName;
  mainContent.innerHTML = ''; // Clear
  currentView.render(mainContent);

  // Close mobile sidebar
  closeSidebar();

  // Scroll to top
  window.scrollTo(0, 0);
}

function rerender() {
  if (currentView) {
    if (currentView.destroy) currentView.destroy();
    currentView.render(mainContent);
  }
}

// ===== MONTH NAVIGATION =====

function updateMonthDisplay() {
  const month = store.getCurrentMonth();
  const label = document.getElementById('currentMonthLabel');
  const mobile = document.getElementById('currentMonthMobile');
  if (label) label.textContent = getMonthLabel(month);
  if (mobile) mobile.textContent = getMonthShort(month);
}

function goToPrevMonth() {
  const current = store.getCurrentMonth();
  store.setCurrentMonth(prevMonth(current));
  updateMonthDisplay();
  rerender();
}

function goToNextMonth() {
  const current = store.getCurrentMonth();
  store.setCurrentMonth(nextMonth(current));
  updateMonthDisplay();
  rerender();
}

// ===== MODAL SYSTEM =====

let onModalCloseCallback = null;

export function openModal(title, htmlContent, onReady = null) {
  modalTitle.textContent = title;
  modalBody.innerHTML = htmlContent;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Cancel button inside modal
  const cancelBtn = modalBody.querySelector('#cancelModal');
  cancelBtn?.addEventListener('click', closeModal);

  // Store callback
  onModalCloseCallback = null;

  if (onReady) {
    onReady(modalBody);
  }

  // Setup form submission to auto-close modal
  const form = modalBody.querySelector('form');
  if (form) {
    const originalSubmit = form.onsubmit;
    form.addEventListener('submit', (e) => {
      // After a short delay, close modal and rerender
      setTimeout(() => {
        closeModal();
        rerender();
      }, 50);
    });
  }
}

export function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  if (onModalCloseCallback) {
    onModalCloseCallback();
    onModalCloseCallback = null;
  }
}

// ===== TOAST NOTIFICATIONS =====

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ===== MOBILE SIDEBAR =====

function openSidebar() {
  sidebar.classList.add('open');
  getOrCreateOverlay().classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  getOrCreateOverlay().classList.remove('active');
}

function getOrCreateOverlay() {
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeSidebar);
    document.body.appendChild(overlay);
  }
  return overlay;
}

// ===== INIT =====

function init() {
  console.log('FinControl v2.0 — Inicializando...');

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  // Month navigation (sidebar)
  document.getElementById('prevMonth')?.addEventListener('click', goToPrevMonth);
  document.getElementById('nextMonth')?.addEventListener('click', goToNextMonth);

  // Month navigation (mobile)
  document.getElementById('prevMonthMobile')?.addEventListener('click', goToPrevMonth);
  document.getElementById('nextMonthMobile')?.addEventListener('click', goToNextMonth);

  // Mobile hamburger
  document.getElementById('hamburgerBtn')?.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  // Modal close
  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSidebar();
    }
  });

  // Update month display
  updateMonthDisplay();

  // QuickAdd bar
  initQuickAdd();

  // Re-render current view when cloud sync brings new data
  window.addEventListener('fincontrol-synced', () => {
    console.log('Sync: re-rendering', currentViewName);
    navigateTo(currentViewName);
  });

  // Start on dashboard
  navigateTo('dashboard');

  console.log('fincontrol listo');
}

// ===== QUICK ADD =====

function initQuickAdd() {
  const input = document.getElementById('quickAddInput');
  const btn = document.getElementById('quickAddBtn');
  const preview = document.getElementById('quickAddPreview');

  if (!input || !btn || !preview) return;

  // Live preview mientras escribe
  input.addEventListener('input', () => {
    const text = input.value.trim();
    if (!text) {
      preview.textContent = '';
      preview.classList.remove('has-preview');
      return;
    }

    const parsed = parseExpenseText(text);
    if (parsed && parsed.amount > 0) {
      const catId = detectCategory(parsed.name);
      const cat = getCategoryById(catId);
      preview.innerHTML = `${parsed.name} — ${formatCurrency(parsed.amount)} <span class="preview-category"><span class="color-dot" style="background:${cat.color}; width:6px; height:6px;"></span> ${cat.name}</span>`;
      preview.classList.add('has-preview');
    } else {
      preview.textContent = 'Escribe: nombre cantidad (ej: mercadona 50)';
      preview.classList.remove('has-preview');
    }
  });

  // Submit con Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitQuickAdd(input, preview);
    }
  });

  // Submit con botón
  btn.addEventListener('click', () => {
    submitQuickAdd(input, preview);
  });
}

function submitQuickAdd(input, preview) {
  const text = input.value.trim();
  if (!text) return;

  const result = processQuickAdd(text);

  if (result.success) {
    showToast(`${result.expense.name} — ${formatCurrency(result.expense.amount)} (${result.categoryName})`, 'success');
    input.value = '';
    preview.textContent = '';
    preview.classList.remove('has-preview');

    // Re-renderizar si estamos en gastos o dashboard
    if (currentViewName === 'expenses' || currentViewName === 'dashboard') {
      rerender();
    }
  } else {
    showToast(result.error, 'error');
  }
}

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
