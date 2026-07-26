/**
 * ===========================================
 * Scheduler
 * Backup Worker v1.0
 * ===========================================
 */

import { createBackup } from "./backup.js";
import { writeLog } from "./logger.js";

/**
 * تشغيل النسخ الاحتياطي المجدول
 */
export async function runScheduledBackup(env) {

    const started = Date.now();

    try {

        const result = await createBackup(env);

        await writeLog(env, {

            type: "backup",

            trigger: "cron",

            status: result.changed ? "success" : "skipped",

            backupId: result.backup || null,

            reason: result.changed
                ? "hash_changed"
                : "no_changes",

            duration: Date.now() - started

        });

        return result;

    }

    catch (err) {

        await writeLog(env, {

            type: "backup",

            trigger: "cron",

            status: "failed",

            error: err.message,

            duration: Date.now() - started

        });

        throw err;

    }

}
