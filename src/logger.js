/**
 * ===========================================
 * Logger Engine
 * Backup Worker v1.0
 * ===========================================
 */

import { logPath } from "./config.js";
import { loadJSON, saveJSON } from "./r2.js";

/**
 * اسم ملف اليوم
 */
function todayFile() {

    const d = new Date();

    return `${d.getFullYear()}-${
        String(d.getMonth() + 1).padStart(2, "0")
    }-${
        String(d.getDate()).padStart(2, "0")
    }.json`;

}

/**
 * إضافة سجل
 */
export async function writeLog(env, entry) {

    const file = logPath(todayFile());

    let logs = await loadJSON(env, file);

    if (!Array.isArray(logs)) {

        logs = [];

    }

    logs.unshift({

        id: crypto.randomUUID(),

        time: new Date().toISOString(),

        ...entry

    });

    // الاحتفاظ بآخر 1000 سجل
    if (logs.length > 1000) {

        logs = logs.slice(0, 1000);

    }

    await saveJSON(env, file, logs);

}

/**
 * قراءة سجل يوم معين
 */
export async function getLogs(env, date = null) {

    const file = logPath(date || todayFile());

    return await loadJSON(env, file) || [];

}

/**
 * آخر السجلات
 */
export async function getLatestLogs(env, limit = 50) {

    const logs = await getLogs(env);

    return logs.slice(0, limit);

}

/**
 * حذف سجل يوم
 */
export async function clearLogs(env, date) {

    if (!date) {

        throw new Error("Date is required");

    }

    const file = logPath(date);

    await env.elhadidy.delete(file);

    return true;

}
