import User from "../models/User";
import PendingOperation from "../models/PendingOperation";
import mcpClient from "../services/mcpClient";
import { Request, Response } from "express";

export const handleChat = async (req: Request, res: Response) => {
  const { chat } = req.body;

  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Unauthorized user" });
    return;
  }


  let functionResponse;

  //if the last message of the chat has a type, and its "confirmation", call the MCP tool first
  if (chat[chat.length - 1].type === "confirmation") {
    ({ functionResponse } = await mcpClient.executeToolFromDb(
      chat[chat.length - 1].toolId
    ));

    // //remove the toolId and type fields from the last message so Gemini doesnt throw an error
    // chat[chat.length - 1].toolId = undefined;
    // chat[chat.length - 1].type = undefined;
    //remove the last message completely and replace it with the function response
    chat.pop();

    //add the result of the tool call to the chat
    chat.push({
      role: "function",
      parts: [
        {
          functionResponse,
        },
      ],
    });

  }

  const response = await mcpClient.processQuery(user, chat);

  if (!response) {
    res.status(500).json({ error: "Failed to process chat" });
    return;
  }

  res.json({
    ...response,
    ...(functionResponse && { 
      role: "function",
      parts: [{ functionResponse }],
    }),
  });
};

export const handleSaveMessage = async (req: Request, res: Response) => {
  const { message } = req.body;

  const user = req.user;

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

export const handleDeletePendingOperation = async (
  req: Request,
  res: Response
) => {
  const { toolId } = req.body;

  const user = req.user;

  if (!user) {
    res.status(401).json({ error: "Unauthorized user" });
    return;
  }

  //delete the pending operation from the database
  const result = await PendingOperation.deleteOne({ _id: toolId });
  if (result.deletedCount === 0) {
    res.status(404).json({ error: "Pending operation not found" });
    return;
  }

  res.json({ message: "Pending operation deleted successfully" });
};
