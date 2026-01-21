/**
 * Gmail MCP Addon - Google Apps Script
 *
 * This Gmail addon integrates with the MCP server via agent-to-agent (A2A) communication.
 * It provides AI-powered email assistance directly within Gmail.
 *
 * Setup Instructions:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Copy this code
 * 4. Update MCP_SERVER_URL with your deployed Cloudflare Worker URL
 * 5. Deploy as Gmail addon
 */

// Configuration
const MCP_SERVER_URL = 'https://your-worker.workers.dev'; // Update this!
const ADDON_VERSION = '1.0.0';

/**
 * Called when a message is opened in Gmail
 */
function onGmailMessageOpen(e) {
  Logger.log('Gmail message opened: ' + JSON.stringify(e));

  const accessToken = e.messageMetadata.accessToken;
  const messageId = e.messageMetadata.messageId;

  // Get the message details
  const message = GmailApp.getMessageById(messageId);

  // Build the card UI
  const card = buildMessageCard(message, accessToken);

  return [card];
}

/**
 * Called when the addon is first opened
 */
function onGmailCompose(e) {
  Logger.log('Gmail compose opened');
  return [buildComposeCard()];
}

/**
 * Build the main message card with AI assistance
 */
function buildMessageCard(message, accessToken) {
  const subject = message.getSubject();
  const from = message.getFrom();
  const body = message.getPlainBody();
  const date = message.getDate();

  const card = CardService.newCardBuilder();

  // Header
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Gmail MCP Assistant')
      .setSubtitle('AI-Powered Email Help')
      .setImageUrl('https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png')
  );

  // Email summary section
  const summarySection = CardService.newCardSection()
    .setHeader('Email Summary');

  summarySection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('From')
      .setContent(from)
  );

  summarySection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Subject')
      .setContent(subject)
  );

  summarySection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Date')
      .setContent(Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm'))
  );

  card.addSection(summarySection);

  // AI Actions section
  const actionsSection = CardService.newCardSection()
    .setHeader('AI Actions');

  // Summarize button
  actionsSection.addWidget(
    CardService.newTextButton()
      .setText('Summarize Email')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('summarizeEmail')
          .setParameters({
            messageId: message.getId(),
            body: body.substring(0, 5000) // Limit size
          })
      )
  );

  // Generate reply button
  actionsSection.addWidget(
    CardService.newTextButton()
      .setText('Generate Smart Reply')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('generateReply')
          .setParameters({
            messageId: message.getId(),
            subject: subject,
            from: from,
            body: body.substring(0, 5000)
          })
      )
  );

  // Search similar button
  actionsSection.addWidget(
    CardService.newTextButton()
      .setText('Find Similar Emails')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('findSimilar')
          .setParameters({
            subject: subject,
            body: body.substring(0, 1000)
          })
      )
  );

  card.addSection(actionsSection);

  // Chat section
  const chatSection = CardService.newCardSection()
    .setHeader('Chat with AI');

  chatSection.addWidget(
    CardService.newTextInput()
      .setFieldName('chatMessage')
      .setTitle('Ask about this email')
      .setHint('e.g., "What are the action items?"')
  );

  chatSection.addWidget(
    CardService.newTextButton()
      .setText('Send')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('sendChatMessage')
          .setParameters({
            messageId: message.getId(),
            context: JSON.stringify({
              subject: subject,
              from: from,
              body: body.substring(0, 5000)
            })
          })
      )
  );

  card.addSection(chatSection);

  return card.build();
}

/**
 * Build the compose card for drafting emails
 */
function buildComposeCard() {
  const card = CardService.newCardBuilder();

  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Gmail MCP Assistant')
      .setSubtitle('AI Writing Helper')
  );

  const section = CardService.newCardSection()
    .setHeader('AI Writing Assistant');

  section.addWidget(
    CardService.newTextInput()
      .setFieldName('emailPrompt')
      .setTitle('Describe what you want to write')
      .setHint('e.g., "Professional thank you email to a client"')
      .setMultiline(true)
  );

  section.addWidget(
    CardService.newTextButton()
      .setText('Generate Draft')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('generateDraft')
      )
  );

  card.addSection(section);

  return card.build();
}

/**
 * Summarize the email using MCP server
 */
function summarizeEmail(e) {
  const messageId = e.parameters.messageId;
  const body = e.parameters.body;

  try {
    // Call MCP server via A2A
    const response = callMCPServer('a2a/message', {
      from: 'gmail-addon',
      to: 'mcp-server',
      message: {
        action: 'summarize',
        content: body
      },
      context: {
        messageId: messageId,
        source: 'gmail-addon',
        version: ADDON_VERSION
      }
    });

    // Show summary in notification
    const notification = CardService.newNotification()
      .setText('Summary generated! Check the card.');

    // Build result card
    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('Email Summary')
    );

    const section = CardService.newCardSection();
    section.addWidget(
      CardService.newTextParagraph()
        .setText(response.summary || 'Summary generated successfully')
    );

    card.addSection(section);

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setNavigation(CardService.newNavigation().updateCard(card.build()))
      .build();

  } catch (error) {
    return showError('Failed to summarize: ' + error.message);
  }
}

