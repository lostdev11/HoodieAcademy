'use client';

import { useState, useRef, useEffect } from 'react';
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
import Image from 'next/image';

interface AIChatWidgetProps {
  initialOpen?: boolean;
}

export default function AIChatWidget({ initialOpen = false }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [position, setPosition] = useState({ 
    x: 24, 
    y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600 
  }); // Default bottom-left
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const MESSAGE_LIMIT = 50; // Limit messages per session
  const DRAG_THRESHOLD = 5; // Minimum pixels to move before considering it a drag

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai-chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hey there! 👋 I'm your Hoodie Academy AI Assistant. I'm here to help you with Web3, Solana, NFTs, and any coding questions you have. What would you like to learn today?",
      },
    ],
    onFinish: () => {
      setMessageCount(prev => prev + 1);
    },
  });

  const hasReachedLimit = messageCount >= MESSAGE_LIMIT;
  const messagesRemaining = MESSAGE_LIMIT - messageCount;

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    
    // Prevent opening chat when dragging
    e.preventDefault();
    
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    setIsDragging(true);
    setHasMoved(false); // Reset movement flag
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Check if movement exceeds threshold before marking as moved
    const deltaX = Math.abs(e.clientX - dragStart.x);
    const deltaY = Math.abs(e.clientY - dragStart.y);
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      setHasMoved(true); // Mark that we've moved beyond threshold
    }
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep widget within viewport bounds
    const widgetWidth = isOpen ? (isMinimized ? 320 : 384) : 56; // 56px for button
    const widgetHeight = isOpen ? (isMinimized ? 64 : 600) : 56; // 56px for button
    const maxX = window.innerWidth - widgetWidth;
    const maxY = window.innerHeight - widgetHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Keep hasMoved flag active briefly to prevent click event from firing
    if (hasMoved) {
      setTimeout(() => {
        setHasMoved(false);
      }, 100);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    // Only open chat if we didn't just finish dragging
    if (!hasMoved) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, dragStart, hasMoved]);

  if (!isOpen) {
    return (
      <Button
        ref={widgetRef}
        onClick={handleButtonClick}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 50
        }}
        className={`h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        size="icon"
      >
        <div className="w-full h-full flex items-center justify-center">
          <Image 
            src="/images/hoodie-bot.png" 
            alt="Hoodie AI Bot" 
            width={48} 
            height={48} 
            className="rounded-full object-cover w-full h-full"
          />
        </div>
        <span className="sr-only">Open AI Assistant</span>
      </Button>
    );
  }

  return (
    <Card 
      ref={widgetRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50
      }}
      className={`shadow-2xl border-cyan-500/30 bg-slate-900/95 backdrop-blur-lg transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-96 h-[600px]'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {/* Header */}
      <CardHeader 
        className="pb-3 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-900/30 to-purple-900/30"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-5 h-5 rounded-full overflow-hidden">
                <Image 
                  src="/images/hoodie-bot.png" 
                  alt="Hoodie AI Bot" 
                  width={20} 
                  height={20} 
                  className="w-full h-full object-cover"
                />
              </div>
              <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <CardTitle className="text-base text-cyan-400 select-none">Hoodie AI Assistant</CardTitle>
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
                      <div className="w-4 h-4 rounded-full overflow-hidden">
                        <Image 
                          src="/images/hoodie-bot.png" 
                          alt="Hoodie AI Bot" 
                          width={16} 
                          height={16} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex-1 rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30'
                        : 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 border border-cyan-500/30'
                    }`}
                  >
                    <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed font-medium">
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
            onSubmit={(e) => {
              e.preventDefault();
              if (hasReachedLimit) {
                return;
              }
              handleSubmit(e);
            }}
            className="p-4 border-t border-cyan-500/30 bg-slate-800/50"
          >
            {hasReachedLimit ? (
              <div className="p-3 rounded-lg bg-orange-900/30 border border-orange-500/30 mb-2">
                <p className="text-sm text-orange-400">
                  ⚠️ Message limit reached ({MESSAGE_LIMIT} messages per session). 
                  Refresh the page to reset.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask me anything about Web3, Solana, or coding..."
                    className="flex-1 bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-cyan-500/30 text-gray-100 placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 font-medium"
                    disabled={isLoading || hasReachedLimit}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim() || hasReachedLimit}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    💡 Ask me to explain code, debug errors, or learn Web3!
                  </p>
                  {messageCount > MESSAGE_LIMIT * 0.7 && (
                    <p className="text-xs text-orange-400">
                      {messagesRemaining} messages left
                    </p>
                  )}
                </div>
              </>
            )}
          </form>
        </CardContent>
      )}
    </Card>
  );
}

