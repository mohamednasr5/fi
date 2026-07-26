/**
 * ===========================================
 * Firebase Engine
 * Backup Worker v1.0
 * ===========================================
 */

import { getDatabases, getDatabaseURL } from "./config.js";

/**
 * طلب مع Timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = 30000) {

    const controller = new AbortController();

    const id = setTimeout(() => controller.abort(), timeout);

    try {

        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(id);

        return response;

    } catch (err) {

        clearTimeout(id);

        throw err;

    }

}

/**
 * قراءة قاعدة بيانات كاملة
 */
export async function readDatabase(env, databaseId) {

    const baseUrl = getDatabaseURL(env, databaseId);

    const response = await fetchWithTimeout(
        `${baseUrl}/.json`
    );

    if (!response.ok) {

        throw new Error(
            `Unable to read ${databaseId} (${response.status})`
        );

    }

    // قراءة النص أولاً
    const text = await response.text();
    
    // التحقق من أن النص ليس فارغاً
    if (!text || text.trim() === '' || text.trim() === 'null') {
        console.log(`Database ${databaseId} is empty, returning empty object`);
        return {};
    }

    try {
        // محاولة تحويل JSON
        return JSON.parse(text);
    } catch (parseError) {
        console.error(`JSON parse error for ${databaseId}:`, parseError.message);
        console.error(`Response text:`, text.substring(0, 200));
        throw new Error(`Invalid JSON from ${databaseId}: ${parseError.message}`);
    }

}

/**
 * كتابة قاعدة بيانات كاملة
 */
export async function writeDatabase(env, databaseId, data) {

    const baseUrl = getDatabaseURL(env, databaseId);

    const response = await fetchWithTimeout(
        `${baseUrl}/.json`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to write ${databaseId}`
        );

    }

    return true;

}

/**
 * قراءة جميع قواعد البيانات
 */
export async function readAllDatabases(env) {

    const databases = getDatabases();

    const result = {};

    await Promise.all(

        databases.map(async db => {

            result[db.id] = await readDatabase(env, db.id);

        })

    );

    return result;

}

/**
 * كتابة جميع قواعد البيانات
 */
export async function writeAllDatabases(env, backup) {

    const databases = getDatabases();

    await Promise.all(

        databases.map(async db => {

            if (backup[db.id] !== undefined) {

                await writeDatabase(
                    env,
                    db.id,
                    backup[db.id]
                );

            }

        })

    );

}

/**
 * هل قاعدة البيانات موجودة؟
 */
export async function databaseExists(env, databaseId) {

    try {

        await readDatabase(env, databaseId);

        return true;

    }

    catch {

        return false;

    }

}

/**
 * حجم البيانات بالبايت
 */
export function getDatabaseSize(data) {

    return new TextEncoder().encode(

        JSON.stringify(data)

    ).length;

}

/**
 * حجم البيانات بصيغة مناسبة
 */
export function formatSize(bytes) {

    if (bytes < 1024)
        return `${bytes} B`;

    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(2)} KB`;

    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;

}

/**
 * عدد السجلات
 */
export function countRecords(data) {

    let count = 0;

    function walk(obj) {

        if (!obj)
            return;

        if (typeof obj !== "object")
            return;

        for (const key in obj) {

            count++;

            walk(obj[key]);

        }

    }

    walk(data);

    return count;

}

/**
 * معلومات قاعدة البيانات
 */
export function getDatabaseInfo(data) {

    const bytes = getDatabaseSize(data);

    return {

        bytes,

        size: formatSize(bytes),

        records: countRecords(data)

    };

}

/**
 * اختبار الاتصال
 */
export async function testConnections(env) {

    const databases = getDatabases();

    const result = {};

    for (const db of databases) {

        try {

            await readDatabase(env, db.id);

            result[db.id] = true;

        }

        catch {

            result[db.id] = false;

        }

    }

    return result;

}
