import UserGroup from "../models/UserGroup";
import Application from "../models/Application";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { checkToolPrivileges } from "../utils/checkToolPrivileges";

import dotenv from "dotenv";
import logger from "../utils/logger";

import { GoogleGenAI, Type } from "@google/genai";
import PendingOperation from "../models/PendingOperation";

dotenv.config(); // load environment variables from .env

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
  private transport: StdioClientTransport | null = null;
  private tools: any[] = []; // Use 'any' for tools to allow flexibility
  private gemini: GoogleGenAI;

  constructor() {
    // Initialize Gemini client and MCP client
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
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
      "create-index",
    ]);

    this.tools = toolsResult.tools
      .filter((tool) => !excludedTools.has(tool.name))
      .map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      }));

    logger.info(
      "Connected to Mongo MCP Server with tools:" +
      this.tools.map((t) => t.name)
    );
  }

  async processQuery(user: ChatUser, chat: any) {
    const contents: any[] = chat;

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

    let finalText: string[] = [];
    let hasToolUse = true;

    const maxToolCalls = 10; // Limit to prevent infinite loops
    let toolCount = 0;

    const toolDeclarations = userTools.length
      ? [
          {
            functionDeclarations: userTools.map((tool) => ({
              name: tool.name,
              description: tool.description || "",
              // Pass the raw input_schema—Gemini will accept `{ properties, required }`
              parameters: tool.input_schema,
            })),
          },
        ]
      : undefined;

    while (hasToolUse && toolCount < maxToolCalls) {
      // Ask Gemini
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          tools: toolDeclarations,
          systemInstruction: `You are a helpful assistant that can call MongoDB MCP tools as part of a logging microservice. Currently, you are working with the db called "test".
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
        Important Scenarios:
        1) When creating or modifying any application or user group, always fetch the schema of the collection first to ensure you get field names right.
        2) If creating a new application, make sure they are assigned to the admin group ALWAYS whether or not the user asks.
        3) If user is asking about a specific application or user group, and the name doesnt match exactly, retry with a case-insensitive search or any possible similar variations.
        4) If there are multiple tool calls with write operations to be made, make them one at a time so that the user can confirm each one individually.
        Here is the current user object:
        ${JSON.stringify(user, null, 2)}
        `,
          //   maxOutputTokens: 1500,
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error("Unexpected Gemini response shape");
      }

      hasToolUse = false;

      for (const part of candidate.content.parts) {
        if (part.text) {
          // For text responses without tool calls
          finalText.push(part.text);
        } else if (part.functionCall) {
          // Gemini wants to call a tool
          hasToolUse = true;
          const { name: toolName, args: toolArgs } = part.functionCall as {
            name: string;
            args: Record<string, any>;
          };

          // — push the function-call back into the convo so the model sees it
          contents.push({
            role: "model",
            parts: [{ functionCall: { name: toolName, args: toolArgs } }],
          });

          // — execute the tool
          if (!isAdmin) {
            const { authorized, message } = checkToolPrivileges(
              user,
              toolName,
              toolArgs
            );
            if (!authorized)
              return {
                type: "response",
                message,
              };
          }

          // If its a write tool, send the user a confirmation message
          if (
            ["insert-many", "update-many", "delete-many"].includes(toolName)
          ) {
            // Store the operation in PendingOperation collection
            const pendingOperation = new PendingOperation({
              toolName,
              toolArgs,
            });
            const result = await pendingOperation.save();

            const toolId = result._id.toString();

            // send the user a confirmation message
            return {
              type: "confirmation_required",
              toolId: toolId,
              toolDetails:{
                toolName,
                toolArgs
              },
              message: `Are you sure you want to ${toolName} on the ${toolArgs.collection} collection with the following data? ${JSON.stringify(toolArgs.filter)}`,
            };
          }

          const toolResult = await this.mcp.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          // — push the result back in as a “user” message
          contents.push({
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: toolName,
                  response: { result: toolResult },
                },
              },
            ],
          });
        }
      }

      toolCount++;
    }

    // 3) Once no more tool calls, return the last text
    return finalText.length > 0
      ? {
          type: "response",
          message: finalText.join(" "),
        }
      : {
          type: "response",
          message: "No response could be generated.",
        };
  }

  async executeToolFromDb(toolId: string) {
    // first, get the tool name and args from the PendingOperation collection
    const pendingOperation = await PendingOperation.findById(toolId);
    if (!pendingOperation) {
      throw new Error(`Pending operation with ID ${toolId} not found`);
    }
    const { toolName, toolArgs } = pendingOperation;

    // execute the tool
    const toolResult = await this.mcp.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    // remove the pending operation from the db
    await PendingOperation.findByIdAndDelete(toolId);

    // return the result
    return {
      functionResponse: {
        name: toolName,
        response: { result: toolResult },
      },
    };
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    await this.mcp.close();
  }
}

export default MCPClient;
