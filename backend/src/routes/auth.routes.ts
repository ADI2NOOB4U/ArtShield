import { timingSafeEqual } from "node:crypto";
import { Router } from "express";

import { clearSessionCookie, createSessionCookie, readSession, requireAllowedBrowserOrigin, requireBrowserMutationOrigin, setSessionCookie } from "../middleware/session-auth.middleware.js";

const router = Router();

function safeEqual(left: string, right: string): boolean {
	const leftBytes = Buffer.from(left);
	const rightBytes = Buffer.from(right);
	return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

router.get("/session", (request, response) => {
	const session = readSession(request);
	if (!session) {
		response.status(401).json({ error: "authenticated session required" });
		return;
	}
	response.json({ user: { name: session.name, email: session.email, role: session.role, roleTitle: "ArtShield Operator" } });
});

router.post("/login", requireAllowedBrowserOrigin, (request, response) => {
	const username = process.env.ARTSHIELD_AUTH_USERNAME;
	const password = process.env.ARTSHIELD_AUTH_PASSWORD;
	const configuredRole = process.env.ARTSHIELD_MUTATION_ROLE ?? "operator";
	const configuredName = process.env.ARTSHIELD_AUTH_NAME ?? "ArtShield Operator";
	if (!username || !password || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
		response.status(503).json({ error: "authentication is not configured" });
		return;
	}
	const suppliedUsername = typeof request.body?.username === "string" ? request.body.username : "";
	const suppliedPassword = typeof request.body?.password === "string" ? request.body.password : "";
	if (!safeEqual(suppliedUsername, username) || !safeEqual(suppliedPassword, password)) {
		response.status(401).json({ error: "invalid credentials" });
		return;
	}
	const cookie = createSessionCookie({ email: username, name: configuredName, role: configuredRole });
	if (!cookie) {
		response.status(503).json({ error: "authentication is not configured" });
		return;
	}
	setSessionCookie(response, cookie);
	response.json({ user: { name: configuredName, email: username, role: configuredRole, roleTitle: "ArtShield Operator" } });
});

router.post("/logout", requireBrowserMutationOrigin, (_request, response) => {
	clearSessionCookie(response);
	response.status(204).end();
});

export default router;