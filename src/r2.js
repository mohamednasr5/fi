/**
 * ===========================================
 * Cloudflare R2 Engine
 * Backup Worker v1.0
 * ===========================================
 */

import {
    CONFIG,
    backupPath,
    latestPath,
    hashPath,
    logPath
} from "./config.js";

/**
 * حفظ JSON
 */
export async function saveJSON(env, path, data) {

    await env.elhadidy.put(

        path,

        JSON.stringify(data, null, 2),

        {
            httpMetadata: {
                contentType: "application/json"
            }
        }

    );

    return true;

}

/**
 * قراءة JSON
 */
export async function loadJSON(env, path) {

    const object = await env.elhadidy.get(path);

    if (!object)
        return null;

    return await object.json();

}

/**
 * حذف ملف
 */
export async function deleteFile(env, path) {

    await env.elhadidy.delete(path);

}

/**
 * هل الملف موجود؟
 */
export async function fileExists(env, path) {

    const object = await env.elhadidy.head(path);

    return object !== null;

}

/**
 * حفظ نسخة كاملة
 */
export async function saveBackup(env, folder, backup) {

    const root = backupPath(folder);

    await Promise.all([

        saveJSON(
            env,
            `${root}/fish.json`,
            backup.fish
        ),

        saveJSON(
            env,
            `${root}/tager.json`,
            backup.tager
        ),

        saveJSON(
            env,
            `${root}/info.json`,
            backup.info
        )

    ]);

}

/**
 * تحديث latest
 */
export async function updateLatest(env, backup) {

    await Promise.all([

        saveJSON(
            env,
            latestPath("fish.json"),
            backup.fish
        ),

        saveJSON(
            env,
            latestPath("tager.json"),
            backup.tager
        ),

        saveJSON(
            env,
            latestPath("info.json"),
            backup.info
        )

    ]);

}

/**
 * حفظ Hash
 */
export async function saveHashes(env, hashes) {

    await saveJSON(

        env,

        hashPath("current.json"),

        hashes

    );

}

/**
 * قراءة Hash
 */
export async function loadHashes(env) {

    return await loadJSON(

        env,

        hashPath("current.json")

    );

}

/**
 * حفظ Log
 */
export async function writeLog(env, log) {

    const name = `${Date.now()}.json`;

    await saveJSON(

        env,

        logPath(name),

        log

    );

}

/**
 * جميع النسخ
 */
export async function listBackups(env) {

    const list = await env.elhadidy.list({

        prefix: `${CONFIG.STORAGE.ROOT}/`

    });

    const folders = new Set();

    for (const file of list.objects) {

        const parts = file.key.split("/");

        if (parts.length >= 2) {

            const folder = parts[1];

            if (

                folder !== CONFIG.STORAGE.LATEST &&
                folder !== CONFIG.STORAGE.LOGS &&
                folder !== CONFIG.STORAGE.HASHES

            ) {

                folders.add(folder);

            }

        }

    }

    return [...folders].sort().reverse();

}

/**
 * تحميل نسخة
 */
export async function loadBackup(env, folder) {

    const root = backupPath(folder);

    return {

        fish: await loadJSON(
            env,
            `${root}/fish.json`
        ),

        tager: await loadJSON(
            env,
            `${root}/tager.json`
        ),

        info: await loadJSON(
            env,
            `${root}/info.json`
        )

    };

}

/**
 * حذف نسخة كاملة
 */
export async function deleteBackup(env, folder) {

    const root = backupPath(folder);

    await Promise.all([

        deleteFile(
            env,
            `${root}/fish.json`
        ),

        deleteFile(
            env,
            `${root}/tager.json`
        ),

        deleteFile(
            env,
            `${root}/info.json`
        )

    ]);

}

/**
 * إحصائيات R2
 */
export async function getStorageStats(env) {

    const list = await env.elhadidy.list({

        prefix: `${CONFIG.STORAGE.ROOT}/`

    });

    let files = 0;

    let bytes = 0;

    for (const obj of list.objects) {

        files++;

        bytes += obj.size;

    }

    return {

        files,

        bytes,

        kb: (bytes / 1024).toFixed(2),

        mb: (bytes / 1024 / 1024).toFixed(2)

    };

}
