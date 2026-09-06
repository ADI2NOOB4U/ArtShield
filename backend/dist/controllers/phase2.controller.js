import { getArtwork, getProvenance, issueRights, registerArtwork, revokeRights, verifyRights, Phase2BlockchainError, Phase2ConfigurationError, Phase2ValidationError, } from "../services/blockchain/phase2.service.js";
function handle(error, response) {
    if (error instanceof Phase2ValidationError) {
        response.status(422).json({ error: error.message });
        return;
    }
    if (error instanceof Phase2ConfigurationError) {
        response.status(503).json({ error: "Phase 2 blockchain service is not configured" });
        return;
    }
    if (error instanceof Phase2BlockchainError) {
        response.status(502).json({ error: error.message });
        return;
    }
    response.status(502).json({ error: "blockchain operation failed" });
}
export async function register(request, response) {
    try {
        response.status(201).json(await registerArtwork(request.body));
    }
    catch (error) {
        handle(error, response);
    }
}
export async function artwork(request, response) {
    try {
        response.json(await getArtwork(String(request.params.fingerprint)));
    }
    catch (error) {
        handle(error, response);
    }
}
export async function provenance(request, response) {
    try {
        response.json(await getProvenance(String(request.params.fingerprint)));
    }
    catch (error) {
        handle(error, response);
    }
}
export async function rights(request, response) {
    try {
        response.status(201).json(await issueRights(request.body));
    }
    catch (error) {
        handle(error, response);
    }
}
export async function verify(request, response) {
    try {
        response.json({ valid: await verifyRights(String(request.params.tokenId), Number(request.query.rightsMask)) });
    }
    catch (error) {
        handle(error, response);
    }
}
export async function revoke(request, response) {
    try {
        response.json(await revokeRights(String(request.params.tokenId)));
    }
    catch (error) {
        handle(error, response);
    }
}
//# sourceMappingURL=phase2.controller.js.map