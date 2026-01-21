/**
 * @file Type Definitions for Gmail MCP Server
 *
 * This file contains TypeScript interfaces and types used throughout
 * the MCP server implementation.
 *
 * @author Gmail MCP Team
 * @version 1.0.0
 */

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Icon component from lucide-react */
  icon: React.ComponentType<{ className?: string }>;
  /** Display label for the action */
  label: string;
  /** Default prompt/command to execute */
  action: string;
}

/**
 * MCP Tool execution request
 */
export interface MCPExecuteRequest {
  /** Name of the tool to execute */
  tool: string;
  /** Tool-specific arguments */
  arguments: Record<string, any>;
  /** User email for service account impersonation */
  userId?: string;
}

/**
 * MCP Tool execution response
 */
export interface MCPExecuteResponse {
  /** Response content array */
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
  }>;
  /** Whether the execution resulted in an error */
  isError: boolean;
}

/**
 * A2A (Agent-to-Agent) message format
 */
export interface A2AMessage {
  /** Source agent identifier */
  from: string;
  /** Destination agent identifier */
  to: string;
  /** Message payload */
  message: {
    /** Action type */
    action: string;
    /** Message content */
    content?: any;
    /** Query string */
    query?: string;
    /** Additional context */
    context?: Record<string, any>;
  };
  /** Message metadata and context */
  context?: {
    /** Message source system */
    source?: string;
    /** API version */
    version?: string;
    /** Timestamp */
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * A2A message response
 */
export interface A2AResponse {
  /** Success status */
  success: boolean;
  /** Unique message identifier */
  messageId?: string;
  /** Response timestamp */
  timestamp?: string;
  /** Response data */
  data?: any;
  /** Error message if failed */
  error?: string;
}

/**
 * Vector search match result
 */
export interface VectorMatch {
  /** Email ID */
  id: string;
  /** Similarity score (0-1) */
  score: number;
  /** Email metadata */
  email: {
    subject?: string;
    snippet?: string;
    from?: string;
    to?: string;
    date?: string;
    labelIds?: string[];
  };
}

/**
 * Vector search response
 */
export interface VectorSearchResponse {
  /** Array of matching emails */
  matches: VectorMatch[];
}

/**
 * Chat message from AI SDK
 */
export interface ChatMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Message ID */
  id?: string;
  /** Creation timestamp */
  createdAt?: Date;
}

/**
 * MCP Server capabilities
 */
export interface MCPCapabilities {
  /** Vector search available */
  vectorSearch: boolean;
  /** Gmail integration available */
  gmail: boolean;
  /** Streaming responses supported */
  streaming: boolean;
}

/**
 * MCP Tools list response
 */
export interface MCPToolsResponse {
  /** Array of available tools */
  tools: any[];
  /** Server capabilities */
  capabilities: MCPCapabilities;
}

/**
 * Service account validation result
 */
export interface ServiceAccountValidation {
  /** Whether the service account is valid */
  valid: boolean;
  /** Service account email if valid */
  serviceAccountEmail?: string;
  /** Error message if invalid */
  error?: string;
}

/**
 * Gmail addon action parameters
 */
export interface GmailAddonActionParams {
  /** Gmail message ID */
  messageId?: string;
  /** Email subject */
  subject?: string;
  /** Email sender */
  from?: string;
  /** Email body (truncated) */
  body?: string;
  /** Label ID */
  labelId?: string;
  /** Context data */
  context?: string;
}

/**
 * Environment variables interface
 */
export interface EnvironmentVariables {
  /** Google service account JSON key */
  GOOGLE_SERVICE_ACCOUNT_KEY: string;
  /** OpenAI API key */
  OPENAI_API_KEY: string;
  /** MCP server URL */
  PUBLIC_MCP_SERVER_URL: string;
  /** Enable RAG flag */
  ENABLE_RAG?: string;
}
