import express from "express";
import mcpClient from "../services/mcpClient";
import { Request, Response } from "express";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    res.status(400).json({ error: "Missing 'query' in request body" });
    return;
  }

  const response = await mcpClient.processQuery(query);

  if (!response) {
    res.status(500).json({ error: "Failed to process query" });
    return;
  }

  res.json({ response });
});

export default router;
