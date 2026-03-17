'use client';

/**
 * وكيل المرجع الذكي - نظام Agentic متكامل
 * Professional Agentic AI System for Al-Marjaa Language
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bot, Code, Terminal, Send, Play, Copy, Check, Loader2, 
  FileCode, Plus, RefreshCw, Download, Upload,
  ChevronDown, Folder, Settings as SettingsIcon,
  MessageSquare, Sparkles, PanelLeftClose, PanelLeft,
  X, Save, Trash2, FolderPlus,
  Zap, Cpu, CheckCircle, XCircle, AlertCircle,
  Wrench, FileText, Clock, Rocket, Loader
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ExecutionStep {
  id: string;
  type: 'think' | 'create' | 'execute' | 'fix' | 'success' | 'error' | 'info';
  title: string;
  content: string;
  code?: string;
  filePath?: string;
  output?: string;
  error?: string;
  timestamp: Date;
  duration?: number;
}

interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

// Step Icon Component
function StepIcon({ type }: { type: ExecutionStep['type'] }) {
  const iconClass = "h-5 w-5";
  switch (type) {
    case 'think':
      return <Cpu className={cn(iconClass, "text-purple-400")} />;
    case 'create':
      return <FileCode className={cn(iconClass, "text-blue-400")} />;
    case 'execute':
      return <Play className={cn(iconClass, "text-yellow-400")} />;
    case 'fix':
      return <Wrench className={cn(iconClass, "text-orange-400")} />;
    case 'success':
      return <CheckCircle className={cn(iconClass, "text-green-400")} />;
    case 'error':
      return <XCircle className={cn(iconClass, "text-red-400")} />;
    case 'info':
    default:
      return <AlertCircle className={cn(iconClass, "text-cyan-400")} />;
  }
}

// Step Card Component
function StepCard({ step }: { step: ExecutionStep }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = step.code || step.output || step.error;

  return (
    <div className={cn(
      "rounded-lg border transition-all duration-300",
      step.type === 'success' && "border-green-500/30 bg-green-500/5",
      step.type === 'error' && "border-red-500/30 bg-red-500/5",
      step.type === 'think' && "border-purple-500/30 bg-purple-500/5",
      step.type === 'create' && "border-blue-500/30 bg-blue-500/5",
      step.type === 'execute' && "border-yellow-500/30 bg-yellow-500/5",
      step.type === 'fix' && "border-orange-500/30 bg-orange-500/5",
      !['success', 'error', 'think', 'create', 'execute', 'fix'].includes(step.type) && "border-slate-500/30 bg-slate-500/5"
    )}>
      <div 
        className={cn("flex items-start gap-3 p-3", hasDetails && "cursor-pointer")}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="mt-0.5 shrink-0">
          <StepIcon type={step.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-100">{step.title}</span>
            {step.filePath && (
              <Badge variant="outline" className="text-xs bg-slate-800 border-slate-600">
                {step.filePath}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 whitespace-pre-wrap">{step.content}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">
              {step.timestamp.toLocaleTimeString('ar-SA')}
            </span>
            {step.duration && (
              <span className="text-[10px] text-slate-500">
                ({step.duration}ms)
              </span>
            )}
          </div>
        </div>
        {hasDetails && (
          <ChevronDown className={cn(
            "h-4 w-4 text-slate-500 transition-transform",
            expanded && "rotate-180"
          )} />
        )}
      </div>
      
      {expanded && hasDetails && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          {step.code && (
            <div className="rounded-md bg-slate-900/80 border border-slate-700/50 overflow-hidden">
              <div className="px-2 py-1 text-xs text-slate-400 bg-slate-800/50 border-b border-slate-700/50">
                الكود
              </div>
              <pre className="p-2 text-xs font-mono text-emerald-300 overflow-x-auto" dir="ltr">
                {step.code}
              </pre>
            </div>
          )}
          {step.output && (
            <div className="rounded-md bg-slate-900/80 border border-slate-700/50 overflow-hidden">
              <div className="px-2 py-1 text-xs text-slate-400 bg-slate-800/50 border-b border-slate-700/50">
                المخرجات
              </div>
              <pre className="p-2 text-xs font-mono text-cyan-300 whitespace-pre-wrap" dir="ltr">
                {step.output}
              </pre>
            </div>
          )}
          {step.error && (
            <div className="rounded-md bg-red-950/30 border border-red-500/30 overflow-hidden">
              <div className="px-2 py-1 text-xs text-red-400 bg-red-900/20 border-b border-red-500/30">
                الخطأ
              </div>
              <pre className="p-2 text-xs font-mono text-red-300 whitespace-pre-wrap" dir="ltr">
                {step.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Component
export default function AlMarjaaAgentPage() {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('agent');
  const [taskDescription, setTaskDescription] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [iterations, setIterations] = useState(0);
  const [maxIterations] = useState(10);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const stepsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new step
  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Load files from sandbox
  const loadFiles = async () => {
    try {
      const response = await fetch('/api/agent/task?action=list');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          setFiles(data.files);
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Execute agentic task with streaming
  const executeTask = useCallback(async () => {
    if (!taskDescription.trim() || isExecuting) return;

    setIsExecuting(true);
    setSteps([]);
    setSuccess(null);
    setIterations(0);

    try {
      const response = await fetch('/api/agent/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: taskDescription,
          maxIterations,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

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
              setSteps(prev => [...prev, {
                ...data.step,
                timestamp: new Date(data.step.timestamp)
              }]);
            } else if (data.type === 'complete') {
              setSuccess(data.result.success);
              setIterations(data.result.iterations);
              if (data.result.files) {
                setFiles(data.result.files);
              }
            } else if (data.type === 'error') {
              setSuccess(false);
              setSteps(prev => [...prev, {
                id: `error_${Date.now()}`,
                type: 'error',
                title: '❌ خطأ في النظام',
                content: data.error,
                timestamp: new Date()
              }]);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Reload files
      await loadFiles();

    } catch (error: any) {
      console.error('Task execution error:', error);
      setSuccess(false);
      setSteps(prev => [...prev, {
        id: `error_${Date.now()}`,
        type: 'error',
        title: '❌ خطأ في الاتصال',
        content: error.message,
        timestamp: new Date()
      }]);
    } finally {
      setIsExecuting(false);
    }
  }, [taskDescription, isExecuting, maxIterations]);

  // Download project as ZIP
  const downloadProject = async () => {
    try {
      const response = await fetch('/api/agent/task?action=download&project=almarjaa-project');
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'almarjaa-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('حدث خطأ في التنزيل');
    }
  };

  // Clear sandbox
  const clearSandbox = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع الملفات؟')) return;
    
    try {
      await fetch('/api/agent/task', { method: 'DELETE' });
      setFiles([]);
      setSelectedFile(null);
      setSteps([]);
      setSuccess(null);
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get selected file content
  const selectedFileContent = files.find(f => f.path === selectedFile)?.content || '';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-800/80 rounded-lg"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                وكيل المرجع الذكي
              </h1>
              <p className="text-xs text-slate-400">نظام Agentic متكامل</p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs bg-emerald-500/10">
            v3.4.0
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
            onClick={downloadProject}
            disabled={files.length === 0}
          >
            <Download className="h-4 w-4" />
            تنزيل ZIP
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={clearSandbox}
          >
            <Trash2 className="h-4 w-4" />
            مسح
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex" dir="rtl">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* Sidebar - File Explorer */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-slate-900/50">
                <div className="h-full flex flex-col border-l border-slate-800/50">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/50 shrink-0 bg-slate-800/30">
                    <span className="text-sm font-medium text-slate-300">الملفات</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 hover:bg-emerald-600/20 hover:text-emerald-400" 
                      onClick={loadFiles}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File List */}
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-slate-300">
                        <Folder className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium">sandbox</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {files.length}
                        </Badge>
                      </div>
                      <div className="mr-4 mt-1">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className={cn(
                              "group flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-md transition-all",
                              selectedFile === file.path 
                                ? "bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500" 
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                            onClick={() => {
                              setSelectedFile(file.path);
                              setActiveTab('code');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-emerald-400" />
                              <span className="text-sm truncate">{file.path}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(file.content);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {files.length === 0 && (
                          <div className="text-center text-slate-600 text-sm py-8">
                            <Folder className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            لا توجد ملفات
                            <br />
                            <span className="text-xs">أنشئ مشروعاً جديداً</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-slate-800/50 hover:bg-emerald-500/50 transition-colors cursor-col-resize" />
            </>
          )}

          {/* Main Panel */}
          <ResizablePanel defaultSize={sidebarOpen ? 80 : 100}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800/50 bg-slate-800/20 shrink-0">
                <TabsList className="bg-transparent gap-2">
                  <TabsTrigger
                    value="agent"
                    className="gap-2 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 rounded-lg"
                  >
                    <Rocket className="h-4 w-4" />
                    الوكيل
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="gap-2 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 rounded-lg"
                  >
                    <Code className="h-4 w-4" />
                    الكود
                  </TabsTrigger>
                </TabsList>
                
                {/* Progress indicator */}
                {isExecuting && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    <span className="text-sm text-slate-400">
                      المحاولة {iterations}/{maxIterations}
                    </span>
                    <Progress value={(iterations / maxIterations) * 100} className="w-24 h-1.5" />
                  </div>
                )}
                
                {success === true && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    تم بنجاح
                  </Badge>
                )}
                {success === false && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <XCircle className="h-3 w-3 ml-1" />
                    فشل
                  </Badge>
                )}
              </div>

              {/* Agent Tab */}
              <TabsContent value="agent" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                <div className="h-full flex flex-col">
                  {/* Steps */}
                  <ScrollArea className="flex-1 p-4">
                    {steps.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/10 border border-emerald-500/10">
                          <Sparkles className="h-14 w-14 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-l from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                          مرحباً بك في الوكيل الذكي!
                        </h3>
                        <p className="text-slate-400 max-w-lg mb-8 leading-relaxed">
                          اكتب وصف المشروع وسيقوم الوكيل بإنشاء الملفات وتنفيذها وإصلاح الأخطاء تلقائياً حتى ينجح.
                        </p>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                          {[
                            'برنامج حاسبة',
                            'لعبة تخمين الأرقام',
                            'نظام إدارة مهام',
                            'تطبيق قائمة مهام'
                          ].map(example => (
                            <Button
                              key={example}
                              variant="outline"
                              className="justify-start gap-2 bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/50 h-12"
                              onClick={() => setTaskDescription(`أنشئ ${example}`)}
                            >
                              <Zap className="h-4 w-4 text-emerald-400" />
                              {example}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-w-3xl mx-auto">
                        {steps.map(step => (
                          <StepCard key={step.id} step={step} />
                        ))}
                        <div ref={stepsEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-800/50 bg-slate-800/20 shrink-0">
                    <div className="max-w-3xl mx-auto flex gap-3">
                      <Textarea
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="اكتب وصف المشروع... مثال: أنشئ برنامج حاسبة تقوم بالجمع والطرح والضرب والقسمة"
                        className="min-h-[56px] max-h-32 bg-slate-800/50 border-slate-700/50 resize-none text-right placeholder:text-slate-500 focus-visible:ring-emerald-500/50"
                        dir="rtl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            executeTask();
                          }
                        }}
                        disabled={isExecuting}
                      />
                      <Button
                        onClick={executeTask}
                        disabled={isExecuting || !taskDescription.trim()}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-auto px-5 shrink-0 shadow-lg shadow-emerald-500/20"
                      >
                        {isExecuting ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Rocket className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Code Tab */}
              <TabsContent value="code" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
                <div className="h-full flex flex-col">
                  {selectedFile ? (
                    <>
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/50 bg-slate-800/20 shrink-0">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium">{selectedFile}</span>
                          <Badge variant="outline" className="text-xs">
                            {files.find(f => f.path === selectedFile)?.language}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(selectedFileContent)}
                            className="gap-2"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            نسخ
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="flex-1">
                        <pre className="p-4 text-sm font-mono text-emerald-300 whitespace-pre" dir="ltr">
                          {selectedFileContent}
                        </pre>
                      </ScrollArea>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-slate-500">
                      <div>
                        <FileCode className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p>اختر ملفاً من القائمة الجانبية</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-slate-800/50 bg-slate-900/80 text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={cn(
              "w-2 h-2 rounded-full shadow-lg",
              isExecuting ? "bg-yellow-500 animate-pulse shadow-yellow-500/50" : "bg-emerald-500 shadow-emerald-500/50"
            )} />
            {isExecuting ? "يعمل..." : "جاهز"}
          </span>
          <span>لغة المرجع v3.4.0</span>
          <span className="text-slate-600">|</span>
          <span>{files.length} ملفات</span>
          {iterations > 0 && (
            <>
              <span className="text-slate-600">|</span>
              <span>{iterations} محاولات</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>© 2026 رضوان دالي حمدوني</span>
        </div>
      </footer>
    </div>
  );
}
