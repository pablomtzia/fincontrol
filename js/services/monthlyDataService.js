/**
 * Servicio para gestionar datos mensuales
 * Los ingresos y gastos fijos se replican automáticamente cada mes
 * Los gastos variables se cargan por mes
 */

class MonthlyDataService {
  constructor() {
    this.storageKey = 'finance_monthly_data';

    // Template base: ingresos y gastos fijos que se replican cada mes
    this.template = {
      income: [
        { id: 1, name: 'Salary', amount: 1200.00, type: 'fixed', notes: 'Monthly' },
        { id: 2, name: 'Benefits', amount: 680.00, type: 'fixed', notes: 'Monthly' }
      ],
      fixedExpenses: [
        { id: 1, name: 'Food', amount: 250.00, category: 'food', notes: 'Groceries' },
        { id: 2, name: 'Gym', amount: 28.90, category: 'health', notes: 'Monthly fee' },
        { id: 3, name: 'Claude Pro', amount: 21.78, category: 'tech', notes: 'Subscription' },
        { id: 4, name: 'iCloud', amount: 2.99, category: 'tech', notes: 'Storage' },
        { id: 5, name: 'Utilities', amount: 50.00, category: 'home', notes: 'Electricity, Water, Gas, WiFi' }
      ],
      investments: [
        {
          id: 1,
          name: 'Bitcoin',
          invested: 1000.00,
          shares: 0.014605,
          pricePerShare: 68465.82,
          broker: 'Trade Republic',
          type: 'crypto'
        },
        {
          id: 2,
          name: 'Alphabet',
          invested: 1000.00,
          shares: 5.399803,
          pricePerShare: 183.55,
          broker: 'Trade Republic',
          type: 'stock'
        },
        {
          id: 3,
          name: 'District Metals',
          invested: 10.00,
          shares: 13.554216,
          pricePerShare: 0.74,
          broker: 'Trade Republic',
          type: 'stock'
        },
        {
          id: 4,
          name: 'District Metals',
          invested: 300.00,
          shares: 354,
          pricePerShare: 0.85,
          broker: 'IBKR',
          type: 'stock'
        }
      ]
    };

    // Inicializar con mes actual
    this.data = this.loadData();
  }

  /**
   * Cargar datos desde localStorage
   */
  loadData() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return JSON.parse(stored);
    }

    // Inicializar con marzo 2026
    const currentMonth = '2026-03';
    return {
      currentMonth,
      months: {
        [currentMonth]: this.createMonthData()
      }
    };
  }

  /**
   * Guardar datos en localStorage
   */
  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  /**
   * Crear datos para un nuevo mes basado en el template
   */
  createMonthData() {
    return {
      income: JSON.parse(JSON.stringify(this.template.income)),
      fixedExpenses: JSON.parse(JSON.stringify(this.template.fixedExpenses)),
      variableExpenses: [],
      investments: JSON.parse(JSON.stringify(this.template.investments)),
      transactions: []
    };
  }

  /**
   * Obtener mes actual seleccionado
   */
  getCurrentMonth() {
    return this.data.currentMonth;
  }

  /**
   * Cambiar mes actual
   */
  setCurrentMonth(month) {
    // Si el mes no existe, crearlo
    if (!this.data.months[month]) {
      this.data.months[month] = this.createMonthData();
    }

    this.data.currentMonth = month;
    this.saveData();
  }

  /**
   * Obtener datos de un mes específico
   */
  getMonthData(month = null) {
    const targetMonth = month || this.data.currentMonth;

    // Si el mes no existe, crearlo
    if (!this.data.months[targetMonth]) {
      this.data.months[targetMonth] = this.createMonthData();
      this.saveData();
    }

    return this.data.months[targetMonth];
  }

  /**
   * Obtener lista de todos los meses disponibles
   */
  getAvailableMonths() {
    return Object.keys(this.data.months).sort();
  }

  /**
   * Obtener meses en formato legible
   */
  getMonthsFormatted() {
    const months = this.getAvailableMonths();
    const monthNames = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };

    return months.map(month => {
      const [year, monthNum] = month.split('-');
      return {
        value: month,
        label: `${monthNames[monthNum]} ${year}`
      };
    });
  }

  /**
   * Agregar mes nuevo al horizonte temporal
   */
  addMonth(month) {
    if (!this.data.months[month]) {
      this.data.months[month] = this.createMonthData();
      this.saveData();
    }
  }

  /**
   * Agregar gasto variable a un mes
   */
  addVariableExpense(expense, month = null) {
    const targetMonth = month || this.data.currentMonth;
    const monthData = this.getMonthData(targetMonth);

    const newExpense = {
      id: Date.now(),
      ...expense,
      date: new Date().toISOString()
    };

    monthData.variableExpenses.push(newExpense);
    this.saveData();

    return newExpense;
  }

  /**
   * Actualizar gasto variable
   */
  updateVariableExpense(id, updates, month = null) {
    const targetMonth = month || this.data.currentMonth;
    const monthData = this.getMonthData(targetMonth);

    const index = monthData.variableExpenses.findIndex(e => e.id === id);
    if (index !== -1) {
      monthData.variableExpenses[index] = {
        ...monthData.variableExpenses[index],
        ...updates
      };
      this.saveData();
      return monthData.variableExpenses[index];
    }

    return null;
  }

  /**
   * Eliminar gasto variable
   */
  deleteVariableExpense(id, month = null) {
    const targetMonth = month || this.data.currentMonth;
    const monthData = this.getMonthData(targetMonth);

    monthData.variableExpenses = monthData.variableExpenses.filter(e => e.id !== id);
    this.saveData();
  }

  /**
   * Actualizar precio de inversión para un mes específico
   */
  updateInvestmentPrice(id, newPrice, month = null) {
    const targetMonth = month || this.data.currentMonth;
    const monthData = this.getMonthData(targetMonth);

    const investment = monthData.investments.find(inv => inv.id === id);
    if (investment) {
      investment.pricePerShare = newPrice;
      this.saveData();
      return investment;
    }

    return null;
  }

  /**
   * Obtener resumen del mes actual
   */
  getCurrentMonthSummary() {
    const monthData = this.getMonthData();

    const totalIncome = monthData.income.reduce((sum, item) => sum + item.amount, 0);
    const totalFixedExpenses = monthData.fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalVariableExpenses = monthData.variableExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;

    const totalInvested = monthData.investments.reduce((sum, inv) => sum + inv.invested, 0);
    const currentInvestmentValue = monthData.investments.reduce(
      (sum, inv) => sum + (inv.shares * inv.pricePerShare),
      0
    );

    const netIncome = totalIncome - totalExpenses;

    return {
      income: totalIncome,
      expenses: {
        fixed: totalFixedExpenses,
        variable: totalVariableExpenses,
        total: totalExpenses
      },
      investments: {
        invested: totalInvested,
        currentValue: currentInvestmentValue,
        profit: currentInvestmentValue - totalInvested
      },
      netIncome,
      savingsRate: totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0
    };
  }

  /**
   * Generar meses automáticamente desde marzo 2026 hasta diciembre 2026
   */
  generateMonthsForYear() {
    const year = 2026;
    for (let month = 3; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      this.addMonth(monthStr);
    }
    this.saveData();
  }
}

// Singleton
export const monthlyDataService = new MonthlyDataService();
