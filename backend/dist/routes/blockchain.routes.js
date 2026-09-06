import { Router } from "express";
import { createCertificate } from "../controllers/blockchain.controller.js";
import { requireMutationAuth } from "../middleware/mutation-auth.middleware.js";
const router = Router();
router.post("/certificates", requireMutationAuth, createCertificate);
export default router;
//# sourceMappingURL=blockchain.routes.js.map