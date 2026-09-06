import { Router } from "express";

import { artwork, provenance, register, rights, revoke, transfer, verify } from "../controllers/phase2.controller.js";

const router = Router();
router.post("/artworks/register", register);
router.get("/artworks/:fingerprint", artwork);
router.get("/artworks/:fingerprint/provenance", provenance);
router.post("/artworks/transfer", transfer);
router.post("/rights", rights);
router.get("/rights/:tokenId/verify", verify);
router.post("/rights/:tokenId/revoke", revoke);

export default router;
