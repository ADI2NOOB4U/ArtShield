import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes, isAddress } from "ethers";
const CERTIFICATE_ABI = [
    "function certificateForArtwork(bytes32) view returns (uint256)",
    "function issueCertificate(address,bytes32,bytes32,string) returns (uint256)",
    "event CertificateIssued(uint256 indexed tokenId,bytes32 indexed artworkHash,bytes32 indexed metadataHash,address creator,address recipient)",
];
export class CertificateValidationError extends Error {
}
export class BlockchainConfigurationError extends Error {
}
export class DuplicateCertificateError extends Error {
}
export class BlockchainTransactionError extends Error {
}
function canonicalize(value) {
    if (Array.isArray(value))
        return value.map(canonicalize);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, canonicalize(nested)]));
    }
    return value;
}
export function canonicalMetadata(metadata) {
    return JSON.stringify(canonicalize(metadata));
}
export function validateCertificateRequest(request) {
    if (!isAddress(request.recipient))
        throw new CertificateValidationError("recipient must be a valid wallet address");
    if (!/^[a-f0-9]{64}$/i.test(request.artworkFingerprint))
        throw new CertificateValidationError("artworkFingerprint must be a SHA-256 hex digest");
    if (!request.metadata || typeof request.metadata !== "object" || Array.isArray(request.metadata))
        throw new CertificateValidationError("metadata must be an object");
    if (typeof request.metadataUri !== "string" || request.metadataUri.length < 1 || request.metadataUri.length > 2048)
        throw new CertificateValidationError("metadataUri is required and must be at most 2048 characters");
    const metadataJson = canonicalMetadata(request.metadata);
    return { artworkHash: `0x${request.artworkFingerprint.toLowerCase()}`, metadataHash: keccak256(toUtf8Bytes(metadataJson)) };
}
export function createConfiguredCertificateClient() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS;
    const privateKey = process.env.CERTIFICATE_SIGNER_PRIVATE_KEY;
    if (!rpcUrl || !contractAddress || !privateKey)
        throw new BlockchainConfigurationError("blockchain certificate configuration is incomplete");
    if (!isAddress(contractAddress))
        throw new BlockchainConfigurationError("CERTIFICATE_CONTRACT_ADDRESS is invalid");
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);
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
                if (!receipt?.hash)
                    throw new Error("transaction receipt was unavailable");
                const event = receipt.logs
                    .map((log) => {
                    try {
                        return contract.interface.parseLog(log);
                    }
                    catch {
                        return null;
                    }
                })
                    .find((parsed) => parsed?.name === "CertificateIssued");
                if (!event?.args?.[0])
                    throw new Error("certificate event was unavailable");
                return { tokenId: BigInt(event.args[0]), transactionHash: receipt.hash };
            }
            catch {
                throw new BlockchainTransactionError("certificate transaction failed");
            }
        },
    };
}
export async function issueCertificate(request, client = createConfiguredCertificateClient()) {
    const { artworkHash, metadataHash } = validateCertificateRequest(request);
    let existing;
    try {
        existing = await client.getExistingCertificate(artworkHash);
    }
    catch {
        throw new BlockchainTransactionError("unable to query certificate contract");
    }
    if (existing !== 0n)
        throw new DuplicateCertificateError("artwork already has a certificate");
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
//# sourceMappingURL=blockchain.service.js.map