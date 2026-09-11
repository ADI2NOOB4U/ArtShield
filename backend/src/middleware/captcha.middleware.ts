import type { NextFunction, Request, Response } from "express";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function requireTurnstile(request: Request, response: Response, next: NextFunction): Promise<void> {
	if (process.env.TURNSTILE_ENABLED !== "true") return next();
	const secret = process.env.TURNSTILE_SECRET_KEY;
	const token = request.header("x-turnstile-token");
	if (!secret) {
		response.status(503).json({ error: "Service temporarily unavailable", code: "CAPTCHA_UNAVAILABLE" });
		return;
	}
	if (!token || token.length > 4096) {
		response.status(400).json({ error: "Human verification required", code: "CAPTCHA_REQUIRED" });
		return;
	}
	try {
		const form = new URLSearchParams({ secret, response: token, ...(request.ip ? { remoteip: request.ip } : {}) });
		const verification = await fetch(VERIFY_URL, { method: "POST", body: form, signal: AbortSignal.timeout(5000) });
		const result = await verification.json() as { success?: boolean; hostname?: string };
		const expectedHost = process.env.TURNSTILE_EXPECTED_HOSTNAME;
		if (!result.success || (expectedHost && result.hostname !== expectedHost)) {
			response.status(403).json({ error: "Human verification failed", code: "CAPTCHA_FAILED" });
			return;
		}
		next();
	} catch {
		response.status(503).json({ error: "Human verification unavailable", code: "CAPTCHA_UNAVAILABLE" });
	}
}
