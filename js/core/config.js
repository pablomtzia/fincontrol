/**
 * Configuración global de la aplicación
 */

export const CONFIG = {
  APP_NAME: 'Finanzas Personales',
  VERSION: '1.0.0',
  DB_NAME: 'FinanceAppDB',
  DB_VERSION: 1,
  LOCALE: 'es-ES',
  CURRENCY: 'EUR',
  DATE_FORMAT: 'DD/MM/YYYY',
};

/**
 * Categorías predefinidas de gastos
 */
export const EXPENSE_CATEGORIES = [
  {
    id: 'alimentacion',
    name: 'Alimentación',
    icon: '🛒',
    color: '#FF9A9E',
    keywords: [
      'mercadona', 'carrefour', 'lidl', 'aldi', 'dia', 'ahorramas',
      'eroski', 'alcampo', 'hipercor', 'consum', 'supermercado',
      'restaurante', 'bar', 'cafeteria', 'comida', 'cena', 'desayuno',
      'menu', 'mcdonald', 'burger', 'pizza', 'kebab', 'tapas',
      'glovo', 'uber eats', 'just eat', 'deliveroo', 'compra'
    ]
  },
  {
    id: 'transporte',
    name: 'Transporte',
    icon: '🚗',
    color: '#A8E6CF',
    keywords: [
      'gasolina', 'gasolinera', 'repsol', 'cepsa', 'shell', 'bp',
      'diesel', 'combustible', 'repostar',
      'metro', 'bus', 'autobus', 'tren', 'renfe', 'cercanias',
      'taxi', 'uber', 'cabify', 'bicing', 'patinete',
      'taller', 'mecanico', 'revision', 'itv', 'parking',
      'aparcamiento', 'peaje', 'autopista'
    ]
  },
  {
    id: 'salud',
    name: 'Salud',
    icon: '💊',
    color: '#FFD4A3',
    keywords: [
      'farmacia', 'medicamento', 'medicina', 'parafarmacia',
      'medico', 'doctor', 'dentista', 'odontologo', 'fisio',
      'fisioterapia', 'clinica', 'hospital', 'seguro medico',
      'consulta', 'revision medica',
      'optica', 'gafas', 'lentillas'
    ]
  },
  {
    id: 'ocio',
    name: 'Ocio',
    icon: '🎮',
    color: '#C4B5FF',
    keywords: [
      'cine', 'teatro', 'concierto', 'museo', 'exposicion',
      'spotify', 'netflix', 'hbo', 'disney', 'streaming',
      'videojuego', 'steam', 'playstation', 'xbox', 'nintendo',
      'gimnasio', 'deporte', 'piscina', 'padel', 'futbol',
      'entrada', 'ticket', 'fiesta', 'evento'
    ]
  },
  {
    id: 'hogar',
    name: 'Hogar',
    icon: '🏠',
    color: '#FFB4D1',
    keywords: [
      'ikea', 'leroy merlin', 'bricomart', 'brico depot',
      'luz', 'agua', 'gas', 'electricidad', 'internet',
      'telefono', 'alquiler', 'hipoteca', 'comunidad',
      'seguro hogar', 'limpieza', 'reparacion',
      'mueble', 'decoracion', 'electrodomestico'
    ]
  },
  {
    id: 'ropa',
    name: 'Ropa',
    icon: '👕',
    color: '#B4E7FF',
    keywords: [
      'zara', 'h&m', 'mango', 'pull bear', 'bershka',
      'stradivarius', 'primark', 'decathlon', 'nike', 'adidas',
      'ropa', 'zapatos', 'zapatillas', 'calzado', 'vestido',
      'camisa', 'pantalon', 'chaqueta',
      'tintoreria', 'zapatero', 'arreglo'
    ]
  },
  {
    id: 'tecnologia',
    name: 'Tecnología',
    icon: '📱',
    color: '#D4A5FF',
    keywords: [
      'mediamarkt', 'fnac', 'pccomponentes', 'amazon',
      'apple', 'samsung', 'xiaomi',
      'movil', 'ordenador', 'portatil', 'tablet', 'iphone',
      'macbook', 'pc', 'auriculares', 'teclado', 'raton',
      'software', 'licencia', 'suscripcion', 'app'
    ]
  },
  {
    id: 'viajes',
    name: 'Viajes',
    icon: '✈️',
    color: '#FFE5A5',
    keywords: [
      'avion', 'vuelo', 'ryanair', 'vueling', 'iberia',
      'booking', 'airbnb', 'hotel', 'hostal', 'alojamiento',
      'excursion', 'tour', 'guia', 'seguro viaje'
    ]
  },
  {
    id: 'otros',
    name: 'Otros',
    icon: '💰',
    color: '#C7CEEA',
    keywords: []
  }
];

/**
 * Categorías predefinidas de ingresos
 */
export const INCOME_CATEGORIES = [
  {
    id: 'salario',
    name: 'Salario',
    icon: '💵',
    color: '#4ECDC4',
    keywords: ['salario', 'nomina', 'sueldo', 'paga', 'trabajo']
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: '💼',
    color: '#95E1D3',
    keywords: ['freelance', 'autonomo', 'proyecto', 'cliente', 'factura']
  },
  {
    id: 'ingresos-varios',
    name: 'Ingresos varios',
    icon: '🎁',
    color: '#A8E6CF',
    keywords: ['regalo', 'venta', 'devolucion', 'reembolso']
  },
  {
    id: 'otros-ingresos',
    name: 'Otros',
    icon: '💰',
    color: '#B8E6D5',
    keywords: []
  }
];

/**
 * Todas las categorías combinadas
 */
export const ALL_CATEGORIES = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES
};

/**
 * Configuración de formatos
 */
export const FORMATS = {
  CURRENCY: {
    style: 'currency',
    currency: CONFIG.CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  },
  DATE: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  },
  DATETIME: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
};

/**
 * Rutas de la aplicación
 */
export const ROUTES = {
  DASHBOARD: 'dashboard',
  TRANSACTIONS: 'transactions',
  GOALS: 'goals',
  SETTINGS: 'settings'
};

/**
 * Configuración de animaciones
 */
export const ANIMATIONS = {
  TOAST_DURATION: 4000,
  TOAST_ANIMATION: 300,
  MODAL_ANIMATION: 300,
  NUMBER_ANIMATION: 400
};

/**
 * Límites y validaciones
 */
export const LIMITS = {
  MAX_AMOUNT: 1000000,
  MIN_AMOUNT: 0.01,
  MAX_DESCRIPTION_LENGTH: 200,
  TRANSACTIONS_PER_PAGE: 20
};
