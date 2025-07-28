import MCPClient from "./mcpService";

const mcpClient = new MCPClient();

export async function initMCP() {
  await mcpClient.connectToMongoMcpServer();
  return mcpClient;
}

export default mcpClient;