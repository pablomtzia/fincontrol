/**
 * Store — Unified data layer using localStorage
 * Single source of truth for all financial data
 */

import { generateId, getCurrentMonthStr } from './utils.js';
import { pushData, fullSync, isSyncEnabled } from './syncService.js';

const STORAGE_KEY = 'fincontrol_data';

// Default data template for a new month
function defaultMonthData() {
    return {
        income: [],
        fixedExpenses: [],
        variableExpenses: [],
        investments: [],
    };
}

// Initial seed data for first-time users
function seedData() {
    const month = getCurrentMonthStr();
    return {
        currentMonth: month,
        months: {
            [month]: {
                income: [
                    { id: 'inc1', name: 'Salario', amount: 1200, notes: 'Trabajo a tiempo parcial' },
                    { id: 'inc2', name: 'Prestaciones', amount: 680, notes: 'Beca estudios' },
                ],
                fixedExpenses: [
                    { id: 'fix1', name: 'Alimentación', amount: 250, category: 'alimentacion', notes: 'Compra semanal' },
                    { id: 'fix2', name: 'Gimnasio', amount: 28.90, category: 'salud', notes: 'Cuota mensual' },
                    { id: 'fix3', name: 'Claude Pro', amount: 21.78, category: 'suscripciones', notes: 'Suscripción IA' },
                    { id: 'fix4', name: 'iCloud', amount: 2.99, category: 'suscripciones', notes: 'Almacenamiento' },
                    { id: 'fix5', name: 'Suministros', amount: 50, category: 'hogar', notes: 'Luz, agua, gas, WiFi' },
                ],
                variableExpenses: [],
            },
        },
        investments: [
            { id: 'inv1', name: 'Bitcoin', type: 'crypto', broker: 'Trade Republic', shares: 0.014605, pricePerShare: 82000, invested: 1000, ticker: 'bitcoin' },
            { id: 'inv2', name: 'Alphabet', type: 'acción', broker: 'Trade Republic', shares: 5.399803, pricePerShare: 185.19, invested: 1000, ticker: 'GOOGL' },
            { id: 'inv3', name: 'District Metals', type: 'acción', broker: 'Trade Republic', shares: 13.554216, pricePerShare: 0.22, invested: 10, ticker: 'DMX.V' },
            { id: 'inv4', name: 'District Metals', type: 'acción', broker: 'IBKR', shares: 354, pricePerShare: 0.22, invested: 300, ticker: 'DMX.V' },
        ],
        lastPriceUpdate: null,
        _lastModified: Date.now(),
    };
}

class Store {
    constructor() {
        this.data = this.load();
        this.listeners = [];
        this._syncing = false;
        // Sync al iniciar
        this.initCloudSync();
        // Auto-sync cuando vuelves a la app/pestaña
        this._setupVisibilitySync();
    }

