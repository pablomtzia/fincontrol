/**
 * SyncService — Sincronización en la nube via Firebase Realtime Database REST API
 *
 * No necesita SDK. Solo usa fetch() con la REST API de Firebase.
 * El usuario configura su propia URL de Firebase en Ajustes.
 */

const SYNC_URL_KEY = 'fincontrol_sync_url';
const SYNC_ENABLED_KEY = 'fincontrol_sync_enabled';

// ===== CONFIG =====

export function getSyncUrl() {
    return localStorage.getItem(SYNC_URL_KEY) || '';
}

export function setSyncUrl(url) {
    // Limpiar URL: quitar trailing slash
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
 * Sube los datos a Firebase (PUT)
 * Silencioso — nunca lanza errores al usuario
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
        console.warn('Sync push failed (offline?):', e.message);
        return false;
    }
}

/**
 * Descarga los datos de Firebase (GET)
 * Devuelve null si no hay datos o falla
 */
export async function pullData() {
    if (!isSyncEnabled()) return null;

    try {
        const url = getSyncUrl();
        const res = await fetch(`${url}/fincontrol.json`);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data || !data.currentMonth || !data.months) return null;

        return data;
    } catch (e) {
        console.warn('Sync pull failed (offline?):', e.message);
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

/**
 * Resuelve conflictos: devuelve los datos más recientes
 * Compara timestamps de local vs cloud
 */
export function resolveConflict(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    const localTime = localData._lastModified || 0;
    const cloudTime = cloudData._lastModified || 0;

    // Si la nube es más reciente, usar datos de la nube
    if (cloudTime > localTime) {
        return cloudData;
    }

    return localData;
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
