'use client';

/**
 * وكيل المرجع الذكي - واجهة شاملة
 * Comprehensive AI Agent Interface similar to Z.AI Agent
 * 
 * Features:
 * - Sidebar with conversation history
 * - Chat area with markdown support
 * - Todo panel for task management
 * - Terminal panel
 * - File manager
 * - GitHub integration
 * - Floating windows
 * 
 * © 2026 رضوان دالي حمدوني - All Rights Reserved
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import {
  Bot,
  Zap,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Terminal as TerminalIcon,
  FolderOpen,
  Github,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useAgentStore } from '@/lib/agent-store';
import { AgentSidebar } from '@/components/agent/agent-sidebar';
import { ChatArea } from '@/components/agent/chat-area';
import { TodoPanel } from '@/components/agent/todo-panel';
import { TerminalPanel } from '@/components/agent/terminal-panel';
import { FloatingWindowsContainer, MinimizedWindowsBar } from '@/components/agent/floating-window';

export default function AgentInterface() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const {
    theme,
    toggleTheme,
    sidebarOpen,
    todoPanelOpen,
    toggleSidebar,
    toggleTodoPanel,
    terminalOpen,
    openFloatingWindow,
    isAgentThinking,
    tasks,
    createConversation,
  } = useAgentStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Task counts
  const taskCounts = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          {/* Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-primary/10 hover:text-primary"
          >
            {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">وكيل المرجع الذكي</h1>
              <p className="text-xs text-muted-foreground">نظام Agentic متكامل</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-xs">
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

          {/* Open Terminal */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10 hover:text-primary"
            onClick={() => openFloatingWindow('terminal', 'الطرفية')}
          >
            <TerminalIcon className="h-4 w-4" />
            الطرفية
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
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">يعمل...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-primary pulse-glow" />
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
                <TodoPanel />
              </ResizablePanel>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
            </>
          )}

          {/* Chat Area (Center) */}
          <ResizablePanel defaultSize={todoPanelOpen ? (sidebarOpen ? 58 : 76) : (sidebarOpen ? 72 : 100)}>
            <div className="h-full flex flex-col">
              {/* Chat */}
              <div className="flex-1 overflow-hidden">
                <ChatArea />
              </div>
              
              {/* Terminal */}
              <TerminalPanel />
            </div>
          </ResizablePanel>

          {/* Sidebar (Right) */}
          {sidebarOpen && (
            <>
              <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
              <ResizablePanel defaultSize={22} minSize={18} maxSize={30}>
                <AgentSidebar 
                  collapsed={sidebarCollapsed} 
                  onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
                />
              </ResizablePanel>
            </>
          )}
          
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-background/80 backdrop-blur-sm text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={cn(
              "w-2 h-2 rounded-full shadow-lg",
              isAgentThinking ? "bg-yellow-500 animate-pulse shadow-yellow-500/50" : "bg-primary shadow-primary/50"
            )} />
            {isAgentThinking ? "يعمل..." : "جاهز"}
          </span>
          <span>لغة المرجع v3.4.0</span>
          <span className="text-border">|</span>
          <span>{tasks.length} مهام</span>
          {taskCounts.inProgress > 0 && (
            <>
              <span className="text-border">|</span>
              <span className="text-yellow-400">{taskCounts.inProgress} قيد التنفيذ</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={toggleTodoPanel}
          >
            {todoPanelOpen ? 'إخفاء المهام' : 'إظهار المهام'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={toggleSidebar}
          >
            {sidebarOpen ? 'إخفاء الشريط' : 'إظهار الشريط'}
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
