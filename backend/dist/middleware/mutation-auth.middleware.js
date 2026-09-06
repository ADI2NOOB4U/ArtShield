import { timingSafeEqual } from "node:crypto";
const TOKEN_HEADER = "authorization";
const ROLE_HEADER = "x-artshield-role";
function safeEqual(left, right) {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}
export function requireMutationAuth(request, response, next) {
    const configuredToken = process.env.ARTSHIELD_MUTATION_TOKEN;
    const configuredRole = process.env.ARTSHIELD_MUTATION_ROLE ?? "operator";
    const authorization = request.header(TOKEN_HEADER);
    const role = request.header(ROLE_HEADER);
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
    if (!configuredToken || !token || !safeEqual(token, configuredToken)) {
        response.status(401).json({ error: "mutation authorization required" });
        return;
    }
    if (role !== configuredRole) {
        response.status(403).json({ error: "mutation role is not authorized" });
        return;
    }
    next();
}
//# sourceMappingURL=mutation-auth.middleware.js.map