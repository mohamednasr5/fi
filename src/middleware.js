/**
 * ===========================================
 * Middleware
 * Backup Worker v1.0
 * ===========================================
 */

import { error } from "./helpers.js";

/**
 * رؤوس CORS
 */
export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-api-key"
};

/**
 * معالجة OPTIONS
 */
export function handleOptions() {

    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });

}

/**
 * إضافة رؤوس CORS
 */
export function withCors(response) {

    const headers = new Headers(response.headers);

    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        headers.set(key, value);
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });

}

/**
 * التحقق من API KEY
 */
export function authenticate(request, env) {

    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
        throw new Error("Missing API Key");
    }

    if (apiKey !== env.API_KEY) {
        throw new Error("Invalid API Key");
    }

}

/**
 * تغليف التنفيذ ومعالجة الأخطاء
 */
export async function execute(handler) {

    try {

        const response = await handler();

        return withCors(response);

    } catch (err) {

        console.error(err);

        return withCors(

            error(

                err.message || "Internal Server Error",

                500

            )

        );

    }

}
