# MCP JS Server Template

A simple boilerplate for building Model Context Protocol (MCP) servers in Node.js with:

- HTTP MCP transport
- Automatic JSON schema generation from Zod
- Easy tool registration via a single config file
- Optional API key authentication
- Centralized logging and error handling

## Quick Start

Clone the repository:

```
git clone <repo>
cd mcp-js-server
npm install
npm start
```

You should see server information including MCP and tools endpoints.

## Project Structure

```
mcp-js-server/
  package.json
  src/
    server.js         # Main entry point
    toolRegistry.js   # Tool loader, zod→JSON schema generator
    tools.config.js   # The ONLY file developers edit to add tools
    logger.js         # Logging middleware
    auth.js           # Optional API key middleware
```

## Adding a Tool

Edit:
```
src/tools.config.js
```

Add a new block:

```js
defineTool({
  name: "echo",
  title: "Echo Tool",
  description: "Returns the input message",
  inputShape: {
    message: z.string()
  },
  async handler({ message }) {
    const result = `Echo: ${message}`;
    return {
      content: [{ type: "text", text: result }],
      structuredContent: { result }
    };
  }
});
```

Restart:

```
npm start
```

Now visit:

```
http://localhost:3000/tools
```

Your tool will appear.

## Endpoints

### GET /tools
List tools and schemas.

### POST /mcp
MCP JSON-RPC interface.

Requires:
```
Accept: application/json, text/event-stream
```

Example:

```
curl -i http://localhost:3000/mcp   -H "Content-Type: application/json"   -H "Accept: application/json, text/event-stream"   -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "get_weather",
      "arguments": { "city": "Dortmund", "unit": "c" }
    }
  }'
```

## Authentication (Optional)

Enable API key:

```
export MCP_API_KEY=secret
```

Clients must send:

```
x-api-key: secret
```

## Debug Logging

Enable:

```
DEBUG=1 npm start
```
