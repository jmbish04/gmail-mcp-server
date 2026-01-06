/**
 * @file Gmail MCP Chat Component
 *
 * Full-featured chat interface for Gmail MCP server with:
 * - Vercel AI SDK for streaming responses
 * - shadcn/ui for accessible, beautiful components
 * - Responsive mobile and desktop design
 * - Real-time message streaming
 * - Quick action buttons for common tasks
 *
 * @author Gmail MCP Team
 * @version 1.0.0
 */

import { useChat } from 'ai/react';
import {
  Send,
  Mail,
  Search,
  Inbox,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Badge } from './ui/badge';

export default function GmailChat() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('user@example.com');

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      userId: userEmail,
    },
  });

  const quickActions = [
    { icon: Inbox, label: 'Unread Emails', action: 'Show me my unread emails' },
    { icon: Search, label: 'Search', action: 'Search my emails for...' },
    { icon: Mail, label: 'Compose', action: 'Help me write an email' },
    { icon: Sparkles, label: 'Summarize', action: 'Summarize my top 5 emails' },
  ];

  const handleQuickAction = (action: string) => {
    handleInputChange(action);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Gmail MCP
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/avatar.png" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-500 text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <p className="text-xs text-slate-500">Connected</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-1 p-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          onClick={() => handleQuickAction(item.action)}
                        >
                          <Icon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{item.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.action}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Connected
              </Badge>
              <span>MCP Server v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Gmail Assistant</h2>
              <p className="text-sm text-slate-500">
                AI-powered email management
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <Mail className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold mb-2">
                  Welcome to Gmail MCP Chat
                </h3>
                <p className="text-slate-500 mb-6">
                  Your AI-powered Gmail assistant with semantic search
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {quickActions.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start gap-3 h-auto py-3"
                        onClick={() => handleQuickAction(item.action)}
                      >
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-slate-500">
                            {item.action}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </Card>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-500 text-white text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <Card
                    className={cn(
                      "max-w-[80%] p-4",
                      message.role === 'user'
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-800"
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content}
                    </div>
                  </Card>
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                        {userEmail.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-500 text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <Card className="p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your emails..."
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="lg"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
