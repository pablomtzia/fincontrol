/**
 * SyncService — Sincronización en la nube via Firebase Realtime Database REST API
 *
 * MERGE inteligente: combina datos de ambos dispositivos por ID.
 * Auto-sync cuando vuelves a la pestaña/app.
 */

const SYNC_URL_KEY = 'fincontrol_sync_url';
const SYNC_ENABLED_KEY = 'fincontrol_sync_enabled';

// ===== CONFIG =====

export function getSyncUrl() {
    return localStorage.getItem(SYNC_URL_KEY) || '';
}

export function setSyncUrl(url) {
    const clean = url.replace(/\/+$/, '');
    localStorage.setItem(SYNC_URL_KEY, clean);
}

export function isSyncEnabled() {
    return localStorage.getItem(SYNC_ENABLED_KEY) === 'true' && getSyncUrl().length > 0;
}

export function enableSync(url) {
    setSyncUrl(url);
    localStorage.setItem(SYNC_ENABLED_KEY, 'true');
}

export function disableSync() {
    localStorage.setItem(SYNC_ENABLED_KEY, 'false');
}

// ===== SYNC OPERATIONS =====

/**
 * Sube datos a Firebase (PUT)
 */
export async function pushData(data) {
    if (!isSyncEnabled()) return false;

    try {
        const url = getSyncUrl();
        const payload = {
            ...data,
            _lastModified: Date.now(),
            _device: getDeviceId(),
        };

        const res = await fetch(`${url}/fincontrol.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return res.ok;
    } catch (e) {
        console.warn('Sync push failed:', e.message);
        return false;
    }
}

/**
 * Descarga datos de Firebase (GET)
 */
export async function pullData() {
    if (!isSyncEnabled()) return null;

    try {
        const url = getSyncUrl();
        const res = await fetch(`${url}/fincontrol.json`);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data || !data.months) return null;

        return data;
    } catch (e) {
        console.warn('Sync pull failed:', e.message);
        return null;
    }
}

/**
 * Comprueba si la URL de Firebase es válida
 */
export async function testConnection(url) {
    try {
        const clean = url.replace(/\/+$/, '');
        const res = await fetch(`${clean}/.json?shallow=true`, {
            signal: AbortSignal.timeout(5000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

// ===== MERGE INTELIGENTE =====

/**
 * Merge de dos arrays por ID: combina sin duplicados.
 * Si un ID existe en ambos, mantiene la versión del array 'priority'.
 */
function mergeArraysById(arrA, arrB) {
    if (!arrA && !arrB) return [];
    if (!arrA) return [...arrB];
    if (!arrB) return [...arrA];

    const map = new Map();

    // Primero meter B (cloud)
    for (const item of arrB) {
        if (item && item.id) {
            map.set(item.id, item);
        }
    }

    // Luego A (local) — si existe en ambos, local gana (es lo que el usuario acaba de editar)
    for (const item of arrA) {
        if (item && item.id) {
            map.set(item.id, item);
        }
    }

    return Array.from(map.values());
}

/**
 * Merge completo de datos locales + nube.
 * Combina gastos, ingresos e inversiones de ambos dispositivos.
 */
export function mergeData(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    const merged = JSON.parse(JSON.stringify(localData)); // deep clone

    // Merge de cada mes
    const allMonths = new Set([
        ...Object.keys(localData.months || {}),
        ...Object.keys(cloudData.months || {}),
    ]);

    if (!merged.months) merged.months = {};

    for (const month of allMonths) {
        const localMonth = (localData.months || {})[month] || {};
        const cloudMonth = (cloudData.months || {})[month] || {};

        merged.months[month] = {
            income: mergeArraysById(localMonth.income, cloudMonth.income),
            fixedExpenses: mergeArraysById(localMonth.fixedExpenses, cloudMonth.fixedExpenses),
            variableExpenses: mergeArraysById(localMonth.variableExpenses, cloudMonth.variableExpenses),
        };
    }

    // Merge inversiones
    merged.investments = mergeArraysById(
        localData.investments,
        cloudData.investments
    );

    // Usar el currentMonth más reciente
    if (cloudData.currentMonth) {
        merged.currentMonth = localData.currentMonth || cloudData.currentMonth;
    }

    // Timestamp
    merged._lastModified = Date.now();

    return merged;
}

/**
 * Sync completo: pull → merge → save local → push merged
 * Devuelve true si hubo cambios desde la nube
 */
export async function fullSync(localData) {
    if (!isSyncEnabled()) return { changed: false, data: localData };

    try {
        const cloudData = await pullData();

        if (!cloudData) {
            // No hay datos en la nube, subir los locales
            await pushData(localData);
            return { changed: false, data: localData };
        }

        // Merge
        const merged = mergeData(localData, cloudData);

        // Comprobar si hay diferencias respecto al local
        const localItems = countItems(localData);
        const mergedItems = countItems(merged);
        const hasNewFromCloud = mergedItems > localItems;

        // Push el resultado merged a la nube
        await pushData(merged);

        return { changed: hasNewFromCloud, data: merged };
    } catch (e) {
        console.warn('Full sync failed:', e);
        return { changed: false, data: localData };
    }
}

// Cuenta total de items para detectar cambios
function countItems(data) {
    let count = 0;
    if (data.months) {
        for (const m of Object.values(data.months)) {
            count += (m.income || []).length;
            count += (m.fixedExpenses || []).length;
            count += (m.variableExpenses || []).length;
        }
    }
    count += (data.investments || []).length;
    return count;
}

// ===== HELPERS =====

function getDeviceId() {
    let id = localStorage.getItem('fincontrol_device_id');
    if (!id) {
        id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        localStorage.setItem('fincontrol_device_id', id);
    }
    return id;
}
