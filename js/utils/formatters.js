/**
 * Utilidades para formateo de datos
 */

import { CONFIG, FORMATS } from '../core/config.js';

/**
 * Formatear cantidad como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada (ej: "1.234,56 €")
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat(CONFIG.LOCALE, FORMATS.CURRENCY).format(amount);
}

/**
 * Formatear fecha
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export function formatDate(date, options = FORMATS.DATE) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(CONFIG.LOCALE, options).format(dateObj);
}

/**
 * Formatear fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(date) {
  return formatDate(date, FORMATS.DATETIME);
}

/**
 * Obtener nombre del mes
 * @param {string} monthStr - Mes en formato YYYY-MM
 * @returns {string} Nombre del mes (ej: "Marzo 2026")
 */
export function getMonthName(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);

  const monthName = date.toLocaleDateString(CONFIG.LOCALE, { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
}

/**
 * Obtener mes actual en formato YYYY-MM
 * @returns {string}
 */
export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Obtener fecha de hoy en formato YYYY-MM-DD
 * @returns {string}
 */
export function getTodayISO() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Formatear fecha relativa (ej: "Hoy", "Ayer", "Hace 3 días")
 * @param {string|Date} date - Fecha
 * @returns {string}
 */
export function formatRelativeDate(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffTime = today - dateObj;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;

  return formatDate(dateObj);
}

/**
 * Formatear número con separadores de miles
 * @param {number} num - Número a formatear
 * @returns {string}
 */
export function formatNumber(num) {
  return new Intl.NumberFormat(CONFIG.LOCALE).format(num);
}

/**
 * Formatear porcentaje
 * @param {number} value - Valor (0-1 o 0-100)
 * @param {boolean} isDecimal - Si el valor está en formato decimal (0-1)
 * @returns {string}
 */
export function formatPercentage(value, isDecimal = true) {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Abreviar cantidad grande
 * @param {number} num - Número a abreviar
 * @returns {string} Ej: "1,2K", "3,5M"
 */
export function abbreviateNumber(num) {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Capitalizar primera letra
 * @param {string} str - Cadena de texto
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncar texto
 * @param {string} str - Texto
 * @param {number} maxLength - Longitud máxima
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
