import { Router } from "express";
import { artwork, provenance, register, rights, revoke, transfer, verify } from "../controllers/phase2.controller.js";
import { requireMutationAuth } from "../middleware/mutation-auth.middleware.js";
const router = Router();
router.post("/artworks/register", requireMutationAuth, register);
router.get("/artworks/:fingerprint", artwork);
router.get("/artworks/:fingerprint/provenance", provenance);
router.post("/artworks/transfer", requireMutationAuth, transfer);
router.post("/rights", requireMutationAuth, rights);
router.get("/rights/:tokenId/verify", verify);
router.post("/rights/:tokenId/revoke", requireMutationAuth, revoke);
export default router;
//# sourceMappingURL=phase2.routes.js.map