import { GoogleGenerativeAI } from "@google/generative-ai";
import UserGroup from "../models/UserGroup";
import Application from "../models/Application";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { checkToolPrivileges } from "../utils/checkToolPrivileges";

import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config(); // load environment variables from .env

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
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

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string } | { functionCall: any } | { functionResponse: any }>;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: any;
}

class MCPClient {
  private mcp: Client;
  private genAI: GoogleGenerativeAI;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];

  constructor() {
    // Initialize Gemini client and MCP client
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
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
        description: tool.description || "",
        input_schema: tool.inputSchema,
      }));

    console.log(
      "Connected to Mongo MCP Server with tools:",
      this.tools.map((t) => t.name)
    );
  }  async processQuery(user: ChatUser, chat: any[]) {
    // Convert chat messages to Gemini format
    const messages: GeminiMessage[] = this.convertToGeminiFormat(chat);

    console.log("Converted messages to Gemini format:", JSON.stringify(messages, null, 2));

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

    // Convert tools to Gemini format
    const geminiTools = this.convertToolsToGeminiFormat(userTools);
    
    // Get Gemini model
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      tools: geminiTools.length > 0 ? [{ functionDeclarations: geminiTools }] : undefined,
      systemInstruction: `You are a helpful assistant that can call MongoDB MCP tools. Currently, you are working with the db called "test".
        Use tools only when necessary. When you have enough information to answer, stop calling tools and show the final response to the user.
        If you need to access data to answer a query, use the collection-schema tool before fetching any data from a collection to understand the schema and field names.
        Give concise and accurate answers, dont over-explain.
        ${
          isAdmin
            ? 'My main collections are "users", "logs", "applications", "usergroups", "atriskrules", and "dataretentions", and you can access all of them since this is an admin user. These are only the active applications and user groups but you can also find inactive ones from the database.'
            : `The only collection you have access to is "logs" and the data provided in the user object below. You do not have access to any other collections as this is a non-admin user.
            If a user asks about applications or groups they have no access to, simply inform them that they do not have access to it. 
            No need to tell them about their user object details and permissions, just tell them they dont have access.`
        }
        Note that the only log_level types are "INFO", "DEBUG", "ERROR", and "WARNING". 
        IMPORTANT: All id fields such as application_id in logs collection are ObjectId type and need to be treated correctly e.g. using $oid to reference them.  
        Here is the current user object:
        ${JSON.stringify(user, null, 2)}`
    });

    while (hasToolUse && toolCount < maxToolCalls) {
      // Ask Gemini
      const chat = model.startChat({
        history: messages.slice(0, -1), // All messages except the last one
      });

      const lastMessage = messages[messages.length - 1];
      const lastMessageText = lastMessage.parts
        .filter(part => 'text' in part)
        .map(part => (part as { text: string }).text)
        .join(' ');
      const result = await chat.sendMessage(lastMessageText);

      console.log("Gemini response:", result.response);

      const response = result.response;
      
      // Add assistant response to messages
      const responseText = response.text();
      if (responseText) {
        messages.push({
          role: "model",
          parts: [{ text: responseText }]
        });
      }

      hasToolUse = false;

      // Check for function calls
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        hasToolUse = true;
        
        for (const functionCall of functionCalls) {
          const toolName = functionCall.name;
          const toolArgs = functionCall.args as Record<string, unknown>;

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
          const toolResult = await this.mcp.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          console.log(`Tool ${toolName} result:`, toolResult);

          // Add the function call and response to messages
          messages.push({
            role: "model",
            parts: [{ functionCall: functionCall }]
          });

          messages.push({
            role: "user",
            parts: [{ 
              functionResponse: {
                name: toolName,
                response: toolResult
              }
            }]
          });
        }
      } else if (responseText) {
        finalText.push(responseText);
      }

      toolCount++;
      // If Gemini didn't request any tools, the loop stops.
    }

    return finalText.length > 0
      ? finalText[finalText.length - 1]
      : "No response could be generated.";
  }

  private convertToGeminiFormat(chat: any[]): GeminiMessage[] {
    const geminiMessages: GeminiMessage[] = [];
    
    for (const message of chat) {
      if (message.role === "user") {
        geminiMessages.push({
          role: "user",
          parts: [{ text: message.content }]
        });
      } else if (message.role === "assistant") {
        if (typeof message.content === "string") {
          geminiMessages.push({
            role: "model",
            parts: [{ text: message.content }]
          });
        } else if (Array.isArray(message.content)) {
          const parts = [];
          for (const content of message.content) {
            if (content.type === "text") {
              parts.push({ text: content.text });
            } else if (content.type === "tool_use") {
              parts.push({ 
                functionCall: {
                  name: content.name,
                  args: content.input
                }
              });
            }
          }
          if (parts.length > 0) {
            geminiMessages.push({
              role: "model",
              parts: parts
            });
          }
        }
      }
    }
    
    return geminiMessages;
  }

  private convertToolsToGeminiFormat(tools: Tool[]) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema
    }));
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    await this.mcp.close();
  }
}

export default MCPClient;
