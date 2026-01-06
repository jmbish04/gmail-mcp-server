/**
 * @file Chat API Route with AI SDK streaming
 *
 * Integrates with the MCP server and provides streaming responses
 * using Vercel AI SDK and OpenAI.
 */

import type { APIRoute } from 'astro';
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// MCP Server URL (update based on deployment)
const MCP_SERVER_URL = import.meta.env.PUBLIC_MCP_SERVER_URL || 'http://localhost:8787';

// Define tools for the AI to use (calling MCP server)
const gmailTools = {
  getUnreadEmails: tool({
    description: 'Get unread emails from Gmail',
    parameters: z.object({
      maxResults: z.number().optional().describe('Maximum number of emails to retrieve'),
    }),
    execute: async ({ maxResults }) => {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get-unread-emails',
          arguments: { maxResults },
        }),
      });
      return await response.json();
    },
  }),

  searchEmails: tool({
    description: 'Search emails using semantic vector search',
    parameters: z.object({
      query: z.string().describe('The search query'),
      k: z.number().optional().describe('Number of results to return'),
    }),
    execute: async ({ query, k }) => {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'vector-search-emails',
          arguments: { query, k },
        }),
      });
      return await response.json();
    },
  }),

  sendEmail: tool({
    description: 'Send an email via Gmail',
    parameters: z.object({
      to: z.string().describe('Recipient email address'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body content'),
      isHtml: z.boolean().optional().describe('Whether body is HTML'),
    }),
    execute: async ({ to, subject, body, isHtml }) => {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'send-email',
          arguments: { to, subject, body, isHtml },
        }),
      });
      return await response.json();
    },
  }),

  summarizeEmails: tool({
    description: 'Summarize top K emails',
    parameters: z.object({
      k: z.number().describe('Number of emails to summarize'),
    }),
    execute: async ({ k }) => {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'summarize-top-k-emails',
          arguments: { k },
        }),
      });
      return await response.json();
    },
  }),

  globalSearch: tool({
    description: 'Search emails using Gmail global search',
    parameters: z.object({
      query: z.string().describe('Search query string'),
      maxResults: z.number().optional().describe('Maximum results'),
    }),
    execute: async ({ query, maxResults }) => {
      const response = await fetch(`${MCP_SERVER_URL}/mcp/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'global-search-emails',
          arguments: { query, maxResults },
        }),
      });
      return await response.json();
    },
  }),
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages, userId } = await request.json();

    const result = streamText({
      model: openai('gpt-4-turbo'),
      messages,
      tools: gmailTools,
      system: `You are a helpful Gmail assistant powered by MCP (Model Context Protocol).
You have access to the user's Gmail account and can help them:
- Read and search emails using semantic search
- Compose and send emails
- Summarize emails
- Manage labels and organize inbox

Always be helpful, concise, and respectful of the user's privacy.
When searching or retrieving emails, use the appropriate tools.
${userId ? `Current user: ${userId}` : ''}`,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
