import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes, isAddress } from "ethers";

const CERTIFICATE_ABI = [
	"function certificateForArtwork(bytes32) view returns (uint256)",
	"function issueCertificate(address,bytes32,bytes32,string) returns (uint256)",
	"event CertificateIssued(uint256 indexed tokenId,bytes32 indexed artworkHash,bytes32 indexed metadataHash,address creator,address recipient)",
];

export type CertificateRequest = {
	recipient: string;
	artworkFingerprint: string;
	metadata: Record<string, unknown>;
	metadataUri: string;
};

export type CertificateResult = {
	tokenId: string;
	transactionHash: string;
	contractAddress: string;
	chainId: string;
	artworkHash: string;
	metadataHash: string;
	metadataUri: string;
};

export interface CertificateClient {
	getExistingCertificate(artworkHash: string): Promise<bigint>;
	issueCertificate(recipient: string, artworkHash: string, metadataHash: string, metadataUri: string): Promise<{ tokenId: bigint; transactionHash: string }>;
}

export class CertificateValidationError extends Error {}
export class BlockchainConfigurationError extends Error {}
export class DuplicateCertificateError extends Error {}
export class BlockchainTransactionError extends Error {}

function assertLocalDevelopmentChain(rpcUrl: string): void {
	try {
		const url = new URL(rpcUrl);
		if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname) || (process.env.BLOCKCHAIN_CHAIN_ID && process.env.BLOCKCHAIN_CHAIN_ID !== '31337')) {
			throw new Error();
		}
	} catch {
		throw new BlockchainConfigurationError("blockchain signing is restricted to the local Hardhat chain");
	}
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, canonicalize(nested)]));
	}
	return value;
}

export function canonicalMetadata(metadata: Record<string, unknown>): string {
	return JSON.stringify(canonicalize(metadata));
}

export function validateCertificateRequest(request: CertificateRequest): { artworkHash: string; metadataHash: string } {
	if (!request || typeof request !== "object") throw new CertificateValidationError("certificate request must be an object");
	if (!isAddress(request.recipient) || request.recipient === "0x0000000000000000000000000000000000000000") throw new CertificateValidationError("recipient must be a non-zero wallet address");
	if (!/^[a-f0-9]{64}$/i.test(request.artworkFingerprint)) throw new CertificateValidationError("artworkFingerprint must be a SHA-256 hex digest");
	if (!request.metadata || typeof request.metadata !== "object" || Array.isArray(request.metadata)) throw new CertificateValidationError("metadata must be an object");
	if (typeof request.metadataUri !== "string" || request.metadataUri.length < 1 || request.metadataUri.length > 2048 || !/^[a-z][a-z0-9+.-]*:/i.test(request.metadataUri)) throw new CertificateValidationError("metadataUri must be a bounded URI with a scheme");
	const metadataJson = canonicalMetadata(request.metadata);
	return { artworkHash: `0x${request.artworkFingerprint.toLowerCase()}`, metadataHash: keccak256(toUtf8Bytes(metadataJson)) };
}

export function createConfiguredCertificateClient(): CertificateClient & { contractAddress: string; chainId: string } {
	const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
	const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS;
	const privateKey = process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;
	if (!rpcUrl || !contractAddress || !privateKey) throw new BlockchainConfigurationError("blockchain certificate configuration is incomplete");
	assertLocalDevelopmentChain(rpcUrl);
	if (!isAddress(contractAddress)) throw new BlockchainConfigurationError("CERTIFICATE_CONTRACT_ADDRESS is invalid");
	const provider = new JsonRpcProvider(rpcUrl);
	let signer: Wallet;
	try { signer = new Wallet(privateKey, provider); } catch { throw new BlockchainConfigurationError("CERTIFICATE_SIGNER_PRIVATE_KEY is invalid"); }
	const contract = new Contract(contractAddress, CERTIFICATE_ABI, signer);
	return {
		contractAddress,
		chainId: process.env.BLOCKCHAIN_CHAIN_ID ?? "unknown",
		async getExistingCertificate(artworkHash) {
			return BigInt(await contract.certificateForArtwork(artworkHash));
		},
		async issueCertificate(recipient, artworkHash, metadataHash, metadataUri) {
			try {
				const transaction = await contract.issueCertificate(recipient, artworkHash, metadataHash, metadataUri);
				const receipt = await transaction.wait();
				if (!receipt?.hash) throw new Error("transaction receipt was unavailable");
				const event = receipt.logs
					.map((log: unknown) => {
						try { return contract.interface.parseLog(log as never); } catch { return null; }
					})
					.find((parsed: { name?: string } | null) => parsed?.name === "CertificateIssued");
				if (!event?.args?.[0]) throw new Error("certificate event was unavailable");
				return { tokenId: BigInt(event.args[0]), transactionHash: receipt.hash };
			} catch {
				throw new BlockchainTransactionError("certificate transaction failed");
			}
		},
	};
}

export async function issueCertificate(request: CertificateRequest, client = createConfiguredCertificateClient()): Promise<CertificateResult> {
	const { artworkHash, metadataHash } = validateCertificateRequest(request);
	let existing: bigint;
	try {
		existing = await client.getExistingCertificate(artworkHash);
	} catch {
		throw new BlockchainTransactionError("unable to query certificate contract");
	}
	if (existing !== 0n) throw new DuplicateCertificateError("artwork already has a certificate");
	const issued = await client.issueCertificate(request.recipient, artworkHash, metadataHash, request.metadataUri);
	return {
		tokenId: issued.tokenId.toString(),
		transactionHash: issued.transactionHash,
		contractAddress: "contractAddress" in client ? client.contractAddress : "test-client",
		chainId: "chainId" in client ? client.chainId : "test-chain",
		artworkHash,
		metadataHash,
		metadataUri: request.metadataUri,
	};
}
