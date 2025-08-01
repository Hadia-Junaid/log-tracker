import express from "express";
import { chatHandler, getPinnedMessages, updatePinnedMessages } from "../controllers/mcpController";
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post("/chat", authenticate, chatHandler);
router.get("/pinned-messages", authenticate, getPinnedMessages);
router.patch("/pinned-messages", authenticate, updatePinnedMessages);
//router.post("/chat", chatHandler);

export default router;
