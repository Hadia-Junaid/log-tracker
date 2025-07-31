import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { cleanSchema, getAssignedApplicationsForUser, loadSchemaDescriptions } from "./helper";
import readline from "readline/promises";
import { buildInitialPrompt } from "./promptBuilder";
import logger from "../../utils/logger";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI is not set");

export class MCPChatClient {
    private mcp: Client;
      private llm: GoogleGenerativeAI;
      private tools: any[] = [];
    
      constructor() {
        this.llm = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.mcp = new Client({
          name: "mongodb-mcp-client",
          version: "1.0.0"
        });
      }
    
      async connect() {
        const transport = new StdioClientTransport({
          command: "npx",
          args: ["-y", "mongodb-mcp-server", "--connectionString", MONGO_URI!],
        });
    
        await this.mcp.connect(transport);
        logger.info("✅ Connected to MCP server");
    
        const toolsResult = await this.mcp.listTools();
    
        this.tools = [{
          functionDeclarations: toolsResult.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: cleanSchema(tool.inputSchema), 
          })),
        }, ];
    
        logger.info(`🔧 Available tools:`, toolsResult.tools.map((t) => t.name).join(", "));
      }
     
    
      async processQuery(query: string, userid: string, is_admin: boolean, history: string) {
        const schemaInfo = loadSchemaDescriptions(is_admin);
        const assignedApps = await getAssignedApplicationsForUser(userid);
    
        // Prepare list for LLM prompt
        const initialPrompt = buildInitialPrompt(
          schemaInfo,
          assignedApps,
          query,
          is_admin,
          history
        );
        logger.info(`initial prompt is ${initialPrompt}`)
        const messages: any[] = [{
          role: "user",
          parts: [{
            text: initialPrompt
          }]
        }, ];
    
        const finalText: string[] = [];
    
        const model = this.llm.getGenerativeModel({
          model: "gemini-2.5-flash",
          tools: this.tools,
        });
    
    
        let response = await model.generateContent({
          contents: messages,
        });
    
        while (true) {
          if (!response.response.candidates || response.response.candidates.length === 0) {
            logger.warn("No candidates found in the Gemini API response. Breaking loop.");
            break;
          }
    
          const candidate = response.response.candidates[0];
          if (!candidate.content) {
            logger.warn("Candidate content is undefined. Breaking loop.");
            finalText.push("I couldn't process your request. Please try rephrasing.");

            break;
          }
          const parts = candidate.content.parts;
    
          let messageContent = "";
          let toolCalls: any[] = [];
    
          for (const part of parts) {
            if (part.text) {
              messageContent += part.text;
            }
            if (part.functionCall) {
              toolCalls.push({
                function: part.functionCall
              });
            }
          }
    
          if (messageContent) {
            finalText.push(messageContent);
            messages.push({
              role: "model",
              parts: [{
                text: messageContent
              }]
            });
          }
    
          if (toolCalls.length > 0) {
            messages.push({
              role: "model",
              parts: toolCalls.map(tc => ({
                functionCall: tc.function
              }))
            });
    
            for (const toolCall of toolCalls) {
              const toolName = toolCall.function.name;
              const toolArgs = toolCall.function.args || {};
              logger.info(`⚙️ Calling MCP tool: ${toolName} with args ${JSON.stringify(toolArgs)}`);
              if (is_admin) {
                // Prevent update/insert/delete on logs and users in admin view
                if (
                  (toolName.includes("insert") || toolName.includes("update") || toolName.includes("delete")) &&
                  (toolArgs.collection === "logs" || toolArgs.collection === "users")
                ) {
                  logger.warn(`Blocked ${toolName} on ${toolArgs.collection} (admin cannot modify logs/users)`);
                  finalText.push(`❌ Admin is not allowed to modify '${toolArgs.collection}' collection.`);
                  continue;
                }} else {
                if (toolName.includes("insert") || toolName.includes("update") || toolName.includes("delete")) {
                  logger.warn(`Blocked tool call ${toolName} (user is not admin)`);
                  finalText.push("❌ You are not allowed to modify data.");
                  continue; }
    
                if(toolArgs.collection !== "logs"){
                  logger.warn(`Blocked tool call ${toolName} (user is not admin)`);
                  finalText.push("❌ You are not allowed to access any collection other than logs.");
                  continue;
                }
              
              if ((toolName.includes("find") || toolName.includes("count") || toolName.includes("aggregate"))) {
                  // Restrict logs to assigned apps only
                  const assignedAppIds = assignedApps.map((a) => ({ $oid: a.id }));
    
                  if (!toolArgs.filter) toolArgs.filter = {};
    
                  if (toolArgs.filter.application_id) {
                    toolArgs.filter.$and = [
                      { application_id: toolArgs.filter.application_id },
                      { application_id: { $in: assignedAppIds } },
                    ];
                    delete toolArgs.filter.application_id;
                  } else {
                    toolArgs.filter.application_id = { $in: assignedAppIds };
                  }
                logger.info(`⚙️ After filtering Calling MCP tool: ${toolName} with args ${JSON.stringify(toolArgs)}`);
              } }
    
              let result;
              try {
                result = await this.mcp.callTool({
                  name: toolName,
                  arguments: toolArgs,
                });
              } catch (error: any) {
                logger.error(`Error calling tool ${toolName}:`, error);
                result = {
                  error: `Failed to call tool ${toolName}: ${(error as Error).message}`
                };
              }
    
              messages.push({
                role: "tool",
                parts: [{
                  functionResponse: {
                    name: toolName,
                    response: result
                  }
                }],
              });
    
              // finalText.push(`[Tool ${toolName} result]: ${JSON.stringify(result)}`); //will comment this out
            }
    
            response = await model.generateContent({
              contents: messages,
            });
            continue;
          }
          break;
        }
        return finalText.join(" ");
      }
    
}

let mcpClient: MCPChatClient;

export async function initMcpClient() {

  mcpClient = new MCPChatClient();
  await mcpClient.connect();
  logger.info("✅ MCP client ready");
}

export function getMcpClient() {
  return mcpClient;
}