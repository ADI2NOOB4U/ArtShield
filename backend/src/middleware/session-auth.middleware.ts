import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const SESSION_COOKIE = "artshield_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const ALLOWED_BROWSER_ORIGINS = new Set([
	"https://art-shield-alpha.vercel.app",
	"http://localhost:5173",
	"http://127.0.0.1:5173",
]);

type SessionPayload = {
	email: string;
	name: string;
	role: string;
	expiresAt: number;
};

const SCOPE_ENVIRONMENT = {
	protection: "ARTSHIELD_PROTECTION_TOKEN",
	registry: "ARTSHIELD_REGISTRY_TOKEN",
	ownership: "ARTSHIELD_OWNERSHIP_TOKEN",
} as const;

function configuredSecret(): string | undefined {
	const secret = process.env.SESSION_SECRET;
	return secret && secret.length >= 32 ? secret : undefined;
}

function encode(value: string): string {
	return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string): string {
	return createHmac("sha256", secret).update(value).digest("base64url");
}

function equal(left: string, right: string): boolean {
	const leftBytes = Buffer.from(left);
	const rightBytes = Buffer.from(right);
	return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function cookieValue(request: Request): string | undefined {
	const cookieHeader = request.header("cookie");
	if (!cookieHeader) return undefined;
	const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
	return cookie?.slice(`${SESSION_COOKIE}=`.length);
}

export function createSessionCookie(payload: Omit<SessionPayload, "expiresAt">): string | undefined {
	const secret = configuredSecret();
	if (!secret) return undefined;
	const value = encode(JSON.stringify({ ...payload, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }));
	return `${value}.${sign(value, secret)}`;
}

export function readSession(request: Request): SessionPayload | undefined {
	const secret = configuredSecret();
	const value = cookieValue(request);
	if (!secret || !value) return undefined;
	const separator = value.lastIndexOf(".");
	if (separator <= 0) return undefined;
	const encodedPayload = value.slice(0, separator);
	const signature = value.slice(separator + 1);
	if (!equal(signature, sign(encodedPayload, secret))) return undefined;
	try {
		const payload = JSON.parse(decode(encodedPayload)) as Partial<SessionPayload>;
		if (
			typeof payload.email !== "string" ||
			typeof payload.name !== "string" ||
			typeof payload.role !== "string" ||
			typeof payload.expiresAt !== "number" ||
			payload.expiresAt <= Math.floor(Date.now() / 1000)
		) return undefined;
		return payload as SessionPayload;
	} catch {
		return undefined;
	}
}

export function setSessionCookie(response: Response, value: string): void {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
	response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=${sameSite}${secure}; Max-Age=${SESSION_TTL_SECONDS}`);
}

export function clearSessionCookie(response: Response): void {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
	response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=${sameSite}${secure}; Max-Age=0`);
}

export function requireAllowedBrowserOrigin(request: Request, response: Response, next: NextFunction): void {
	const origin = request.header("origin");
	if (!origin || !ALLOWED_BROWSER_ORIGINS.has(origin)) {
		response.status(403).json({ error: "browser origin is not authorized" });
		return;
	}
	next();
}

export function requireBrowserMutationOrigin(request: Request, response: Response, next: NextFunction): void {
	if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS" || request.header("authorization")) {
		next();
		return;
	}
	if (!readSession(request)) {
		next();
		return;
	}
	requireAllowedBrowserOrigin(request, response, next);
}

export function allowBrowserMutationAuth(scope: keyof typeof SCOPE_ENVIRONMENT) {
	return (request: Request, _response: Response, next: NextFunction): void => {
		if (!request.header("authorization")) {
			const session = readSession(request);
			const configuredRole = process.env.ARTSHIELD_MUTATION_ROLE ?? "operator";
			const configuredToken = process.env[SCOPE_ENVIRONMENT[scope]];
			if (session?.role === configuredRole && configuredToken) {
				request.headers.authorization = `Bearer ${configuredToken}`;
				request.headers["x-artshield-role"] = configuredRole;
			}
		}
		next();
	};
}