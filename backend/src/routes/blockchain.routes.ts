import { Router } from "express";

import { createCertificate } from "../controllers/blockchain.controller.js";
import { requireMutationAuth } from "../middleware/mutation-auth.middleware.js";
import { allowBrowserMutationAuth, requireBrowserMutationOrigin } from "../middleware/session-auth.middleware.js";

const router = Router();
router.post("/certificates", requireBrowserMutationOrigin, allowBrowserMutationAuth("registry"), requireMutationAuth("registry"), createCertificate);

export default router;