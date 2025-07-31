import { Request, Response } from "express";
import { getMcpClient } from "../services/mcp/mcpClient";

// const client = new MCPChatClient();
// let isConnected = false;

export async function chatHandler(req: Request, res: Response) {
  try {
    // if (!isConnected) {
    //   await client.connect();
    //   isConnected = true;
    // }

    // const userid = "68650fd57a72d0b64525da71";
    //const is_admin = false;
    const userId = req.user.id;
    const is_admin = req.user.is_admin;
    const client = getMcpClient();
    const { query, history } = req.body;
    const response = await client.processQuery(query, userId, is_admin, history);
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
