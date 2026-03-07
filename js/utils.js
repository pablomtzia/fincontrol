/**
 * Utils — Formateadores y helpers
 */

export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

export function formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function getMonthLabel(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function getMonthShort(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return `${MONTH_SHORT[month - 1]} ${year}`;
}

export function getCurrentMonthStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function prevMonth(monthStr) {
    let [y, m] = monthStr.split('-').map(Number);
    m--;
    if (m < 1) { m = 12; y--; }
    return `${y}-${String(m).padStart(2, '0')}`;
}

export function nextMonth(monthStr) {
    let [y, m] = monthStr.split('-').map(Number);
    m++;
    if (m > 12) { m = 1; y++; }
    return `${y}-${String(m).padStart(2, '0')}`;
}

// Definiciones de categorías de gasto
export const EXPENSE_CATEGORIES = [
    { id: 'alimentacion', name: 'Alimentación', color: '#ff9a9e' },
    { id: 'transporte', name: 'Transporte', color: '#a8e6cf' },
    { id: 'salud', name: 'Salud', color: '#ffd4a3' },
    { id: 'ocio', name: 'Ocio', color: '#c4b5ff' },
    { id: 'hogar', name: 'Hogar', color: '#ffb4d1' },
    { id: 'ropa', name: 'Ropa', color: '#b4e7ff' },
    { id: 'tecnologia', name: 'Tecnología', color: '#d4a5ff' },
    { id: 'viajes', name: 'Viajes', color: '#ffe5a5' },
    { id: 'formacion', name: 'Formación', color: '#95e6cb' },
    { id: 'suscripciones', name: 'Suscripciones', color: '#f0b4ff' },
    { id: 'otros', name: 'Otros', color: '#c7ceea' },
];

export function getCategoryById(id) {
    return EXPENSE_CATEGORIES.find(c => c.id === id) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}
