# Gmail MCP Server - Full Stack AI Email Assistant

A comprehensive, production-ready Gmail assistant built on the Model Context Protocol (MCP), deployed on Cloudflare's edge network with AI-powered features.

## 🚀 Features

### Backend (Cloudflare Workers)
- **MCP over HTTP**: Full MCP protocol support via RESTful HTTP
- **Cloudflare Vectorize**: Semantic email search with vector embeddings
- **Service Account Auth**: Domain-wide delegation for Google Workspace
- **Agent-to-Agent (A2A)**: Communication protocol for distributed agents
- **Streaming AI Responses**: Real-time streaming using Vercel AI SDK

### Frontend (Astro + React)
- **Modern Chat UI**: Built with shadcn/ui and assistant-ui
- **Responsive Design**: Mobile and desktop optimized
- **Real-time Streaming**: Live AI responses via Server-Sent Events
- **Quick Actions**: Pre-built commands for common tasks
- **Dark Mode**: Full theme support

### Gmail Addon (Apps Script)
- **Native Integration**: Appears directly in Gmail interface
- **AI Summarization**: Automatically summarize emails
- **Smart Replies**: Context-aware response generation
- **Vector Search**: Find similar emails semantically
- **Draft Assistant**: AI-powered email composition

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interfaces                           │
├────────────────┬────────────────┬───────────────────────────┤
│  Web Chat UI   │  Gmail Addon   │  Mobile Responsive        │
│  (Astro/React) │  (Apps Script) │  (Progressive Web App)    │
└────────┬───────┴────────┬───────┴───────────┬───────────────┘
         │                 │                   │
         └─────────────────┼───────────────────┘
                           │
                    HTTP / SSE / A2A
                           │
         ┌─────────────────┴─────────────────┐
         │   Cloudflare Workers (Edge)        │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │   MCP Server (HTTP)          │ │
         │  │   - Tool Execution           │ │
         │  │   - A2A Communication        │ │
         │  │   - Streaming Responses      │ │
         │  └──────────────────────────────┘ │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │   AI & Embeddings            │ │
         │  │   - Cloudflare AI Workers    │ │
         │  │   - OpenAI GPT-4             │ │
         │  └──────────────────────────────┘ │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │   Storage Layer              │ │
         │  │   - Vectorize (Embeddings)   │ │
         │  │   - D1 (SQLite)              │ │
         │  │   - KV (Cache)               │ │
         │  └──────────────────────────────┘ │
         └─────────────────┬──────────────────┘
                           │
                Service Account Auth
                           │
         ┌─────────────────┴──────────────────┐
         │   Google Workspace                 │
         │   - Gmail API                      │
         │   - Domain-Wide Delegation         │
         └────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Cloudflare Workers
- **MCP**: Model Context Protocol SDK
- **HTTP Framework**: Hono
- **AI**: Cloudflare AI + OpenAI
- **Vector DB**: Cloudflare Vectorize
- **Database**: D1 (SQLite)
- **Cache**: KV Storage
- **Auth**: Google Service Account

### Frontend
- **Framework**: Astro 5.0
- **UI Library**: React 19
- **Components**: shadcn/ui
- **Chat UI**: assistant-ui
- **AI SDK**: Vercel AI SDK
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React

### Gmail Integration
- **Platform**: Google Apps Script
- **API**: Gmail API v1
- **UI**: CardService
- **Protocol**: A2A over HTTP

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Node.js 20+
- pnpm 10+
- Cloudflare account
- Google Cloud project
- Google Workspace (for addon)
- OpenAI API key
```

### Installation

```bash
# Clone and install
git clone <repo-url>
cd gmail-mcp-server
pnpm install

# Configure environment
cp .env .env.local
# Edit .env.local with your credentials

# Deploy Cloudflare infrastructure
pnpm api:deploy
pnpm web:deploy

