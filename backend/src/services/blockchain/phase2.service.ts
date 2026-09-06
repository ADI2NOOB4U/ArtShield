import { Contract, JsonRpcProvider, Wallet, isAddress } from "ethers";

const OWNERSHIP_ABI = [
	"function registerArtwork(bytes32,bytes32,uint256,address)",
	"function transferArtwork(bytes32,address)",
	"function transferArtwork(bytes32,address)",
	"function artwork(bytes32) view returns (address creator,address currentOwner,bytes32 metadataHash,uint256 certificateTokenId,uint64 registeredAt,bool registered)",
	"function provenance(bytes32) view returns (bytes32[])",
];
const RIGHTS_ABI = [
	"function issueRights(bytes32,address,uint256,uint64,string) returns (uint256)",
	"function revokeRights(uint256)",
	"function verifyRights(uint256,uint256) view returns (bool)",
	"function rights(uint256) view returns (bytes32 artworkHash,address issuer,address grantee,uint256 rightsMask,uint64 expiresAt,bool revoked)",
];

export type RegisterArtworkRequest = { artworkFingerprint: string; metadataHash: string; certificateTokenId: string; creator: string };
export type IssueRightsRequest = { artworkFingerprint: string; grantee: string; rightsMask: number; expiresAt?: number; metadataUri: string };
export type TransferArtworkRequest = { artworkFingerprint: string; newOwner: string };
export type BlockchainReceipt = { transactionHash: string; result?: string };

export interface Phase2Client {
	registerArtwork(request: { artworkHash: string; metadataHash: string; certificateTokenId: bigint; creator: string }): Promise<BlockchainReceipt>;
	transferArtwork(request: { artworkHash: string; newOwner: string }): Promise<BlockchainReceipt>;
	getArtwork(artworkHash: string): Promise<unknown>;
	getProvenance(artworkHash: string): Promise<string[]>;
	issueRights(request: { artworkHash: string; grantee: string; rightsMask: number; expiresAt: number; metadataUri: string }): Promise<BlockchainReceipt>;
	verifyRights(tokenId: bigint, rightsMask: number): Promise<boolean>;
	revokeRights(tokenId: bigint): Promise<BlockchainReceipt>;
}

export class Phase2ValidationError extends Error {}
export class Phase2ConfigurationError extends Error {}
export class Phase2BlockchainError extends Error {}

function hash(value: string, field: string): string {
	if (!/^0x[a-f0-9]{64}$/i.test(value)) throw new Phase2ValidationError(`${field} must be a 32-byte hex hash`);
	return value.toLowerCase();
}

function address(value: string, field: string): string {
	if (!isAddress(value) || value === "0x0000000000000000000000000000000000000000") throw new Phase2ValidationError(`${field} must be a non-zero wallet address`);
	return value;
}

export function validateRegister(request: RegisterArtworkRequest) {
	const artworkHash = validateArtworkFingerprint(request.artworkFingerprint);
	const metadataHash = hash(request.metadataHash, "metadataHash");
	const certificateTokenId = BigInt(request.certificateTokenId);
	if (certificateTokenId < 0n) throw new Phase2ValidationError("certificateTokenId must be non-negative");
	return { artworkHash, metadataHash, certificateTokenId, creator: address(request.creator, "creator") };
}

export function validateArtworkFingerprint(value: string) {
	return hash(value.startsWith("0x") ? value : `0x${value}`, "artworkFingerprint");
}

export function validateRights(request: IssueRightsRequest) {
	const artworkHash = hash(request.artworkFingerprint.startsWith("0x") ? request.artworkFingerprint : `0x${request.artworkFingerprint}`, "artworkFingerprint");
	const grantee = address(request.grantee, "grantee");
	if (!Number.isInteger(request.rightsMask) || request.rightsMask <= 0 || request.rightsMask > 63) throw new Phase2ValidationError("rightsMask must be an integer between 1 and 63");
	const expiresAt = request.expiresAt ?? 0;
	if (!Number.isInteger(expiresAt) || expiresAt < 0) throw new Phase2ValidationError("expiresAt must be a non-negative timestamp");
	if (typeof request.metadataUri !== "string" || request.metadataUri.length < 1 || request.metadataUri.length > 2048) throw new Phase2ValidationError("metadataUri is required and bounded");
	return { artworkHash, grantee, rightsMask: request.rightsMask, expiresAt, metadataUri: request.metadataUri };
}

