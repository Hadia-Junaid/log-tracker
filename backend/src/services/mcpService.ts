import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import UserGroup from "../models/UserGroup";
import Application from "../models/Application";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import { checkToolPrivileges } from "../utils/checkToolPrivileges";

import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config(); // load environment variables from .env

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

export interface ChatUser {
  id: string;
  email: string;
  name: string;
  settings?: Record<string, unknown>;
  pinned_applications?: string[];
  is_admin: boolean;
  user_groups?: { id: string; name: string }[];
  assigned_applications?: {
    id: string;
    name: string;
    hostname?: string;
    environment?: string;
    description?: string;
  }[];
}

class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    // Initialize Anthropic client and MCP client
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }

  async connectToMongoMcpServer() {
    /**
     * Connect to a MongoDB MCP Server via npx
     */
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in environment");
    }

    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "mongodb-mcp-server", "--connectionString", mongoUri],
    });

    await this.mcp.connect(this.transport);

    // Load available tools
    const toolsResult = await this.mcp.listTools();

    // List of tools we want to exclude
    const excludedTools = new Set([
      "switch-connection",
      "rename-collection",
      "drop-database",
      "drop-collection",
    ]);

    this.tools = toolsResult.tools
      .filter((tool) => !excludedTools.has(tool.name))
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));

    console.log(
      "Connected to Mongo MCP Server with tools:",
      this.tools.map((t) => t.name)
    );
  }

  async processQuery(user: ChatUser, query: string) {
    const messages: MessageParam[] = [{ role: "user", content: query }];

    // const user: ChatUser = {
    //   //   id: "6865076e568c37c6aa0e54bb",
    //   id: "6865461db4caa5eb646c8a8a",
    //   email: "bilal.jadoon@gosaas.io",
    //   name: "Bilal Jadoon",
    //   settings: {},
    //   pinned_applications: [],
    //   is_admin: false,
    // };

    const isAdmin = user.is_admin;
    //define RBAC based tools
    let userTools = [...this.tools];

    if (!isAdmin) {
      // If the user is not an admin, we need to filter all writing tools
      userTools = userTools.filter(
        (tool) =>
          [
            "create-index",
            "insert-many",
            "delete-many",
            "update-many",
          ].includes(tool.name) === false
      );

      // Fetch user's active groups
      const userGroups = await UserGroup.find({
        members: user.id,
        is_active: true,
      }).select("name _id assigned_applications");

      // Collect assigned applications from all active groups
      const allowedApplications = userGroups.flatMap(
        (group) => group.assigned_applications
      );

      // Fetch user's active applications
      const applications = await Application.find({
        _id: { $in: allowedApplications },
        isActive: true,
      }).select("name hostname environment description _id"); // Only needed fields

      // Build the final user object fields
      user.user_groups = userGroups.map((group) => ({
        id: String(group._id),
        name: group.name,
      }));

      user.assigned_applications = applications.map((app) => ({
        id: String(app._id),
        name: app.name,
        hostname: app.hostname,
        environment: app.environment,
        description: app.description,
      }));
    }

    console.log("Final user object:", JSON.stringify(user, null, 2));

    let finalText = [];
    let hasToolUse = true;

    const maxToolCalls = 6; // Limit to prevent infinite loops
    let toolCount = 0;

    while (hasToolUse && toolCount < maxToolCalls) {
      // Ask Claude
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages,
        tools: userTools,
        system: `You are a helpful assistant that can call MongoDB MCP tools. Currently, you are working with the db called "test".
        Use tools only when necessary. When you have enough information to answer, stop calling tools and show the final response to the user.
        If you need to access data to answer a query, use the collection-schema tool to understand the structure of the database.
        Do not blindly call tools without understanding the data. 
        ${
          isAdmin
            ? 'My main collections are "users", "logs", "applications", and "usergroups" and you can access all of them since this is an admin user.'
            : `The only collection you have access to is "logs" and the data provided in the user object below. You do not have access to any other collections as this is a non-admin user.
            If a user asks about applications or groups they have no access to, simply inform them that they do not have access to it. 
            No need to tell them about their user object details and permissions, just tell them they dont have access.`
        }
        },
        Here is the current user object:
        ${JSON.stringify(user, null, 2)}
        `,
      });

      console.log("Claude response:", response.content);

      messages.push({
        role: "assistant",
        content: response.content,
      });

      hasToolUse = false;

      for (const content of response.content) {
        if (content.type === "text") {
          finalText.push(content.text);
        } else if (content.type === "tool_use") {
          hasToolUse = true;
          const toolName = content.name;
          const toolArgs = content.input as Record<string, unknown>;

          console.log(`Tool requested: ${toolName}`, toolArgs);

          //Check if the user has the necessary permissions to use the tool
          if (!isAdmin) {
            const { authorized, message } = checkToolPrivileges(
              user,
              toolName,
              toolArgs
            );
            if (!authorized) {
              console.log("Unauthorized tool: ", message);
              return message;
            }
          }

          // Execute the tool
          const result = await this.mcp.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          console.log(`Tool ${toolName} result:`, result);
          //   console.log("Messages content:", messages);

          // Add the result back to conversation so Claude can see it
          messages.push({
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: content.id, // match the tool_use ID from the request
                content: [{ type: "text", text: JSON.stringify(result) }],
              },
            ],
          });
        }
      }

      toolCount++;
      // If Claude didn't request any tools, the loop stops.
    }

    return finalText.length > 0
      ? finalText[finalText.length - 1]
      : "No response could be generated.";
  }

  async chatLoop() {
    /**
     * Run an interactive chat loop
     */
    const user: ChatUser = {
      id: "6865461db4caa5eb646c8a8a",
      email: "bilal.jadoon@gosaas.io",
      name: "Bilal Jadoon",
      settings: {},
      pinned_applications: [],
      is_admin: false,
    };

    console.log("Starting interactive chat loop...");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(user, message);
        console.log("\nAI: " + response);
      }
    } catch (err) {
      console.error("Error during chat loop:", err);
    } finally {
      rl.close();
    }
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    await this.mcp.close();
  }
}

export default MCPClient;

// async function main() {
//   const mcpClient = new MCPClient();
//   try {
//     await mcpClient.connectToMongoMcpServer();
//     await mcpClient.chatLoop();
//   } finally {
//     await mcpClient.cleanup();
//     process.exit(0);
//   }
// }

// main();
