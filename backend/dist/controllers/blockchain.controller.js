import { BlockchainConfigurationError, BlockchainTransactionError, CertificateValidationError, DuplicateCertificateError, issueCertificate, } from "../services/blockchain/blockchain.service.js";
let certificateIssuer = issueCertificate;
export function setCertificateIssuerForTests(issuer) {
    certificateIssuer = issuer;
}
export function resetCertificateIssuerForTests() {
    certificateIssuer = issueCertificate;
}
export async function createCertificate(request, response) {
    try {
        const result = await certificateIssuer(request.body);
        response.status(201).json(result);
    }
    catch (error) {
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
//# sourceMappingURL=blockchain.controller.js.map