export function validateTransfer(request: TransferArtworkRequest) {
	return { artworkHash: validateArtworkFingerprint(request.artworkFingerprint), newOwner: address(request.newOwner, "newOwner") };
}

function receipt(transaction: any): BlockchainReceipt {
	return transaction.wait().then((result: any) => {
		if (!result?.hash) throw new Phase2BlockchainError("blockchain receipt was unavailable");
		return { transactionHash: result.hash };
	});
}

export function createConfiguredPhase2Client(): Phase2Client {
	const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
	const ownershipAddress = process.env.OWNERSHIP_CONTRACT_ADDRESS;
	const rightsAddress = process.env.RIGHTS_CONTRACT_ADDRESS;
	const privateKey = process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;
	if (!rpcUrl || !ownershipAddress || !rightsAddress || !privateKey) throw new Phase2ConfigurationError("Phase 2 blockchain configuration is incomplete");
	if (!isAddress(ownershipAddress) || !isAddress(rightsAddress)) throw new Phase2ConfigurationError("Phase 2 contract address is invalid");
	const provider = new JsonRpcProvider(rpcUrl);
	const signer = new Wallet(privateKey, provider);
	const ownership = new Contract(ownershipAddress, OWNERSHIP_ABI, signer);
	const rights = new Contract(rightsAddress, RIGHTS_ABI, signer);
	return {
		registerArtwork: async (request) => receipt(await ownership.registerArtwork(request.artworkHash, request.metadataHash, request.certificateTokenId, request.creator)),
		transferArtwork: async (request) => receipt(await ownership.transferArtwork(request.artworkHash, request.newOwner)),
		getArtwork: async (artworkHash) => ownership.artwork(artworkHash),
		getProvenance: async (artworkHash) => ownership.provenance(artworkHash),
		issueRights: async (request) => receipt(await rights.issueRights(request.artworkHash, request.grantee, request.rightsMask, request.expiresAt, request.metadataUri)),
		verifyRights: async (tokenId, rightsMask) => rights.verifyRights(tokenId, rightsMask),
		revokeRights: async (tokenId) => receipt(await rights.revokeRights(tokenId)),
	};
}

let clientFactory: () => Phase2Client = createConfiguredPhase2Client;
export function setPhase2ClientFactoryForTests(factory: () => Phase2Client) { clientFactory = factory; }
export function resetPhase2ClientFactoryForTests() { clientFactory = createConfiguredPhase2Client; }
export function getPhase2Client() { return clientFactory(); }

export async function registerArtwork(request: RegisterArtworkRequest) { return getPhase2Client().registerArtwork(validateRegister(request)); }
export async function transferArtwork(request: TransferArtworkRequest) { return getPhase2Client().transferArtwork(validateTransfer(request)); }
export async function getArtwork(fingerprint: string) { return getPhase2Client().getArtwork(validateArtworkFingerprint(fingerprint)); }
export async function getProvenance(fingerprint: string) { return getPhase2Client().getProvenance(validateArtworkFingerprint(fingerprint)); }
export async function issueRights(request: IssueRightsRequest) { return getPhase2Client().issueRights(validateRights(request)); }
export async function verifyRights(tokenId: string, rightsMask: number) {
	if (!/^\d+$/.test(tokenId) || !Number.isInteger(rightsMask) || rightsMask <= 0 || rightsMask > 63) throw new Phase2ValidationError("invalid rights verification request");
	return getPhase2Client().verifyRights(BigInt(tokenId), rightsMask);
}
export async function revokeRights(tokenId: string) {
	if (!/^\d+$/.test(tokenId)) throw new Phase2ValidationError("tokenId must be a non-negative integer");
	return getPhase2Client().revokeRights(BigInt(tokenId));
}
