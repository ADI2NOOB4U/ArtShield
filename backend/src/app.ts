import express, { NextFunction, Request, Response } from "express";

import blockchainRoutes from "./routes/blockchain.routes.js";
import phase2Routes from "./routes/phase2.routes.js";

const MAX_IMAGE_BASE64_LENGTH = 14 * 1024 * 1024;
const mlServiceUrl = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

type ProtectionBody = {
	imageBase64?: unknown;
	watermark?: unknown;
	metadata?: unknown;
};

type VerificationBody = ProtectionBody & {
	expectedFingerprint?: unknown;
	expectedWatermark?: unknown;
};

function isBase64(value: unknown): value is string {
	return typeof value === "string" && value.length > 0 && value.length <= MAX_IMAGE_BASE64_LENGTH && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

function parseProtectionBody(body: ProtectionBody): { imageBase64: string; watermark: string; metadata: Record<string, unknown> } {
	if (!isBase64(body.imageBase64)) {
		throw new Error("imageBase64 must be a valid bounded base64 string");
	}
	if (typeof body.watermark !== "string" || body.watermark.length < 1 || body.watermark.length > 2048) {
		throw new Error("watermark must be between 1 and 2048 characters");
	}
	if (body.metadata === null || typeof body.metadata !== "object" || Array.isArray(body.metadata)) {
		throw new Error("metadata must be an object");
	}
	return { imageBase64: body.imageBase64, watermark: body.watermark, metadata: body.metadata as Record<string, unknown> };
}

async function callMl(path: string, body: ProtectionBody | VerificationBody): Promise<unknown> {
	const parsed = parseProtectionBody(body);
	const form = new FormData();
	form.append("image", new Blob([Buffer.from(parsed.imageBase64, "base64")], { type: "image/png" }), "artwork.png");
	form.append("metadata_json", JSON.stringify(parsed.metadata));
	if (path === "/v1/protect") {
		form.append("watermark", parsed.watermark);
	} else {
		const verification = body as VerificationBody;
		if (typeof verification.expectedFingerprint !== "string" || !/^[a-f0-9]{64}$/i.test(verification.expectedFingerprint)) {
			throw new Error("expectedFingerprint must be a SHA-256 hex digest");
		}
		form.append("expected_fingerprint", verification.expectedFingerprint);
		if (typeof verification.expectedWatermark === "string") form.append("expected_watermark", verification.expectedWatermark);
	}
	const response = await fetch(`${mlServiceUrl}${path}`, { method: "POST", body: form, signal: AbortSignal.timeout(15000) });
	if (!response.ok) throw new Error("ML service rejected the request");
	return response.json();
}

async function callSecurity(path: string, body: unknown): Promise<unknown> {
	const response = await fetch(`${mlServiceUrl}${path}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(15000),
	});
	if (!response.ok) {
		if (response.status >= 400 && response.status < 500) throw new Error("security request was rejected");
		throw new Error("ML security service rejected the request");
	}
	return response.json();
}

export const app = express();
app.use(express.json({ limit: "12mb" }));
app.use("/api", blockchainRoutes);
app.use("/api", phase2Routes);

app.get("/health", (_request, response) => response.json({ status: "ok", service: "backend", phase: "1" }));
app.post("/api/protection", async (request, response, next) => {
	try {
		response.json(await callMl("/v1/protect", request.body as ProtectionBody));
	} catch (error) {
		next(error);
	}
});
app.post("/api/verification", async (request, response, next) => {
	try {
		response.json(await callMl("/v1/verify", request.body as VerificationBody));
	} catch (error) {
		next(error);
	}
});
for (const [route, mlPath] of [["/api/security/model-inversion", "/v1/security/model-inversion"], ["/api/security/prompt-check", "/v1/security/prompt-check"], ["/api/security/file-check", "/v1/security/file-check"]] as const) {
	app.post(route, async (request, response, next) => {
		try {
			response.json(await callSecurity(mlPath, request.body));
		} catch (error) {
			next(error);
		}
	});
}
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
	const message = error instanceof Error ? error.message : "request failed";
	const status = message.includes("must be") ? 422 : message.includes("ML service") || message.includes("security request") || message.includes("fetch failed") ? 503 : 400;
	response.status(status).json({ error: message });
});
