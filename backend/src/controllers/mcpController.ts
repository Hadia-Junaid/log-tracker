import { Request, Response, NextFunction } from "express";
import { getMcpClient } from "../services/mcp/mcpClient";
import User from "../models/User";

// Extend Express Request to include user property
declare module 'express' {
    interface Request {
        user?: any;
    }
}


export async function chatHandler(req: Request, res: Response) {
    const is_admin = false;
    const userId = req.user.id;
    //const is_admin = req.user.is_admin;
    const client = getMcpClient();
    const { query, history } = req.body;
    const response = await client.processQuery(query, userId, is_admin, history);
    res.json({ response });
  
}

export const getPinnedMessages = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user.saved_messages || []);
  
};

export const updatePinnedMessages = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user.id;

    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: "Messages must be an array" });
      return;
    }

    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.saved_messages = messages;
    await user.save();

    res.json({ success: true });
  
};