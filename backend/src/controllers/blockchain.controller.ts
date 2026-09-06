import { Request, Response } from "express";

import {
	BlockchainConfigurationError,
	BlockchainTransactionError,
	CertificateValidationError,
	DuplicateCertificateError,
	CertificateRequest,
	issueCertificate,
} from "../services/blockchain/blockchain.service.js";

let certificateIssuer: typeof issueCertificate = issueCertificate;

export function setCertificateIssuerForTests(issuer: typeof issueCertificate): void {
	certificateIssuer = issuer;
}

export function resetCertificateIssuerForTests(): void {
	certificateIssuer = issueCertificate;
}

export async function createCertificate(request: Request, response: Response): Promise<void> {
	try {
		const result = await certificateIssuer(request.body as CertificateRequest);
		response.status(201).json(result);
	} catch (error) {
		if (error instanceof CertificateValidationError) {
			response.status(422).json({ error: error.message });
			return;
		}
		if (error instanceof DuplicateCertificateError) {
			response.status(409).json({ error: error.message });
			return;
		}
		if (error instanceof BlockchainConfigurationError) {
			response.status(503).json({ error: "blockchain certificate service is not configured" });
			return;
		}
		if (error instanceof BlockchainTransactionError) {
			response.status(502).json({ error: error.message });
			return;
		}
		response.status(500).json({ error: "certificate request failed" });
	}
}