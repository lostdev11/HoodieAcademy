'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  User, 
  Send, 
  X, 
  Minimize2, 
  Maximize2,
  Loader2,
  Sparkles 
} from 'lucide-react';

interface AIChatWidgetProps {
  initialOpen?: boolean;
}

export default function AIChatWidget({ initialOpen = false }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai-chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hey there! 👋 I'm your Hoodie Academy AI Assistant. I'm here to help you with Web3, Solana, NFTs, and any coding questions you have. What would you like to learn today?",
      },
    ],
  });

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 z-50"
        size="icon"
      >
        <Bot className="h-6 w-6 text-white" />
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    );
  }

  return (
    <Card 
      className={`fixed left-6 z-50 shadow-2xl border-cyan-500/30 bg-slate-900/95 backdrop-blur-lg transition-all duration-300 ${
        isMinimized 
          ? 'bottom-6 w-80 h-16' 
          : 'bottom-6 w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <CardHeader className="pb-3 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-900/30 to-purple-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-5 w-5 text-cyan-400" />
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <CardTitle className="text-base text-cyan-400">Hoodie AI Assistant</CardTitle>
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
              Online
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`flex-1 rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30'
                        : 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-cyan-500/30'
                    }`}
                  >
                    <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-500">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <div className="flex-1 rounded-lg p-3 bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-cyan-500/30">
                    <p className="text-sm text-gray-400">Thinking...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30">
                  <p className="text-sm text-red-400">
                    ⚠️ Error: {error.message}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-cyan-500/30 bg-slate-800/50"
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about Web3, Solana, or coding..."
                className="flex-1 bg-slate-700/50 border-cyan-500/30 text-white placeholder:text-gray-400 focus:border-cyan-400"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Ask me to explain code, debug errors, or learn Web3 concepts!
            </p>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

