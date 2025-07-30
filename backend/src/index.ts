import express from "express";
import config from "./startup/config";
import logger from "./utils/logger";
import { setupMiddleware } from "./startup/middleware";
import { setupRoutes } from "./startup/routes";
import { setupErrorHandling } from "./startup/errorHandlers";
import { connectToDatabase } from "./startup/db";
import { processErrors } from "./startup/processErrors";
import { launchMcpServer } from "./services/mcp/mcpServer";
import { initMcpClient } from "./services/mcp/mcpClient";

processErrors();
const app = express();

setupMiddleware(app);
setupRoutes(app);


const PORT = config.get<number>("server.port") || 3000;

(async () => {
  await connectToDatabase();
  await launchMcpServer(); 
  await initMcpClient();
  
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})();

setupErrorHandling(app);


