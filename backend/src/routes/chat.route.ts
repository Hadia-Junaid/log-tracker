import express from "express";
import { authenticate } from "../middleware/auth";
import { handleChat, handleSaveMessage, handleUnsaveMessage } from "../controllers/chat.controller";
import { validateBody } from "../middleware/validate";
import { chatSchema, saveMessageSchema } from "../validators/chat";

const router = express.Router();

router.post("/", authenticate, validateBody(chatSchema), handleChat);

router.post("/save-message", authenticate, validateBody(saveMessageSchema), handleSaveMessage);

router.delete("/unsave-message", authenticate, validateBody(saveMessageSchema), handleUnsaveMessage);

export default router;
