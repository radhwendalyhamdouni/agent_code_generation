'use client';

/**
 * مدير الملفات
 * File manager with tree view and code editor
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Download,
  Save,
  X,
} from 'lucide-react';
import { useAgentStore, FileItem } from '@/lib/agent-store';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Language mapping
const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || 'text';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    r: 'r',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    md: 'markdown',
    mdx: 'mdx',
    graphql: 'graphql',
    gql: 'graphql',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    toml: 'toml',
    ini: 'ini',
    env: 'bash',
    mrj: 'almarjaa', // Custom language
  };
  return langMap[ext] || ext;
};

// File icon component
function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java'].includes(ext || '')) {
    return <FileCode className={cn("text-primary", className)} />;
  }
  if (['md', 'txt', 'log'].includes(ext || '')) {
    return <FileText className={cn("text-blue-400", className)} />;
  }
  return <File className={cn("text-muted-foreground", className)} />;
}

export function FileManager() {
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');

  const {
    files,
    setFiles,
    selectedFile,
    setSelectedFile,
    updateFileContent,
    toggleFolder,
  } = useAgentStore();

  // Get selected file data
  const selectedFileData = findFile(files, selectedFile);

  // Handle file selection
  const handleSelectFile = useCallback((path: string, content?: string) => {
    setSelectedFile(path);
    if (content) {
      setEditorContent(content);
    }
    setEditingPath(path);
  }, [setSelectedFile]);

  // Create new file
  const handleCreateFile = useCallback(() => {
    if (!newFileName.trim()) return;

    const newFile: FileItem = {
      name: newFileName,
      path: newFileName,
      type: 'file',
      content: '',
      language: getLanguageFromPath(newFileName),
    };

    setFiles([...files, newFile]);
    handleSelectFile(newFileName, '');
    setNewFileName('');
    setIsNewFileDialogOpen(false);
  }, [newFileName, files, setFiles, handleSelectFile]);

  // Delete file
  const handleDeleteFile = useCallback((path: string) => {
    setFiles(files.filter((f) => f.path !== path));
    if (selectedFile === path) {
      setSelectedFile(null);
    }
  }, [files, setFiles, selectedFile, setSelectedFile]);

  // Copy file path
  const handleCopyPath = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  // Save file content
  const handleSaveContent = useCallback(() => {
    if (selectedFile) {
      updateFileContent(selectedFile, editorContent);
    }
  }, [selectedFile, editorContent, updateFileContent]);

  // Load files from API
  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        if (data.files) {
          setFiles(data.files);
        }
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }, [setFiles]);

  return (
    <div className="h-full flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">الملفات</span>
          <Badge variant="outline" className="text-[10px]">
            {files.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={loadFiles}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsNewFileDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-56 border-l border-border flex flex-col shrink-0">
          <ScrollArea className="flex-1">
            <div className="p-2">
              {files.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">لا توجد ملفات</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsNewFileDialogOpen(true)}
                    className="text-primary mt-1"
                  >
                    إنشاء ملف جديد
                  </Button>
                </div>
              ) : (
                files.map((file) => (
                  <FileTreeItem
                    key={file.path}
                    file={file}
                    depth={0}
                    selectedPath={selectedFile}
                    onSelect={handleSelectFile}
                    onDelete={handleDeleteFile}
                    onCopyPath={handleCopyPath}
                    copiedPath={copiedPath}
                    onToggleFolder={toggleFolder}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFileData ? (
            <>
              {/* Editor Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0 bg-muted/20">
                <div className="flex items-center gap-2">
                  <FileIcon name={selectedFileData.name} className="h-4 w-4" />
                  <span className="text-sm font-medium truncate">{selectedFileData.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {selectedFileData.language || getLanguageFromPath(selectedFileData.name)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={handleSaveContent}
                  >
                    <Save className="h-3.5 w-3.5" />
                    حفظ
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => handleCopyPath(selectedFileData.path)}
                  >
                    {copiedPath === selectedFileData.path ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 overflow-auto bg-[#0a0a0a]" dir="ltr">
                {selectedFileData.language === 'markdown' || 
                 selectedFileData.language === 'txt' || 
                 selectedFileData.language === 'log' ? (
                  <textarea
                    value={editorContent || selectedFileData.content || ''}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full h-full p-4 bg-transparent text-sm font-mono text-slate-300 resize-none focus:outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <SyntaxHighlighter
                    language={selectedFileData.language || getLanguageFromPath(selectedFileData.name)}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      fontSize: '0.875rem',
                      background: 'transparent',
                      minHeight: '100%',
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: 'Geist Mono, monospace',
                      },
                    }}
                  >
                    {editorContent || selectedFileData.content || ''}
                  </SyntaxHighlighter>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">اختر ملفاً للتحرير</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New File Dialog */}
      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء ملف جديد</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="اسم الملف (مثال: main.ts)"
              className="bg-muted/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFileDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateFile} disabled={!newFileName.trim()}>
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// File Tree Item Component
interface FileTreeItemProps {
  file: FileItem;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string, content?: string) => void;
  onDelete: (path: string) => void;
  onCopyPath: (path: string) => void;
  copiedPath: string | null;
  onToggleFolder: (path: string) => void;
}

function FileTreeItem({
  file,
  depth,
  selectedPath,
  onSelect,
  onDelete,
  onCopyPath,
  copiedPath,
  onToggleFolder,
}: FileTreeItemProps) {
  const isSelected = selectedPath === file.path;
  const isDirectory = file.type === 'directory';

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-muted/50",
            isSelected && "bg-primary/10 text-primary"
          )}
          style={{ paddingRight: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              onToggleFolder(file.path);
            } else {
              onSelect(file.path, file.content);
            }
          }}
        >
          {isDirectory ? (
            <>
              {file.isOpen ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              {file.isOpen ? (
                <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-amber-400 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              <FileIcon name={file.name} className="h-4 w-4 shrink-0" />
            </>
          )}
          <span className="text-sm truncate">{file.name}</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onCopyPath(file.path)}>
          {copiedPath === file.path ? (
            <Check className="h-4 w-4 ml-2 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 ml-2" />
          )}
          نسخ المسار
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDelete(file.path)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4 ml-2" />
          حذف
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// Helper function to find file by path
function findFile(files: FileItem[], path: string | null): FileItem | null {
  if (!path) return null;
  
  for (const file of files) {
    if (file.path === path) return file;
    if (file.children) {
      const found = findFile(file.children, path);
      if (found) return found;
    }
  }
  return null;
}
