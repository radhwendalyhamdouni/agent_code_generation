'use client';

/**
 * لوحة المهام
 * Todo panel with task management and progress tracking
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  MoreHorizontal,
  Trash2,
  Play,
  Pause,
  ListTodo,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { useAgentStore, Task } from '@/lib/agent-store';

export function TodoPanel() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const { tasks, addTask, updateTask, deleteTask, clearTasks } = useAgentStore();

  // Add new task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    addTask({
      content: newTaskTitle.trim(),
      status: 'pending',
      priority: newTaskPriority,
      progress: 0,
      details: newTaskDetails.trim() || undefined,
    });

    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskDetails('');
    setIsAddDialogOpen(false);
  };

  // Get task counts
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  // Overall progress
  const overallProgress = tasks.length > 0
    ? Math.round((taskCounts.completed / tasks.length) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col bg-background/50 border-r border-border" dir="rtl">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">المهام</span>
            <Badge variant="outline" className="text-xs">
              {taskCounts.total}
            </Badge>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 gap-1 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                إضافة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مهمة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="عنوان المهمة"
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Textarea
                    value={newTaskDetails}
                    onChange={(e) => setNewTaskDetails(e.target.value)}
                    placeholder="تفاصيل إضافية (اختياري)"
                    className="bg-muted/50 min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                  إضافة المهمة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>التقدم الكلي</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {/* Status Counts */}
        <div className="flex items-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-slate-400" />
            {taskCounts.pending} معلقة
          </span>
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 text-yellow-400" />
            {taskCounts.in_progress} قيد التنفيذ
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-400" />
            {taskCounts.completed} مكتملة
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد مهام</p>
              <p className="text-xs mt-1">أضف مهمة جديدة للبدء</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isExpanded={expandedTask === task.id}
                onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                onUpdate={(updates) => updateTask(task.id, updates)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {tasks.length > 0 && (
        <div className="p-3 border-t border-border shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm('هل أنت متأكد من مسح جميع المهام؟')) {
                clearTasks();
              }
            }}
          >
            <Trash2 className="h-4 w-4 ml-2" />
            مسح الكل
          </Button>
        </div>
      )}
    </div>
  );
}

// Task Item Component
interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

function TaskItem({ task, isExpanded, onToggleExpand, onUpdate, onDelete }: TaskItemProps) {
  const statusIcon = {
    pending: <Circle className="h-4 w-4 text-slate-400" />,
    in_progress: <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4 text-green-400" />,
    failed: <AlertCircle className="h-4 w-4 text-red-400" />,
  };

  const statusText = {
    pending: 'معلقة',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتملة',
    failed: 'فشلت',
  };

  const priorityColor = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-slate-400',
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        `task-${task.status}`,
        task.status === 'completed' && "bg-green-500/5",
        task.status === 'failed' && "bg-red-500/5",
        task.status === 'in_progress' && "bg-yellow-500/5"
      )}
    >
      {/* Main Row */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Status Icon */}
        <button
          className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            if (task.status === 'pending') {
              onUpdate({ status: 'in_progress' });
            } else if (task.status === 'in_progress') {
              onUpdate({ status: 'completed', progress: 100 });
            } else if (task.status === 'completed') {
              onUpdate({ status: 'pending', progress: 0 });
            }
          }}
        >
          {statusIcon[task.status]}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-sm font-medium truncate",
              task.status === 'completed' && "line-through text-muted-foreground"
            )}>
              {task.content}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] h-5">
              {statusText[task.status]}
            </Badge>
            <span className={priorityColor[task.priority]}>
              {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
            </span>
          </div>

          {/* Progress Bar */}
          {task.status === 'in_progress' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>التقدم</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {task.status === 'pending' && (
              <DropdownMenuItem onClick={() => onUpdate({ status: 'in_progress' })}>
                <Play className="h-4 w-4 ml-2" />
                بدء التنفيذ
              </DropdownMenuItem>
            )}
            {task.status === 'in_progress' && (
              <DropdownMenuItem onClick={() => onUpdate({ status: 'pending' })}>
                <Pause className="h-4 w-4 ml-2" />
                إيقاف مؤقت
              </DropdownMenuItem>
            )}
            {task.status !== 'completed' && (
              <DropdownMenuItem onClick={() => onUpdate({ status: 'completed', progress: 100 })}>
                <CheckCircle className="h-4 w-4 ml-2" />
                تعيين كمكتمل
              </DropdownMenuItem>
            )}
            <Separator className="my-1" />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4 ml-2" />
              حذف المهمة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand Icon */}
        {(task.details || task.status === 'in_progress') && (
          <div className="shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-border/50">
          {task.details && (
            <p className="text-xs text-muted-foreground py-2">{task.details}</p>
          )}
          
          {task.status === 'in_progress' && (
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={task.progress}
                onChange={(e) => onUpdate({ progress: parseInt(e.target.value) || 0 })}
                className="h-8 w-20 bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(task.createdAt).toLocaleDateString('ar-SA')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
