#!/usr/bin/env node
/**
 * scenetra-mcp — stdio bridge to the hosted Scenetra MCP server.
 *
 * MCP clients that only launch local (stdio) servers run this via `npx`.
 * Every request is forwarded to https://app.scenetra.com/api/mcp with your
 * personal token; tools, models and pricing all live server-side, so this
 * bridge never needs updating when Scenetra adds models or tools.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const VERSION = "0.1.0";
const DEFAULT_URL = "https://app.scenetra.com/api/mcp";
const TOKEN_HELP = "Create one at https://app.scenetra.com/mcp (Settings → MCP).";

// stdout carries the MCP protocol — all diagnostics go to stderr.
function fail(message: string): never {
  console.error(`[scenetra-mcp] ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const token = process.env.SCENETRA_API_TOKEN?.trim();
  if (!token) fail(`SCENETRA_API_TOKEN is not set. ${TOKEN_HELP}`);

  const url = new URL(process.env.SCENETRA_MCP_URL?.trim() || DEFAULT_URL);

  const upstream = new Client({ name: "scenetra-mcp-bridge", version: VERSION });
  try {
    await upstream.connect(
      new StreamableHTTPClientTransport(url, {
        requestInit: { headers: { Authorization: `Bearer ${token}` } },
      }),
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(
      /401|unauthori[sz]ed|invalid_token/i.test(detail)
        ? `Scenetra rejected the token. Check SCENETRA_API_TOKEN. ${TOKEN_HELP}`
        : `Could not reach ${url.href}: ${detail}`,
    );
  }

  const server = new Server(
    { name: "scenetra", version: VERSION },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, (request) =>
    upstream.listTools(request.params),
  );

  // Video runs can take minutes, but get_run_status is the long wait — each
  // individual call returns quickly. The generous timeout only guards slow
  // board validation on large graphs.
  server.setRequestHandler(CallToolRequestSchema, (request) =>
    upstream.callTool(request.params, undefined, { timeout: 300_000 }),
  );

  const shutdown = async () => {
    await Promise.allSettled([server.close(), upstream.close()]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await server.connect(new StdioServerTransport());
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
