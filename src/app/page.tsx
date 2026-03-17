'use client';

/**
 * وكيل المرجع الذكي - واجهة شاملة مصلحة
 * Professional AI Agent Interface with proper state management
 * يستخدم Zustand لإدارة الحالة المركزية
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import {
  Bot,
  PanelLeftClose,
  PanelLeft,
  Terminal as TerminalIcon,
  FolderOpen,
  Github,
  Plus,
  CheckCircle,
  Loader2,
  Download,
  Trash2,
  Settings,
  ListTodo,
  ChevronDown,
  Eye,
  Pause,
  Play,
  X,
  RotateCcw,
} from 'lucide-react';
import { ChatArea } from '@/components/agent/chat-area';
import { TodoPanel } from '@/components/agent/todo-panel';
import { TerminalPanel } from '@/components/agent/terminal-panel';
import { FloatingWindowsContainer, MinimizedWindowsBar } from '@/components/agent/floating-window';
import { SettingsPanel } from '@/components/agent/settings-panel';
import { useAgentStore } from '@/lib/agent-store';

export default function AgentInterface() {
  // Get all state from Zustand store
  const {
    theme,
    setTheme,
    sidebarOpen,
    setSidebarOpen,
    todoPanelOpen,
    setTodoPanelOpen,
    terminalOpen,
    toggleTerminal,
    tasks,
    files,
    isAgentThinking,
    conversations,
    currentConversationId,
    createConversation,
    selectConversation,
    floatingWindows,
    openFloatingWindow,
    closeFloatingWindow,
  } = useAgentStore();

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Task counts
  const taskCounts = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };

  // Download project
  const downloadProject = async () => {
    try {
      const response = await fetch('/api/agent/task?action=download');
      if (!response.ok) throw new Error('فشل التنزيل');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'almarjaa-project.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Clear sandbox
  const clearSandbox = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع الملفات؟')) return;
    
    try {
      await fetch('/api/agent/task', { method: 'DELETE' });
      // Clear local state will happen via store
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur-md shrink-0 z-50">
        <div className="flex items-center gap-3">
          {/* Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-primary/10 hover:text-primary"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-l from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                وكيل المرجع الذكي
              </h1>
              <p className="text-xs text-muted-foreground">نظام Agentic متكامل</p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs">
            v3.4.0
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* New Chat */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={createConversation}
          >
            <Plus className="h-4 w-4" />
            محادثة جديدة
          </Button>

          {/* Toggle Terminal */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={toggleTerminal}
          >
            <TerminalIcon className="h-4 w-4" />
            {terminalOpen ? 'إخفاء الطرفية' : 'الطرفية'}
          </Button>

          {/* Open File Manager */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={() => openFloatingWindow('file-manager', 'الملفات')}
          >
            <FolderOpen className="h-4 w-4" />
            الملفات
          </Button>

          {/* Open Preview */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={() => openFloatingWindow('preview', 'معاينة المشروع')}
          >
            <Eye className="h-4 w-4" />
            معاينة
          </Button>

          {/* Open GitHub */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={() => openFloatingWindow('github', 'GitHub')}
          >
            <Github className="h-4 w-4" />
            GitHub
          </Button>

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={downloadProject}
            disabled={files.length === 0}
          >
            <Download className="h-4 w-4" />
            تنزيل
          </Button>

          {/* Clear */}
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

        {/* Status */}
        <div className="flex items-center gap-4">
          {/* Task Status */}
          {taskCounts.total > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{taskCounts.completed}/{taskCounts.total} مهام</span>
              {taskCounts.inProgress > 0 && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                  {taskCounts.inProgress} قيد التنفيذ
                </Badge>
              )}
            </div>
          )}

          {/* Agent Status */}
          <div className="flex items-center gap-2">
            {isAgentThinking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                <span className="text-sm text-muted-foreground">يعمل...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                <span className="text-sm text-muted-foreground">جاهز</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* Todo Panel (Left) */}
          {todoPanelOpen && (
            <>
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <div className="h-full flex flex-col border-l border-border bg-muted/20">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ListTodo className="h-4 w-4 text-primary" />
                      المهام
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setTodoPanelOpen(false)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Tasks List */}
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                      {tasks.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          لا توجد مهام
                        </div>
                      ) : (
                        tasks.map(task => (
                          <TaskItem key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Files Preview */}
                  {files.length > 0 && (
                    <div className="border-t border-border p-2 shrink-0">
                      <span className="text-xs text-muted-foreground mb-2 block">الملفات ({files.length})</span>
                      <div className="space-y-1">
                        {files.slice(0, 3).map((file, idx) => (
                          <Badge key={`${file.path}-${idx}`} variant="outline" className="text-[10px] w-full justify-start truncate">
                            {file.path}
                          </Badge>
                        ))}
                        {files.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{files.length - 3} المزيد</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
            </>
          )}

          {/* Chat Area (Center) */}
          <ResizablePanel defaultSize={todoPanelOpen ? (sidebarOpen ? 64 : 82) : (sidebarOpen ? 78 : 100)}>
            <div className="h-full flex flex-col">
              {/* Chat */}
              <div className="flex-1 overflow-hidden">
                <ChatArea />
              </div>
              
              {/* Terminal */}
              {terminalOpen && (
                <div className="border-t border-border bg-background shrink-0 h-[200px]">
                  <TerminalPanel />
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Sidebar (Right) */}
          {sidebarOpen && (
            <>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
              <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
                <div className="h-full flex flex-col border-r border-border bg-muted/20">
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                    <span className="text-sm font-medium">المحادثات</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={createConversation}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Conversations List */}
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {conversations.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          لا توجد محادثات
                          <br />
                          <span className="text-xs">ابدأ محادثة جديدة</span>
                        </div>
                      ) : (
                        conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            className={cn(
                              "w-full text-right p-2 rounded-lg text-sm transition-colors",
                              currentConversationId === conv.id
                                ? "bg-primary/20 text-primary"
                                : "hover:bg-muted/50"
                            )}
                          >
                            {conv.title}
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Settings */}
                  <div className="border-t border-border p-2 shrink-0 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => openFloatingWindow('settings', 'الإعدادات')}
                    >
                      <Settings className="h-4 w-4" />
                      إعدادات AI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark' ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن'}
                    </Button>
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
          
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-background/95 backdrop-blur-sm text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={cn(
              "w-2 h-2 rounded-full shadow-lg",
              isAgentThinking ? "bg-yellow-500 animate-pulse shadow-yellow-500/50" : "bg-emerald-500 shadow-emerald-500/50"
            )} />
            {isAgentThinking ? "يعمل..." : "جاهز"}
          </span>
          <span>لغة المرجع v3.4.0</span>
          <span className="text-border">|</span>
          <span>{files.length} ملفات</span>
          <span className="text-border">|</span>
          <span>{tasks.length} مهام</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={() => setTodoPanelOpen(!todoPanelOpen)}
          >
            {todoPanelOpen ? 'إخفاء المهام' : 'إظهار المهام'}
          </Button>
          <span className="text-border">|</span>
          <span>© 2026 رضوان دالي حمدوني</span>
        </div>
      </footer>

      {/* Floating Windows */}
      <FloatingWindowsContainer />
      
      {/* Minimized Windows Bar */}
      <MinimizedWindowsBar />
    </div>
  );
}

// Task Item Component with controls
function TaskItem({ task }: { task: { id: string; content: string; status: string; progress: number } }) {
  const { updateTask, deleteTask } = useAgentStore();
  const [showControls, setShowControls] = useState(false);

  const statusConfig = {
    completed: { bg: 'bg-green-500/10', border: 'border-green-500/30', bar: 'bg-green-500' },
    in_progress: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', bar: 'bg-yellow-500' },
    failed: { bg: 'bg-red-500/10', border: 'border-red-500/30', bar: 'bg-red-500' },
    pending: { bg: 'bg-muted/30', border: 'border-border', bar: 'bg-muted-foreground' },
    paused: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', bar: 'bg-blue-500' },
  };

  const config = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div
      className={cn(
        "p-2 rounded-lg border text-xs transition-all relative",
        config.bg,
        config.border
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium truncate flex-1">{task.content.substring(0, 30)}...</span>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px]">{task.progress}%</Badge>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-300", config.bar)}
          style={{ width: `${task.progress}%` }}
        />
      </div>

      {/* Task Controls */}
      {showControls && task.status !== 'completed' && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-background/95 rounded p-0.5 border border-border">
          {task.status === 'in_progress' && (
            <>
              <button
                className="p-1 hover:bg-yellow-500/20 rounded text-yellow-400"
                onClick={() => updateTask(task.id, { status: 'paused' as any })}
                title="إيقاف مؤقت"
              >
                <Pause className="h-3 w-3" />
              </button>
              <button
                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                onClick={() => {
                  updateTask(task.id, { status: 'failed' as any, progress: 0 });
                }}
                title="إلغاء"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          )}
          {task.status === 'paused' && (
            <>
              <button
                className="p-1 hover:bg-green-500/20 rounded text-green-400"
                onClick={() => updateTask(task.id, { status: 'in_progress' as any })}
                title="مواصلة"
              >
                <Play className="h-3 w-3" />
              </button>
              <button
                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                onClick={() => {
                  updateTask(task.id, { status: 'failed' as any });
                }}
                title="إلغاء"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          )}
          {task.status === 'failed' && (
            <button
              className="p-1 hover:bg-blue-500/20 rounded text-blue-400"
              onClick={() => updateTask(task.id, { status: 'pending' as any, progress: 0 })}
              title="إعادة"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
          {task.status === 'pending' && (
            <button
              className="p-1 hover:bg-red-500/20 rounded text-red-400"
              onClick={() => deleteTask(task.id)}
              title="حذف"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
