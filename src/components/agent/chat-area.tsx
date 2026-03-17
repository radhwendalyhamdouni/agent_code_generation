'use client';

/**
 * منطقة المحادثة الرئيسية - مصلحة
 * Chat area with proper scrolling and real agent integration
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
  RefreshCw,
  CheckCircle,
  XCircle,
  Folder,
  Terminal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  steps?: ExecutionStep[];
}

interface ExecutionStep {
  id: string;
  type: 'think' | 'create' | 'execute' | 'fix' | 'success' | 'error' | 'info';
  title: string;
  content: string;
  code?: string;
  filePath?: string;
  output?: string;
  timestamp: Date;
}

interface Task {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  progress: number;
}

interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

// In-memory store for persistence
const memoryStore = {
  messages: [] as Message[],
  tasks: [] as Task[],
  files: [] as ProjectFile[],
  conversations: [] as { id: string; title: string; messages: Message[] }[],
  currentConversationId: null as string | null,
};

export function ChatArea() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(memoryStore.messages);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(memoryStore.tasks);
  const [files, setFiles] = useState<ProjectFile[]>(memoryStore.files);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load persisted data on mount
  useEffect(() => {
    const saved = localStorage.getItem('agent-memory');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.messages) {
          setMessages(data.messages);
          memoryStore.messages = data.messages;
        }
        if (data.tasks) {
          setTasks(data.tasks);
          memoryStore.tasks = data.tasks;
        }
        if (data.files) {
          setFiles(data.files);
          memoryStore.files = data.files;
        }
      } catch {}
    }
  }, []);

  // Save to localStorage
  const saveMemory = useCallback(() => {
    localStorage.setItem('agent-memory', JSON.stringify({
      messages: memoryStore.messages,
      tasks: memoryStore.tasks,
      files: memoryStore.files,
    }));
  }, []);

  // Add task
  const addTask = useCallback((content: string, priority: Task['priority'] = 'medium') => {
    const task: Task = {
      id: `task_${Date.now()}`,
      content,
      status: 'pending',
      priority,
      progress: 0,
    };
    setTasks(prev => {
      const updated = [...prev, task];
      memoryStore.tasks = updated;
      saveMemory();
      return updated;
    });
    return task.id;
  }, [saveMemory]);

  // Update task
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      memoryStore.tasks = updated;
      saveMemory();
      return updated;
    });
  }, [saveMemory]);

  // Add file
  const addFile = useCallback((path: string, content: string, language: string = 'almarjaa') => {
    setFiles(prev => {
      const existing = prev.findIndex(f => f.path === path);
      let updated: ProjectFile[];
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = { path, content, language };
      } else {
        updated = [...prev, { path, content, language }];
      }
      memoryStore.files = updated;
      saveMemory();
      return updated;
    });
  }, [saveMemory]);

  // Send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      memoryStore.messages = updated;
      saveMemory();
      return updated;
    });

    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    // Add initial task
    const taskId = addTask(`معالجة: ${currentInput.substring(0, 50)}...`, 'high');
    updateTask(taskId, { status: 'in_progress', progress: 10 });

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
      let assistantContent = '';

      // Add placeholder message
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        steps: [],
      };

      setMessages(prev => [...prev, assistantMessage]);

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
              updateTask(taskId, { progress: Math.min(90, steps.length * 15) });

              // Add files from create steps
              if (step.type === 'create' && step.code && step.filePath) {
                addFile(step.filePath, step.code);
              }

              // Update message
              setMessages(prev => prev.map(m => 
                m.id === assistantMessage.id 
                  ? { ...m, steps, content: formatStepsAsContent(steps) }
                  : m
              ));
            } else if (data.type === 'complete') {
              const result = data.result;
              if (result.success) {
                updateTask(taskId, { status: 'completed', progress: 100 });
                if (result.files) {
                  result.files.forEach((f: ProjectFile) => addFile(f.path, f.content, f.language));
                }
              } else {
                updateTask(taskId, { status: 'failed', progress: 100 });
              }

              setMessages(prev => prev.map(m => 
                m.id === assistantMessage.id 
                  ? { ...m, isStreaming: false, content: formatStepsAsContent(steps) }
                  : m
              ));
            } else if (data.type === 'error') {
              updateTask(taskId, { status: 'failed', progress: 100 });
              setMessages(prev => prev.map(m => 
                m.id === assistantMessage.id 
                  ? { ...m, isStreaming: false, content: `خطأ: ${data.error}` }
                  : m
              ));
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Save final state
      saveMemory();

    } catch (error: any) {
      console.error('Chat error:', error);
      updateTask(taskId, { status: 'failed', progress: 100 });
      
      const errorMessage: Message = {
        id: `msg_${Date.now() + 2}`,
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${error.message}\n\nسأحاول مساعدتك بطريقة أخرى. يمكنني:\n1. كتابة كود لغة المرجع\n2. إنشاء ملفات جديدة\n3. شرح الكود\n\nحاول مرة أخرى بصيغة مختلفة.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addTask, updateTask, addFile, saveMemory]);

  // Format steps as readable content
  const formatStepsAsContent = (steps: ExecutionStep[]): string => {
    if (steps.length === 0) return '';
    
    let content = '';
    const createSteps = steps.filter(s => s.type === 'create');
    const successSteps = steps.filter(s => s.type === 'success');
    const errorSteps = steps.filter(s => s.type === 'error');
    
    if (successSteps.length > 0) {
      content += '✅ **تم إنجاز المهمة بنجاح!**\n\n';
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
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <TypingIndicator />
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Tasks Preview */}
      {tasks.filter(t => t.status === 'in_progress').length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">المهام النشطة:</span>
            {tasks.filter(t => t.status === 'in_progress').map(task => (
              <Badge key={task.id} variant="outline" className="text-xs">
                {task.content.substring(0, 30)}...
                <span className="mr-2">{task.progress}%</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Files Preview */}
      {files.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
            <Folder className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">الملفات:</span>
            {files.slice(0, 5).map(file => (
              <Badge key={file.path} variant="secondary" className="text-xs">
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
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute left-2 bottom-2 h-9 w-9 p-0 bg-primary hover:bg-primary/90 rounded-lg"
            >
              {isLoading ? (
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
  message: Message; 
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
                  {message.steps.map((step) => (
                    <StepIndicator key={step.id} step={step} />
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
        }}
      >
        {code}
      </SyntaxHighlighter>

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
