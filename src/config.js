/**
 * ===========================================
 * Configuration
 * Backup Worker v1.0
 * ===========================================
 */

// ==========================================
// API Configuration
// ==========================================

export const CONFIG = {
    API: {
        NAME: "BackupElhadidi",
        VERSION: "1.0.0",
        STATUS: "active"
    },
    STORAGE: {
        ROOT: "backups",
        LATEST: "latest",
        LOGS: "logs",
        HASHES: "hashes"
    }
};

// ==========================================
// Database Configuration
// ==========================================

export function getDatabases() {
    return [
        { id: "fish", name: "Fish Database" },
        { id: "tager", name: "Tager Database" }
    ];
}

export function getDatabaseURL(env, databaseId) {
    const urls = {
        fish: env.FISH_DB_URL,
        tager: env.TAGER_DB_URL
    };
    
    const url = urls[databaseId];
    
    if (!url) {
        throw new Error(`Database URL not found: ${databaseId}`);
    }
    
    return url;
}

// ==========================================
// Path Helpers
// ==========================================

export function backupPath(folder) {
    return `${CONFIG.STORAGE.ROOT}/${folder}`;
}

export function latestPath(file) {
    return `${CONFIG.STORAGE.LATEST}/${file}`;
}

export function hashPath(file) {
    return `${CONFIG.STORAGE.HASHES}/${file}`;
}

export function logPath(file) {
    return `${CONFIG.STORAGE.LOGS}/${file}`;
}
