import { Request, Response } from "express";

import {
	getArtwork,
	getProvenance,
	issueRights,
	registerArtwork,
	transferArtwork,
	revokeRights,
	verifyRights,
	Phase2BlockchainError,
	Phase2ConflictError,
	Phase2ConfigurationError,
	Phase2ValidationError,
} from "../services/blockchain/phase2.service.js";

function handle(error: unknown, response: Response): void {
	if (error instanceof Phase2ValidationError) { response.status(422).json({ error: error.message }); return; }
	if (error instanceof Phase2ConfigurationError) { response.status(503).json({ error: "Phase 2 blockchain service is not configured" }); return; }
	if (error instanceof Phase2BlockchainError) { response.status(502).json({ error: error.message }); return; }
	if (error instanceof Phase2ConflictError) { response.status(409).json({ error: error.message }); return; }
	response.status(502).json({ error: "blockchain operation failed" });
}

export async function register(request: Request, response: Response): Promise<void> {
	try { response.status(201).json(await registerArtwork(request.body)); } catch (error) { handle(error, response); }
}
export async function artwork(request: Request, response: Response): Promise<void> {
	try { response.json(await getArtwork(String(request.params.fingerprint))); } catch (error) { handle(error, response); }
}
export async function provenance(request: Request, response: Response): Promise<void> {
	try { response.json(await getProvenance(String(request.params.fingerprint))); } catch (error) { handle(error, response); }
}
export async function transfer(request: Request, response: Response): Promise<void> {
	try { response.json(await transferArtwork(request.body)); } catch (error) { handle(error, response); }
}
export async function rights(request: Request, response: Response): Promise<void> {
	try { response.status(201).json(await issueRights(request.body)); } catch (error) { handle(error, response); }
}
export async function verify(request: Request, response: Response): Promise<void> {
	try { response.json({ valid: await verifyRights(String(request.params.tokenId), Number(request.query.rightsMask)) }); } catch (error) { handle(error, response); }
}
export async function revoke(request: Request, response: Response): Promise<void> {
	try { response.json(await revokeRights(String(request.params.tokenId))); } catch (error) { handle(error, response); }
}
