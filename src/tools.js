// src/tools.js

import * as z from "zod/v4";
import { logger } from "./logger.js";

/**
 * Internal store of tools for discovery endpoint.
 */
const registeredTools = [];

/**
 * Unwrap optional schemas.
 * Returns { inner, optional }.
 */
function unwrapOptional(schema) {
  if (schema instanceof z.ZodOptional) {
    return { inner: schema._def.innerType, optional: true };
  }
  if (schema instanceof z.ZodDefault) {
    // Treat default as optional as well
    return { inner: schema._def.innerType, optional: true };
  }
  return { inner: schema, optional: false };
}

/**
 * Convert a zod object shape into a JSON schema with proper optional handling.
 */
export function jsonSchemaFromZodShape(shape) {
  const properties = {};
  const required = [];

  for (const [key, rawSchema] of Object.entries(shape)) {
    const { inner, optional } = unwrapOptional(rawSchema);

    let type;
    if (inner instanceof z.ZodString) type = "string";
    else if (inner instanceof z.ZodNumber) type = "number";
    else if (inner instanceof z.ZodBoolean) type = "boolean";
    else {
      type = "string";
      logger.warn("Unknown zod type for field, defaulting to string", { key });
    }

    properties[key] = { type };
    if (!optional) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false
  };
}

/**
 * Helper to register a tool with MCP server and discovery list.
 */
export function registerToolWithDiscovery(server, { name, title, description, inputShape, handler }) {
  const inputSchemaZod = inputShape;
  const inputSchemaJson = jsonSchemaFromZodShape(inputShape);

  server.registerTool(
    name,
    {
      title,
      description,
      inputSchema: inputSchemaZod,
      outputSchema: {
        result: z.string()
      }
    },
    handler
  );

  registeredTools.push({
    name,
    description,
    input_schema: inputSchemaJson
  });

  logger.info(`Registered tool`, { name, title });
}

/**
 * Register all tools here.
 */
export function registerAllTools(server) {
  // Example: main weather tool
  registerToolWithDiscovery(server, {
    name: "get_weather",
    title: "Weather tool",
    description: "Returns weather info for a given city",
    inputShape: {
      city: z.string(),
      unit: z
        .string()
        .optional() // optional parameter, reflected correctly in JSON schema
    },
    async handler({ city, unit }) {
      const normalizedUnit = unit === "f" ? "f" : "c";
      const unitLabel = normalizedUnit === "f" ? "77°F" : "25°C";
      const text = `Weather in ${city}: always sunny and ${unitLabel}.`;
      const output = { result: text };

      return {
        content: [
          {
            type: "text",
            text
          }
        ],
        structuredContent: output
      };
    }
  });

  // You can add more tools here using the same helper
}

/**
 * Expose tools list for /tools endpoint.
 */
export function getToolsForDiscovery() {
  return registeredTools;
}
