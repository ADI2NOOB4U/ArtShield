import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	BlockchainConfigurationError,
	CertificateValidationError,
	DuplicateCertificateError,
	issueCertificate,
	validateCertificateRequest,
} from "../src/services/blockchain/blockchain.service.js";

const fingerprintA = "a".repeat(64);
const request = {
	recipient: "0x0000000000000000000000000000000000000001",
	artworkFingerprint: fingerprintA,
	metadata: { title: "A", artist: "ArtShield" },
	metadataUri: "local://certificate-a",
};

describe("certificate service boundary", () => {
	it("rejects malformed certificate fields with useful validation errors", () => {
		assert.throws(() => validateCertificateRequest(undefined as never), CertificateValidationError);
		assert.throws(() => validateCertificateRequest({ ...request, recipient: "0x0" }), /recipient/);
		assert.throws(() => validateCertificateRequest({ ...request, recipient: "0x0000000000000000000000000000000000000000" }), /non-zero/);
		assert.throws(() => validateCertificateRequest({ ...request, artworkFingerprint: "bad" }), /SHA-256/);
		assert.throws(() => validateCertificateRequest({ ...request, metadata: null as never }), /metadata/);
		assert.throws(() => validateCertificateRequest({ ...request, metadataUri: "not-a-uri" }), /URI/);
		assert.throws(() => validateCertificateRequest({ ...request, metadataUri: "" }), /URI/);
	});

	it("returns the actual client token ID and preserves metadata hash/URI", async () => {
		const result = await issueCertificate(request, {
			async getExistingCertificate() { return 0n; },
			async issueCertificate() { return { tokenId: 37n, transactionHash: "0x" + "a".repeat(64) }; },
		});
		assert.equal(result.tokenId, "37");
		assert.equal(result.metadataUri, request.metadataUri);
		assert.match(result.metadataHash, /^0x[0-9a-f]{64}$/);
	});

	it("rejects an existing artwork certificate and missing blockchain configuration", async () => {
		await assert.rejects(
			issueCertificate(request, { async getExistingCertificate() { return 9n; }, async issueCertificate() { throw new Error("unreachable"); } }),
			DuplicateCertificateError,
		);
		const originalRpc = process.env.BLOCKCHAIN_RPC_URL;
		const originalAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS;
		const originalKey = process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;
		delete process.env.BLOCKCHAIN_RPC_URL;
		delete process.env.CERTIFICATE_CONTRACT_ADDRESS;
		delete process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;
		try {
			await assert.rejects(issueCertificate(request), BlockchainConfigurationError);
		} finally {
			if (originalRpc === undefined) delete process.env.BLOCKCHAIN_RPC_URL; else process.env.BLOCKCHAIN_RPC_URL = originalRpc;
			if (originalAddress === undefined) delete process.env.CERTIFICATE_CONTRACT_ADDRESS; else process.env.CERTIFICATE_CONTRACT_ADDRESS = originalAddress;
			if (originalKey === undefined) delete process.env.CERTIFICATE_SIGNER_PRIVATE_KEY; else process.env.CERTIFICATE_SIGNER_PRIVATE_KEY = originalKey;
		}
	});
});