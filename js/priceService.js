/**
 * PriceService — Obtiene precios de mercado en tiempo real
 *
 * Crypto: CoinGecko API (gratuita, sin clave, CORS habilitado)
 * Acciones: Yahoo Finance via proxy CORS
 * Divisas: ExchangeRate API (gratuita, sin clave)
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
];

// Mapeo de nombres comunes a IDs de CoinGecko
const CRYPTO_IDS = {
    'bitcoin': 'bitcoin', 'btc': 'bitcoin',
    'ethereum': 'ethereum', 'eth': 'ethereum',
    'solana': 'solana', 'sol': 'solana',
    'cardano': 'cardano', 'ada': 'cardano',
    'polkadot': 'polkadot', 'dot': 'polkadot',
    'ripple': 'ripple', 'xrp': 'ripple',
    'dogecoin': 'dogecoin', 'doge': 'dogecoin',
    'litecoin': 'litecoin', 'ltc': 'litecoin',
    'chainlink': 'chainlink', 'link': 'chainlink',
    'avalanche': 'avalanche-2',
};

// Mapeo de nombres comunes a tickers de Yahoo Finance
const STOCK_TICKERS = {
    'alphabet': 'GOOGL',
    'google': 'GOOGL',
    'googl': 'GOOGL',
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'amazon': 'AMZN',
    'tesla': 'TSLA',
    'nvidia': 'NVDA',
    'meta': 'META',
    'netflix': 'NFLX',
    'district metals': 'DMX.V',
    'dmx': 'DMX.V',
};

function resolveCryptoId(name) {
    return CRYPTO_IDS[name.toLowerCase().trim()] || null;
}

function resolveStockTicker(name) {
    return STOCK_TICKERS[name.toLowerCase().trim()] || null;
}

// ===== COINGECKO (CRYPTO) =====

async function fetchCryptoPrices(ids) {
    if (ids.length === 0) return {};
    const unique = [...new Set(ids)];
    const url = `${COINGECKO_API}/simple/price?ids=${unique.join(',')}&vs_currencies=eur`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    const prices = {};
    for (const [id, vals] of Object.entries(data)) {
        if (vals.eur) prices[id] = vals.eur;
    }
    return prices;
}

// ===== EXCHANGE RATES =====

let cachedRates = null;
let ratesFetchedAt = 0;

async function getExchangeRates() {
    // Cache rates for 1 hour
    if (cachedRates && Date.now() - ratesFetchedAt < 3600000) {
        return cachedRates;
    }
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/EUR');
        if (!res.ok) throw new Error();
        const data = await res.json();
        cachedRates = data.rates;
        ratesFetchedAt = Date.now();
        return cachedRates;
    } catch {
        // Tasas de cambio aproximadas como fallback
        return { USD: 1.08, CAD: 1.58, GBP: 0.85, CHF: 0.95, JPY: 162, GBX: 85 };
    }
}

function convertToEUR(price, currency, rates) {
    if (currency === 'EUR') return price;
    // GBX = GBP in pennies
    if (currency === 'GBX' || currency === 'GBp') {
        return (price / 100) / (rates['GBP'] || 0.85);
    }
    if (rates[currency]) {
        return price / rates[currency];
    }
    return price; // No conversion available
}

// ===== YAHOO FINANCE (ACCIONES) =====

async function fetchWithProxy(url) {
    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
            if (res.ok) {
                const text = await res.text();
                return JSON.parse(text);
            }
        } catch {
            continue; // Try next proxy
        }
    }
    throw new Error('Todos los proxies fallaron');
}

async function fetchStockPrice(ticker) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
    const data = await fetchWithProxy(yahooUrl);

    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) {
        throw new Error(`Sin datos de precio para ${ticker}`);
    }
    return {
        price: meta.regularMarketPrice,
        currency: meta.currency || 'USD',
    };
}

// ===== FUNCIÓN PRINCIPAL =====

/**
 * Obtiene precios actuales para todas las inversiones.
 * Devuelve { updates: { investmentId: newPrice }, errors: string[] }
 */
export async function updatePrices(investments) {
    const updates = {};
    const errors = [];

    // Separar crypto y acciones
    const cryptoInvs = [];
    const stockInvs = [];

    for (const inv of investments) {
        if (inv.type === 'crypto') {
            const id = resolveCryptoId(inv.name) || inv.ticker;
            if (id) {
                cryptoInvs.push({ inv, cryptoId: id });
            } else {
                errors.push(`${inv.name}: no se reconoce como cripto`);
            }
        } else {
            const ticker = resolveStockTicker(inv.name) || inv.ticker;
            if (ticker) {
                stockInvs.push({ inv, stockTicker: ticker });
            } else {
                errors.push(`${inv.name}: sin ticker configurado`);
            }
        }
    }

    // 1. Obtener precios crypto
    if (cryptoInvs.length > 0) {
        try {
            const ids = cryptoInvs.map(c => c.cryptoId);
            const cryptoPrices = await fetchCryptoPrices(ids);
            for (const { inv, cryptoId } of cryptoInvs) {
                if (cryptoPrices[cryptoId] !== undefined) {
                    updates[inv.id] = cryptoPrices[cryptoId];
                } else {
                    errors.push(`${inv.name}: precio no disponible`);
                }
            }
        } catch (e) {
            errors.push('Error al obtener precios crypto: ' + e.message);
        }
    }

    // 2. Obtener tasas de cambio y precios de acciones
    if (stockInvs.length > 0) {
        const rates = await getExchangeRates();
        const uniqueTickers = [...new Set(stockInvs.map(s => s.stockTicker))];

        for (const ticker of uniqueTickers) {
            try {
                const { price, currency } = await fetchStockPrice(ticker);
                const eurPrice = convertToEUR(price, currency, rates);

                for (const { inv, stockTicker } of stockInvs) {
                    if (stockTicker === ticker) {
                        updates[inv.id] = eurPrice;
                    }
                }
            } catch (e) {
                errors.push(`${ticker}: ${e.message}`);
            }
        }
    }

    return { updates, errors };
}
