/**
 * syncService.js — Cloud Sync via Firebase Realtime Database (REST API, no SDK)
 * 
 * Strategy: "Last Write Wins" with push-on-save
 * - Each save() pushes the full dataset to Firebase
 * - On load/tab-focus: pull from Firebase, compare timestamps, take the newest
 * - Simple and reliable for personal single-user multi-device use
 */

const SYNC_KEY = 'fincontrol_sync_url';

// ===== CONFIG =====

export function getSyncUrl() {
    return localStorage.getItem(SYNC_KEY) || '';
}

export function isSyncEnabled() {
    return !!getSyncUrl();
}

export function enableSync(url) {
    // Clean URL
    url = url.trim().replace(/\/+$/, '');
    if (!url.endsWith('.json')) {
        url += '/fincontrol.json';
    }
    localStorage.setItem(SYNC_KEY, url);
}

export function disableSync() {
    localStorage.removeItem(SYNC_KEY);
}

// ===== TEST CONNECTION =====

export async function testConnection() {
    const url = getSyncUrl();
    if (!url) return { ok: false, error: 'No URL configured' };

    try {
        const resp = await fetch(url, { method: 'GET' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// ===== PUSH / PULL =====

export async function pushData(data) {
    const url = getSyncUrl();
    if (!url) return;

    try {
        // Ensure timestamp is current
        data._lastModified = Date.now();
        data._deviceId = getDeviceId();

        const resp = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        console.log('Sync: datos subidos a la nube');
    } catch (e) {
        console.warn('Sync push failed:', e);
    }
}

export async function pullData() {
    const url = getSyncUrl();
    if (!url) return null;

    try {
        const resp = await fetch(url, { method: 'GET' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        return data;
    } catch (e) {
        console.warn('Sync pull failed:', e);
        return null;
    }
}

// ===== FULL SYNC =====

/**
 * Simple sync: pull from cloud, compare timestamps.
 * - If cloud is newer → use cloud data
 * - If local is newer → push local data
 * - Returns { changed: boolean, data: object }
 */
export async function fullSync(localData) {
    if (!isSyncEnabled()) return { changed: false, data: localData };

    try {
        const cloudData = await pullData();

        if (!cloudData) {
            // Nothing in the cloud yet — push local
            await pushData(localData);
            return { changed: false, data: localData };
        }

        const localTime = localData._lastModified || 0;
        const cloudTime = cloudData._lastModified || 0;

        if (cloudTime > localTime) {
            // Cloud is newer — use cloud data (another device saved more recently)
            console.log('Sync: cloud es más reciente, usando datos de la nube');
            return { changed: true, data: cloudData };
        } else if (localTime > cloudTime) {
            // Local is newer — push to cloud
            await pushData(localData);
            return { changed: false, data: localData };
        }

        // Same timestamp — no changes needed
        return { changed: false, data: localData };
    } catch (e) {
        console.warn('Full sync failed:', e);
        return { changed: false, data: localData };
    }
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
