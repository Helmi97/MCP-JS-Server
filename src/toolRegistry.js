// src/toolRegistry.js

import * as z from "zod/v4";
import { logger } from "./logger.js";

// Internal store of tools for /tools endpoint
const registeredTools = [];


function unwrapOptional(schema) {
  if (schema instanceof z.ZodOptional) {
    return { inner: schema._def.innerType, optional: true };
  }
  if (schema instanceof z.ZodDefault) {
    return { inner: schema._def.innerType, optional: true };
  }
  return { inner: schema, optional: false };
}

export function jsonSchemaFromZodShape(shape) {
  const properties = {};
  const required = [];

  for (const [key, rawSchema] of Object.entries(shape)) {
    const { inner, optional } = unwrapOptional(rawSchema);

    let schemaDef = {};
    if (inner instanceof z.ZodString) {
      schemaDef.type = "string";
    } else if (inner instanceof z.ZodNumber) {
      schemaDef.type = "number";
    } else if (inner instanceof z.ZodBoolean) {
      schemaDef.type = "boolean";
    } else if (inner instanceof z.ZodEnum || inner instanceof z.ZodNativeEnum) {
      schemaDef.type = "string";
      // If you want, you can also expose allowed values:
      // schemaDef.enum = inner._def.values;
    } else {
      schemaDef.type = "string";
      logger.warn("Unknown zod type for field, defaulting to string", { key });
    }

    properties[key] = schemaDef;
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


// Simple helper so tools.config.js stays clean
export function defineTool({ name, title, description, inputShape, handler }) {
  return { name, title, description, inputShape, handler };
}

// Register all tool definitions with MCP server and discovery list
export function registerAllTools(server, toolDefinitions) {
  for (const def of toolDefinitions) {
    const { name, title, description, inputShape, handler } = def;

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

    logger.info("Registered tool", { name, title });
  }
}

// Used by /tools endpoint
export function getToolsForDiscovery() {
  return registeredTools;
}