    // Load from localStorage
    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Error loading data:', e);
        }
        return seedData();
    }

    // Cloud sync on startup + tab focus
    async initCloudSync() {
        if (!isSyncEnabled() || this._syncing) return;
        this._syncing = true;
        try {
            const result = await fullSync(this.data);
            if (result.changed) {
                this.data = result.data;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
                console.log('Datos sincronizados desde la nube');
            }
        } catch (e) {
            console.warn('Cloud sync failed:', e);
        } finally {
            this._syncing = false;
        }
    }

    // Auto-sync when tab becomes visible again
    _setupVisibilitySync() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && isSyncEnabled()) {
                this.initCloudSync();
            }
        });
    }

    // Save to localStorage + push to cloud
    save() {
        this.data._lastModified = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.notify();
        // Push to cloud (async, non-blocking)
        pushData(this.data);
    }

    // Subscribe to changes
    subscribe(fn) {
        this.listeners.push(fn);
        return () => { this.listeners = this.listeners.filter(l => l !== fn); };
    }

    notify() {
        this.listeners.forEach(fn => fn(this.data));
    }

    // ===== MONTH NAVIGATION =====

    getCurrentMonth() {
        return this.data.currentMonth;
    }

    setCurrentMonth(month) {
        if (!this.data.months[month]) {
            this.data.months[month] = this.cloneTemplate();
        }
        this.data.currentMonth = month;
        this.save();
    }

    // Clone from previous month or use template for new months
    cloneTemplate() {
        const months = Object.keys(this.data.months).sort();
        if (months.length > 0) {
            const lastMonth = this.data.months[months[months.length - 1]];
            return {
                income: JSON.parse(JSON.stringify(lastMonth.income)).map(i => ({ ...i, id: generateId() })),
                fixedExpenses: JSON.parse(JSON.stringify(lastMonth.fixedExpenses)).map(e => ({ ...e, id: generateId() })),
                variableExpenses: [],
                investments: JSON.parse(JSON.stringify(lastMonth.investments)).map(i => ({ ...i, id: generateId() })),
            };
        }
        return defaultMonthData();
    }

    getMonthData(month = null) {
        const m = month || this.data.currentMonth;
        if (!this.data.months[m]) {
            this.data.months[m] = this.cloneTemplate();
            this.save();
        }
        return this.data.months[m];
    }

    // ===== INCOME =====

    getIncome(month = null) {
        return this.getMonthData(month).income;
    }

    addIncome(item) {
        const entry = { id: generateId(), ...item };
        this.getMonthData().income.push(entry);
        this.save();
        return entry;
    }

    updateIncome(id, updates) {
        const income = this.getMonthData().income;
        const idx = income.findIndex(i => i.id === id);
        if (idx !== -1) {
            income[idx] = { ...income[idx], ...updates };
            this.save();
        }
    }

    deleteIncome(id) {
        const md = this.getMonthData();
        md.income = md.income.filter(i => i.id !== id);
        this.save();
    }

    // ===== FIXED EXPENSES =====

    getFixedExpenses(month = null) {
        return this.getMonthData(month).fixedExpenses;
    }

    addFixedExpense(item) {
        const entry = { id: generateId(), ...item };
        this.getMonthData().fixedExpenses.push(entry);
        this.save();
        return entry;
    }

    updateFixedExpense(id, updates) {
        const expenses = this.getMonthData().fixedExpenses;
        const idx = expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], ...updates };
            this.save();
        }
    }

    deleteFixedExpense(id) {
        const md = this.getMonthData();
        md.fixedExpenses = md.fixedExpenses.filter(e => e.id !== id);
        this.save();
    }

    // ===== VARIABLE EXPENSES =====

    getVariableExpenses(month = null) {
        return this.getMonthData(month).variableExpenses;
    }

    addVariableExpense(item) {
        const entry = { id: generateId(), date: new Date().toISOString(), ...item };
        this.getMonthData().variableExpenses.push(entry);
        this.save();
        return entry;
    }

    updateVariableExpense(id, updates) {
        const expenses = this.getMonthData().variableExpenses;
        const idx = expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], ...updates };
            this.save();
        }
    }

    deleteVariableExpense(id) {
        const md = this.getMonthData();
        md.variableExpenses = md.variableExpenses.filter(e => e.id !== id);
        this.save();
    }

    // ===== INVESTMENTS =====

    getInvestments(month = null) {
        return this.getMonthData(month).investments;
    }

    addInvestment(item) {
        const entry = { id: generateId(), ...item };
        this.getMonthData().investments.push(entry);
        this.save();
        return entry;
    }

    updateInvestment(id, updates) {
        const investments = this.getMonthData().investments;
        const idx = investments.findIndex(i => i.id === id);
        if (idx !== -1) {
            investments[idx] = { ...investments[idx], ...updates };
            this.save();
        }
    }

    deleteInvestment(id) {
        const md = this.getMonthData();
        md.investments = md.investments.filter(i => i.id !== id);
        this.save();
    }

    // ===== PRICE UPDATES =====

    applyPriceUpdates(priceMap) {
        // priceMap = { investmentId: newPricePerShare }
        const investments = this.getMonthData().investments;
        let updated = 0;
        for (const [id, price] of Object.entries(priceMap)) {
            const idx = investments.findIndex(i => i.id === id);
            if (idx !== -1) {
                investments[idx].pricePerShare = price;
                updated++;
            }
        }
        if (updated > 0) {
            this.data.lastPriceUpdate = new Date().toISOString();
            this.save();
        }
        return updated;
    }

    getLastPriceUpdate() {
        return this.data.lastPriceUpdate || null;
    }

    // ===== SUMMARIES =====

    getSummary(month = null) {
        const md = this.getMonthData(month);

        const totalIncome = md.income.reduce((s, i) => s + Number(i.amount), 0);
        const totalFixed = md.fixedExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const totalVariable = md.variableExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const totalExpenses = totalFixed + totalVariable;

        const totalInvested = md.investments.reduce((s, i) => s + Number(i.invested), 0);
        const currentValue = md.investments.reduce(
            (s, i) => s + (Number(i.shares) * Number(i.pricePerShare)), 0
        );

        const netIncome = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

        return {
            income: totalIncome,
            expenses: { fixed: totalFixed, variable: totalVariable, total: totalExpenses },
            investments: {
                invested: totalInvested,
                currentValue,
                profit: currentValue - totalInvested,
                profitPercent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0
            },
            netIncome,
            savingsRate,
            patrimony: currentValue + Math.max(netIncome, 0),
        };
    }

    // ===== EXPORT / IMPORT =====

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(json) {
        try {
            const parsed = JSON.parse(json);
            if (parsed.currentMonth && parsed.months) {
                this.data = parsed;
                this.save();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    resetData() {
        this.data = seedData();
        this.save();
    }
}

// Singleton
export const store = new Store();
