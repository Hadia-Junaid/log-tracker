import express from "express";
import { chatHandler } from "../controllers/mcpController";
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post("/chat", authenticate, chatHandler);
//router.post("/chat", chatHandler);

export default router;
