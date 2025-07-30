import mcpClient from "../services/mcpClient";
import { Request, Response } from "express";


export const handleChat = async (req: Request, res: Response) => {
  const { chat } = req.body;

  const user = req.user; 

  if (!chat) {
    res.status(400).json({ error: "Missing 'chat' in request body" });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized user" });
    return;
  }

  const response = await mcpClient.processQuery(user, chat);

  if (!response) {
    res.status(500).json({ error: "Failed to process chat" });
    return;
  }

  res.json(response);
};