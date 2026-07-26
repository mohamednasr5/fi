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

    try {
        // قراءة قواعد البيانات
        const databases = await readAllDatabases(env);

        // التأكد من وجود البيانات
        const fishData = databases.fish || {};
        const tagerData = databases.tager || {};

        console.log('Fish data keys:', Object.keys(fishData).length);
        console.log('Tager data keys:', Object.keys(tagerData).length);

        // حساب Hash لكل قاعدة
        const fishHash = await objectHash(fishData);

        const tagerHash = await objectHash(tagerData);

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

            fish: getDatabaseInfo(fishData),

            tager: getDatabaseInfo(tagerData)

        },

        hashes: {

            fishHash,

            tagerHash,

            masterHash

        }

    };

    // حفظ النسخة
    await saveBackup(env, folder, {

        fish: fishData,

        tager: tagerData,

        info

    });

    // تحديث latest
    await updateLatest(env, {

        fish: fishData,

        tager: tagerData,

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

    } catch (error) {
        console.error('Backup creation error:', error);
        throw new Error(`Backup failed: ${error.message}`);
    }

}
