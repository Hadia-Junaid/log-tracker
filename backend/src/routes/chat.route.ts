import express from "express";
import { authenticate } from "../middleware/auth";
import { handleChat } from "../controllers/chat.controller";
import { validateBody } from "../middleware/validate";
import { chatSchema } from "../validators/chat";

const router = express.Router();

router.post("/", authenticate, validateBody(chatSchema), handleChat);

export default router;
