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
    "function rights(uint256) view returns (tuple(bytes32 artworkHash,address issuer,address grantee,uint256 rightsMask,uint64 expiresAt,bool revoked,string metadataUri))",
    "function rightsForArtwork(bytes32) view returns (uint256[])",
    "event RightsIssued(uint256 indexed tokenId,bytes32 indexed artworkHash,address indexed grantee,address issuer,uint256 rightsMask,uint64 expiresAt,string metadataUri)",
];
const MAX_UINT256 = (1n << 256n) - 1n;
export class Phase2ValidationError extends Error {
}
export class Phase2ConfigurationError extends Error {
}
export class Phase2BlockchainError extends Error {
}
export class Phase2ConflictError extends Error {
}
function assertLocalDevelopmentChain(rpcUrl) {
    try {
        const url = new URL(rpcUrl);
        if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname) || (process.env.BLOCKCHAIN_CHAIN_ID && process.env.BLOCKCHAIN_CHAIN_ID !== '31337')) {
            throw new Error();
        }
    }
    catch {
        throw new Phase2ConfigurationError("blockchain signing is restricted to the local Hardhat chain");
    }
}
function hash(value, field) {
    if (typeof value !== "string" || !/^0x[a-f0-9]{64}$/i.test(value))
        throw new Phase2ValidationError(`${field} must be a 32-byte hex hash`);
    return value.toLowerCase();
}
function address(value, field) {
    if (typeof value !== "string" || !isAddress(value) || value === "0x0000000000000000000000000000000000000000")
        throw new Phase2ValidationError(`${field} must be a non-zero wallet address`);
    return value;
}
export function validateRegister(request) {
    if (!request || typeof request !== "object")
        throw new Phase2ValidationError("registration request must be an object");
    const artworkHash = validateArtworkFingerprint(request.artworkFingerprint);
    const metadataHash = hash(request.metadataHash, "metadataHash");
    if (typeof request.certificateTokenId !== "string" || !/^\d+$/.test(request.certificateTokenId))
        throw new Phase2ValidationError("certificateTokenId must be a non-negative integer");
    const certificateTokenId = BigInt(request.certificateTokenId);
    if (certificateTokenId < 0n || certificateTokenId > MAX_UINT256)
        throw new Phase2ValidationError("certificateTokenId must fit uint256");
    return { artworkHash, metadataHash, certificateTokenId, creator: address(request.creator, "creator") };
}
export function validateArtworkFingerprint(value) {
    if (typeof value !== "string")
        throw new Phase2ValidationError("artworkFingerprint must be a 64-character hex digest");
    return hash(value.startsWith("0x") ? value : `0x${value}`, "artworkFingerprint");
}
export function validateRights(request) {
    if (!request || typeof request !== "object")
        throw new Phase2ValidationError("rights request must be an object");
    if (typeof request.artworkFingerprint !== "string")
        throw new Phase2ValidationError("artworkFingerprint must be a 64-character hex digest");
    const artworkHash = hash(request.artworkFingerprint.startsWith("0x") ? request.artworkFingerprint : `0x${request.artworkFingerprint}`, "artworkFingerprint");
    const grantee = address(request.grantee, "grantee");
    if (!Number.isSafeInteger(request.rightsMask) || request.rightsMask <= 0 || request.rightsMask > 63)
        throw new Phase2ValidationError("rightsMask must be an integer between 1 and 63");
    const expiresAt = request.expiresAt ?? 0;
    if (!Number.isSafeInteger(expiresAt) || expiresAt < 0)
        throw new Phase2ValidationError("expiresAt must be a non-negative timestamp");
    if (typeof request.metadataUri !== "string" || request.metadataUri.length < 1 || request.metadataUri.length > 2048 || !/^[a-z][a-z0-9+.-]*:/i.test(request.metadataUri))
        throw new Phase2ValidationError("metadataUri must be a bounded URI with a scheme");
    return { artworkHash, grantee, rightsMask: request.rightsMask, expiresAt, metadataUri: request.metadataUri };
}
export function validateTransfer(request) {
    if (!request || typeof request !== "object")
        throw new Phase2ValidationError("transfer request must be an object");
    return { artworkHash: validateArtworkFingerprint(request.artworkFingerprint), newOwner: address(request.newOwner, "newOwner") };
}
function receipt(transaction, eventName) {
    return transaction.wait().then((result) => {
        if (!result?.hash)
            throw new Phase2BlockchainError("blockchain receipt was unavailable");
        const event = eventName ? result.logs?.find((log) => log.fragment?.name === eventName) : undefined;
        return { transactionHash: result.hash, ...(event?.args?.[0] !== undefined ? { tokenId: event.args[0].toString() } : {}) };
    });
}
export function createConfiguredPhase2Client() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const ownershipAddress = process.env.OWNERSHIP_CONTRACT_ADDRESS;
    const rightsAddress = process.env.RIGHTS_CONTRACT_ADDRESS;
    const privateKey = process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;
    if (!rpcUrl || !ownershipAddress || !rightsAddress || !privateKey)
        throw new Phase2ConfigurationError("Phase 2 blockchain configuration is incomplete");
    assertLocalDevelopmentChain(rpcUrl);
    if (!isAddress(ownershipAddress) || !isAddress(rightsAddress))
        throw new Phase2ConfigurationError("Phase 2 contract address is invalid");
    const provider = new JsonRpcProvider(rpcUrl);
    let signer;
    try {
        signer = new Wallet(privateKey, provider);
    }
    catch {
        throw new Phase2ConfigurationError("CERTIFICATE_SIGNER_PRIVATE_KEY is invalid");
    }
    const ownership = new Contract(ownershipAddress, OWNERSHIP_ABI, signer);
    const rights = new Contract(rightsAddress, RIGHTS_ABI, signer);
    return {
        registerArtwork: async (request) => {
            try {
                await ownership.artwork(request.artworkHash);
                throw new Phase2ConflictError("artwork is already registered");
            }
            catch (error) {
                if (error instanceof Phase2ConflictError)
                    throw error;
            }
            try {
                return await receipt(await ownership.registerArtwork(request.artworkHash, request.metadataHash, request.certificateTokenId, request.creator));
            }
            catch (error) {
                if (String(error).includes("ArtworkAlreadyRegistered"))
                    throw new Phase2ConflictError("artwork is already registered");
                throw error;
            }
        },
        transferArtwork: async (request) => receipt(await ownership.transferArtwork(request.artworkHash, request.newOwner)),
        getArtwork: async (artworkHash) => {
            const record = await ownership.artwork(artworkHash);
            return {
                creator: record.creator,
                currentOwner: record.currentOwner,
                metadataHash: record.metadataHash,
                certificateTokenId: record.certificateTokenId.toString(),
                registeredAt: record.registeredAt.toString(),
                registered: record.registered,
            };
        },
        getProvenance: async (artworkHash) => ownership.provenance(artworkHash),
        issueRights: async (request) => {
            try {
                const existingTokens = await rights.rightsForArtwork(request.artworkHash);
                const latestBlock = await provider.getBlock("latest");
                const now = BigInt(latestBlock?.timestamp ?? 0);
                for (const tokenId of existingTokens) {
                    const prior = await rights.rights(tokenId);
                    const active = !prior.revoked && (prior.expiresAt === 0n || prior.expiresAt >= now);
                    if (active && prior.grantee.toLowerCase() === request.grantee.toLowerCase() && prior.rightsMask === BigInt(request.rightsMask)) {
                        throw new Phase2ConflictError("conflicting rights already exist");
                    }
                }
            }
            catch (error) {
                if (error instanceof Phase2ConflictError)
                    throw error;
            }
            try {
                return await receipt(await rights.issueRights(request.artworkHash, request.grantee, request.rightsMask, request.expiresAt, request.metadataUri), "RightsIssued");
            }
            catch (error) {
                if (String(error).includes("RightsConflict"))
                    throw new Phase2ConflictError("conflicting rights already exist");
                throw error;
            }
        },
        verifyRights: async (tokenId, rightsMask) => rights.verifyRights(tokenId, rightsMask),
        revokeRights: async (tokenId) => receipt(await rights.revokeRights(tokenId)),
    };
}
let clientFactory = createConfiguredPhase2Client;
export function setPhase2ClientFactoryForTests(factory) { clientFactory = factory; }
export function resetPhase2ClientFactoryForTests() { clientFactory = createConfiguredPhase2Client; }
export function getPhase2Client() { return clientFactory(); }
export async function registerArtwork(request) { return getPhase2Client().registerArtwork(validateRegister(request)); }
export async function transferArtwork(request) { return getPhase2Client().transferArtwork(validateTransfer(request)); }
export async function getArtwork(fingerprint) { return getPhase2Client().getArtwork(validateArtworkFingerprint(fingerprint)); }
export async function getProvenance(fingerprint) { return getPhase2Client().getProvenance(validateArtworkFingerprint(fingerprint)); }
export async function issueRights(request) { return getPhase2Client().issueRights(validateRights(request)); }
export async function verifyRights(tokenId, rightsMask) {
    if (!/^\d+$/.test(tokenId))
        throw new Phase2ValidationError("invalid rights verification request");
    const numericTokenId = BigInt(tokenId);
    if (numericTokenId > MAX_UINT256 || !Number.isInteger(rightsMask) || rightsMask <= 0 || rightsMask > 63)
        throw new Phase2ValidationError("invalid rights verification request");
    return getPhase2Client().verifyRights(numericTokenId, rightsMask);
}
export async function revokeRights(tokenId) {
    if (!/^\d+$/.test(tokenId))
        throw new Phase2ValidationError("tokenId must be a non-negative integer");
    const numericTokenId = BigInt(tokenId);
    if (numericTokenId > MAX_UINT256)
        throw new Phase2ValidationError("tokenId must fit uint256");
    return getPhase2Client().revokeRights(numericTokenId);
}
//# sourceMappingURL=phase2.service.js.map