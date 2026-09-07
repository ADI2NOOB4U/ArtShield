import type { NextFunction, Request, Response } from "express";

const SENSITIVE = /authorization|cookie|password|secret|token|key|imagebase64/i;

export function securityLog(event: string, request: Request, extra: Record<string, unknown> = {}): void {
	const safe = Object.fromEntries(Object.entries(extra).filter(([key]) => !SENSITIVE.test(key)));
	console.info(JSON.stringify({ event, requestId: request.res?.locals.requestId, method: request.method, path: request.path, ip: request.ip, ...safe }));
}

export function responseSecurityLog(request: Request, response: Response, next: NextFunction): void {
	response.on("finish", () => {
		if (response.statusCode >= 400) securityLog("http_request_rejected", request, { status: response.statusCode });
	});
	next();
}