/**
 * Generate a smart reply
 */
function generateReply(e) {
  const subject = e.parameters.subject;
  const from = e.parameters.from;
  const body = e.parameters.body;

  try {
    const response = callMCPServer('a2a/message', {
      from: 'gmail-addon',
      to: 'mcp-server',
      message: {
        action: 'generate-reply',
        content: {
          subject: subject,
          from: from,
          body: body
        }
      },
      context: {
        source: 'gmail-addon'
      }
    });

    // Create compose action with the generated reply
    const composeAction = CardService.newComposeActionResponseBuilder()
      .setGmailDraft(
        CardService.newUpdateDraftBodyAction()
          .addUpdateContent(response.reply || 'Thank you for your email.', CardService.ContentType.MUTABLE_HTML)
      )
      .build();

    const notification = CardService.newNotification()
      .setText('Reply generated! Opening compose window...');

    return CardService.newActionResponseBuilder()
      .setNotification(notification)
      .setComposeAction(composeAction)
      .build();

  } catch (error) {
    return showError('Failed to generate reply: ' + error.message);
  }
}

/**
 * Find similar emails using vector search
 */
function findSimilar(e) {
  const subject = e.parameters.subject;
  const body = e.parameters.body;

  try {
    const response = callMCPServer('execute', {
      tool: 'vector-search-emails',
      arguments: {
        query: subject + ' ' + body,
        k: 5
      }
    });

    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('Similar Emails')
    );

    const section = CardService.newCardSection();

    if (response.matches && response.matches.length > 0) {
      response.matches.forEach(function(match) {
        section.addWidget(
          CardService.newKeyValue()
            .setTopLabel('Match (Score: ' + (match.score * 100).toFixed(1) + '%)')
            .setContent(match.email.subject)
            .setBottomLabel(match.email.from)
        );
      });
    } else {
      section.addWidget(
        CardService.newTextParagraph()
          .setText('No similar emails found.')
      );
    }

    card.addSection(section);

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card.build()))
      .build();

  } catch (error) {
    return showError('Failed to search: ' + error.message);
  }
}

/**
 * Send a chat message to the MCP server
 */
function sendChatMessage(e) {
  const chatMessage = e.formInput.chatMessage;
  const context = JSON.parse(e.parameters.context);

  try {
    const response = callMCPServer('a2a/message', {
      from: 'gmail-addon',
      to: 'mcp-server',
      message: {
        action: 'chat',
        query: chatMessage,
        context: context
      }
    });

    const card = CardService.newCardBuilder();
    card.setHeader(
      CardService.newCardHeader()
        .setTitle('AI Response')
    );

    const section = CardService.newCardSection();
    section.addWidget(
      CardService.newTextParagraph()
        .setText(response.response || 'Response received')
    );

    card.addSection(section);

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().pushCard(card.build()))
      .build();

  } catch (error) {
    return showError('Chat failed: ' + error.message);
  }
}

/**
 * Generate an email draft
 */
function generateDraft(e) {
  const prompt = e.formInput.emailPrompt;

  try {
    const response = callMCPServer('a2a/message', {
      from: 'gmail-addon',
      to: 'mcp-server',
      message: {
        action: 'generate-email',
        prompt: prompt
      }
    });

    const composeAction = CardService.newComposeActionResponseBuilder()
      .setGmailDraft(
        CardService.newUpdateDraftBodyAction()
          .addUpdateContent(response.draft || 'Draft generated', CardService.ContentType.MUTABLE_HTML)
          .addUpdateSubject(response.subject || 'Email Draft')
      )
      .build();

    return CardService.newActionResponseBuilder()
      .setComposeAction(composeAction)
      .build();

  } catch (error) {
    return showError('Failed to generate draft: ' + error.message);
  }
}

/**
 * Call the MCP server
 */
function callMCPServer(endpoint, payload) {
  const url = MCP_SERVER_URL + '/mcp/' + endpoint;

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code !== 200) {
    throw new Error('MCP Server error: ' + code + ' - ' + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

/**
 * Show an error notification
 */
function showError(message) {
  const notification = CardService.newNotification()
    .setText(message)
    .setType(CardService.NotificationType.ERROR);

  return CardService.newActionResponseBuilder()
    .setNotification(notification)
    .build();
}