# Deploy Gmail addon
# See gmail-addon/README.md
```

### Configuration

1. **Service Account Setup**
   ```bash
   # See DEPLOYMENT.md for detailed steps
   # 1. Create service account
   # 2. Enable domain-wide delegation
   # 3. Configure OAuth scopes
   # 4. Download JSON key
   ```

2. **Cloudflare Setup**
   ```bash
   # Create Vectorize index
   wrangler vectorize create gmail-mcp-server \
     --preset @cf/baai/bge-large-en-v1.5

   # Create KV namespace
   wrangler kv:namespace create "KV"

   # Create D1 database
   wrangler d1 create gmail-mcp-server
   ```

3. **Deploy**
   ```bash
   # Deploy API
   pnpm api:deploy

   # Deploy Web UI
   pnpm web:deploy

   # Deploy Gmail addon (see gmail-addon/README.md)
   ```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment walkthrough
- [Gmail Addon](./gmail-addon/README.md) - Apps Script addon documentation
- [API Reference](./apps/api/README.md) - MCP server API documentation
- [Frontend Guide](./apps/web/README.md) - Web UI documentation

## 🎯 Use Cases

### Email Management
- Get unread emails
- Search emails semantically
- Organize with labels
- Archive and delete

### AI Assistance
- Summarize long email threads
- Generate smart replies
- Draft new emails from prompts
- Find similar conversations

### Productivity
- Quick actions from chat
- Gmail sidebar integration
- Mobile-friendly interface
- Keyboard shortcuts

## 🔐 Security

### Service Account
- Domain-wide delegation enabled
- Minimal OAuth scopes
- Key rotation supported
- Audit logging enabled

### API Security
- CORS properly configured
- Rate limiting implemented
- Input validation
- Error handling

### Data Privacy
- No data stored permanently
- Embeddings only (no full content)
- User consent required
- GDPR compliant

## 🧪 Testing

```bash
# Test API
curl https://your-worker.workers.dev/mcp/health

# Test tool execution
curl -X POST https://your-worker.workers.dev/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"get-unread-emails","arguments":{"maxResults":5},"userId":"user@domain.com"}'

# Test web UI
# Open https://your-web-app.pages.dev/chat

# Test Gmail addon
# Open Gmail, click addon icon
```

## 📊 Performance

- **Edge Deployment**: <50ms latency worldwide
- **Vector Search**: Sub-100ms semantic search
- **Streaming**: Real-time AI responses
- **Caching**: KV-backed response cache
- **Scalability**: Auto-scales with traffic

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

See [LICENSE](./LICENSE) file.

## 🆘 Support

- **Documentation**: Check docs in `/docs`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@your-domain.com

## 🗺️ Roadmap

- [ ] Multi-account support
- [ ] Email scheduling
- [ ] Advanced filtering
- [ ] Calendar integration
- [ ] Slack notifications
- [ ] Mobile app (React Native)
- [ ] Chrome extension
- [ ] Outlook integration

## 💡 Advanced Features

### Custom MCP Tools

Add your own tools in `apps/api/lib/gmail-mcp/tools/`:

```typescript
export const MY_CUSTOM_TOOL: Tool = {
  name: 'my-custom-tool',
  description: 'Does something custom',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    }
  }
};
```

### Webhook Integration

Connect to external services:

```typescript
mcpRouter.post('/webhook/slack', async (c) => {
  // Handle Slack webhooks
  // Forward to MCP tools
});
```

### Custom Embeddings

Use different embedding models:

```typescript
// In vector-db.ts
const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: [content]
});
```

## 🎨 Customization

### Chat UI Theme

Edit `apps/web/tailwind.config.css`:

```css
@theme {
  --color-primary: #4285F4;
  --color-secondary: #34A853;
}
```

### Gmail Addon Colors

Edit `gmail-addon/appsscript.json`:

```json
{
  "gmail": {
    "primaryColor": "#4285F4",
    "secondaryColor": "#34A853"
  }
}
```

## 📞 Contact

- **Website**: https://your-domain.com
- **Email**: hello@your-domain.com
- **Twitter**: @yourusername
- **GitHub**: @yourusername

## 🙏 Acknowledgments

- Model Context Protocol (Anthropic)
- Cloudflare Workers & AI
- Google Apps Script Team
- shadcn/ui
- Vercel AI SDK
- assistant-ui

---

Built with ❤️ using MCP, Cloudflare, and modern web technologies.
