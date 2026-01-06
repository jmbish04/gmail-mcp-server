/**
 * @file Cloudflare Vectorize Integration for Gmail Email Search
 *
 * This module provides semantic email search capabilities using:
 * - Cloudflare Vectorize for vector storage
 * - Cloudflare AI Workers for embeddings (@cf/baai/bge-large-en-v1.5)
 * - Efficient batch indexing of email content
 * - Fast semantic similarity search
 *
 * Features:
 * - Automatic email indexing on retrieval
 * - 384-dimensional vector embeddings
 * - Metadata storage for email attributes
 * - Fallback embeddings for local development
 *
 * @author Gmail MCP Team
 * @version 1.0.0
 * @see https://developers.cloudflare.com/vectorize
 */

import type { IReadableGmailFormat } from './format';

/**
 * Generates text embeddings using Cloudflare AI
 *
 * @param text - The text to embed
 * @param env - Cloudflare environment (with AI binding)
 * @returns Vector embedding as number array
 */
async function getEmbeddingFromText(
  text: string,
  env: any
): Promise<number[]> {
  try {
    // Use Cloudflare AI Workers for embeddings
    // Model: @cf/baai/bge-large-en-v1.5
    if (env.AI) {
      const response = await env.AI.run('@cf/baai/bge-large-en-v1.5', {
        text: [text],
      });
      return response.data[0];
    }

    // Fallback for local development: generate simple embeddings
    // In production, you should always have AI binding
    console.warn('AI binding not available, using fallback embeddings');
    return generateSimpleEmbedding(text);
  } catch (err) {
    console.error('Failed to generate embedding:', err);
    throw err;
  }
}

/**
 * Simple fallback embedding for local development
 */
function generateSimpleEmbedding(text: string): number[] {
  // Create a simple 384-dimensional embedding based on text characteristics
  // This is just for development - production should use Cloudflare AI
  const embedding = new Array(384).fill(0);
  for (let i = 0; i < text.length && i < 384; i++) {
    embedding[i] = text.charCodeAt(i) / 255;
  }
  return embedding;
}

/**
 * Index emails in Cloudflare Vectorize
 *
 * @param emails - Array of emails to index
 * @param vectorize - Cloudflare Vectorize binding
 * @param env - Cloudflare environment (for AI binding)
 */
export async function indexEmails(
  emails: IReadableGmailFormat[],
  vectorize: VectorizeIndex,
  env?: any
) {
  if (!vectorize) {
    console.warn('Vectorize binding not available, skipping indexing');
    return;
  }

  const vectors: VectorizeVector[] = [];

  for (const email of emails) {
    const text = `${email.subject} ${email.snippet}`;

    try {
      const embedding = await getEmbeddingFromText(text, env);

      vectors.push({
        id: email.id,
        values: embedding,
        metadata: {
          subject: email.subject,
          snippet: email.snippet,
          from: email.from,
          to: email.to,
          date: email.date,
          labelIds: email.labelIds,
        },
      });
    } catch (err) {
      console.error('Failed to embed email:', email.id, err);
      continue;
    }
  }

  try {
    // Batch insert vectors
    await vectorize.insert(vectors);
    console.log(`Indexed ${vectors.length} emails in Vectorize`);
  } catch (err) {
    console.error('Failed to insert vectors:', err);
    throw err;
  }
}

/**
 * Search for emails using vector similarity
 *
 * @param query - Search query text
 * @param k - Number of results to return
 * @param vectorize - Cloudflare Vectorize binding
 * @param env - Cloudflare environment (for AI binding)
 * @returns Search results
 */
export async function vectorSearchEmails(
  query: string,
  k = 5,
  vectorize: VectorizeIndex,
  env?: any
) {
  if (!vectorize) {
    throw new Error('Vectorize binding not available');
  }

  try {
    const embedding = await getEmbeddingFromText(query, env);

    const results = await vectorize.query(embedding, {
      topK: k,
      returnValues: true,
      returnMetadata: 'all',
    });

    return {
      matches: results.matches.map((match) => ({
        id: match.id,
        score: match.score,
        email: {
          subject: match.metadata?.subject,
          snippet: match.metadata?.snippet,
          from: match.metadata?.from,
          to: match.metadata?.to,
          date: match.metadata?.date,
          labelIds: match.metadata?.labelIds
            ? JSON.parse(match.metadata.labelIds as string)
            : [],
        },
      })),
    };
  } catch (err) {
    console.error('Failed to query Vectorize:', err);
    throw err;
  }
}

/**
 * Check if RAG (vector search) is enabled
 */
export function isRagEnabled(): boolean {
  // Always enabled when using Cloudflare Vectorize
  return true;
}
