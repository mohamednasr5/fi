/**
 * ===========================================
 * Backup Engine
 * Backup Worker v1.0
 * ===========================================
 */

import {
    readAllDatabases,
    getDatabaseInfo
} from "./firebase.js";

import {
    saveBackup,
    updateLatest,
    loadHashes,
    saveHashes
} from "./r2.js";

import {
    createTimestamp,
    objectHash
} from "./helpers.js";

/**
 * إنشاء نسخة احتياطية
 */
export async function createBackup(env) {

    // قراءة قواعد البيانات
    const databases = await readAllDatabases(env);

    // حساب Hash لكل قاعدة
    const fishHash = await objectHash(databases.fish);

    const tagerHash = await objectHash(databases.tager);

    // Hash موحد
    const masterHash = await objectHash({
        fishHash,
        tagerHash
    });

    // آخر Hash محفوظ
    const currentHash = await loadHashes(env);

    // مقارنة
    if (
        currentHash &&
        currentHash.masterHash === masterHash
    ) {

        return {
            success: true,
            changed: false,
            message: "No changes detected."
        };

    }

    // اسم النسخة
    const folder = createTimestamp();

    // معلومات النسخة
    const info = {

        id: folder,

        createdAt: new Date().toISOString(),

        reason: "hash_changed",

        version: "1.0",

        worker: "backupelhadidi",

        status: "success",

        databases: {

            fish: getDatabaseInfo(databases.fish),

            tager: getDatabaseInfo(databases.tager)

        },

        hashes: {

            fishHash,

            tagerHash,

            masterHash

        }

    };

    // حفظ النسخة
    await saveBackup(env, folder, {

        fish: databases.fish,

        tager: databases.tager,

        info

    });

    // تحديث latest
    await updateLatest(env, {

        fish: databases.fish,

        tager: databases.tager,

        info

    });

    // تحديث Hash
    await saveHashes(env, {

        fishHash,

        tagerHash,

        masterHash,

        lastBackup: folder,

        updatedAt: new Date().toISOString()

    });

    return {

        success: true,

        changed: true,

        backup: folder,

        info

    };

}
