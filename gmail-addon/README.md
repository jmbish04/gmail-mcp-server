# Gmail MCP Assistant - Apps Script Addon

AI-powered Gmail addon that integrates with the MCP server for intelligent email management.

## Features

- **Email Summarization**: Automatically summarize long emails
- **Smart Replies**: Generate context-aware email replies
- **Semantic Search**: Find similar emails using vector search
- **AI Chat**: Ask questions about your emails
- **Draft Generation**: Create email drafts from prompts

## Installation

### Option 1: Manual Installation

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Copy the contents of `Code.gs` into the script editor
4. Click the "Project Settings" icon (⚙️)
5. Check "Show appsscript.json manifest file"
6. Copy the contents of `appsscript.json` into the manifest
7. Update `MCP_SERVER_URL` in `Code.gs` with your deployed Cloudflare Worker URL
8. Save and deploy

### Option 2: clasp (Command Line)

```bash
# Install clasp
npm install -g @google/clasp

# Login to Google
clasp login

# Create new project
clasp create --type standalone --title "Gmail MCP Assistant"

# Push code
clasp push

# Deploy
clasp deploy
```

## Configuration

### 1. Update MCP Server URL

In `Code.gs`, line 15:

```javascript
const MCP_SERVER_URL = 'https://your-worker.workers.dev';
```

Replace with your actual Cloudflare Worker URL.

### 2. OAuth Scopes

The addon requires the following scopes (already configured in `appsscript.json`):

- `gmail.addons.current.message.readonly` - Read current message
- `gmail.addons.current.message.action` - Perform actions on messages
- `gmail.compose` - Create email drafts
- `gmail.modify` - Modify Gmail data
- `script.external_request` - Call external MCP server
- `userinfo.email` - Get user email

## Usage

### In Gmail Message View

1. Open any email in Gmail
2. Click the addon icon in the right sidebar
3. The addon will display:
   - Email summary
   - AI action buttons
   - Chat interface

### Available Actions

#### Summarize Email
- Click "Summarize Email" to get an AI-generated summary
- Useful for long threads and complex emails

#### Generate Smart Reply
- Click "Generate Smart Reply"
- AI analyzes the email and creates a contextual response
- Opens in compose window for editing

#### Find Similar Emails
- Click "Find Similar Emails"
- Uses vector search to find related messages
- Shows top 5 matches with similarity scores

#### Chat with AI
- Type a question in the chat input
- Ask about action items, deadlines, etc.
- Get instant AI-powered answers

### In Compose Mode

1. Click "Compose" in Gmail
2. Click the addon icon
3. Enter a description of what you want to write
4. Click "Generate Draft"
5. AI creates a complete email draft

## Architecture

### Agent-to-Agent (A2A) Communication

The addon communicates with the MCP server using A2A protocol:

```
Gmail Addon → MCP Server → Gmail API
     ↓            ↓            ↓
  User UI    AI Processing  Email Data
```

### Flow Diagram

```
┌─────────────────┐
│  Gmail Inbox    │
└────────┬────────┘
         │ User opens email
         ↓
┌─────────────────┐
│  Gmail Addon    │
│  (Apps Script)  │
└────────┬────────┘
         │ HTTP POST
         ↓
┌─────────────────┐
│  MCP Server     │
│  (Cloudflare)   │
└────────┬────────┘
         │ AI Processing
         ↓
┌─────────────────┐
│  Response to    │
│  Gmail Addon    │
└─────────────────┘
```

## API Reference

### callMCPServer(endpoint, payload)

Calls the MCP server with the given endpoint and payload.

**Parameters:**
- `endpoint` (string): API endpoint path
- `payload` (object): Request payload

**Returns:**
- Parsed JSON response

**Example:**

```javascript
const response = callMCPServer('execute', {
  tool: 'get-unread-emails',
  arguments: { maxResults: 10 }
});
```

## Development

### Testing Locally

1. Use Apps Script's built-in debugger
2. Add Logger.log() statements
3. View logs: View > Logs

### Debugging

Common issues:

**Issue: "MCP Server error: 403"**
- Check CORS settings on Cloudflare Worker
- Verify MCP_SERVER_URL is correct

**Issue: "Authorization required"**
- Re-authorize the addon
- Check OAuth scopes

**Issue: "Timeout"**
- MCP server might be slow
- Check Cloudflare Worker logs

## Security

### Best Practices

1. **Never hardcode sensitive data**
   - Use Properties Service for configuration
   - Don't commit API keys

2. **Validate user input**
   - Sanitize chat messages
   - Limit message length

3. **Rate limiting**
   - Implement on MCP server
   - Prevent abuse

4. **Audit logging**
   - Log all MCP requests
   - Monitor usage patterns

## Customization

### Adding New Actions

1. Create a new function in `Code.gs`:

```javascript
function myCustomAction(e) {
  const response = callMCPServer('a2a/message', {
    from: 'gmail-addon',
    to: 'mcp-server',
    message: {
      action: 'my-action',
      data: e.parameters
    }
  });

  // Build response card
  const card = CardService.newCardBuilder();
  // ... add widgets
  return card.build();
}
```

2. Add button in card builder:

```javascript
section.addWidget(
  CardService.newTextButton()
    .setText('My Action')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('myCustomAction')
    )
);
```

### Styling

Customize colors in `appsscript.json`:

```json
{
  "gmail": {
    "primaryColor": "#4285F4",
    "secondaryColor": "#34A853"
  }
}
```

## Performance

### Optimization Tips

1. **Limit email body size**
   - Truncate to 5000 characters
   - Prevents timeout

2. **Cache responses**
   - Use CacheService for repeated queries
   - Set appropriate TTL

3. **Async operations**
   - Use UrlFetchApp properly
   - Handle errors gracefully

## Troubleshooting

### Common Errors

**Error: "Exception: Request failed for https://... returned code 500"**

Solution:
- Check MCP server logs
- Verify payload structure
- Test endpoint independently

**Error: "You do not have permission to call..."**

Solution:
- Re-authorize addon
- Check OAuth scopes in manifest
- Verify service account permissions

## Updates

### Version History

- **v1.0.0** (2024-01-06)
  - Initial release
  - Email summarization
  - Smart replies
  - Vector search
  - AI chat

## License

See main project LICENSE file.

## Support

For issues or questions:
- Check main project README
- Review Apps Script documentation
- Check MCP server logs

## Contributing

Contributions welcome! Please:
1. Test thoroughly
2. Follow coding standards
3. Update documentation
4. Submit pull request
