/**
 * @file MCP Server over HTTP for Cloudflare Workers
 *
 * This module provides an HTTP-based MCP (Model Context Protocol) server that runs
 * on Cloudflare Workers edge network, enabling:
 * - RESTful HTTP API for MCP protocol
 * - Agent-to-agent (A2A) communication
 * - Gmail integration via service accounts
 * - Semantic email search with Vectorize
 * - Real-time streaming responses via SSE
 *
 * @author Gmail MCP Team
 * @version 1.0.0
 * @see https://modelcontextprotocol.io
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import type { Env } from '../env.js';
import {
  CREATE_LABEL_TOOL,
  createLabel,
  DELETE_EMAIL_TOOL,
  DELETE_LABELS_TOOL,
  deleteEmail,
  deleteGmailLabel,
  GET_GMAIL_PROFILE_TOOL,
  GET_UNREAD_EMAILS_TOOL,
  getGmailProfileById,
  getUnreadEmails,
  GLOBAL_SEARCH_TOOL,
  globalSearchEmails,
  LIST_LABELS_TOOL,
  listGmailLabels,
  SEND_EMAIL_TOOL,
  sendEmail,
  SUMMARIZE_TOP_K_EMAILS_TOOL,
  summarizeTopKEmails,
} from './tools/gmail.js';
import {
  VECTOR_SEARCH_EMAILS_TOOL,
  vectorSearchEmailsHandler,
} from './tools/vector-search.js';
import { indexEmails, isRagEnabled } from './utils/vector-db.js';
import { authenticateServiceAccount } from './service-account-auth.js';

type MCPContext = {
  Bindings: {
    VECTORIZE: VectorizeIndex;
    KV: KVNamespace;
    DB: D1Database;
  } & Env;
};

// Create MCP router
export const mcpRouter = new Hono<MCPContext>();

// Enable CORS for agent-to-agent communication
mcpRouter.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
mcpRouter.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'gmail-mcp-server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * MCP Tools Configuration
 *
 * Defines all available MCP tools for Gmail operations.
 * RAG tools (vector search) are conditionally included based on Vectorize availability.
 */
const RAG_TOOLS: any[] = isRagEnabled() ? [VECTOR_SEARCH_EMAILS_TOOL] : [];

const ALL_TOOLS: any[] = [
  GET_GMAIL_PROFILE_TOOL,      // Get Gmail profile information
  SEND_EMAIL_TOOL,             // Send emails via Gmail API
  SUMMARIZE_TOP_K_EMAILS_TOOL, // AI-powered email summarization
  GET_UNREAD_EMAILS_TOOL,      // Retrieve unread emails
  GLOBAL_SEARCH_TOOL,          // Search emails with Gmail query syntax
  LIST_LABELS_TOOL,            // List all Gmail labels
  CREATE_LABEL_TOOL,           // Create new Gmail labels
  DELETE_EMAIL_TOOL,           // Delete emails
  DELETE_LABELS_TOOL,          // Delete Gmail labels
  ...RAG_TOOLS,                // Vector search tools (if enabled)
];

// List available tools
mcpRouter.get('/mcp/tools', (c) => {
  return c.json({
    tools: ALL_TOOLS,
    capabilities: {
      vectorSearch: isRagEnabled(),
      gmail: true,
      streaming: true,
    }
  });
});

// Execute a tool
mcpRouter.post('/mcp/execute', async (c) => {
  try {
    const { tool, arguments: args, userId } = await c.req.json();

    // Authenticate with service account if needed
    if (userId) {
      await authenticateServiceAccount(userId, c.env);
    }

    let result;

    switch (tool) {
      case GET_GMAIL_PROFILE_TOOL.name: {
        const { userId } = args as { userId: string };
        result = await getGmailProfileById(userId);
        break;
      }
      case SEND_EMAIL_TOOL.name: {
        const { to, subject, body, isHtml, attachments } = args as {
          to: string;
          subject: string;
          body: string;
          isHtml?: boolean;
          attachments?: Array<{
            filename: string;
            mimeType: string;
            content: string;
          }>;
        };
        result = await sendEmail(to, subject, body, isHtml, attachments);
        break;
      }
      case CREATE_LABEL_TOOL.name: {
        const { name } = args as { name: string };
        result = await createLabel(name);
        break;
      }
      case DELETE_EMAIL_TOOL.name: {
        const { messageId } = args as { messageId: string };
        result = await deleteEmail(messageId);
        break;
      }
      case SUMMARIZE_TOP_K_EMAILS_TOOL.name: {
        const { k } = args as { k: number };
        result = await summarizeTopKEmails(k);
        break;
      }
      case GET_UNREAD_EMAILS_TOOL.name: {
        const { maxResults } = args as { maxResults?: number };
        const unreadResult = await getUnreadEmails(maxResults);

        if (isRagEnabled() && c.env.VECTORIZE) {
          const emails = JSON.parse(unreadResult.content[0].text);
          await indexEmails(emails, c.env.VECTORIZE, c.env);
        }

        result = unreadResult;
        break;
      }
      case GLOBAL_SEARCH_TOOL.name: {
        const searchResult = await globalSearchEmails(args as any);

        if (isRagEnabled() && c.env.VECTORIZE) {
          const emails = JSON.parse(searchResult.content[0].text);
          await indexEmails(emails, c.env.VECTORIZE, c.env);
        }

        result = searchResult;
        break;
      }
      case LIST_LABELS_TOOL.name: {
        result = await listGmailLabels();
        break;
      }
      case DELETE_LABELS_TOOL.name: {
        const { labelId } = args as { labelId: string };
        result = await deleteGmailLabel(labelId);
        break;
      }
      case VECTOR_SEARCH_EMAILS_TOOL.name: {
        const { query, k } = args as {
          query: string;
          k?: number;
        };
        result = await vectorSearchEmailsHandler(query, k, c.env.VECTORIZE, c.env);
        break;
      }
      default:
        return c.json({
          error: `Unknown tool: ${tool}`,
          isError: true,
        }, 400);
    }

    return c.json(result);
  } catch (error) {
    console.error('MCP execution error:', error);
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      isError: true,
    }, 500);
  }
});

// Streaming chat endpoint for agentic experiences
mcpRouter.post('/mcp/chat/stream', async (c) => {
  const { messages, userId } = await c.req.json();

  return streamSSE(c, async (stream) => {
    try {
      // Authenticate with service account
      if (userId) {
        await authenticateServiceAccount(userId, c.env);
      }

      // Stream response chunks
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'start',
          timestamp: new Date().toISOString(),
        }),
      });

      // Process messages and generate response
      // This will be integrated with AI SDK
      const response = {
        type: 'response',
        content: 'Processing your request...',
      };

      await stream.writeSSE({
        data: JSON.stringify(response),
      });

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'done',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  });
});

// Agent-to-Agent (A2A) communication endpoint
mcpRouter.post('/mcp/a2a/message', async (c) => {
  try {
    const { from, to, message, context } = await c.req.json();

    // Log the A2A interaction
    console.log('A2A Message:', { from, to, timestamp: new Date().toISOString() });

    // Store in KV for async processing if needed
    if (c.env.KV) {
      const key = `a2a:${from}:${to}:${Date.now()}`;
      await c.env.KV.put(key, JSON.stringify({ message, context }), {
        expirationTtl: 3600, // 1 hour
      });
    }

    // Process the message
    const response = {
      success: true,
      messageId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export default mcpRouter;
