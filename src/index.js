/**
 * ===========================================
 * index.js - Main Entry Point
 * Backup Worker v1.0
 * ===========================================
 */

import { execute, handleOptions, authenticate } from "./middleware.js";
import { success, error } from "./helpers.js";
import { createBackup } from "./backup.js";
import { restoreBackup } from "./restore.js";
import { listBackups, loadBackup, getStorageStats } from "./r2.js";
import { getLatestLogs } from "./logger.js";
import { runScheduledBackup } from "./scheduler.js";
import { CONFIG } from "./config.js";

async function router(request, env) {

    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "OPTIONS") {
        return handleOptions();
    }

    if (pathname !== "/health") {
        authenticate(request, env);
    }

    // Health Check
    if (request.method === "GET" && pathname === "/health") {

        return success({
            service: CONFIG.API.NAME,
            version: CONFIG.API.VERSION,
            status: CONFIG.API.STATUS,
            time: new Date().toISOString()
        });

    }

    // List All Backups
    if (request.method === "GET" && pathname === "/backups") {

        return success(await listBackups(env));

    }

    // Storage Statistics
    if (request.method === "GET" && pathname === "/stats") {

        return success(await getStorageStats(env));

    }

    // Get Latest Logs
    if (request.method === "GET" && pathname === "/logs") {

        return success(await getLatestLogs(env));

    }

    // Get Latest Backup
    if (request.method === "GET" && pathname === "/latest") {

        return success(await loadBackup(env, "latest"));

    }

    // Create Manual Backup
    if (request.method === "POST" && pathname === "/backup") {

        const result = await createBackup(env);

        return success(result, "Backup completed");

    }

    // Restore Backup
    if (request.method === "POST" && pathname === "/restore") {

        const body = await request.json();

        const result = await restoreBackup(
            env,
            body.backupId
        );

        return success(result, "Restore completed");

    }

    return error("Route not found", 404);

}

export default {

    async fetch(request, env) {

        return execute(() =>
            router(request, env)
        );

    },

    async scheduled(event, env) {

        await runScheduledBackup(env);

    }

};
