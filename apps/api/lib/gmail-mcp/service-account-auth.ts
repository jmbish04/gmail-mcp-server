/**
 * @file Service Account Authentication with Domain-Wide Delegation
 *
 * This module handles authentication using Google Service Accounts with
 * domain-wide delegation, allowing the MCP server to access Gmail on behalf
 * of users in a Google Workspace domain.
 *
 * Setup Requirements:
 * 1. Create service account in Google Cloud Console
 * 2. Enable domain-wide delegation for the service account
 * 3. Configure OAuth scopes in Google Workspace Admin Console
 * 4. Download service account JSON key
 * 5. Add key to environment as GOOGLE_SERVICE_ACCOUNT_KEY
 *
 * @author Gmail MCP Team
 * @version 1.0.0
 * @see https://developers.google.com/identity/protocols/oauth2/service-account
 */

import { google } from 'googleapis';
import type { Env } from '../env.js';

// Gmail API scopes
const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

/**
 * Creates a JWT client for service account authentication with domain-wide delegation
 *
 * @param userEmail - The email of the user to impersonate
 * @param env - Cloudflare environment variables
 * @returns Authenticated JWT client
 */
export async function createServiceAccountClient(userEmail: string, env: Env) {
  const serviceAccountKey = env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }

  // Parse the service account key
  const credentials = JSON.parse(serviceAccountKey);

  // Create JWT client with domain-wide delegation
  const jwtClient = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
    subject: userEmail, // Impersonate this user
  });

  // Authorize the client
  await jwtClient.authorize();

  return jwtClient;
}

/**
 * Authenticates and sets up the global Google API client for a specific user
 *
 * @param userEmail - The email of the user to authenticate as
 * @param env - Cloudflare environment variables
 */
export async function authenticateServiceAccount(userEmail: string, env: Env) {
  const auth = await createServiceAccountClient(userEmail, env);
  google.options({ auth });

  console.log(`Authenticated as ${userEmail} via service account`);
}

/**
 * Gets the Gmail API client for a specific user
 *
 * @param userEmail - The email of the user
 * @param env - Cloudflare environment variables
 * @returns Gmail API client
 */
export async function getGmailClient(userEmail: string, env: Env) {
  const auth = await createServiceAccountClient(userEmail, env);
  return google.gmail({ version: 'v1', auth });
}

/**
 * Validates that a service account has domain-wide delegation enabled
 *
 * @param env - Cloudflare environment variables
 * @returns Validation result
 */
export async function validateDomainWideDelegation(env: Env): Promise<{
  valid: boolean;
  error?: string;
  serviceAccountEmail?: string;
}> {
  try {
    const serviceAccountKey = env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      return {
        valid: false,
        error: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured',
      };
    }

    const credentials = JSON.parse(serviceAccountKey);

    return {
      valid: true,
      serviceAccountEmail: credentials.client_email,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
