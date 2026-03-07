/**
 * QuickAdd — Entrada rápida de gastos con auto-categorización
 *
 * Escribes: "mercadona 50" → Gasto variable: Mercadona, 50€, categoría: Alimentación
 * Formatos aceptados:
 *   "mercadona 50"
 *   "mercadona 50€"
 *   "50 mercadona"
 *   "gasolina 30.5"
 *   "uber 12,50"
 */

import { store } from './store.js';
import { showToast } from './app.js';
import { EXPENSE_CATEGORIES, getCategoryById } from './utils.js';

// Mapeo de palabras clave a categorías
const CATEGORY_KEYWORDS = {
    alimentacion: [
        'mercadona', 'carrefour', 'lidl', 'aldi', 'dia', 'alcampo', 'hipercor',
        'supermercado', 'super', 'compra', 'comida', 'cena', 'almuerzo', 'desayuno',
        'restaurante', 'bar', 'cafe', 'cafetería', 'kebab', 'pizza', 'burger',
        'sushi', 'mcdonald', 'mcdonalds', 'burger king', 'kfc', 'starbucks',
        'telepizza', 'dominos', 'just eat', 'glovo', 'uber eats', 'deliveroo',
        'panadería', 'frutería', 'carnicería', 'pescadería', 'pastelería',
        'helado', 'cerveza', 'vino', 'tapas', 'menú', 'bocadillo',
    ],
    transporte: [
        'gasolina', 'diesel', 'gasolinera', 'repsol', 'cepsa', 'bp', 'shell',
        'parking', 'aparcamiento', 'bus', 'autobús', 'metro', 'tranvía',
        'taxi', 'uber', 'cabify', 'bolt', 'renfe', 'tren', 'ave',
        'avión', 'vuelo', 'blablacar', 'peaje', 'autopista', 'taller',
        'itv', 'seguro coche', 'multa', 'bici', 'patinete', 'alsa',
    ],
    salud: [
        'farmacia', 'médico', 'doctor', 'dentista', 'hospital', 'clínica',
        'óptica', 'gafas', 'lentillas', 'fisio', 'fisioterapeuta', 'psicólogo',
        'dermatólogo', 'vacuna', 'análisis', 'radiografía', 'seguro médico',
        'gimnasio', 'gym', 'proteína', 'vitaminas', 'suplemento',
    ],
    ocio: [
        'cine', 'teatro', 'concierto', 'festival', 'discoteca', 'club',
        'fiesta', 'copa', 'copas', 'juego', 'videojuego', 'steam',
        'playstation', 'ps5', 'xbox', 'nintendo', 'parque', 'zoo',
        'museo', 'exposición', 'escape room', 'boliche', 'karaoke',
        'deporte', 'fútbol', 'baloncesto', 'padel', 'tenis', 'esquí',
    ],
    hogar: [
        'ikea', 'leroy merlin', 'bricomart', 'limpieza', 'ferretería',
        'mueble', 'decoración', 'cortina', 'lámpara', 'electrodoméstico',
        'lavadora', 'frigorífico', 'aspiradora', 'colchón', 'almohada',
        'toalla', 'sábana', 'cocina', 'baño', 'jardín', 'pintura',
        'alquiler', 'hipoteca', 'comunidad', 'seguro hogar', 'luz', 'agua', 'gas', 'wifi',
    ],
    ropa: [
        'zara', 'h&m', 'hm', 'primark', 'nike', 'adidas', 'puma',
        'pull&bear', 'pull and bear', 'bershka', 'stradivarius', 'mango',
        'massimo dutti', 'uniqlo', 'decathlon', 'sprinter', 'foot locker',
        'ropa', 'zapatillas', 'zapatos', 'camiseta', 'pantalón', 'chaqueta',
        'abrigo', 'vestido', 'falda', 'bolso', 'cinturón', 'gorra',
    ],
    tecnologia: [
        'amazon', 'mediamarkt', 'media markt', 'pccomponentes', 'pc componentes',
        'apple', 'fnac', 'coolmod', 'aliexpress', 'temu',
        'móvil', 'teléfono', 'portátil', 'tablet', 'ipad', 'auriculares',
        'cargador', 'cable', 'ratón', 'teclado', 'monitor', 'impresora',
        'usb', 'disco duro', 'ssd', 'ram', 'componente',
    ],
    viajes: [
        'hotel', 'hostal', 'booking', 'airbnb', 'trivago',
        'ryanair', 'vueling', 'iberia', 'easyjet', 'wizz air',
        'equipaje', 'maleta', 'excursión', 'guía', 'tour',
        'souvenir', 'recuerdo', 'viaje', 'vacaciones', 'escapada',
    ],
    formacion: [
        'libro', 'librería', 'curso', 'udemy', 'coursera', 'masterclass',
        'academia', 'clase', 'matrícula', 'universidad', 'máster',
        'certificación', 'examen', 'oposición', 'material escolar',
        'cuaderno', 'bolígrafo', 'mochila',
    ],
    suscripciones: [
        'netflix', 'spotify', 'hbo', 'disney', 'disney+', 'youtube',
        'amazon prime', 'prime video', 'apple music', 'apple tv',
        'claude', 'chatgpt', 'openai', 'icloud', 'google one',
        'dropbox', 'notion', 'canva', 'adobe', 'microsoft 365',
        'twitch', 'patreon', 'crunchyroll', 'dazn',
    ],
};

/**
 * Detecta la categoría a partir del texto del gasto
 */
export function detectCategory(text) {
    const lower = text.toLowerCase().trim();

    for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return categoryId;
            }
        }
    }

    return 'otros';
}

/**
 * Parsea texto libre a { name, amount }
 * Formatos: "mercadona 50", "50 mercadona", "mercadona 50€", "gasolina 12,50"
 */
export function parseExpenseText(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Normalizar: quitar € y reemplazar coma por punto
    const normalized = trimmed.replace(/€/g, '').replace(',', '.').trim();

    // Patrón 1: "texto 50.00" o "texto 50"
    const match1 = normalized.match(/^(.+?)\s+([\d]+(?:\.[\d]+)?)\s*$/);
    if (match1) {
        return {
            name: capitalize(match1[1].trim()),
            amount: parseFloat(match1[2]),
        };
    }

    // Patrón 2: "50 texto" o "50.00 texto"
    const match2 = normalized.match(/^([\d]+(?:\.[\d]+)?)\s+(.+)$/);
    if (match2) {
        return {
            name: capitalize(match2[2].trim()),
            amount: parseFloat(match2[1]),
        };
    }

    return null;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Procesa la entrada rápida completa: parsea, categoriza y guarda
 */
export function processQuickAdd(text) {
    const parsed = parseExpenseText(text);
    if (!parsed || isNaN(parsed.amount) || parsed.amount <= 0) {
        return { success: false, error: 'Formato no reconocido. Escribe: nombre cantidad' };
    }

    const categoryId = detectCategory(parsed.name);
    const category = getCategoryById(categoryId);

    const expense = {
        name: parsed.name,
        amount: parsed.amount,
        category: categoryId,
        notes: 'Añadido rápido',
    };

    store.addVariableExpense(expense);

    return {
        success: true,
        expense,
        categoryName: category.name,
    };
}
