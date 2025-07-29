import express from "express";
import { authenticate } from "../middleware/auth";
import { handleChat } from "../controllers/chat.controller";

const router = express.Router();

router.post("/", authenticate, handleChat);

export default router;
