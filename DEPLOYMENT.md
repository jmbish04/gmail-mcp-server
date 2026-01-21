# Gmail MCP Server - Full Stack Deployment Guide

This guide covers deploying the complete Gmail MCP server stack including:
- Cloudflare Workers API with MCP over HTTP
- Vectorize for semantic email search
- Service account with domain-wide delegation
- Frontend chat application
- Gmail AppScript addon

## Prerequisites

1. **Cloudflare Account**
   - Workers subscription
   - Vectorize enabled
   - AI Workers enabled

2. **Google Cloud Project**
   - Service account created
   - Domain-wide delegation enabled
   - Gmail API enabled

3. **OpenAI API Key**
   - For AI-powered chat responses

## Part 1: Google Service Account Setup

### 1.1 Create Service Account

```bash
# Go to Google Cloud Console
# https://console.cloud.google.com/

# Navigate to: IAM & Admin > Service Accounts
# Click "Create Service Account"

# Fill in details:
Name: gmail-mcp-server
Description: Service account for Gmail MCP server with domain-wide delegation
```

### 1.2 Enable Domain-Wide Delegation

```bash
# In Service Account details:
# 1. Click "Edit" under "Domain-wide delegation"
# 2. Check "Enable Google Workspace Domain-wide Delegation"
# 3. Save

# Note the Client ID and Service Account Email
```

### 1.3 Configure OAuth Scopes in Admin Console

```bash
# Go to Google Workspace Admin Console
# https://admin.google.com/

# Navigate to: Security > API Controls > Domain-wide Delegation
# Click "Add new"

# Client ID: [Your service account client ID]
# OAuth Scopes (comma-separated):
https://mail.google.com/,https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send
```

### 1.4 Download Service Account Key

```bash
# In Google Cloud Console > Service Accounts
# Click on your service account
# Go to "Keys" tab
# Click "Add Key" > "Create new key"
# Choose JSON format
# Save the file securely
```

## Part 2: Cloudflare Setup

### 2.1 Create Vectorize Index

```bash
# Create vectorize index for email embeddings
wrangler vectorize create gmail-mcp-server --preset @cf/baai/bge-large-en-v1.5

# Note the index ID for wrangler.jsonc
```

### 2.2 Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create "KV"

# Note the ID for wrangler.jsonc
```

### 2.3 Create D1 Database

```bash
# Create D1 database
wrangler d1 create gmail-mcp-server

# Note the database ID for wrangler.jsonc
```

### 2.4 Configure Environment Variables

Create `.env.local` file:

```bash
# Service Account (JSON key as single-line string)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# OpenAI
OPENAI_API_KEY=sk-...

# MCP Server URL (after deployment)
PUBLIC_MCP_SERVER_URL=https://your-worker.workers.dev
```

### 2.5 Update wrangler.jsonc

Update the IDs in `apps/api/wrangler.jsonc`:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "YOUR_KV_ID"
    }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "YOUR_D1_ID"
    }
  ],
  "vectorize": [
    {
      "binding": "VECTORIZE",
      "index_name": "gmail-mcp-server"
    }
  ]
}
```

## Part 3: Deploy API Server

### 3.1 Install Dependencies

```bash
pnpm install
```

### 3.2 Build and Deploy

```bash
# Deploy API worker
pnpm api:deploy

# Note the deployed URL
# Example: https://gmail-mcp-server-api.YOUR_SUBDOMAIN.workers.dev
```

### 3.3 Test the Deployment

```bash
# Test health endpoint
curl https://your-worker.workers.dev/mcp/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "gmail-mcp-server",
#   "version": "1.0.0"
# }
```

## Part 4: Deploy Frontend Chat App

### 4.1 Update Configuration

Update `apps/web/.env.local`:

```bash
PUBLIC_MCP_SERVER_URL=https://your-worker.workers.dev
PUBLIC_API_URL=https://your-worker.workers.dev
```

### 4.2 Deploy

```bash
# Build and deploy web app
pnpm web:deploy

# Note the deployed URL
```

## Part 5: Gmail AppScript Addon

### 5.1 Create Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Name it "Gmail MCP Assistant"

### 5.2 Add Code

1. Copy contents of `gmail-addon/Code.gs` to `Code.gs`
2. Copy contents of `gmail-addon/appsscript.json` to `appsscript.json`

### 5.3 Update Configuration

In `Code.gs`, update:

```javascript
const MCP_SERVER_URL = 'https://your-worker.workers.dev';
```

### 5.4 Deploy as Gmail Addon

1. Click "Deploy" > "New deployment"
2. Type: "Add-on"
3. Configuration:
   - Name: Gmail MCP Assistant
   - Description: AI-powered Gmail assistant
4. Click "Deploy"

### 5.5 Install in Gmail

1. Open Gmail
2. Click the addon icon in the sidebar
3. Select "Gmail MCP Assistant"
4. Authorize the addon

## Part 6: Testing

### 6.1 Test MCP Server

```bash
# Test tool listing
curl https://your-worker.workers.dev/mcp/tools

# Test email retrieval (requires service account setup)
curl -X POST https://your-worker.workers.dev/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get-unread-emails",
    "arguments": {"maxResults": 5},
    "userId": "user@yourdomain.com"
  }'
```

### 6.2 Test Chat Frontend

1. Open your deployed web app
2. Navigate to `/chat`
3. Try asking: "Show me my unread emails"
4. Verify the AI responds with email data

### 6.3 Test Gmail Addon

1. Open any email in Gmail
2. Click the addon icon
3. Try "Summarize Email"
4. Try "Generate Smart Reply"
5. Verify the addon communicates with MCP server

## Part 7: Production Considerations

### 7.1 Security

- Store service account key in Cloudflare Secrets:
  ```bash
  wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY
  ```

- Enable CORS properly for production domains

- Implement rate limiting on MCP endpoints

### 7.2 Monitoring

- Enable Cloudflare Analytics
- Set up error logging
- Monitor Vectorize usage

### 7.3 Scaling

- Vectorize automatically scales
- Consider implementing caching for frequent queries
- Use Durable Objects for stateful operations if needed

## Troubleshooting

### Issue: Service account authentication fails

**Solution:**
- Verify domain-wide delegation is enabled
- Check OAuth scopes in Admin Console
- Ensure service account key is valid JSON
- Verify user email is in the domain

### Issue: Vectorize queries timeout

**Solution:**
- Check vectorize index exists
- Verify AI binding is configured
- Ensure embeddings are being generated correctly

### Issue: Gmail addon doesn't load

**Solution:**
- Check Apps Script deployment status
- Verify MCP_SERVER_URL is correct
- Check addon OAuth scopes
- Review Apps Script logs

## Support

For issues or questions:
- Check the [documentation](./README.md)
- Review Cloudflare Workers docs
- Check Google Apps Script documentation

## Next Steps

1. Customize the chat UI
2. Add more MCP tools
3. Implement email categorization
4. Add scheduling features
5. Integrate with calendar

---

**Important Security Notes:**
- Never commit service account keys to git
- Use Cloudflare Secrets for sensitive data
- Implement proper access controls
- Audit service account usage regularly
