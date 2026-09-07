import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import blockchainRoutes from "./routes/blockchain.routes.js";
import phase2Routes from "./routes/phase2.routes.js";
import { requireMutationAuth } from "./middleware/mutation-auth.middleware.js";
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env"), quiet: true });
// Base64 has ~33% overhead; this caps decoded artwork below the ML 10 MiB limit.
const MAX_IMAGE_BASE64_LENGTH = 13 * 1024 * 1024;
const JSON_BODY_LIMIT = "14mb";
const mlServiceUrl = process.env.ML_SERVICE_URL ?? "http://localhost:8000";
const isProduction = process.env.NODE_ENV === "production";
class MlServiceError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "MlServiceError";
    }
}
function isBase64(value) {
    return typeof value === "string" && value.length > 0 && value.length <= MAX_IMAGE_BASE64_LENGTH && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}
function parseProtectionBody(body) {
    if (!body || typeof body !== "object" || Object.keys(body).some((key) => !["imageBase64", "watermark", "metadata", "expectedFingerprint", "expectedWatermark", "expectedArtifactHash"].includes(key))) {
        throw new Error("request contains unsupported fields");
    }
    if (!isBase64(body.imageBase64)) {
        throw new Error("imageBase64 must be a valid bounded base64 string");
    }
    if (typeof body.watermark !== "string" || body.watermark.length < 1 || body.watermark.length > 2048) {
        throw new Error("watermark must be between 1 and 2048 characters");
    }
    if (body.metadata === null || typeof body.metadata !== "object" || Array.isArray(body.metadata)) {
        throw new Error("metadata must be an object");
    }
    return { imageBase64: body.imageBase64, watermark: body.watermark, metadata: body.metadata };
}
async function callMl(path, body) {
    const parsed = parseProtectionBody(body);
    const form = new FormData();
    form.append("image", new Blob([Buffer.from(parsed.imageBase64, "base64")], { type: "image/png" }), "artwork.png");
    form.append("metadata_json", JSON.stringify(parsed.metadata));
    if (path === "/v1/protect") {
        form.append("watermark", parsed.watermark);
    }
    else {
        const verification = body;
        if (typeof verification.expectedFingerprint !== "string" || !/^[a-f0-9]{64}$/i.test(verification.expectedFingerprint)) {
            throw new Error("expectedFingerprint must be a SHA-256 hex digest");
        }
        form.append("expected_fingerprint", verification.expectedFingerprint);
        if (verification.expectedWatermark !== undefined) {
            if (typeof verification.expectedWatermark !== "string" || verification.expectedWatermark.length < 1 || verification.expectedWatermark.length > 2048) {
                throw new Error("expectedWatermark must be between 1 and 2048 characters");
            }
            form.append("expected_watermark", verification.expectedWatermark);
        }
        if (verification.expectedArtifactHash !== undefined) {
            if (typeof verification.expectedArtifactHash !== "string" || !/^[a-f0-9]{64}$/i.test(verification.expectedArtifactHash)) {
                throw new Error("expectedArtifactHash must be a SHA-256 hex digest");
            }
            form.append("expected_artifact_hash", verification.expectedArtifactHash);
        }
    }
    let response;
    try {
        response = await fetch(`${mlServiceUrl}${path}`, {
            method: "POST", body: form, signal: AbortSignal.timeout(15000),
            headers: process.env.ML_SERVICE_TOKEN ? { "x-artshield-ml-token": process.env.ML_SERVICE_TOKEN } : undefined,
        });
    }
    catch {
        throw new MlServiceError(503, "ML service is unavailable");
    }
    if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
        throw new MlServiceError(statusCode, response.status >= 500 ? "ML service failed" : "ML service rejected the request");
    }
    try {
        return await response.json();
    }
    catch {
        throw new MlServiceError(502, "ML service returned invalid JSON");
    }
}
async function callSecurity(path, body) {
    let response;
    try {
        response = await fetch(`${mlServiceUrl}${path}`, {
            method: "POST",
            headers: { "content-type": "application/json", ...(process.env.ML_SERVICE_TOKEN ? { "x-artshield-ml-token": process.env.ML_SERVICE_TOKEN } : {}) },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });
    }
    catch {
        throw new MlServiceError(503, "ML security service is unavailable");
    }
    if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
        throw new MlServiceError(statusCode, response.status >= 500 ? "ML security service failed" : "ML security service rejected the request");
    }
    try {
        return await response.json();
    }
    catch {
        throw new MlServiceError(502, "ML security service returned invalid JSON");
    }
}
export const app = express();
const configuredOrigins = new Set((process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean));
const corsOptions = {
    origin(origin, callback) {
        if (!origin || configuredOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-ArtShield-Role"],
    optionsSuccessStatus: 204,
};
app.disable("x-powered-by");
app.use(helmet({
    contentSecurityPolicy: false, // API responses contain JSON; frontend CSP belongs at its static host.
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    hsts: isProduction ? undefined : false,
}));
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
const expensiveLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "too many expensive requests; please retry shortly" } });
const mutationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 80, standardHeaders: "draft-8", legacyHeaders: false, skip: (request) => ["GET", "HEAD", "OPTIONS"].includes(request.method), message: { error: "too many mutation requests; please retry shortly" } });
app.use("/api", mutationLimiter);
app.use("/api", blockchainRoutes);
app.use("/api", phase2Routes);
app.get("/health", (_request, response) => response.json({ status: "ok", service: "backend", phase: "1" }));
app.post("/api/protection", requireMutationAuth, expensiveLimiter, async (request, response, next) => {
    try {
        response.json(await callMl("/v1/protect", request.body));
    }
    catch (error) {
        next(error);
    }
});
app.post("/api/verification", requireMutationAuth, expensiveLimiter, async (request, response, next) => {
    try {
        response.json(await callMl("/v1/verify", request.body));
    }
    catch (error) {
        next(error);
    }
});
for (const [route, mlPath] of [["/api/security/model-inversion", "/v1/security/model-inversion"], ["/api/security/prompt-check", "/v1/security/prompt-check"], ["/api/security/file-check", "/v1/security/file-check"]]) {
    app.post(route, requireMutationAuth, expensiveLimiter, async (request, response, next) => {
        try {
            response.json(await callSecurity(mlPath, request.body));
        }
        catch (error) {
            next(error);
        }
    });
}
app.use((error, _request, response, _next) => {
    if (typeof error === "object" && error !== null && "type" in error && error.type === "entity.too.large") {
        response.status(413).json({ error: "request body exceeds the 15 MiB limit" });
        return;
    }
    if (error instanceof MlServiceError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
    }
    const message = error instanceof Error ? error.message : "request failed";
    const status = message.includes("must be") ? 422 : message.includes("ML service") || message.includes("security request") || message.includes("fetch failed") ? 503 : 400;
    response.status(status).json({ error: isProduction && status >= 500 ? "request failed" : message });
});
//# sourceMappingURL=app.js.map