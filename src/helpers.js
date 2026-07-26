/**
 * ===========================================
 * Helpers
 * Backup Worker v1.0
 * ===========================================
 */

/**
 * إنشاء استجابة JSON
 */
export function json(data, status = 200, headers = {}) {

    return new Response(
        JSON.stringify(data, null, 2),
        {
            status,
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                ...headers
            }
        }
    );

}

/**
 * نجاح
 */
export function success(data = {}, message = "Success") {

    return json({
        success: true,
        message,
        data
    });

}

/**
 * خطأ
 */
export function error(message = "Unknown Error", status = 500) {

    return json({
        success: false,
        error: message
    }, status);

}

/**
 * الوقت الحالي ISO
 */
export function now() {
    return new Date().toISOString();
}

/**
 * إنشاء Timestamp للنسخ الاحتياطية
 */
export function createTimestamp() {

    const d = new Date();

    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0") + "_" +
        String(d.getHours()).padStart(2, "0") + "-" +
        String(d.getMinutes()).padStart(2, "0") + "-" +
        String(d.getSeconds()).padStart(2, "0");

}

/**
 * SHA256
 */
export async function sha256(text) {

    const encoder = new TextEncoder();

    const data = encoder.encode(text);

    const hash = await crypto.subtle.digest(
        "SHA-256",
        data
    );

    return [...new Uint8Array(hash)]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");

}

/**
 * Hash لأي Object
 */
export async function objectHash(obj) {

    return await sha256(
        JSON.stringify(obj)
    );

}

/**
 * قراءة JSON بأمان
 */
export async function safeJson(request) {

    try {

        return await request.json();

    }

    catch {

        return {};

    }

}

/**
 * انتظار
 */
export function sleep(ms) {

    return new Promise(resolve => {

        setTimeout(resolve, ms);

    });

}

/**
 * قياس مدة التنفيذ
 */
export async function measure(fn) {

    const start = Date.now();

    const result = await fn();

    return {

        result,

        duration: Date.now() - start

    };

}
