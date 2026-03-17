'use client';

/**
 * لوحة الطرفية المدمجة
 * Integrated terminal panel with command execution
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Terminal as TerminalIcon,
  Play,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { useAgentStore, TerminalLine } from '@/lib/agent-store';

interface TerminalPanelProps {
  className?: string;
}

export function TerminalPanel({ className }: TerminalPanelProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    terminalLines,
    addTerminalLine,
    clearTerminal,
    terminalOpen,
    toggleTerminal,
    terminalHeight,
    setTerminalHeight,
  } = useAgentStore();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLines]);

  // Focus input when terminal opens
  useEffect(() => {
    if (terminalOpen) {
      inputRef.current?.focus();
    }
  }, [terminalOpen]);

  // Execute command
  const executeCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) return;

    // Add to history
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setCommand('');

    // Add input line
    addTerminalLine({
      type: 'input',
      content: cmd,
    });

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      const result = await response.json();

      if (result.output) {
        addTerminalLine({
          type: 'output',
          content: result.output,
        });
      }

      if (result.error) {
        addTerminalLine({
          type: 'error',
          content: result.error,
        });
      }
    } catch (error: any) {
      addTerminalLine({
        type: 'error',
        content: error.message || 'خطأ في الاتصال',
      });
    }
  }, [addTerminalLine]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(command);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[history.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Escape') {
      setCommand('');
    }
  };

  // Copy terminal content
  const copyTerminalContent = () => {
    const content = terminalLines.map((line) => {
      const prefix = line.type === 'input' ? '$ ' : '';
      return `${prefix}${line.content}`;
    }).join('\n');
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!terminalOpen) {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border cursor-pointer hover:bg-muted/50 transition-colors",
          className
        )}
        onClick={toggleTerminal}
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">الطرفية</span>
          {terminalLines.length > 0 && (
            <span className="text-xs text-muted-foreground">({terminalLines.length} سطر)</span>
          )}
        </div>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-t border-border",
        className
      )}
      style={{ height: terminalHeight }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">الطرفية</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={copyTerminalContent}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={clearTerminal}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setTerminalHeight(terminalHeight === 200 ? 400 : 200)}
          >
            {terminalHeight > 200 ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleTerminal}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <ScrollArea className="flex-1 bg-[#0a0a0a]" ref={scrollRef}>
        <div className="p-3 font-mono text-sm" dir="ltr">
          {terminalLines.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              <TerminalIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">الطرفية جاهزة - اكتب أمراً للتنفيذ</p>
            </div>
          ) : (
            terminalLines.map((line) => (
              <TerminalLineComponent key={line.id} line={line} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 border-t border-border shrink-0">
        <span className="text-primary font-mono text-sm shrink-0">$</span>
        <Input
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب أمراً..."
          className="border-0 bg-transparent focus-visible:ring-0 font-mono text-sm h-8 px-0"
          dir="ltr"
        />
        <Button
          size="sm"
          className="h-7 px-2 bg-primary hover:bg-primary/90 shrink-0"
          onClick={() => executeCommand(command)}
          disabled={!command.trim()}
        >
          <Play className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Terminal Line Component
function TerminalLineComponent({ line }: { line: TerminalLine }) {
  const lineColors = {
    input: 'text-cyan-400',
    output: 'text-slate-300',
    error: 'text-red-400',
    info: 'text-yellow-400',
  };

  return (
    <div className={cn("flex items-start gap-2 py-0.5", lineColors[line.type])}>
      {line.type === 'input' && <span className="text-primary">$</span>}
      <span className="whitespace-pre-wrap break-all flex-1">{line.content}</span>
      <span className="text-muted-foreground text-[10px] shrink-0">
        {new Date(line.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
    </div>
  );
}
