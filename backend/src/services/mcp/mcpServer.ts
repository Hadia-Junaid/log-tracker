import { spawn, ChildProcess } from "child_process";

let mcpProc: ChildProcess | null = null;

export async function launchMcpServer() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error("MONGO_URI is not set");

  mcpProc = spawn("npx", ["-y", "mongodb-mcp-server", "--connectionString", MONGO_URI!], {
    stdio: ["pipe", "pipe", "inherit"],
  });
  mcpProc.on("error", (err) => console.error("MCP server failed:", err));
  console.log("✅ MCP server started.");
}
