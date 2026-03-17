'use client';

/**
 * النوافذ العائمة
 * Floating windows that can be dragged, resized, minimized, and closed
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  X,
  Minus,
  Square,
  Maximize2,
  Minimize2,
  GripVertical,
} from 'lucide-react';
import { useAgentStore, FloatingWindow as FloatingWindowType } from '@/lib/agent-store';
import { TerminalPanel } from './terminal-panel';
import { FileManager } from './file-manager';
import { GitHubPanel } from './github-panel';
import { FileViewer } from './file-viewer';
import { SettingsPanel } from './settings-panel';

interface FloatingWindowProps {
  window: FloatingWindowType;
}

export function FloatingWindow({ window: win }: FloatingWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const {
    closeFloatingWindow,
    updateWindowPosition,
    updateWindowSize,
    minimizeWindow,
    maximizeWindow,
    bringToFront,
  } = useAgentStore();

  // Handle mouse down on drag handle
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    });
    bringToFront(win.id);
  }, [win.x, win.y, win.isMaximized, win.id, bringToFront]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    bringToFront(win.id);
  }, [win.isMaximized, win.id, bringToFront]);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        updateWindowPosition(win.id, newX, newY);
      } else if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const newWidth = Math.max(300, e.clientX - rect.left);
        const newHeight = Math.max(200, e.clientY - rect.top);
        updateWindowSize(win.id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, win.id, updateWindowPosition, updateWindowSize]);

  // Handle window click (bring to front)
  const handleWindowClick = useCallback(() => {
    bringToFront(win.id);
  }, [win.id, bringToFront]);

  // Get window content based on type
  const getWindowContent = () => {
    switch (win.type) {
      case 'terminal':
        return <TerminalPanel />;
      case 'file-manager':
        return <FileManager />;
      case 'github':
        return <GitHubPanel />;
      case 'preview':
        return <FileViewer />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            محتوى النافذة
          </div>
        );
    }
  };

  // Get window icon
  const getWindowIcon = () => {
    switch (win.type) {
      case 'terminal':
        return '⌘';
      case 'file-manager':
        return '📁';
      case 'github':
        return '🐙';
      case 'preview':
        return '👁';
      case 'settings':
        return '⚙';
      default:
        return '🪟';
    }
  };

  if (win.isMinimized) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className={cn(
        "absolute rounded-lg overflow-hidden shadow-2xl border border-border bg-background animate-window-appear",
        "flex flex-col",
        isDragging && "cursor-grabbing",
        win.isMaximized && "inset-0 w-full h-full !rounded-none"
      )}
      style={{
        left: win.isMaximized ? 0 : win.x,
        top: win.isMaximized ? 0 : win.y,
        width: win.isMaximized ? '100%' : win.width,
        height: win.isMaximized ? '100%' : win.height,
        zIndex: win.zIndex,
      }}
      onClick={handleWindowClick}
    >
      {/* Title Bar */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border shrink-0",
          !win.isMaximized && "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{getWindowIcon()}</span>
          <span className="text-sm font-medium">{win.title}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Minimize */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-yellow-500/20 hover:text-yellow-400"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          {/* Maximize/Restore */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-green-500/20 hover:text-green-400"
            onClick={(e) => {
              e.stopPropagation();
              maximizeWindow(win.id);
            }}
          >
            {win.isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          
          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              closeFloatingWindow(win.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {getWindowContent()}
      </div>

      {/* Resize Handle */}
      {!win.isMaximized && (
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/30 rotate-45" />
        </div>
      )}
    </div>
  );
}

// Floating Windows Container
export function FloatingWindowsContainer() {
  const { floatingWindows } = useAgentStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {floatingWindows.map((win) => (
        <div key={win.id} className="pointer-events-auto">
          <FloatingWindow window={win} />
        </div>
      ))}
    </div>
  );
}

// Minimized Windows Bar
export function MinimizedWindowsBar() {
  const { floatingWindows, minimizeWindow } = useAgentStore();
  
  const minimizedWindows = floatingWindows.filter((w) => w.isMinimized);

  if (minimizedWindows.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-muted/80 backdrop-blur-md rounded-full px-4 py-2 border border-border shadow-lg z-50" dir="rtl">
      {minimizedWindows.map((win) => (
        <Button
          key={win.id}
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full hover:bg-primary/10"
          onClick={() => minimizeWindow(win.id)}
        >
          <span>{win.type === 'terminal' ? '⌘' : win.type === 'file-manager' ? '📁' : '🪟'}</span>
          <span className="text-xs">{win.title}</span>
        </Button>
      ))}
    </div>
  );
}
