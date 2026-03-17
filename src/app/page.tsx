'use client';

/**
 * وكيل المرجع الذكي - واجهة احترافية
 * Professional UI for Al-Marjaa AI Agent
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Bot, Code, Terminal, Send, Play, Copy, Check, Loader2, 
  FileCode, FolderOpen, Plus, Trash2, Edit, RefreshCw,
  ChevronDown, ChevronRight, File, Folder, Settings,
  MessageSquare, Sparkles, PanelLeftClose, PanelLeft,
  Square, X, Save, Download, Upload, Search, GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  language: string;
  code: string;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

// Main Component
export default function AlMarjaaAgentPage() {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('// اكتب كود لغة المرجع هنا\nاطبع("مرحباً بالعالم!")؛');
  const [output, setOutput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Load files from API
  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();

      // Extract code blocks
      const codeBlocks: CodeBlock[] = [];
      const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      while ((match = codeRegex.exec(data.content)) !== null) {
        codeBlocks.push({
          language: match[1] || 'almarjaa',
          code: match[2].trim()
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.error || 'حدث خطأ',
        timestamp: new Date(),
        codeBlocks
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there's code, update editor
      if (codeBlocks.length > 0) {
        setCode(codeBlocks[0].code);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'حدث خطأ في الاتصال بالخادم',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute code
  const executeCode = async () => {
    setIsLoading(true);
    setOutput('جاري التنفيذ...');

    try {
      const response = await fetch('/api/agent/execute?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      setOutput(data.output || data.error || 'تم التنفيذ');
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput('حدث خطأ في تنفيذ الكود');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute terminal command
  const executeTerminalCommand = async () => {
    if (!terminalInput.trim()) return;

    const command = terminalInput;
    setTerminalInput('');
    setTerminalHistory(prev => [...prev, `$ ${command}`]);

    try {
      const response = await fetch('/api/agent/execute?XTransformPort=3030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      const data = await response.json();
      setTerminalHistory(prev => [...prev, data.output || data.error || '']);
    } catch (error) {
      setTerminalHistory(prev => [...prev, 'حدث خطأ في تنفيذ الأمر']);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save file
  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          path: selectedFile,
          content: code
        })
      });
    } catch (error) {
      console.error('Error saving file:', error);
    }
  };

  // Create new file
  const createNewFile = async () => {
    const name = prompt('أدخل اسم الملف:');
    if (!name) return;

    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: name,
          content: '// ملف جديد\n'
        })
      });
      loadFiles();
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  // Render message content
  const renderMessageContent = (message: Message) => {
    const parts = message.content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const langMatch = part.match(/```(\w+)?\n?/);
        const language = langMatch?.[1] || 'almarjaa';
        const codeContent = part.replace(/```\w*\n?|```/g, '');

        return (
          <div key={index} className="relative my-2 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <Badge variant="outline" className="text-xs">{language}</Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(codeContent)}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => { setCode(codeContent); setActiveTab('code'); }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <pre className="p-3 text-sm text-green-400 font-mono overflow-x-auto" dir="ltr">
              {codeContent}
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-800"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                وكيل المرجع الذكي
              </h1>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
            v3.4.0
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-slate-100">
            <GitBranch className="h-4 w-4" />
            main
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-slate-800">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar - File Explorer */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                    <span className="text-sm font-medium text-slate-400">المستكشف</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={createNewFile}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadFiles}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* File List */}
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      <div className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-slate-100 cursor-pointer">
                        <ChevronDown className="h-4 w-4" />
                        <Folder className="h-4 w-4 text-amber-400" />
                        <span className="text-sm">sandbox</span>
                      </div>
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 mr-4 cursor-pointer rounded",
                            selectedFile === file.path ? "bg-slate-800" : "hover:bg-slate-800/50"
                          )}
                          onClick={() => {
                            setSelectedFile(file.path);
                            if (file.type === 'file') {
                              // Load file content
                              fetch(`/api/files?path=${file.path}`)
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) setCode(data.content);
                                });
                            }
                          }}
                        >
                          {file.type === 'directory' ? (
                            <Folder className="h-4 w-4 text-amber-400" />
                          ) : (
                            <FileCode className="h-4 w-4 text-emerald-400" />
                          )}
                          <span className="text-sm text-slate-300 truncate">{file.name}</span>
                        </div>
                      ))}
                      {files.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-4 mr-4">
                          لا توجد ملفات
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle className="w-px bg-slate-800" />
            </>
          )}

          {/* Main Panel */}
          <ResizablePanel defaultSize={sidebarOpen ? 82 : 100}>
            <ResizablePanelGroup direction="vertical">
              {/* Top Section - Chat & Code */}
              <ResizablePanel defaultSize={70} minSize={40}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-1 border-b border-slate-800 bg-slate-900/30">
                    <TabsList className="bg-transparent gap-1">
                      <TabsTrigger
                        value="chat"
                        className="gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-400"
                      >
                        <MessageSquare className="h-4 w-4" />
                        المحادثة
                      </TabsTrigger>
                      <TabsTrigger
                        value="code"
                        className="gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-400"
                      >
                        <Code className="h-4 w-4" />
                        الكود
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex gap-1">
                      {activeTab === 'code' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={saveFile} className="gap-1">
                            <Save className="h-4 w-4" />
                            حفظ
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={executeCode}
                            disabled={isLoading}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            تنفيذ
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chat Tab */}
                  <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                              <Sparkles className="h-10 w-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">مرحباً بك في وكيل المرجع!</h3>
                            <p className="text-slate-400 max-w-md mb-6">
                              أنا وكيل ذكي متخصص في لغة المرجع البرمجية العربية. يمكنني مساعدتك في كتابة وتصحيح وتشغيل الكود.
                            </p>
                            <div className="grid grid-cols-2 gap-3 max-w-lg">
                              {['كتابة كود جديد', 'تصحيح الأخطاء', 'شرح الكود', 'إنشاء مشروع'].map(item => (
                                <Button
                                  key={item}
                                  variant="outline"
                                  className="justify-start bg-slate-800/50 hover:bg-slate-800 border-slate-700"
                                  onClick={() => setInputMessage(`ساعدني في: ${item}`)}
                                >
                                  {item}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 max-w-4xl mx-auto">
                            {messages.map(message => (
                              <div
                                key={message.id}
                                className={cn(
                                  "flex",
                                  message.role === 'user' ? "justify-start" : "justify-end"
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-3",
                                    message.role === 'user'
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-800 text-slate-100 border border-slate-700"
                                  )}
                                >
                                  <div className="text-sm leading-relaxed">
                                    {renderMessageContent(message)}
                                  </div>
                                  <p className="text-xs opacity-50 mt-2">
                                    {message.timestamp.toLocaleTimeString('ar-SA')}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {isLoading && (
                              <div className="flex justify-end">
                                <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700">
                                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                                </div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>

                      {/* Input */}
                      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                        <div className="max-w-4xl mx-auto flex gap-2">
                          <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="اكتب رسالتك هنا... مثال: اكتب برنامج يحسب مضروب عدد"
                            className="min-h-[52px] max-h-32 bg-slate-800 border-slate-700 resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={isLoading || !inputMessage.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 h-auto px-4"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Code Tab */}
                  <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
                    <div className="h-full flex">
                      {/* Editor */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1 p-2">
                          <Textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="h-full font-mono text-sm bg-slate-950 border-slate-800 resize-none focus-visible:ring-emerald-500"
                            dir="rtl"
                            spellCheck={false}
                            placeholder="// اكتب كود لغة المرجع هنا"
                          />
                        </div>
                      </div>

                      {/* Output Panel */}
                      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/30">
                        <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-teal-400" />
                          <span className="text-sm font-medium">النتيجة</span>
                        </div>
                        <ScrollArea className="flex-1 p-3">
                          <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap" dir="ltr">
                            {output || 'اضغط "تنفيذ" لتشغيل الكود...'}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ResizablePanel>

              <ResizableHandle className="h-px bg-slate-800" />

              {/* Bottom Section - Terminal */}
              <ResizablePanel defaultSize={30} minSize={15}>
                <div className="h-full flex flex-col bg-slate-950">
                  <div className="flex items-center justify-between px-4 py-1 border-b border-slate-800 bg-slate-900/30">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">الطرفية</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Terminal Output */}
                  <ScrollArea className="flex-1 p-3" ref={terminalRef}>
                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap" dir="ltr">
                      <span className="text-emerald-400">╔══════════════════════════════════════════════════╗{'\n'}</span>
                      <span className="text-emerald-400">║     متحكم الطرفية - لغة المرجع                  ║{'\n'}</span>
                      <span className="text-emerald-400">║     البيئة: sandbox                             ║{'\n'}</span>
                      <span className="text-emerald-400">╚══════════════════════════════════════════════════╝{'\n'}</span>
                      {'\n'}
                      {terminalHistory.map((line, i) => (
                        <span key={i}>{line}{'\n'}</span>
                      ))}
                      <span className="text-emerald-400">$ </span>
                    </pre>
                  </ScrollArea>

                  {/* Terminal Input */}
                  <div className="p-2 border-t border-slate-800">
                    <div className="flex gap-2">
                      <Input
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            executeTerminalCommand();
                          }
                        }}
                        placeholder="أدخل الأمر..."
                        className="bg-slate-900 border-slate-800 font-mono text-sm"
                        dir="ltr"
                      />
                      <Button
                        onClick={executeTerminalCommand}
                        size="icon"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1 border-t border-slate-800 bg-slate-900/30 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            متصل
          </span>
          <span>لغة المرجع v3.4.0</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Z-AI SDK</span>
          <span>UTF-8</span>
          <span>© 2026 رضوان دالي حمدوني</span>
        </div>
      </footer>
    </div>
  );
}
