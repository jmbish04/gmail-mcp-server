/**
 * @file Cloudflare Workers entrypoint.
 *
 * Initializes database, auth context, and MCP server, then mounts all apps.
 */

import { Hono } from "hono";
import app from "./lib/app.js";
import { createAuth } from "./lib/auth.js";
import type { AppContext } from "./lib/context.js";
import { createDb } from "./lib/db.js";
import type { Env } from "./lib/env.js";
import mcpRouter from "./lib/gmail-mcp/mcp-http.js";

type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  KV: KVNamespace;
  DB: D1Database;
} & Env;

// Create a Hono app with Cloudflare Workers context
const worker = new Hono<{
  Bindings: CloudflareEnv;
  Variables: AppContext["Variables"];
}>();

// Initialize shared context for all requests
worker.use("*", async (c, next) => {
  // Initialize database using Neon via Hyperdrive
  const db = createDb(c.env.HYPERDRIVE_CACHED);
  const dbDirect = createDb(c.env.HYPERDRIVE_DIRECT);

  // Initialize auth
  const auth = createAuth(db, c.env);

  // Set context variables
  c.set("db", db);
  c.set("dbDirect", dbDirect);
  c.set("auth", auth);

  await next();
});

// Mount the MCP server routes
worker.route("/mcp", mcpRouter);

// Mount the core API app
worker.route("/", app);

export default worker;
