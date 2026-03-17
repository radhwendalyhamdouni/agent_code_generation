'use client';

/**
 * منطقة المحادثة الرئيسية - مصلحة
 * Chat area with proper scrolling and real agent integration
 * يستخدم Zustand لإدارة الحالة المركزية
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle,
  XCircle,
  Folder,
  Terminal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAgentStore, ExecutionStep } from '@/lib/agent-store';

export function ChatArea() {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get state from Zustand store
  const {
    messages,
    addMessage,
    updateMessage,
    tasks,
    addTask,
    updateTask,
    files,
    addFile,
    setIsAgentThinking,
    isAgentThinking,
  } = useAgentStore();

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isAgentThinking) return;

    const userMessage = addMessage({
      role: 'user',
      content: input.trim(),
    });

    const currentInput = input.trim();
    setInput('');
    setIsAgentThinking(true);

    // Add initial task
    const task = addTask({
      content: `معالجة: ${currentInput.substring(0, 50)}${currentInput.length > 50 ? '...' : ''}`,
      status: 'in_progress',
      priority: 'high',
      progress: 5,
    });

    // Add placeholder assistant message
    const assistantMessage = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
      steps: [],
    });

    try {
      // Call the agentic task API
      const response = await fetch('/api/agent/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: currentInput,
          maxIterations: 5,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      const steps: ExecutionStep[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.type === 'step') {
              const step: ExecutionStep = {
                ...data.step,
                timestamp: new Date(data.step.timestamp),
              };
              steps.push(step);

              // Update progress
              updateTask(task.id, { progress: Math.min(90, 10 + steps.length * 15) });

              // Add files from create steps
              if (step.type === 'create' && step.code && step.filePath) {
                const newFile = {
                  name: step.filePath.split('/').pop() || step.filePath,
                  path: step.filePath,
                  type: 'file' as const,
                  content: step.code,
                  language: 'almarjaa',
                };
                addFile(newFile);
                
                // حفظ الملف على السيرفر فعلياً
                fetch('/api/files', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'create',
                    path: step.filePath,
                    name: newFile.name,
                    content: step.code,
                  }),
                }).catch(console.error);
              }

              // Update message with steps
              updateMessage(assistantMessage.id, {
                steps: [...steps],
                content: formatStepsAsContent(steps),
              });
            } else if (data.type === 'complete') {
              const result = data.result;
              if (result.success) {
                updateTask(task.id, { status: 'completed', progress: 100 });
                if (result.files) {
                  result.files.forEach((f: { path: string; content: string; language: string }) => {
                    const newFile = {
                      name: f.path.split('/').pop() || f.path,
                      path: f.path,
                      type: 'file' as const,
                      content: f.content,
                      language: f.language || 'almarjaa',
                    };
                    addFile(newFile);
                    
                    // حفظ الملف على السيرفر فعلياً
                    fetch('/api/files', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'create',
                        path: f.path,
                        name: newFile.name,
                        content: f.content,
                      }),
                    }).catch(console.error);
                  });
                }
              } else {
                updateTask(task.id, { status: 'failed', progress: 100 });
              }

              updateMessage(assistantMessage.id, {
                isStreaming: false,
                content: formatStepsAsContent(steps),
              });
            } else if (data.type === 'error') {
              updateTask(task.id, { status: 'failed', progress: 100 });
              updateMessage(assistantMessage.id, {
                isStreaming: false,
                content: `❌ **خطأ:** ${data.error}\n\nيمكنني مساعدتك في:\n1. كتابة كود لغة المرجع\n2. إنشاء ملفات جديدة\n3. شرح الكود\n\nحاول مرة أخرى بصيغة مختلفة.`,
              });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      updateTask(task.id, { status: 'failed', progress: 100 });
      
      updateMessage(assistantMessage.id, {
        isStreaming: false,
        content: `❌ **حدث خطأ:** ${error.message}\n\nسأحاول مساعدتك بطريقة أخرى. يمكنني:\n1. كتابة كود لغة المرجع\n2. إنشاء ملفات جديدة\n3. شرح الكود\n\nحاول مرة أخرى بصيغة مختلفة.`,
      });
    } finally {
      setIsAgentThinking(false);
    }
  }, [input, isAgentThinking, addMessage, addTask, updateTask, addFile, updateMessage, setIsAgentThinking]);

  // Format steps as readable content
  const formatStepsAsContent = (steps: ExecutionStep[]): string => {
    if (steps.length === 0) return '';
    
    let content = '';
    const createSteps = steps.filter(s => s.type === 'create');
    const successSteps = steps.filter(s => s.type === 'success');
    const errorSteps = steps.filter(s => s.type === 'error');
    const thinkSteps = steps.filter(s => s.type === 'think');
    
    if (successSteps.length > 0) {
      content += '✅ **تم إنجاز المهمة بنجاح!**\n\n';
    }
    
    if (thinkSteps.length > 0) {
      content += '### 🧠 التحليل:\n';
      thinkSteps.forEach(s => {
        content += `- ${s.content}\n`;
      });
      content += '\n';
    }
    
    if (createSteps.length > 0) {
      content += '### 📁 الملفات المُنشأة:\n';
      createSteps.forEach(s => {
        if (s.filePath) {
          content += `- \`${s.filePath}\`\n`;
        }
      });
      content += '\n';
    }
    
    if (errorSteps.length > 0 && successSteps.length === 0) {
      content += '### ⚠️ ملاحظات:\n';
      errorSteps.forEach(s => {
        content += `- ${s.content}\n`;
      });
    }
    
    return content;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Execute code
  const executeCode = async (code: string, language: string) => {
    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Active tasks
  const activeTasks = tasks.filter(t => t.status === 'in_progress');
  const recentFiles = files.slice(-5);

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* Messages Area - Fixed scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto p-4">
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={setInput} />
          ) : (
            <div className="space-y-6 pb-4">
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
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Tasks Preview */}
      {activeTasks.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <span className="text-sm shrink-0">المهام النشطة:</span>
            {activeTasks.map(task => (
              <Badge key={task.id} variant="outline" className="text-xs gap-1">
                {task.content.substring(0, 25)}...
                <span className="text-primary">{task.progress}%</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Files Preview */}
      {recentFiles.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 py-2 shrink-0">
          <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
            <Folder className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground shrink-0">الملفات:</span>
            {recentFiles.map((file, idx) => (
              <Badge key={`${file.path}-${idx}`} variant="secondary" className="text-xs">
                {file.path}
              </Badge>
            ))}
            {files.length > 5 && (
              <Badge variant="outline" className="text-xs">+{files.length - 5}</Badge>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب وصف المشروع... مثال: أنشئ برنامج حاسبة بلغة المرجع"
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
            الوكيل ينشئ الملفات، ينفذها، ويصلح الأخطاء تلقائياً
          </p>
        </div>
      </div>
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const suggestions = [
    { icon: Code, text: 'أنشئ برنامج حاسبة بلغة المرجع', desc: 'جمع، طرح، ضرب، قسمة' },
    { icon: FileCode, text: 'أنشئ لعبة تخمين الأرقام', desc: 'لعبة تفاعلية' },
    { icon: Sparkles, text: 'أنشئ نظام إدارة مهام', desc: 'إضافة وعرض المهام' },
    { icon: Terminal, text: 'أنشئ برنامج ترتيب قائمة', desc: 'خوارزمية ترتيب' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center mb-6 shadow-2xl shadow-primary/10 border border-primary/10">
        <Bot className="h-12 w-12 text-primary" />
      </div>
      
      <h1 className="text-3xl font-bold mb-3">
        <span className="bg-gradient-to-l from-primary to-emerald-400 bg-clip-text text-transparent">
          وكيل المرجع الذكي
        </span>
      </h1>
      <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed">
        وكيل ذكي ينشئ الملفات، ينفذها بلغة المرجع الحقيقية، ويصلح الأخطاء تلقائياً.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.text)}
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
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  copiedId, 
  onCopy, 
  onExecute 
}: { 
  message: { 
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    steps?: ExecutionStep[];
  }; 
  copiedId: string | null; 
  onCopy: (text: string, id: string) => void;
  onExecute: (code: string, language: string) => Promise<any>;
}) {
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
      <div className={cn("max-w-[85%] space-y-2", isUser && "text-left")}>
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser ? "bg-blue-500/10 rounded-tr-sm" : "bg-muted/50 rounded-tr-sm"
        )}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
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
              
              {/* Show execution steps */}
              {message.steps && message.steps.length > 0 && (
                <div className="mt-4 space-y-2">
                  {message.steps.map((step, idx) => (
                    <StepIndicator key={`${step.id}-${idx}`} step={step} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary animate-pulse mr-1" />
          )}
        </div>

        {/* Timestamp */}
        <p className={cn("text-[10px] text-muted-foreground", isUser ? "text-left" : "text-right")}>
          {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ step }: { step: ExecutionStep }) {
  const icons = {
    think: '🧠',
    create: '📄',
    execute: '⚡',
    fix: '🔧',
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className={cn(
      "flex items-start gap-2 p-2 rounded-lg text-xs",
      step.type === 'success' && "bg-green-500/10",
      step.type === 'error' && "bg-red-500/10",
      step.type === 'create' && "bg-blue-500/10",
    )}>
      <span>{icons[step.type]}</span>
      <div>
        <p className="font-medium">{step.title}</p>
        <p className="text-muted-foreground">{step.content}</p>
        {step.filePath && (
          <Badge variant="outline" className="text-[10px] mt-1">{step.filePath}</Badge>
        )}
      </div>
    </div>
  );
}

// Code Block Component
function CodeBlockComponent({
  code,
  language,
  id,
  copiedId,
  onCopy,
  onExecute,
}: {
  code: string;
  language: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onExecute: (code: string, language: string) => Promise<any>;
}) {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; output?: string; error?: string } | null>(null);

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    try {
      const res = await onExecute(code, language);
      setResult(res);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setExecuting(false);
    }
  };

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
            onClick={handleExecute}
            disabled={executing}
          >
            {executing ? (
              <Loader2 className="h-3 w-3 ml-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 ml-1" />
            )}
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
      <div dir="rtl" className="overflow-x-auto">
        <SyntaxHighlighter
          language={language === 'almarjaa' ? 'javascript' : language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            background: 'transparent',
            maxHeight: '400px',
            overflow: 'auto',
            direction: 'rtl',
            textAlign: 'right',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Execution Result */}
      {result && (
        <div className={cn(
          "border-t border-border p-3 text-xs font-mono",
          result.success ? "bg-green-500/5" : "bg-red-500/5"
        )}>
          {result.success ? (
            <pre className="text-green-400 whitespace-pre-wrap">{result.output}</pre>
          ) : (
            <pre className="text-red-400 whitespace-pre-wrap">{result.error}</pre>
          )}
        </div>
      )}
    </div>
  );
}
