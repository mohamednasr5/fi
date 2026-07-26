/**
 * ===========================================
 * Restore Engine
 * Backup Worker v1.0
 * ===========================================
 */

import {
    writeAllDatabases,
    databaseExists
} from "./firebase.js";

import {
    loadBackup
} from "./r2.js";

/**
 * استعادة نسخة احتياطية
 */
export async function restoreBackup(env, backupId) {

    if (!backupId) {
        throw new Error("Backup ID is required");
    }

    // تحميل النسخة
    const backup = await loadBackup(env, backupId);

    if (!backup) {
        throw new Error("Backup not found");
    }

    if (!backup.fish || !backup.tager) {
        throw new Error("Backup is incomplete");
    }

    // التأكد من وجود قواعد البيانات
    const fishExists = await databaseExists(env, "fish");
    const tagerExists = await databaseExists(env, "tager");

    if (!fishExists)
        throw new Error("Fish database is unavailable");

    if (!tagerExists)
        throw new Error("Tager database is unavailable");

    // كتابة البيانات
    await writeAllDatabases(env, {

        fish: backup.fish,

        tager: backup.tager

    });

    return {

        success: true,

        restored: backupId,

        restoredAt: new Date().toISOString(),

        version: backup.info?.version || "1.0",

        databases: [

            "fish",

            "tager"

        ]

    };

}
