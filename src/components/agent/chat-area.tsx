'use client';

/**
 * منطقة المحادثة الرئيسية
 * Chat area with message display, markdown support, and code blocks
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Send,
  Copy,
  Check,
  Play,
  Bot,
  User,
  Sparkles,
  Loader2,
  Code,
  FileCode,
  RefreshCw,
} from 'lucide-react';
import { useAgentStore, Message, CodeBlock } from '@/lib/agent-store';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ChatArea() {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    conversations,
    currentConversationId,
    addMessage,
    updateMessage,
    isAgentThinking,
    setIsAgentThinking,
    createConversation,
    terminalOpen,
    setTerminalOpen,
    addTerminalLine,
  } = useAgentStore();

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isAgentThinking) return;

    // Create conversation if none exists
    if (!currentConversationId) {
      createConversation();
    }

    // Add user message
    addMessage({
      role: 'user',
      content: input.trim(),
    });

    setInput('');
    setIsAgentThinking(true);

    try {
      // Call the agent API
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullContent = '';
      let messageId = '';

      // Add initial assistant message
      addMessage({
        role: 'assistant',
        content: '',
        isStreaming: true,
      });

      // Get the current conversation to find the message we just added
      const currentConv = useAgentStore.getState().conversations.find(
        (c) => c.id === useAgentStore.getState().currentConversationId
      );
      const lastMessage = currentConv?.messages[currentConv.messages.length - 1];
      messageId = lastMessage?.id || '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Update the message with new content
        updateMessage(messageId, { content: fullContent });
      }

      // Mark streaming as complete
      updateMessage(messageId, { isStreaming: false });

    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsAgentThinking(false);
    }
  }, [input, isAgentThinking, currentConversationId, addMessage, updateMessage, setIsAgentThinking, createConversation]);

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Execute code
  const executeCode = async (code: string, language: string) => {
    setTerminalOpen(true);
    addTerminalLine({
      type: 'input',
      content: `Executing ${language} code...`,
    });

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const result = await response.json();

      if (result.success) {
        addTerminalLine({
          type: 'output',
          content: result.output || 'تم التنفيذ بنجاح',
        });
      } else {
        addTerminalLine({
          type: 'error',
          content: result.error || 'حدث خطأ في التنفيذ',
        });
      }
    } catch (error: any) {
      addTerminalLine({
        type: 'error',
        content: error.message || 'خطأ في الاتصال',
      });
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                  onExecute={executeCode}
                />
              ))}
              {isAgentThinking && messages[messages.length - 1]?.role !== 'assistant' && (
                <TypingIndicator />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
              className="min-h-[52px] max-h-[200px] resize-none bg-muted/50 border-border focus-visible:ring-primary/50 pr-4 pl-12"
              disabled={isAgentThinking}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isAgentThinking}
              className="absolute left-2 bottom-2 h-9 w-9 p-0 bg-primary hover:bg-primary/90 rounded-lg"
            >
              {isAgentThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            يمكن للوكيل تنفيذ الأوامر وإنشاء الملفات وتصحيح الأخطاء تلقائياً
          </p>
        </div>
      </div>
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen() {
  const { createConversation } = useAgentStore();
  
  const suggestions = [
    { icon: Code, text: 'اكتب برنامج حاسبة', desc: 'برنامج جمع وطرح وضرب وقسمة' },
    { icon: FileCode, text: 'أنشئ تطبيق ويب', desc: 'تطبيق React مع Tailwind' },
    { icon: Sparkles, text: 'حلل كود معين', desc: 'تحليل وتحسين الكود' },
    { icon: RefreshCw, text: 'أصلح الأخطاء', desc: 'تصحيح وتحسين الكود' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center mb-6 shadow-2xl shadow-primary/10 border border-primary/10">
        <Bot className="h-12 w-12 text-primary" />
      </div>
      
      <h1 className="text-3xl font-bold mb-3">
        <span className="gradient-text">وكيل المرجع الذكي</span>
      </h1>
      <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
        مساعد ذكي متكامل للبرمجة والتطوير. يمكنه كتابة الكود، تنفيذه، وتصحيح الأخطاء تلقائياً.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              createConversation();
              // Auto-focus input would happen naturally
            }}
            className="flex flex-col items-start p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 transition-all text-right group"
          >
            <suggestion.icon className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm">{suggestion.text}</span>
            <span className="text-xs text-muted-foreground">{suggestion.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="bg-muted/50 rounded-2xl rounded-tr-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary typing-dot" />
          <span className="w-2 h-2 rounded-full bg-primary typing-dot" />
          <span className="w-2 h-2 rounded-full bg-primary typing-dot" />
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onExecute: (code: string, language: string) => void;
}

function MessageBubble({ message, copiedId, onCopy, onExecute }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        isUser ? "bg-blue-500/20" : "bg-primary/20"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-blue-400" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "max-w-[85%] space-y-2",
        isUser && "text-left"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser 
            ? "bg-blue-500/10 rounded-tr-sm" 
            : "bg-muted/50 rounded-tr-sm"
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : 'text';
                    const codeString = String(children).replace(/\n$/, '');
                    const isInline = !match;

                    if (isInline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlockComponent
                        code={codeString}
                        language={language}
                        id={`${message.id}-${codeString.slice(0, 10)}`}
                        copiedId={copiedId}
                        onCopy={onCopy}
                        onExecute={onExecute}
                      />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse mr-1" />
          )}
        </div>

        {/* Timestamp */}
        <p className={cn(
          "text-[10px] text-muted-foreground",
          isUser ? "text-left" : "text-right"
        )}>
          {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

// Code Block Component
interface CodeBlockComponentProps {
  code: string;
  language: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onExecute: (code: string, language: string) => void;
}

function CodeBlockComponent({
  code,
  language,
  id,
  copiedId,
  onCopy,
  onExecute,
}: CodeBlockComponentProps) {
  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={() => onExecute(code, language)}
          >
            <Play className="h-3 w-3 ml-1" />
            تنفيذ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
            onClick={() => onCopy(code, id)}
          >
            {copiedId === id ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          background: 'transparent',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'Geist Mono, monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
