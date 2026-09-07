import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requestContext(request: Request, response: Response, next: NextFunction): void {
	const supplied = request.header("x-request-id");
	const requestId = supplied && /^[A-Za-z0-9_-]{8,128}$/.test(supplied) ? supplied : randomUUID();
	response.setHeader("X-Request-Id", requestId);
	response.locals.requestId = requestId;
	next();
}

/** Rejects ambiguous payloads before route code sees them. */
export function requireJsonForMutations(request: Request, response: Response, next: NextFunction): void {
	if (!MUTATING_METHODS.has(request.method) || !request.path.startsWith("/api/")) return next();
	if (!request.is("application/json")) {
		response.status(415).json({ error: "Unsupported Media Type", code: "UNSUPPORTED_MEDIA_TYPE" });
		return;
	}
	next();
}

export function rejectDuplicateQueryParameters(request: Request, response: Response, next: NextFunction): void {
	for (const value of Object.values(request.query)) {
		if (Array.isArray(value) || (value !== null && typeof value === "object")) {
			response.status(400).json({ error: "Malformed request", code: "DUPLICATE_QUERY_PARAMETER" });
			return;
		}
	}
	next();
}

export function apiMethodNotAllowed(allowed: readonly string[]) {
	return (_request: Request, response: Response): void => {
		response.setHeader("Allow", allowed.join(", "));
		response.status(405).json({ error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
	};
}
