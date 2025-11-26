// src/server.js

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { tools } from "./tools.config.js";
import { registerAllTools, getToolsForDiscovery } from "./toolRegistry.js";
import { logger, requestLogger } from "./logger.js";
import { authMiddleware } from "./auth.js";


const SERVER_NAME = "js-weather";
const SERVER_VERSION = "1.0.0";

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION
});

// Register all tools from config
registerAllTools(server, tools);

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use(authMiddleware);

// MCP endpoint
app.post("/mcp", async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error("Error in MCP handler", { error: err });
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal MCP server error" });
    }
  }
});

// Tools discovery endpoint
app.get("/tools", (req, res) => {
  try {
    const tools = getToolsForDiscovery();
    res.json({
      server: {
        name: server["options"]?.name,
        version: server["options"]?.version
      },
      tools
    });
  } catch (err) {
    logger.error("Error in tools endpoint", { error: err });
    res.status(500).json({ error: "Failed to list tools" });
  }
});

// Fallback error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error in Express", { error: err });
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = parseInt(process.env.PORT || "3000", 10);

function printStartupInfo() {
  logger.info("====================================");
  logger.info("MCP HTTP server started");
  logger.info("====================================");
  logger.info(`Name:    ${SERVER_NAME}`);
  logger.info(`Version: ${SERVER_VERSION}`);
  logger.info("");
  logger.info("Transport: Streamable HTTP");
  logger.info(`MCP URL:   http://localhost:${port}/mcp`);
  logger.info(`Tools URL: http://localhost:${port}/tools`);
  logger.info("");
  if (process.env.MCP_API_KEY) {
    logger.info("Auth: API key required via header x-api-key");
  } else {
    logger.info("Auth: disabled (no MCP_API_KEY set)");
  }
  logger.info("====================================");
}


app
  .listen(port, () => {
    printStartupInfo();
  })
  .on("error", (error) => {
    logger.error("Server error", { error });
    process.exit(1);
  });
