import mcpClient from "../services/mcpClient";
import { Request, Response } from "express";


export const handleChat = async (req: Request, res: Response) => {
  const { query } = req.body;
  const user = req.user; 

  if (!query) {
    res.status(400).json({ error: "Missing 'query' in request body" });
    return;
  }

  if (!user) {
    res.status(401).json({ error: "Unauthorized user" });
    return;
  }

  const response = await mcpClient.processQuery(user, query);

  if (!response) {
    res.status(500).json({ error: "Failed to process query" });
    return;
  }

  res.json(response);
};