// src/tools.config.js

import * as z from "zod/v4";
import { defineTool } from "./toolRegistry.js";

export const tools = [
  defineTool({
    name: "get_weather",
    title: "Weather tool",
    description: "Returns weather info for a given city",
    inputShape: {
      city: z.string(),
      unit: z
        .enum(["c", "f"])
        .optional() // optional, reflected correctly in JSON schema
    },
    async handler({ city, unit = "c" }) {
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
  })

  // Example for another tool to show how easy it is:
  // defineTool({
  //   name: "echo",
  //   title: "Echo tool",
  //   description: "Echoes a message back to you",
  //   inputShape: {
  //     message: z.string()
  //   },
  //   async handler({ message }) {
  //     const text = `Echo: ${message}`;
  //     return {
  //       content: [{ type: "text", text }],
  //       structuredContent: { result: text }
  //     };
  //   }
  // })
];
