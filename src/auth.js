// src/auth.js

import { logger } from "./logger.js";

const API_KEY = process.env.MCP_API_KEY || null;

export function authMiddleware(req, res, next) {
  if (!API_KEY) {
    // Auth disabled
    return next();
  }

  const provided = req.headers["x-api-key"];

  if (!provided || String(provided).trim() !== API_KEY) {
    logger.warn("Unauthorized request", {
      path: req.originalUrl,
      ip: req.ip
    });
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}
