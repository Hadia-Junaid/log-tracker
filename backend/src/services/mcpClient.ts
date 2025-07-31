// import MCPClient from "./claudeMcpService";
import MCPClient from "./geminiMcpService";
const mcpClient = new MCPClient();

export async function initMCP() {
  await mcpClient.connectToMongoMcpServer();
  return mcpClient;
}

export default mcpClient;