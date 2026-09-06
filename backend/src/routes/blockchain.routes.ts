import { Router } from "express";

import { createCertificate } from "../controllers/blockchain.controller.js";

const router = Router();
router.post("/certificates", createCertificate);

export default router;