import { Router } from "express";

import { artwork, provenance, register, rights, revoke, transfer, verify } from "../controllers/phase2.controller.js";
import { requireMutationAuth } from "../middleware/mutation-auth.middleware.js";

const router = Router();
router.post("/artworks/register", requireMutationAuth("registry"), register);
router.get("/artworks/:fingerprint", artwork);
router.get("/artworks/:fingerprint/provenance", provenance);
router.post("/artworks/transfer", requireMutationAuth("ownership"), transfer);
router.post("/rights", requireMutationAuth("ownership"), rights);
router.get("/rights/:tokenId/verify", verify);
router.post("/rights/:tokenId/revoke", requireMutationAuth("ownership"), revoke);

export default router;
