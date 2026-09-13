import { Router } from "express";

import { artwork, provenance, register, rights, revoke, transfer, verify } from "../controllers/phase2.controller.js";
import { requireMutationAuth } from "../middleware/mutation-auth.middleware.js";
import { allowBrowserMutationAuth, requireBrowserMutationOrigin } from "../middleware/session-auth.middleware.js";

const router = Router();
router.post("/artworks/register", requireBrowserMutationOrigin, allowBrowserMutationAuth("registry"), requireMutationAuth("registry"), register);
router.get("/artworks/:fingerprint", artwork);
router.get("/artworks/:fingerprint/provenance", provenance);
router.post("/artworks/transfer", requireBrowserMutationOrigin, allowBrowserMutationAuth("ownership"), requireMutationAuth("ownership"), transfer);
router.post("/rights", requireBrowserMutationOrigin, allowBrowserMutationAuth("ownership"), requireMutationAuth("ownership"), rights);
router.get("/rights/:tokenId/verify", verify);
router.post("/rights/:tokenId/revoke", requireBrowserMutationOrigin, allowBrowserMutationAuth("ownership"), requireMutationAuth("ownership"), revoke);

export default router;
