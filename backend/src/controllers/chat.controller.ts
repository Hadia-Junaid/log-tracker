import User from "../models/User";
import mcpClient from "../services/mcpClient";
import { Request, Response } from "express";

export const handleChat = async (req: Request, res: Response) => {
  const { chat } = req.body;

  const user = req.user;

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

export const handleSaveMessage = async (req: Request, res: Response) => {
  const { message } = req.body;

  const user = req.user;

  console.log("Message received to save:", message);

  if (!user) {
    res.status(401).json({ error: "Unauthorized user" });
    return;
  }

  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    { $push: { saved_messages: message } },
    { new: true }
  ).select("saved_messages"); 

  if (!updatedUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updatedUser);
};

export const handleUnsaveMessage = async (req: Request, res: Response) => {
  const { message } = req.body;

  const user = req.user;

  console.log("Message received to unsave:", message);

  if (!user) {
    res.status(401).json({ error: "Unauthorized user" });
    return;
  }

  const updatedUser = await User.findByIdAndUpdate(
    user.id,
    { $pull: { saved_messages: message } },
    { new: true }
  ).select("saved_messages"); 

  if (!updatedUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(updatedUser);
};
