'use client';

/**
 * الشريط الجانبي للوكيل الذكي
 * Sidebar component with conversation history, settings, and theme toggle
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  Moon,
  Sun,
  Search,
  Zap,
  Clock,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore, Conversation } from '@/lib/agent-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function AgentSidebar({ collapsed, onToggle }: AgentSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    theme,
    toggleTheme,
    conversations,
    currentConversationId,
    createConversation,
    deleteConversation,
    selectConversation,
    sidebarOpen,
  } = useAgentStore();

  const filteredConversations = conversations.filter(
    (c) => c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'اليوم';
    if (days === 1) return 'أمس';
    if (days < 7) return `منذ ${days} أيام`;
    return new Date(date).toLocaleDateString('ar-SA');
  };

  if (collapsed) {
    return (
      <div className="w-14 h-full flex flex-col items-center py-4 gap-4 bg-background/50 border-l border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        
        <Separator className="w-8" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={createConversation}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center gap-2 py-2">
            {conversations.slice(0, 5).map((conv) => (
              <Button
                key={conv.id}
                variant="ghost"
                size="icon"
                onClick={() => selectConversation(conv.id)}
                className={cn(
                  "w-10 h-10 rounded-lg",
                  currentConversationId === conv.id && "bg-primary/20 text-primary"
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        <Separator className="w-8" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hover:bg-primary/10 hover:text-primary"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 h-full flex flex-col bg-background/50 border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">المحادثات</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={createConversation}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            className="pr-9 bg-muted/50 border-0 focus-visible:ring-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد محادثات</p>
              <Button
                variant="link"
                size="sm"
                onClick={createConversation}
                className="text-primary mt-2"
              >
                ابدأ محادثة جديدة
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversationId === conversation.id}
                onSelect={() => selectConversation(conversation.id)}
                onDelete={() => deleteConversation(conversation.id)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center justify-between">
          {/* Settings Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-primary/10 hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                الإعدادات
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>الإعدادات</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الوضع</Label>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'dark' ? 'الوضع الداكن مفعل' : 'الوضع الفاتح مفعل'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <Separator />
                
                {/* About */}
                <div className="space-y-2">
                  <Label>حول البرنامج</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>وكيل المرجع الذكي v3.4.0</p>
                    <p>نظام Agentic متكامل للبرمجة الذكية</p>
                    <p className="text-xs">© 2026 رضوان دالي حمدوني</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-primary/10 hover:text-primary"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Conversation Item Component
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  formatDate: (date: Date) => string;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  formatDate,
}: ConversationItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all",
        "hover:bg-muted/50",
        isActive && "bg-primary/10 border border-primary/20"
      )}
    >
      <div className={cn(
        "mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        isActive ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
      )}>
        <MessageSquare className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            isActive && "text-primary"
          )}>
            {conversation.title}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف المحادثة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] h-5">
            {conversation.messages.length} رسالة
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(conversation.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
