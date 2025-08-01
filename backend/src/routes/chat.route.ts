import express from "express";
import { authenticate } from "../middleware/auth";
import { handleChat, handleDeletePendingOperation, handleSaveMessage, handleUnsaveMessage } from "../controllers/chat.controller";
import { validateBody } from "../middleware/validate";
import { chatSchema, saveMessageSchema } from "../validators/chat";
import { requireAdmin } from "../middleware/adminAuth";

const router = express.Router();

router.post("/", authenticate, handleChat);

router.post("/save-message", authenticate, validateBody(saveMessageSchema), handleSaveMessage);

router.delete("/unsave-message", authenticate, validateBody(saveMessageSchema), handleUnsaveMessage);

router.delete("/pending-operation", authenticate, requireAdmin, handleDeletePendingOperation);

export default router;
